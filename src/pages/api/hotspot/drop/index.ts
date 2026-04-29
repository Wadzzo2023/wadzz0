/**
 * POST /api/hotspot/drop
 * Place at: pages/api/hotspot/drop/index.ts
 *
 * Called by Upstash QStash on each scheduled interval.
 * Verifies the QStash signature, then drops a new batch of pins.
 *
 * Required env vars:
 *   QSTASH_CURRENT_SIGNING_KEY
 *   QSTASH_NEXT_SIGNING_KEY
 */

import type { NextApiRequest, NextApiResponse } from "next"
import { db } from "~/server/db"
import { dropPinsForHotspot } from "~/server/api/routers/maps/pin"
import { verifySignature } from "@upstash/qstash/nextjs"
import { env } from "~/env"

async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("[hotspot/drop] Received request")
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const body = req.body as { hotspotId?: string }

        if (!body.hotspotId) {
            return res.status(400).json({ error: "Missing hotspotId" })
        }

        const result = await dropPinsForHotspot(db, body.hotspotId)

        return res.status(200).json({ ok: true, ...result })
    } catch (err) {
        console.error("[hotspot/drop] Error:", err)
        return res.status(500).json({ error: "Internal error" })
    }
}

export default verifySignature(handler)
