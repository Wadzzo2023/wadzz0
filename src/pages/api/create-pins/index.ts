// src/app/api/agent/create-pins/route.ts
// QStash calls this endpoint after the agent router enqueues a pin-creation job.
// It processes each PinItem sequentially, updating progress in DB after every pin.

import type { NextApiRequest, NextApiResponse } from "next"
import { verifySignature, verifySignatureAppRouter } from "@upstash/qstash/nextjs"
import { db } from "~/server/db"
import { randomLocation as getLocationInLatLngRad } from "~/utils/map"
import type { PinItem } from "~/lib/agent/types"

// ─── Types ────────────────────────────────────────────────────────────────────
export const config = {
    api: {
        bodyParser: false,
    },
}

interface JobPayload {
    jobId: string
    creatorId: string
    pins: PinItem[]
    redeemMode: "separate" | "single"
}

interface LogEntry {
    title: string
    status: "ok" | "error"
    error?: string
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function createLocationGroup(
    creatorId: string,
    pin: PinItem,
): Promise<void> {
    const pinCount = pin.pinNumber ?? 1
    const radius = pin.radius ?? 2
    console.log("pin tyhpe", pin.type, "generating", pinCount, "locations with radius", radius)
    const locations = Array.from({ length: pinCount }).map(() => {
        const loc = getLocationInLatLngRad(pin.latitude, pin.longitude, radius)
        return {
            latitude: loc.latitude,
            longitude: loc.longitude,
            autoCollect: pin.autoCollect ?? false,
        }
    })

    await db.locationGroup.create({
        data: {
            creatorId,
            title: pin.title,
            description: pin.description,
            startDate: new Date(pin.startDate),
            endDate: new Date(pin.endDate),
            limit: pin.pinCollectionLimit ?? 999999,
            remaining: pin.pinCollectionLimit ?? 999999,
            image: pin.image ?? null,
            link: pin.url ?? null,
            multiPin: false,
            type: pin.type ?? "OTHER",
            locations: { createMany: { data: locations } },
        },
    })
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("Received create-pin job at", new Date().toISOString())
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    let body: JobPayload

    try {
        body = req.body as JobPayload
    } catch {
        return res.status(400).json({ error: "Invalid JSON body" })
    }

    const { jobId, creatorId, pins, redeemMode } = body

    if (!jobId || !creatorId || !Array.isArray(pins)) {
        return res.status(400).json({ error: "Missing required fields" })
    }

    // ── Mark job as processing ────────────────────────────────────────────────
    await db.locationGroupJob.update({
        where: { id: jobId },
        data: { status: "processing", total: pins.length },
    })

    const log: LogEntry[] = []

    try {
        if (redeemMode === "single") {
            // ── Single mode: one locationGroup, all pins as locations ─────────────
            const base = pins[0]
            if (!base) throw new Error("No pins provided")

            const allLocations = pins.map((p) => {
                const loc = getLocationInLatLngRad(p.latitude, p.longitude, p.radius ?? 2)
                return {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    autoCollect: p.autoCollect ?? false,
                }
            })

            try {
                await db.locationGroup.create({
                    data: {
                        creatorId,
                        title: base.title,
                        description: base.description,
                        startDate: new Date(base.startDate),
                        endDate: new Date(base.endDate),
                        limit: base.pinCollectionLimit ?? 999999,
                        remaining: base.pinCollectionLimit ?? 999999,
                        image: base.image ?? null,
                        link: base.url ?? null,
                        multiPin: false,
                        type: base.type ?? "OTHER",
                        locations: { createMany: { data: allLocations } },
                    },
                })

                // Mark all pins as ok in the log
                for (const pin of pins) {
                    log.push({ title: pin.title, status: "ok" })
                }

                await db.locationGroupJob.update({
                    where: { id: jobId },
                    data: {
                        status: "completed",
                        completed: pins.length,
                        log: log as object[],
                    },
                })
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Unknown error"
                for (const pin of pins) {
                    log.push({ title: pin.title, status: "error", error: msg })
                }
                await db.locationGroupJob.update({
                    where: { id: jobId },
                    data: {
                        status: "failed",
                        error: msg,
                        log: log as object[],
                    },
                })
            }
        } else {
            // ── Separate mode: one locationGroup per pin ──────────────────────────
            let completedCount = 0

            for (const pin of pins) {
                try {
                    await createLocationGroup(creatorId, pin)
                    log.push({ title: pin.title, status: "ok" })
                    completedCount++
                } catch (err) {
                    const msg = err instanceof Error ? err.message : "Unknown error"
                    log.push({ title: pin.title, status: "error", error: msg })
                    // Continue with remaining pins even if one fails
                }

                // Update progress after every pin
                await db.locationGroupJob.update({
                    where: { id: jobId },
                    data: {
                        completed: completedCount,
                        log: log as object[],
                        // Still "processing" unless this was the last one
                        status: completedCount === pins.length ? "completed" : "processing",
                    },
                })

                // Small delay to avoid DB hammering
                if (completedCount < pins.length) {
                    await new Promise((r) => setTimeout(r, 300))
                }
            }

            // If some pins failed, mark as failed
            const anyFailed = log.some((l) => l.status === "error")
            if (anyFailed) {
                await db.locationGroupJob.update({
                    where: { id: jobId },
                    data: {
                        status: "failed",
                        error: `${log.filter((l) => l.status === "error").length} pin(s) failed to create`,
                    },
                })
            }
        }
    } catch (err) {
        // Catastrophic failure
        const msg = err instanceof Error ? err.message : "Unknown error"
        await db.locationGroupJob.update({
            where: { id: jobId },
            data: { status: "failed", error: msg, log: log as object[] },
        }).catch(() => null) // don't throw if this update also fails
    }

    return res.status(200).json({ ok: true })
}
export default verifySignature(handler)
