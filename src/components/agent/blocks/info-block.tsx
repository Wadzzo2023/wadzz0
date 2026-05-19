"use client";

import { PinListBlock } from "~/components/agent/blocks/pin-list-block";
import { AnalyticsBlock } from "~/components/agent/analytics/analytics-block";
import { ReportBlock } from "~/components/agent/blocks/report-block";
import { CollectorReportBlock } from "~/components/agent/analytics/collector-report-block";
import { SinglePinReportBlock } from "~/components/agent/blocks/single-pin-report-block";
import { TopPinsReportBlock } from "~/components/agent/blocks/top-pins-report-block";
import { HotspotTrendBlock } from "~/components/agent/blocks/hotspot-trend-block";
import { TimeAnalyticsBlock } from "~/components/agent/blocks/time-analytics-block";
import { PinTypeAnalyticsBlock } from "~/components/agent/blocks/pin-type-analytics-block";
import { CollectorLoyaltyBlock } from "~/components/agent/blocks/collector-loyalty-block";
import { LocationCollectorsBlock } from "~/components/agent/blocks/location-collectors-block";
import { AreaRecommendationBlock } from "~/components/agent/blocks/area-recommendation-block";

import type { AgentResponse } from "~/lib/agent/types";
import type { PinEditFields, HotspotScope, LocationEditFields } from "~/components/agent/pins/pin-edit-form";
import type { HotspotEditFields } from "~/components/agent/hotspot/hotspot-edit-form";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InfoBlockProps {
    data: AgentResponse;
    // pin / hotspot actions
    onEdit?: (ids: string[], fields: PinEditFields, scope?: HotspotScope, locationEdits?: Record<string, LocationEditFields>) => void;
    onDelete?: (ids: string[]) => void;
    onEditHotspot?: (hotspotId: string, fields: HotspotEditFields) => void;
    onDeleteHotspot?: (hotspotId: string) => void;
    onPauseHotspot?: (hotspotId: string) => void;
    onResumeHotspot?: (hotspotId: string) => void;
    // pagination
    onLoadMore?: (nextOffset: number) => void;
    isLoadingMore?: boolean;
    // drill-down
    onViewLocationCollectors?: (locationId: string) => void;
    // recommendation
    onDropHere?: (area: string) => void;
    // send arbitrary message (used for recommendation → pin drop)
    onSendMessage?: (text: string) => void;
    isSlate?: boolean;  // whether this block is rendered in a "slate" style (used for all but the last block in a message)
}

// ─── InfoBlock ────────────────────────────────────────────────────────────────

export function InfoBlock({
    data,
    onEdit, onDelete, onEditHotspot, onDeleteHotspot, onPauseHotspot, onResumeHotspot,
    onLoadMore, isLoadingMore,
    onViewLocationCollectors,
    onDropHere, onSendMessage,
    isSlate = false,
}: InfoBlockProps) {
    console.log("Rendering InfoBlock with data:", data.type);
    switch (data.type) {

        // ── Pin list (standalone + hotspot grouped) ───────────────────────────
        case "pin_list":
        case "geo_pin_list":
            return (
                <PinListBlock
                    data={data.type === "geo_pin_list"
                        ? { standalone: data.data.standalone, hotspots: data.data.hotspots, pagination: data.data.pagination }
                        : data.data
                    }
                    geoContext={data.type === "geo_pin_list"
                        ? { area: data.data.area, radiusKm: data.data.radiusKm }
                        : undefined
                    }
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onEditHotspot={onEditHotspot}
                    onDeleteHotspot={onDeleteHotspot}
                    onPauseHotspot={onPauseHotspot}
                    onResumeHotspot={onResumeHotspot}
                    onLoadMore={onLoadMore}
                    isLoadingMore={isLoadingMore}
                    isSlate={isSlate}
                />
            );

        // ── Hotspot list only ─────────────────────────────────────────────────
        case "hotspot_list":
            return (
                <PinListBlock
                    data={{ standalone: [], hotspots: data.data.hotspots, pagination: data.data.pagination }}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onEditHotspot={onEditHotspot}
                    onDeleteHotspot={onDeleteHotspot}
                    onPauseHotspot={onPauseHotspot}
                    onResumeHotspot={onResumeHotspot}
                    onLoadMore={onLoadMore}
                    isLoadingMore={isLoadingMore}
                    isSlate={isSlate}
                />
            );

        // ── Analytics summary ─────────────────────────────────────────────────
        case "analytics":
            return <AnalyticsBlock data={data.data} />;

        // ── Full paginated report ─────────────────────────────────────────────
        case "report":
            return (
                <ReportBlock
                    data={data.data}
                    onLoadMore={onLoadMore}
                    isLoadingMore={isLoadingMore}
                    isSlate={isSlate}
                />
            );

        // ── Single pin deep analysis ──────────────────────────────────────────
        case "single_pin_report":
            return (
                <SinglePinReportBlock
                    data={data.data}
                    onViewLocationCollectors={onViewLocationCollectors}
                />
            );

        // ── Top N ranked pins ─────────────────────────────────────────────────
        case "top_pins_report":
            return <TopPinsReportBlock data={data.data} />;

        // ── Hotspot trend per drop ────────────────────────────────────────────
        case "hotspot_trend":
            return <HotspotTrendBlock data={data.data} />;

        // ── Time analytics ────────────────────────────────────────────────────
        case "time_analytics":
            return <TimeAnalyticsBlock data={data.data} />;

        // ── Pin type performance ──────────────────────────────────────────────
        case "pin_type_analytics":
            return <PinTypeAnalyticsBlock data={data.data} />;

        // ── Collector report (standard) ───────────────────────────────────────
        case "collector_report":
            return (
                <CollectorReportBlock
                    data={data.data}
                    onLoadMore={onLoadMore}
                    isLoadingMore={isLoadingMore}
                    isSlate={isSlate}
                />
            );

        // ── Collector loyalty / segments ──────────────────────────────────────
        case "collector_loyalty":
            return (
                <CollectorLoyaltyBlock
                    data={data.data}
                    onLoadMore={onLoadMore}
                    isLoadingMore={isLoadingMore}
                    isSlate={isSlate}
                />
            );

        // ── Location drill-down (Level 3) ─────────────────────────────────────
        case "location_collectors":
            return (
                <LocationCollectorsBlock
                    data={data.data}
                    onLoadMore={onLoadMore}
                    isLoadingMore={isLoadingMore}
                    isSlate={isSlate}
                />
            );

        // ── Drop area recommendations ─────────────────────────────────────────
        case "area_recommendation":
            return (
                <AreaRecommendationBlock
                    data={data.data}
                    onDropHere={onDropHere ?? (onSendMessage
                        ? (area) => onSendMessage(`Drop pins in ${area}`)
                        : undefined
                    )}
                />
            );

        // ── Info / error / unknown ────────────────────────────────────────────
        case "info":
        default:
            if (data.type === "info" && data.message) {
                return (
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                        {data.message}
                    </p>
                );
            }
            return null;
    }
}