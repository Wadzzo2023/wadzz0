// ~/lib/agent/pin-db-tools.ts
// DB tools for the management agent.
// All tools are scoped to creatorId — nothing crosses creator boundaries.

import { db } from "~/server/db"
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { qstash } from "../qstash"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Standard pagination envelope returned by every list tool. */
function buildPagination(total: number, offset: number, limit: number, fetched: number) {
    const loadedUpTo = offset + fetched;
    return {
        total,
        offset,
        limit,
        hasMore: loadedUpTo < total,
        nextOffset: loadedUpTo < total ? offset + limit : null,
        showing: `${offset + 1}–${loadedUpTo} of ${total}`,
    };
}

/** Returns IDs of the template LocationGroup for each hotspot (first drop, never shown). */
async function getTemplateIds(creatorId: string): Promise<Set<string>> {
    const hotspots = await db.hotspot.findMany({
        where: { creatorId },
        select: {
            locationGroups: {
                orderBy: { createdAt: "asc" },
                take: 1,
                select: { id: true },
            },
        },
    });
    return new Set(
        hotspots.map(h => h.locationGroups[0]?.id).filter(Boolean) as string[]
    );
}

/** Haversine distance in km between two lat/lng points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Geocode an area name → center lat/lng using Google Geocoding API. */
async function geocodeArea(area: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
    if (!apiKey || !area.trim()) return null;

    try {
        const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        url.searchParams.append("address", area);
        url.searchParams.append("key", apiKey);
        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
        const data = await res.json() as {
            status: string;
            results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
        };
        const loc = data.results?.[0]?.geometry?.location;
        return loc ? { lat: loc.lat, lng: loc.lng } : null;
    } catch {
        return null;
    }
}

/** Compute pin status from DB fields. */
function computeStatus(
    endDate: Date | null,
    remaining: number,
    limit: number,
): "active" | "expired" | "fully_claimed" | "collection_disabled" {
    if (endDate && endDate < new Date()) return "expired";
    if (remaining === 0 && limit > 0) return "fully_claimed";
    if (limit === 0) return "collection_disabled";
    return "active";
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory — call once per request with the authenticated creatorId
// ─────────────────────────────────────────────────────────────────────────────

export const createDbTools = (creatorId: string) => {

    // ── TOOL 1: query_pins_by_ids ─────────────────────────────────────────────
    // Fetch specific pins by ID — used after user selects from a list.
    const queryPinsById = tool(
        async ({ ids }) => {
            const pins = await db.locationGroup.findMany({
                where: { id: { in: ids }, creatorId, hidden: false },
                select: {
                    id: true, title: true, description: true,
                    startDate: true, endDate: true, hotspotId: true, createdAt: true,
                    latitude: true, longitude: true, radius: true,
                    limit: true, remaining: true, image: true, link: true,
                    multiPin: true, hidden: true, type: true,
                    locations: {
                        where: { hidden: false },
                        select: {
                            id: true, latitude: true, longitude: true,
                            autoCollect: true, hidden: true,
                            consumers: {
                                select: { claimedAt: true, isRedeemed: true, viewedAt: true },
                            },
                        },
                    },
                },
            });

            // Attach consumer counts per location
            const enriched = pins.map(p => ({
                ...p,
                locations: p.locations.map(loc => ({
                    id: loc.id,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    autoCollect: loc.autoCollect,
                    hidden: loc.hidden,
                    totalClaimed: loc.consumers.filter(c => c.claimedAt).length,
                    totalRedeemed: loc.consumers.filter(c => c.isRedeemed).length,
                    totalViewed: loc.consumers.filter(c => c.viewedAt).length,
                })),
            }));

            return JSON.stringify({ pins: enriched });
        },
        {
            name: "query_pins_by_ids",
            description:
                "Fetch specific LocationGroups by their exact IDs. " +
                "Use when user message contains 'SYSTEM: locationGroupIds=...' — " +
                "parse the IDs from that suffix and call this tool directly. " +
                "Returns locations with consumer counts (Level 2 data).",
            schema: z.object({
                ids: z.array(z.string()).describe("LocationGroup ids to fetch"),
            }),
        }
    );

    // ── TOOL 2: query_pins ────────────────────────────────────────────────────
    // Paginated pin list. Supports status filter, title search, and geo filter.
    const queryPins = tool(
        async ({ filter, search, area, radiusKm, limit, offset }) => {
            const _filter = filter ?? "all";
            const _limit = limit ?? 10;
            const _offset = offset ?? 0;
            const _radiusKm = radiusKm ?? 50;

            const templateIds = Array.from(await getTemplateIds(creatorId));
            const today = new Date();

            // Geo filter — geocode area and filter by radius
            let geoFilter: { latitude: { gte: number; lte: number }; longitude: { gte: number; lte: number } } | undefined;
            if (area) {
                const coords = await geocodeArea(area);
                if (coords) {
                    // 1° lat ≈ 111km, 1° lng ≈ 111km * cos(lat)
                    const latDelta = _radiusKm / 111;
                    const lngDelta = _radiusKm / (111 * Math.cos((coords.lat * Math.PI) / 180));
                    geoFilter = {
                        latitude: { gte: coords.lat - latDelta, lte: coords.lat + latDelta },
                        longitude: { gte: coords.lng - lngDelta, lte: coords.lng + lngDelta },
                    };
                }
            }

            const where = {
                creatorId,
                hidden: false,
                approved: true,
                ...(templateIds.length > 0 && { NOT: { id: { in: templateIds } } }),
                ...(_filter === "expired" && { endDate: { lt: today } }),
                ...(_filter === "active" && { endDate: { gte: today } }),
                ...(_filter === "fully_claimed" && { remaining: 0, limit: { gt: 0 } }),
                ...(search && { title: { contains: search, mode: "insensitive" as const } }),
                ...geoFilter,
            };

            const [total, pins] = await Promise.all([
                db.locationGroup.count({ where }),
                db.locationGroup.findMany({
                    where,
                    select: {
                        id: true, title: true, description: true,
                        startDate: true, endDate: true, hotspotId: true, createdAt: true,
                        latitude: true, longitude: true, radius: true, type: true,
                        limit: true, remaining: true, image: true, link: true,
                        multiPin: true, hidden: true,
                        locations: {
                            where: { hidden: false },
                            select: {
                                id: true, latitude: true, longitude: true,
                                autoCollect: true, hidden: true,
                                consumers: {
                                    select: { claimedAt: true, isRedeemed: true, viewedAt: true },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: _limit,
                    skip: _offset,
                }),
            ]);

            // If geo filter active, do precise haversine filtering on results
            const filtered = area && geoFilter
                ? pins.filter(p =>
                    p.latitude != null && p.longitude != null &&
                    haversineKm(p.latitude, p.longitude, geoFilter!.latitude.gte + (_radiusKm / 111), geoFilter!.longitude.gte + (_radiusKm / 111)) <= _radiusKm
                )
                : pins;

            const enriched = filtered.map(p => ({
                ...p,
                status: computeStatus(p.endDate, p.remaining, p.limit),
                claimed: p.limit - p.remaining,
                locations: p.locations.map(loc => ({
                    id: loc.id,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    autoCollect: loc.autoCollect,
                    hidden: loc.hidden,
                    totalClaimed: loc.consumers.filter(c => c.claimedAt).length,
                    totalRedeemed: loc.consumers.filter(c => c.isRedeemed).length,
                    totalViewed: loc.consumers.filter(c => c.viewedAt).length,
                })),
            }));

            return JSON.stringify({
                pins: enriched,
                pagination: buildPagination(total, _offset, _limit, enriched.length),
                geoContext: area ? { area, radiusKm: _radiusKm } : null,
            });
        },
        {
            name: "query_pins",
            description:
                "Read creator pins with filters, search, and optional geo filter. " +
                "Pass area + radiusKm for 'pins around Dhaka' style queries. " +
                "radiusKm: ~10 for 'in [city]', ~50 for 'around [city]', ~500 for 'across [country]'. " +
                "Returns locations with consumer counts (Level 2). Default limit 10.",
            schema: z.object({
                filter: z.enum(["all", "active", "expired", "fully_claimed", "collection_disabled"]),
                search: z.string().nullable().describe("fuzzy title search"),
                area: z.string().nullable().describe("city/country for geo filter, null for no filter"),
                radiusKm: z.number().nullable().describe("search radius in km — 10=in city, 50=around city, 500=country"),
                limit: z.number().int().min(1).max(50).describe("pins per page, default 10"),
                offset: z.number().int().min(0).describe("skip N for pagination"),
            }),
        }
    );

    // ── TOOL 3: query_location_collectors ─────────────────────────────────────
    // Level 3 drill-down — full collector list for a specific location point.
    const queryLocationCollectors = tool(
        async ({ locationId, limit, offset }) => {
            const _limit = limit ?? 10;
            const _offset = offset ?? 0;

            // Verify the location belongs to this creator
            const location = await db.location.findFirst({
                where: { id: locationId, locationGroup: { creatorId } },
                select: { id: true, locationGroup: { select: { title: true } } },
            });
            if (!location) return JSON.stringify({ error: "Location not found" });

            const [total, consumers] = await Promise.all([
                db.locationConsumer.count({ where: { locationId } }),
                db.locationConsumer.findMany({
                    where: { locationId },
                    select: {
                        claimedAt: true,
                        redeemedAt: true,
                        isRedeemed: true,
                        viewedAt: true,
                        user: { select: { name: true, email: true, image: true } },
                    },
                    orderBy: { claimedAt: "desc" },
                    take: _limit,
                    skip: _offset,
                }),
            ]);

            return JSON.stringify({
                locationId,
                pinTitle: location.locationGroup?.title ?? "Unknown",
                totalClaimed: consumers.filter(c => c.claimedAt).length,
                totalRedeemed: consumers.filter(c => c.isRedeemed).length,
                collectors: consumers.map(c => ({
                    name: c.user.name ?? "Unknown",
                    email: c.user.email ?? "",
                    image: c.user.image ?? null,
                    claimedAt: c.claimedAt?.toISOString() ?? null,
                    redeemedAt: c.redeemedAt?.toISOString() ?? null,
                    isRedeemed: c.isRedeemed,
                    viewedAt: c.viewedAt?.toISOString() ?? null,
                })),
                pagination: buildPagination(total, _offset, _limit, consumers.length),
            });
        },
        {
            name: "query_location_collectors",
            description:
                "Level 3 drill-down — get paginated collector list for ONE specific Location point. " +
                "Use when user message contains 'SYSTEM: locationId=...' or user expands a location. " +
                "Returns name, email, image, claimedAt, redeemedAt, isRedeemed. Never exposes redeemCode.",
            schema: z.object({
                locationId: z.string().describe("Location id to fetch collectors for"),
                limit: z.number().int().min(1).max(50).describe("collectors per page, default 10"),
                offset: z.number().int().min(0).describe("skip N for pagination"),
            }),
        }
    );

    // ── TOOL 4: query_hotspots ────────────────────────────────────────────────
    const queryHotspots = tool(
        async ({ search, isActive, limit, offset }) => {
            const _limit = limit ?? 10;
            const _offset = offset ?? 0;

            const where = {
                creatorId,
                ...(isActive !== null && isActive !== undefined && { isActive }),
                ...(search && {
                    locationGroups: {
                        some: { title: { contains: search, mode: "insensitive" as const } },
                    },
                }),
            };

            const [total, hotspots] = await Promise.all([
                db.hotspot.count({ where }),
                db.hotspot.findMany({
                    where,
                    include: {
                        locationGroups: {
                            orderBy: { createdAt: "asc" },
                            take: 1,
                            select: { title: true, createdAt: true },
                        },
                        _count: { select: { locationGroups: true } },
                    },
                    take: _limit,
                    skip: _offset,
                }),
            ]);

            return JSON.stringify({
                hotspots: hotspots.map(h => ({
                    id: h.id,
                    displayName: h.locationGroups[0]?.title ?? "Unnamed Hotspot",
                    isActive: h.isActive,
                    dropEveryDays: h.dropEveryDays,
                    dropCount: h._count.locationGroups,
                    qstashScheduleId: h.qstashScheduleId,
                })),
                pagination: buildPagination(total, _offset, _limit, hotspots.length),
            });
        },
        {
            name: "query_hotspots",
            description:
                "Read creator hotspots with optional isActive filter and pagination. " +
                "isActive=true → active only, isActive=false → paused only, null → all.",
            schema: z.object({
                search: z.string().nullable().describe("title search, null for all"),
                isActive: z.boolean().nullable().describe("filter active/paused, null for both"),
                limit: z.number().int().min(1).max(50).describe("per page, default 10"),
                offset: z.number().int().min(0).describe("skip N"),
            }),
        }
    );

    // ── TOOL 5: query_hotspot_drops ───────────────────────────────────────────
    const queryHotspotDrops = tool(
        async ({ hotspotId, limit, offset }) => {
            const _limit = limit ?? 10;
            const _offset = offset ?? 0;

            const templateIds = await getTemplateIds(creatorId);

            const [total, drops] = await Promise.all([
                db.locationGroup.count({ where: { hotspotId, creatorId, hidden: false } }),
                db.locationGroup.findMany({
                    where: { hotspotId, creatorId, hidden: false },
                    select: {
                        id: true, title: true, startDate: true, endDate: true,
                        limit: true, remaining: true, createdAt: true,
                        locations: {
                            where: { hidden: false },
                            select: {
                                id: true, latitude: true, longitude: true,
                                autoCollect: true, hidden: true,
                                consumers: {
                                    select: { claimedAt: true, isRedeemed: true },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: _limit,
                    skip: _offset,
                }),
            ]);

            const filtered = drops.filter(d => !templateIds.has(d.id));

            return JSON.stringify({
                hotspotId,
                drops: filtered.map(d => ({
                    ...d,
                    status: computeStatus(d.endDate, d.remaining, d.limit),
                    claimed: d.limit - d.remaining,
                    locations: d.locations.map(loc => ({
                        id: loc.id,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        autoCollect: loc.autoCollect,
                        hidden: loc.hidden,
                        totalClaimed: loc.consumers.filter(c => c.claimedAt).length,
                        totalRedeemed: loc.consumers.filter(c => c.isRedeemed).length,
                    })),
                })),
                pagination: buildPagination(total, _offset, _limit, filtered.length),
            });
        },
        {
            name: "query_hotspot_drops",
            description: "Get paginated drops for a specific hotspot. Templates excluded. Returns location consumer counts.",
            schema: z.object({
                hotspotId: z.string(),
                limit: z.number().int().min(1).max(50).describe("per page, default 10"),
                offset: z.number().int().min(0).describe("skip N"),
            }),
        }
    );

    // ── TOOL 6: query_analytics_summary ──────────────────────────────────────
    // Fast aggregate stats — never fetches all rows.
    const queryAnalyticsSummary = tool(
        async () => {
            const [
                totalClaimed, totalRedeemed, totalPins,
                activePins, expiredPins, fullyClaimedPins,
                totalLimitAgg, topPerformers,
            ] = await Promise.all([
                db.locationConsumer.count({
                    where: { location: { locationGroup: { creatorId, hidden: false } }, claimedAt: { not: null } },
                }),
                db.locationConsumer.count({
                    where: { location: { locationGroup: { creatorId, hidden: false } }, isRedeemed: true },
                }),
                db.locationGroup.count({ where: { creatorId, hidden: false } }),
                db.locationGroup.count({
                    where: { creatorId, hidden: false, endDate: { gte: new Date() }, remaining: { gt: 0 } },
                }),
                db.locationGroup.count({
                    where: { creatorId, hidden: false, endDate: { lt: new Date() } },
                }),
                db.locationGroup.count({
                    where: { creatorId, hidden: false, remaining: 0, limit: { gt: 0 } },
                }),
                db.locationGroup.aggregate({
                    where: { creatorId, hidden: false },
                    _sum: { limit: true },
                }),
                db.locationGroup.findMany({
                    where: { creatorId, hidden: false, limit: { gt: 0 } },
                    select: { id: true, title: true, limit: true, remaining: true },
                    orderBy: { remaining: "asc" },
                    take: 5,
                }),
            ]);

            const totalLimit = totalLimitAgg._sum.limit ?? 0;
            const claimRate = totalLimit > 0 ? `${Math.round(totalClaimed / totalLimit * 100)}%` : "N/A";
            const redeemRate = totalClaimed > 0 ? `${Math.round(totalRedeemed / totalClaimed * 100)}%` : "N/A";

            return JSON.stringify({
                summary: {
                    totalClaimed, totalRedeemed, claimRate, redeemRate,
                    totalPins, activePins, expiredPins, fullyClaimedPins,
                },
                topPerformers: topPerformers.map(p => ({
                    id: p.id,
                    title: p.title,
                    claimed: p.limit - p.remaining,
                    limit: p.limit,
                    remaining: p.remaining,
                    claimRate: p.limit > 0 ? `${Math.round((p.limit - p.remaining) / p.limit * 100)}%` : "N/A",
                })),
            });
        },
        {
            name: "query_analytics_summary",
            description: "Overall performance stats via DB aggregates. Fast — never fetches all pins. Use first for any analytics request.",
            schema: z.object({}),
        }
    );

    // ── TOOL 7: query_analytics_detail ───────────────────────────────────────
    // Per-pin analytics breakdown with sorting and pagination.
    const queryAnalyticsDetail = tool(
        async ({ limit, offset, sortBy, search }) => {
            const _limit = limit ?? 10;
            const _offset = offset ?? 0;
            const _sortBy = sortBy ?? "claimRate";

            const where = {
                creatorId, hidden: false, approved: true, limit: { gt: 0 },
                ...(search && { title: { contains: search, mode: "insensitive" as const } }),
            };

            const [total, pins] = await Promise.all([
                db.locationGroup.count({ where }),
                db.locationGroup.findMany({
                    where,
                    select: {
                        id: true, title: true, limit: true, remaining: true,
                        startDate: true, endDate: true, type: true,
                        locations: {
                            select: {
                                consumers: { select: { claimedAt: true, isRedeemed: true } },
                            },
                        },
                    },
                    orderBy: _sortBy === "remaining" ? { remaining: "asc" } : { createdAt: "desc" },
                    take: _limit,
                    skip: _offset,
                }),
            ]);

            const perPin = pins.map(p => {
                const consumers = p.locations.flatMap(l => l.consumers);
                const claimed = consumers.filter(c => c.claimedAt).length;
                const redeemed = consumers.filter(c => c.isRedeemed).length;
                const claimRateNum = p.limit > 0 ? Math.round(claimed / p.limit * 100) : 0;
                return {
                    id: p.id,
                    title: p.title,
                    type: p.type,
                    claimed,
                    redeemed,
                    limit: p.limit,
                    remaining: p.remaining,
                    claimRate: `${claimRateNum}%`,
                    redeemRate: claimed > 0 ? `${Math.round(redeemed / claimed * 100)}%` : "0%",
                    claimRateNum, // internal — stripped before return
                };
            });

            // Client-side sort after DB fetch
            if (_sortBy === "claimRate") perPin.sort((a, b) => b.claimRateNum - a.claimRateNum);
            else if (_sortBy === "claimed") perPin.sort((a, b) => b.claimed - a.claimed);
            else if (_sortBy === "redeemed") perPin.sort((a, b) => b.redeemed - a.redeemed);

            const clean = perPin.map(({ claimRateNum: _, ...rest }) => rest);

            return JSON.stringify({
                perPin: clean,
                pagination: buildPagination(total, _offset, _limit, pins.length),
            });
        },
        {
            name: "query_analytics_detail",
            description:
                "Paginated per-pin analytics. sortBy: claimRate | claimed | redeemed | remaining. " +
                "Now includes redeemRate and pin type per row.",
            schema: z.object({
                limit: z.number().int().min(1).max(25).describe("per page, default 10"),
                offset: z.number().int().min(0).describe("skip N"),
                sortBy: z.enum(["claimRate", "claimed", "redeemed", "remaining"]),
                search: z.string().nullable().describe("filter by title, null for all"),
            }),
        }
    );

    // ── TOOL 8: query_single_pin_report ───────────────────────────────────────
    // Deep analysis for one specific pin — stats + location counts + top collectors.
    const querySinglePinReport = tool(
        async ({ locationGroupId }) => {
            const pin = await db.locationGroup.findFirst({
                where: { id: locationGroupId, creatorId, hidden: false },
                select: {
                    id: true, title: true, startDate: true, endDate: true,
                    limit: true, remaining: true, radius: true, type: true,
                    hotspotId: true, description: true,
                    locations: {
                        where: { hidden: false },
                        select: {
                            id: true, latitude: true, longitude: true,
                            autoCollect: true, hidden: true,
                            consumers: {
                                select: {
                                    claimedAt: true, redeemedAt: true,
                                    isRedeemed: true, viewedAt: true,
                                    user: { select: { name: true, email: true, image: true } },
                                },
                                orderBy: { claimedAt: "desc" },
                            },
                        },
                    },
                },
            });

            if (!pin) return JSON.stringify({ error: "Pin not found" });

            const allConsumers = pin.locations.flatMap(l => l.consumers);
            const claimed = allConsumers.filter(c => c.claimedAt).length;
            const redeemed = allConsumers.filter(c => c.isRedeemed).length;
            const viewed = allConsumers.filter(c => c.viewedAt).length;

            // Top 5 collectors across all locations
            const topCollectors = allConsumers
                .filter(c => c.claimedAt)
                .sort((a, b) => (b.claimedAt?.getTime() ?? 0) - (a.claimedAt?.getTime() ?? 0))
                .slice(0, 5)
                .map(c => ({
                    name: c.user.name ?? "Unknown",
                    email: c.user.email ?? "",
                    image: c.user.image ?? null,
                    claimedAt: c.claimedAt?.toISOString() ?? null,
                    redeemedAt: c.redeemedAt?.toISOString() ?? null,
                    isRedeemed: c.isRedeemed,
                    viewedAt: c.viewedAt?.toISOString() ?? null,
                }));

            return JSON.stringify({
                pin: {
                    id: pin.id,
                    title: pin.title,
                    startDate: pin.startDate?.toISOString() ?? null,
                    endDate: pin.endDate?.toISOString() ?? null,
                    status: computeStatus(pin.endDate, pin.remaining, pin.limit),
                    type: pin.type,
                    radius: pin.radius,
                    isHotspotPin: !!pin.hotspotId,
                    hotspotId: pin.hotspotId,
                },
                stats: {
                    claimed,
                    redeemed,
                    limit: pin.limit,
                    remaining: pin.remaining,
                    claimRate: pin.limit > 0 ? `${Math.round(claimed / pin.limit * 100)}%` : "N/A",
                    redeemRate: claimed > 0 ? `${Math.round(redeemed / claimed * 100)}%` : "N/A",
                    totalViewed: viewed,
                    viewToClaimRate: viewed > 0 ? `${Math.round(claimed / viewed * 100)}%` : null,
                },
                // Level 2 — per-location breakdown
                locations: pin.locations.map(loc => {
                    const lClaimed = loc.consumers.filter(c => c.claimedAt).length;
                    const lRedeemed = loc.consumers.filter(c => c.isRedeemed).length;
                    const lViewed = loc.consumers.filter(c => c.viewedAt).length;
                    return {
                        id: loc.id,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        totalClaimed: lClaimed,
                        totalRedeemed: lRedeemed,
                        totalViewed: lViewed,
                        claimRate: pin.limit > 0 ? `${Math.round(lClaimed / pin.limit * 100)}%` : "N/A",
                    };
                }),
                topCollectors,
                totalCollectors: claimed,
            });
        },
        {
            name: "query_single_pin_report",
            description:
                "Deep analysis for ONE specific pin. Returns stats, per-location breakdown, and top 5 collectors. " +
                "Use when user says 'analyze [pin name]' and only one pin matches. " +
                "For full collector list, use query_location_collectors.",
            schema: z.object({
                locationGroupId: z.string().describe("LocationGroup id to analyze"),
            }),
        }
    );

    // ── TOOL 9: query_hotspot_trend ───────────────────────────────────────────
    // Per-drop claim rate trend across all drops of a hotspot.
    const queryHotspotTrend = tool(
        async ({ hotspotId }) => {
            const templateIds = await getTemplateIds(creatorId);

            const drops = await db.locationGroup.findMany({
                where: { hotspotId, creatorId, hidden: false },
                select: {
                    id: true, title: true, startDate: true, endDate: true,
                    limit: true, remaining: true,
                    locations: {
                        select: {
                            consumers: { select: { claimedAt: true, isRedeemed: true } },
                        },
                    },
                },
                orderBy: { startDate: "asc" }, // chronological = drop order
            });

            const filtered = drops.filter(d => !templateIds.has(d.id));
            if (filtered.length === 0) return JSON.stringify({ error: "No drops found" });

            const dropStats = filtered.map((d, i) => {
                const consumers = d.locations.flatMap(l => l.consumers);
                const claimed = consumers.filter(c => c.claimedAt).length;
                const redeemed = consumers.filter(c => c.isRedeemed).length;
                return {
                    dropNumber: i + 1,
                    startDate: d.startDate.toISOString(),
                    endDate: d.endDate.toISOString(),
                    claimed,
                    limit: d.limit,
                    redeemed,
                    claimRate: d.limit > 0 ? `${Math.round(claimed / d.limit * 100)}%` : "N/A",
                    claimRateNum: d.limit > 0 ? Math.round(claimed / d.limit * 100) : 0,
                };
            });

            // Determine trend direction
            const rates = dropStats.map(d => d.claimRateNum);
            const peakDrop = rates.indexOf(Math.max(...rates)) + 1;
            const last3 = rates.slice(-3);
            const trend =
                last3.every((v, i) => i === 0 || v > last3[i - 1]!) ? "improving" :
                    last3.every((v, i) => i === 0 || v < last3[i - 1]!) ? "declining" :
                        peakDrop < rates.length - 1 ? "peaked" : "stable";

            const avgClaimRate = Math.round(rates.reduce((s, r) => s + r, 0) / rates.length);

            const hotspot = await db.hotspot.findFirst({
                where: { id: hotspotId, creatorId },
                select: { id: true },
            });

            return JSON.stringify({
                hotspotId,
                totalDrops: dropStats.length,
                trend,
                drops: dropStats.map(({ claimRateNum: _, ...rest }) => rest),
                peakDrop,
                avgClaimRate: `${avgClaimRate}%`,
            });
        },
        {
            name: "query_hotspot_trend",
            description:
                "Get per-drop claim rate trend for a hotspot in chronological order. " +
                "Returns trend direction: improving | declining | stable | peaked. " +
                "Use when user asks 'how is [hotspot] trending' or 'analyze [hotspot with multiple drops]'.",
            schema: z.object({
                hotspotId: z.string().describe("Hotspot id to analyze"),
            }),
        }
    );

    // ── TOOL 10: query_time_analytics ─────────────────────────────────────────
    // Best day/hour, claim velocity, view → claim funnel.
    const queryTimeAnalytics = tool(
        async () => {
            // Raw SQL needed for date part extraction
            const [byDow, byHour, redemptionLag, viewFunnel] = await Promise.all([

                // Claims grouped by day of week (0=Sun … 6=Sat)
                db.$queryRaw<Array<{ dow: number; claims: bigint }>>`
          SELECT EXTRACT(DOW FROM lc."claimedAt")::int AS dow, COUNT(*)::bigint AS claims
          FROM "LocationConsumer" lc
          JOIN "Location" l ON lc."locationId" = l.id
          JOIN "LocationGroup" lg ON l."locationGroupId" = lg.id
          WHERE lg."creatorId" = ${creatorId}
            AND lc."claimedAt" IS NOT NULL
          GROUP BY dow
          ORDER BY dow
        `,

                // Claims grouped by hour of day
                db.$queryRaw<Array<{ hour: number; claims: bigint }>>`
          SELECT EXTRACT(HOUR FROM lc."claimedAt")::int AS hour, COUNT(*)::bigint AS claims
          FROM "LocationConsumer" lc
          JOIN "Location" l ON lc."locationId" = l.id
          JOIN "LocationGroup" lg ON l."locationGroupId" = lg.id
          WHERE lg."creatorId" = ${creatorId}
            AND lc."claimedAt" IS NOT NULL
          GROUP BY hour
          ORDER BY hour
        `,

                // Avg hours between claim and redeem
                db.$queryRaw<Array<{ avg_hours: number | null }>>`
          SELECT AVG(EXTRACT(EPOCH FROM (lc."redeemedAt" - lc."claimedAt")) / 3600)::float AS avg_hours
          FROM "LocationConsumer" lc
          JOIN "Location" l ON lc."locationId" = l.id
          JOIN "LocationGroup" lg ON l."locationGroupId" = lg.id
          WHERE lg."creatorId" = ${creatorId}
            AND lc."redeemedAt" IS NOT NULL
            AND lc."claimedAt"  IS NOT NULL
        `,

                // View → claim funnel counts
                db.locationConsumer.aggregate({
                    where: { location: { locationGroup: { creatorId, hidden: false } } },
                    _count: { viewedAt: true, claimedAt: true },
                }),
            ]);

            const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const claimsByDow = byDow.map(r => ({
                day: DAY_NAMES[r.dow] ?? "Unknown",
                claims: Number(r.claims),
            }));

            const bestDow = claimsByDow.reduce((best, cur) => cur.claims > best.claims ? cur : best, claimsByDow[0]!);
            const claimsHr = byHour.map(r => ({ hour: r.hour, claims: Number(r.claims) }));
            const bestHour = claimsHr.reduce((best, cur) => cur.claims > best.claims ? cur : best, claimsHr[0]!);

            const viewed = viewFunnel._count.viewedAt ?? 0;
            const claimed = viewFunnel._count.claimedAt ?? 0;

            return JSON.stringify({
                bestDayOfWeek: bestDow?.day ?? "Unknown",
                bestHour: bestHour?.hour ?? 0,
                claimsByDayOfWeek: claimsByDow,
                claimsByHour: claimsHr,
                avgRedemptionLagHours: redemptionLag[0]?.avg_hours ?? null,
                viewToClaimRate: viewed > 0 ? `${Math.round(claimed / viewed * 100)}%` : null,
                totalViewed: viewed,
                totalClaimed: claimed,
            });
        },
        {
            name: "query_time_analytics",
            description:
                "Time-based performance analytics. Returns best day of week, best hour, " +
                "claims distribution by day/hour, avg redemption lag, and view-to-claim funnel rate. " +
                "Use for 'when do my pins perform best' or 'best time to drop'.",
            schema: z.object({}),
        }
    );

    // ── TOOL 11: query_pin_type_analytics ─────────────────────────────────────
    // Performance grouped by PinType enum (EVENT, LANDMARK, etc.)
    const queryPinTypeAnalytics = tool(
        async () => {
            const pins = await db.locationGroup.findMany({
                where: { creatorId, hidden: false, limit: { gt: 0 } },
                select: {
                    type: true, limit: true, remaining: true,
                    locations: {
                        select: {
                            consumers: { select: { claimedAt: true, isRedeemed: true } },
                        },
                    },
                },
            });

            // Group by type
            const byType = new Map<string, { count: number; totalClaimed: number; totalRedeemed: number; totalLimit: number }>();

            for (const pin of pins) {
                const claimed = pin.locations.flatMap(l => l.consumers).filter(c => c.claimedAt).length;
                const redeemed = pin.locations.flatMap(l => l.consumers).filter(c => c.isRedeemed).length;
                const entry = byType.get(pin.type) ?? { count: 0, totalClaimed: 0, totalRedeemed: 0, totalLimit: 0 };

                byType.set(pin.type, {
                    count: entry.count + 1,
                    totalClaimed: entry.totalClaimed + claimed,
                    totalRedeemed: entry.totalRedeemed + redeemed,
                    totalLimit: entry.totalLimit + pin.limit,
                });
            }

            const result = Array.from(byType.entries()).map(([type, stats]) => ({
                type,
                count: stats.count,
                totalClaimed: stats.totalClaimed,
                avgClaimRate: stats.totalLimit > 0 ? `${Math.round(stats.totalClaimed / stats.totalLimit * 100)}%` : "N/A",
                avgRedeemRate: stats.totalClaimed > 0 ? `${Math.round(stats.totalRedeemed / stats.totalClaimed * 100)}%` : "N/A",
            }));

            // Sort by avg claim rate descending
            result.sort((a, b) => parseFloat(b.avgClaimRate) - parseFloat(a.avgClaimRate));

            return JSON.stringify({
                byType,
                bestType: result[0]?.type ?? "Unknown",
            });
        },
        {
            name: "query_pin_type_analytics",
            description:
                "Performance breakdown by pin type (EVENT, LANDMARK, BOUNTY, EXPERIENCE, LAUNCH, OTHER). " +
                "Use for 'do EVENT pins perform better' or when generating drop recommendations.",
            schema: z.object({}),
        }
    );

    // ── TOOL 12: query_collector_report ───────────────────────────────────────
    // Flexible collector report — single collector, all collectors, or per-pin.
    const queryCollectorReport = tool(
        async ({ email, locationGroupId, onlyUnredeemed, limit, offset }) => {
            const _limit = limit ?? 10;
            const _offset = offset ?? 0;

            const pinScope = locationGroupId
                ? { locationGroup: { id: locationGroupId, creatorId } }
                : { locationGroup: { creatorId } };

            const where = {
                location: pinScope,
                claimedAt: { not: null }, // only actual collectors
                ...(email && { user: { email } }),
                ...(onlyUnredeemed && { isRedeemed: false }),
            };

            const [total, consumers] = await Promise.all([
                db.locationConsumer.count({ where }),
                db.locationConsumer.findMany({
                    where,
                    select: {
                        claimedAt: true, isRedeemed: true, redeemedAt: true,
                        user: { select: { name: true, email: true, image: true } },
                        location: {
                            select: {
                                locationGroup: {
                                    select: { id: true, title: true, startDate: true, endDate: true },
                                },
                            },
                        },
                    },
                    orderBy: { claimedAt: "desc" },
                    take: _limit,
                    skip: _offset,
                }),
            ]);

            const pagination = buildPagination(total, _offset, _limit, consumers.length);

            // Single collector view
            if (email) {
                const collectorUser = consumers[0]?.user ?? null;
                return JSON.stringify({
                    mode: "single_collector",
                    collector: {
                        name: collectorUser?.name ?? "Unknown",
                        email: collectorUser?.email ?? email,
                        image: collectorUser?.image ?? null,
                        totalCollected: total,
                        totalRedeemed: consumers.filter(c => c.isRedeemed).length,
                    },
                    collections: consumers.map(c => ({
                        pinId: c.location.locationGroup?.id ?? "",
                        pinTitle: c.location.locationGroup?.title ?? "",
                        pinStartDate: c.location.locationGroup?.startDate?.toISOString() ?? null,
                        pinEndDate: c.location.locationGroup?.endDate?.toISOString() ?? null,
                        claimedAt: c.claimedAt?.toISOString() ?? null,
                        redeemedAt: c.redeemedAt?.toISOString() ?? null,
                        isRedeemed: c.isRedeemed,
                    })),
                    pagination,
                });
            }

            // All collectors view — aggregate by user
            const byCollector = new Map<string, {
                name: string; email: string; image: string | null;
                collected: number; redeemed: number; lastClaimedAt: Date | null;
            }>();

            for (const c of consumers) {
                const key = c.user.email ?? "";
                const existing = byCollector.get(key);
                if (existing) {
                    existing.collected++;
                    if (c.isRedeemed) existing.redeemed++;
                    if (c.claimedAt && (!existing.lastClaimedAt || c.claimedAt > existing.lastClaimedAt))
                        existing.lastClaimedAt = c.claimedAt;
                } else {
                    byCollector.set(key, {
                        name: c.user.name ?? "Unknown",
                        email: c.user.email ?? "",
                        image: c.user.image ?? null,
                        collected: 1,
                        redeemed: c.isRedeemed ? 1 : 0,
                        lastClaimedAt: c.claimedAt,
                    });
                }
            }

            return JSON.stringify({
                mode: "all_collectors",
                collectors: Array.from(byCollector.values()).map(col => ({
                    ...col,
                    lastClaimedAt: col.lastClaimedAt?.toISOString() ?? null,
                })),
                pagination,
            });
        },
        {
            name: "query_collector_report",
            description:
                "Flexible collector report. " +
                "email only → single collector view. " +
                "locationGroupId only → all collectors for that pin. " +
                "onlyUnredeemed=true → filter to collectors who haven't redeemed. " +
                "neither → all collectors paginated. Never returns redeemCode.",
            schema: z.object({
                email: z.string().nullable().describe("collector email for single view, null for all"),
                locationGroupId: z.string().nullable().describe("scope to one pin, null for all pins"),
                onlyUnredeemed: z.boolean().nullable().describe("true = only collectors who haven't redeemed"),
                limit: z.number().int().min(1).max(50).describe("per page, default 10"),
                offset: z.number().int().min(0).describe("skip N"),
            }),
        }
    );

    // ── TOOL 13: query_collector_loyalty ──────────────────────────────────────
    // Loyalty metrics and segmentation — champions, at-risk, new, etc.
    const queryCollectorLoyalty = tool(
        async ({ limit, offset }) => {
            const _limit = limit ?? 20;
            const _offset = offset ?? 0;
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get all collectors with their stats
            const raw = await db.locationConsumer.findMany({
                where: {
                    location: { locationGroup: { creatorId } },
                    claimedAt: { not: null },
                },
                select: {
                    claimedAt: true,
                    isRedeemed: true,
                    user: { select: { name: true, email: true, image: true } },
                },
                orderBy: { claimedAt: "desc" },
            });

            // Aggregate per user
            const byUser = new Map<string, {
                name: string; email: string; image: string | null;
                totalCollected: number; totalRedeemed: number;
                firstAt: Date; lastAt: Date;
            }>();

            for (const c of raw) {
                if (!c.claimedAt) continue;
                const key = c.user.email ?? "";
                const existing = byUser.get(key);
                if (existing) {
                    existing.totalCollected++;
                    if (c.isRedeemed) existing.totalRedeemed++;
                    if (c.claimedAt < existing.firstAt) existing.firstAt = c.claimedAt;
                    if (c.claimedAt > existing.lastAt) existing.lastAt = c.claimedAt;
                } else {
                    byUser.set(key, {
                        name: c.user.name ?? "Unknown",
                        email: c.user.email ?? "",
                        image: c.user.image ?? null,
                        totalCollected: 1,
                        totalRedeemed: c.isRedeemed ? 1 : 0,
                        firstAt: c.claimedAt,
                        lastAt: c.claimedAt,
                    });
                }
            }

            const collectors = Array.from(byUser.values()).map(u => {
                const redemptionRate = u.totalCollected > 0 ? Math.round(u.totalRedeemed / u.totalCollected * 100) : 0;
                const daysSinceLastSeen = Math.floor((now.getTime() - u.lastAt.getTime()) / (1000 * 60 * 60 * 24));
                const isNew = u.firstAt >= sevenDaysAgo;
                const isAtRisk = !isNew && u.lastAt < thirtyDaysAgo;
                const isChampion = redemptionRate >= 70 && u.totalCollected >= 3;
                const segment = isChampion ? "champion" : isNew ? "new" : isAtRisk ? "at_risk" : "collector_only";

                return {
                    name: u.name,
                    email: u.email,
                    image: u.image,
                    totalCollected: u.totalCollected,
                    totalRedeemed: u.totalRedeemed,
                    redemptionRate: `${redemptionRate}%`,
                    firstCollectedAt: u.firstAt.toISOString(),
                    lastCollectedAt: u.lastAt.toISOString(),
                    daysSinceLastSeen,
                    segment,
                };
            });

            const paginated = collectors.slice(_offset, _offset + _limit);

            return JSON.stringify({
                segments: {
                    champions: collectors.filter(c => c.segment === "champion"),
                    collectorsOnly: collectors.filter(c => c.segment === "collector_only"),
                    atRisk: collectors.filter(c => c.segment === "at_risk"),
                    newThisWeek: collectors.filter(c => c.segment === "new"),
                },
                topLoyal: collectors.sort((a, b) => b.totalCollected - a.totalCollected).slice(0, 10),
                pagination: buildPagination(collectors.length, _offset, _limit, paginated.length),
            });
        },
        {
            name: "query_collector_loyalty",
            description:
                "Collector loyalty metrics and segmentation. " +
                "Segments: champion (high collect + high redeem), collector_only, at_risk (gone quiet >30d), new (<7d). " +
                "Use for 'who are my most loyal collectors' or loyalty/retention questions.",
            schema: z.object({
                limit: z.number().int().min(1).max(100).describe("collectors per page, default 20"),
                offset: z.number().int().min(0).describe("skip N"),
            }),
        }
    );

    // ── TOOL 14: query_area_insights (web search) ─────────────────────────────
    // Researches real-world context for drop recommendations.
    const queryAreaInsights = tool(
        async ({ area, context }) => {
            const { ChatOpenAI } = await import("@langchain/openai");

            const llm = new ChatOpenAI({
                model: "gpt-5.4-mini",
                temperature: 0,
                maxTokens: 2000,
            }).bindTools([{ type: "web_search_preview" } as never]);

            const today = new Date().toISOString().split("T")[0]!;

            const response = await llm.invoke([{
                role: "user",
                content:
                    `Today is ${today}. Research "${area}" for location-based pin drop opportunities.\n\n` +
                    `Context: ${context ?? "General recommendation"}\n\n` +
                    `Find:\n` +
                    `1. Top 5 high foot-traffic areas/neighborhoods in ${area}\n` +
                    `2. Upcoming events or festivals in ${area} in the next 30 days\n` +
                    `3. Currently trending spots or new popular locations in ${area}\n` +
                    `4. Any seasonal context (current month patterns, local holidays)\n\n` +
                    `Return ONLY valid JSON — no markdown:\n` +
                    `{\n` +
                    `  "highTrafficAreas": [{"name":"...","description":"...","bestTime":"..."}],\n` +
                    `  "upcomingEvents":   [{"name":"...","date":"...","venue":"...","expectedCrowd":"..."}],\n` +
                    `  "trendingSpots":    [{"name":"...","reason":"..."}],\n` +
                    `  "seasonalContext":  "one sentence about current timing"\n` +
                    `}`,
            }]);

            // Extract text blocks only — web_search injects tool_use blocks
            const textContent = Array.isArray(response.content)
                ? response.content
                    .filter((b: { type?: string }) => b.type === "text")
                    .map((b: { text?: string }) => b.text ?? "")
                    .join("")
                : String(response.content ?? "");

            try {
                const clean = textContent.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
                const start = clean.indexOf("{");
                const end = clean.lastIndexOf("}");
                const parsed = JSON.parse(clean.slice(start, end + 1));
                return JSON.stringify({ area, ...parsed });
            } catch {
                return JSON.stringify({ area, highTrafficAreas: [], upcomingEvents: [], trendingSpots: [], seasonalContext: null });
            }
        },
        {
            name: "query_area_insights",
            description:
                "Web search for real-world context about a specific area. " +
                "Returns foot-traffic hotspots, upcoming events, trending spots, and seasonal context. " +
                "Use ONLY for drop recommendation requests — not for managing existing pins. " +
                "Always combine with query_time_analytics and query_pin_type_analytics for full recommendations.",
            schema: z.object({
                area: z.string().describe("City or region to research (e.g. 'Dhaka', 'New York')"),
                context: z.string().nullable().describe("Optional context about what creator is looking for"),
            }),
        }
    );

    // ── TOOL 15: edit_pins ────────────────────────────────────────────────────
    const editPins = tool(
        async ({ ids, fields }) => {
            const data = Object.fromEntries(
                Object.entries(fields).filter(([, v]) => v !== null && v !== undefined)
            );
            if (Object.keys(data).length === 0)
                return JSON.stringify({ ok: false, error: "No fields to update" });

            await db.locationGroup.updateMany({ where: { id: { in: ids }, creatorId }, data });
            return JSON.stringify({ ok: true, updated: ids.length });
        },
        {
            name: "edit_pins",
            description: "Update LocationGroup fields. Only non-null fields are applied. Empty fields preserve existing values.",
            schema: z.object({
                ids: z.array(z.string()),
                fields: z.object({
                    title: z.string().nullable(),
                    description: z.string().nullable(),
                    startDate: z.string().nullable(),
                    endDate: z.string().nullable(),
                    latitude: z.number().nullable(),
                    longitude: z.number().nullable(),
                    radius: z.number().nullable(),
                    image: z.string().nullable(),
                    link: z.string().nullable(),
                    multiPin: z.boolean().nullable(),
                }),
            }),
        }
    );

    // ── TOOL 16: edit_hotspot ─────────────────────────────────────────────────
    const editHotspot = tool(
        async ({ hotspotId, fields, editScope }) => {
            const h = await db.hotspot.findFirst({ where: { id: hotspotId, creatorId } });
            if (!h) return JSON.stringify({ ok: false, error: "Hotspot not found" });

            const data = Object.fromEntries(
                Object.entries(fields).filter(([, v]) => v !== null && v !== undefined)
            );
            if (Object.keys(data).length === 0)
                return JSON.stringify({ ok: false, error: "No fields to update" });

            await db.hotspot.update({ where: { id: hotspotId }, data });

            // Cascade autoCollect to locations based on scope
            if (fields.autoCollect !== null && fields.autoCollect !== undefined) {
                const scopeFilter =
                    editScope === "future_drops" ? { startDate: { gte: new Date() } } :
                        editScope === "this_drop" ? {} : // handled by edit_pins directly
                            {};                                 // all_drops — no date filter

                await db.location.updateMany({
                    where: { locationGroup: { hotspotId, creatorId, ...scopeFilter } },
                    data: { autoCollect: fields.autoCollect },
                });
            }

            // Cascade multiPin based on scope
            if (fields.multiPin !== null && fields.multiPin !== undefined) {
                const scopeFilter =
                    editScope === "future_drops" ? { startDate: { gte: new Date() } } : {};

                await db.locationGroup.updateMany({
                    where: { hotspotId, creatorId, ...scopeFilter },
                    data: { multiPin: fields.multiPin },
                });
            }

            return JSON.stringify({ ok: true, scope: editScope ?? "all_drops" });
        },
        {
            name: "edit_hotspot",
            description:
                "Update hotspot-level fields. " +
                "editScope controls cascade: 'this_drop' | 'future_drops' | 'all_drops'. " +
                "autoCollect cascades to linked Locations. multiPin cascades to linked LocationGroups.",
            schema: z.object({
                hotspotId: z.string(),
                editScope: z.enum(["this_drop", "future_drops", "all_drops"]).nullable()
                    .describe("Scope for cascading changes. Default: all_drops"),
                fields: z.object({
                    autoCollect: z.boolean().nullable(),
                    multiPin: z.boolean().nullable(),
                    dropEveryDays: z.number().int().nullable(),
                    pinDurationDays: z.number().int().nullable(),
                    hotspotStartDate: z.string().nullable(),
                    hotspotEndDate: z.string().nullable(),
                    isActive: z.boolean().nullable(),
                }),
            }),
        }
    );

    // ── TOOL 17: edit_location ────────────────────────────────────────────────
    const editLocation = tool(
        async ({ locationId, fields }) => {
            const clean = Object.fromEntries(
                Object.entries(fields).filter(([, v]) => v !== null && v !== undefined)
            );
            if (Object.keys(clean).length === 0)
                return JSON.stringify({ ok: false, error: "No fields to update" });

            await db.location.updateMany({
                where: { id: locationId, locationGroup: { creatorId } },
                data: clean,
            });
            return JSON.stringify({ ok: true });
        },
        {
            name: "edit_location",
            description:
                "Edit a single Location point (lat/lng/autoCollect/hidden). " +
                "Manual autoCollect change here overrides the global hotspot autoCollect setting for this location.",
            schema: z.object({
                locationId: z.string(),
                fields: z.object({
                    latitude: z.number().nullable(),
                    longitude: z.number().nullable(),
                    autoCollect: z.boolean().nullable(),
                    hidden: z.boolean().nullable(),
                }),
            }),
        }
    );

    // ── TOOL 18: delete_pins ──────────────────────────────────────────────────
    const deletePins = tool(
        async ({ ids }) => {
            await db.locationGroup.updateMany({
                where: { id: { in: ids }, creatorId },
                data: { hidden: true },
            });
            return JSON.stringify({ ok: true, hidden: ids.length });
        },
        {
            name: "delete_pins",
            description: "Soft-delete pins by setting hidden=true. LocationConsumer records are never touched.",
            schema: z.object({
                ids: z.array(z.string()).describe("LocationGroup ids to hide"),
            }),
        }
    );

    // ── TOOL 19: delete_location ──────────────────────────────────────────────
    const deleteLocation = tool(
        async ({ locationId }) => {
            await db.location.updateMany({
                where: { id: locationId, locationGroup: { creatorId } },
                data: { hidden: true },
            });
            return JSON.stringify({ ok: true });
        },
        {
            name: "delete_location",
            description: "Soft-delete a single Location point. Sibling locations are unaffected.",
            schema: z.object({ locationId: z.string() }),
        }
    );

    // ── TOOL 20: pause_hotspot ────────────────────────────────────────────────
    const pauseHotspot = tool(
        async ({ hotspotId }) => {
            const h = await db.hotspot.findFirst({ where: { id: hotspotId, creatorId } });
            if (!h) return JSON.stringify({ ok: false, error: "Not found" });

            if (h.qstashScheduleId)
                await qstash.schedules.pause({ schedule: h.qstashScheduleId }).catch(() => null);

            await db.hotspot.update({ where: { id: hotspotId }, data: { isActive: false } });
            return JSON.stringify({ ok: true });
        },
        {
            name: "pause_hotspot",
            description: "Pause hotspot schedule. Stops future drops. Existing pins unaffected.",
            schema: z.object({ hotspotId: z.string() }),
        }
    );

    // ── TOOL 21: resume_hotspot ───────────────────────────────────────────────
    const resumeHotspot = tool(
        async ({ hotspotId }) => {
            const h = await db.hotspot.findFirst({ where: { id: hotspotId, creatorId } });
            if (!h) return JSON.stringify({ ok: false, error: "Not found" });
            if (!h.qstashScheduleId)
                return JSON.stringify({ ok: false, error: "Schedule permanently removed. Cannot resume." });

            await qstash.schedules.resume({ schedule: h.qstashScheduleId }).catch(() => null);
            await db.hotspot.update({ where: { id: hotspotId }, data: { isActive: true } });
            return JSON.stringify({ ok: true });
        },
        {
            name: "resume_hotspot",
            description: "Resume a paused hotspot schedule. Fails if hotspot was deleted.",
            schema: z.object({ hotspotId: z.string() }),
        }
    );

    // ── TOOL 22: delete_hotspot ───────────────────────────────────────────────
    const deleteHotspot = tool(
        async ({ hotspotId }) => {
            const h = await db.hotspot.findFirst({ where: { id: hotspotId, creatorId } });
            if (!h) return JSON.stringify({ ok: false, error: "Not found" });

            // Cancel QStash schedule first
            if (h.qstashScheduleId) {
                await qstash.schedules.pause({ schedule: h.qstashScheduleId }).catch(() => null);
                await qstash.schedules.delete(h.qstashScheduleId).catch(e =>
                    console.warn("[deleteHotspot] QStash delete failed:", e)
                );
            }

            // Soft-delete all linked drops + mark hotspot inactive
            await db.locationGroup.updateMany({ where: { hotspotId }, data: { hidden: true } });
            await db.hotspot.update({ where: { id: hotspotId }, data: { isActive: false } });

            return JSON.stringify({ ok: true });
        },
        {
            name: "delete_hotspot",
            description:
                "Delete a hotspot. Cancels QStash schedule and soft-deletes all linked LocationGroups. " +
                "Hotspot row stays in DB (isActive=false). Cannot be undone.",
            schema: z.object({ hotspotId: z.string() }),
        }
    );

    // ── Return all tools ──────────────────────────────────────────────────────
    return [
        // Read — pins
        queryPinsById,           // 1
        queryPins,               // 2
        queryLocationCollectors, // 3 — Level 3 drill-down (NEW)
        // Read — hotspots
        queryHotspots,           // 4
        queryHotspotDrops,       // 5
        queryHotspotTrend,       // 6 — trend per drop (NEW)
        // Read — analytics
        queryAnalyticsSummary,   // 7
        queryAnalyticsDetail,    // 8
        querySinglePinReport,    // 9 — deep single pin (NEW)
        queryTimeAnalytics,      // 10 — time-based analytics (NEW)
        queryPinTypeAnalytics,   // 11 — by pin type (NEW)
        // Read — collectors
        queryCollectorReport,    // 12 — updated with unredeemed filter
        queryCollectorLoyalty,   // 13 — loyalty segments (NEW)
        // Web search
        queryAreaInsights,       // 14 — real-world context for recommendations (NEW)
        // Write — pins
        editPins,                // 15
        editHotspot,             // 16 — updated with editScope
        editLocation,            // 17
        deletePins,              // 18
        deleteLocation,          // 19
        // Write — hotspots
        pauseHotspot,            // 20
        resumeHotspot,           // 21
        deleteHotspot,           // 22
    ];
};