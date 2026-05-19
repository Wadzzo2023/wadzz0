// src/app/api/agent/run/route.ts
//
// QStash calls this endpoint after agent.create enqueues a job.
// Runs the full agent pipeline and writes the result back to AgentJob.
//
// ─── PIPELINE ────────────────────────────────────────────────────────────────
//
// 1. Read AgentJob from DB
// 2. resolveRoute()
//    ├── classifyIntent()   — LLM call, no tools
//    ├── dbPresenceCheck()  — Prisma query (only when needed)
//    └── returns: "management" | "pin_drop" | "clarify"
//
// 3. ROUTE:
//    ├── management → runCreatorAgent()
//    ├── pin_drop   → runPinDropAgent()
//    └── clarify    → buildClarificationResponse()
//
// 4. Write result back to AgentJob { status: "completed", result }
//
// Frontend polls agentRouter.pollJobResult() — unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import type { NextApiRequest, NextApiResponse } from "next";
import { verifySignature } from "@upstash/qstash/nextjs";
import { db } from "~/server/db";

import {
    resolveRoute,
    buildClarificationResponse,
} from "~/lib/agent/classify-intent";

import { runCreatorAgent } from "~/lib/agent/pin-manage-agent";
import { runPinDropAgent } from "~/lib/agent/pin-drop-agent";

import type { PinIntent, MessageRole, PinOptions, Pin } from "~/lib/agent/types";

// ─── Required for raw body (QStash signature verification) ───────────────────

export const config = { api: { bodyParser: false } };

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobPayload {
    jobId: string;
}

interface AgentRunPayload {
    messages: { role: MessageRole; text: string }[];
    intent: Partial<PinIntent> | null;
    pinOptions: PinOptions | null;
    creatorId: string;
    pins?: Pin[];
    loadMore?: boolean;           // ← add
    loadMoreOffset?: number;      // ← add
    loadMoreType?: string;        // ← add
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // ── parse QStash body ─────────────────────────────────────────────────────
    let body: JobPayload;
    try {
        body = req.body as JobPayload;
    } catch {
        return res.status(400).json({ error: "Invalid JSON body" });
    }

    const { jobId } = body;
    if (!jobId) return res.status(400).json({ error: "Missing jobId" });

    // ── load job ──────────────────────────────────────────────────────────────
    const job = await db.agentJob.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });

    await db.agentJob.update({
        where: { id: jobId },
        data: { status: "processing" },
    });

    // ── parse payload ─────────────────────────────────────────────────────────
    let payload: AgentRunPayload;
    try {
        payload = JSON.parse(job.payload as string) as AgentRunPayload;
    } catch {
        await db.agentJob.update({
            where: { id: jobId },
            data: { status: "failed", error: "Invalid job payload" },
        });
        return res.status(200).json({ ok: false, error: "Invalid payload" });
    }

    const { messages, intent, pinOptions, creatorId, pins, loadMore, loadMoreOffset, loadMoreType } = payload;

    // ── run pipeline ──────────────────────────────────────────────────────────
    try {
        const result = await runAgentPipeline({
            messages,
            intent,
            pinOptions,
            creatorId,
            pins,
            loadMore,
            loadMoreOffset,
            loadMoreType,
        });

        await db.agentJob.update({
            where: { id: jobId },
            data: { status: "completed", result: result },
        });

        return res.status(200).json({ ok: true });

    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[/api/agent/run] Job ${jobId} failed:`, err);
        await db.agentJob
            .update({
                where: { id: jobId },
                data: { status: "failed", error: message },
            })
            .catch(() => null);
        return res.status(200).json({ ok: false, error: message });
    }
}

// ─── PIPELINE ─────────────────────────────────────────────────────────────────
//
// This is the only new function in this file.
// Everything else (handler, config, types) is unchanged.

async function runAgentPipeline(payload: AgentRunPayload): Promise<object> {
    const { messages, intent, pinOptions, creatorId, pins, loadMore, loadMoreOffset, loadMoreType } = payload;



    // ── STEP 1: ROUTE ─────────────────────────────────────────────────────────
    const decision = await resolveRoute(messages, creatorId, intent);



    // ── MANAGEMENT ────────────────────────────────────────────────────────────
    if (decision.route === "management") {
        console.log(`[decision.route: management] [runAgentPipeline] Running creator agent`);
        const result = await runCreatorAgent({
            messages,
            creatorId,
            priorIntent: intent,
            loadMore: loadMore ?? false,
            loadMoreOffset,
            loadMoreType,
        });

        return {
            reply: result.reply,
            stage: result.stage,
            intent: result.intent,
            mode: "management",
            pins: [],
        };
    }

    // ── PIN DROP ──────────────────────────────────────────────────────────────
    if (decision.route === "pin_drop") {
        console.log(`[decision.route: pin_drop] [runAgentPipeline] Running pin drop agent with intent: ${decision.classification.intent}`);
        const result = await runPinDropAgent({
            messages,
            intent,
            pinOptions,
            creatorId,
            pins,
        });

        return {
            reply: result.reply,
            stage: result.stage,
            intent: result.intent,
            pins: result.pins,
            pinOptions: result.pinOptions,
            jobId: result.jobId,
        };
    }

    // ── CLARIFY ───────────────────────────────────────────────────────────────
    const clarification = buildClarificationResponse(decision);

    console.log(`[decision.route: ${decision.route}] [runAgentPipeline] Clarification needed:`, {
        reason: decision.reason,
        subject: decision.classification.extractedSubject,
        message: clarification.message,
    });

    const preservedIntent: PinIntent = {
        count: intent?.count ?? 0,
        countSpecified: intent?.countSpecified ?? false,
        query: intent?.query ?? decision.classification.extractedSubject ?? null,
        area: intent?.area ?? null,
        areaType: intent?.areaType ?? "unknown",
        confirmed: false,
        isNiche: intent?.isNiche ?? false,
        pinNumber: intent?.pinNumber ?? 1,
        ambiguousPinIntent: false,
    };

    return {
        reply: JSON.stringify(clarification),
        stage: "clarifying" as const,
        intent: preservedIntent,
    };
}
export default verifySignature(handler);