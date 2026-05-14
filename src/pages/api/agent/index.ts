// src/app/api/agent/run/route.ts
//
// QStash calls this endpoint after agent.create enqueues a job.
// Runs the full LLM agent pipeline and writes the result back to AgentJob.
//
// ─── CHANGES FROM PREVIOUS VERSION ───────────────────────────────────────────
// 1. Imports updated tools (classify_query, backbone_fetch, etc.)
// 2. detectQueryType reads the new 5-type classification from tool results
// 3. gapFillPins uses the new regional_search + smart_geocode loop
// 4. Intent extractor sets isNiche based on classify_query results
// 5. System prompt uses buildIntentContext with new type information
// ─────────────────────────────────────────────────────────────────────────────

import type { NextApiRequest, NextApiResponse } from "next";
import { verifySignature } from "@upstash/qstash/nextjs";
import { db } from "~/server/db";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

import {
    ALL_TOOLS,
    AGENT_SYSTEM_PROMPT,
    searchViaGooglePlacesExported,
    deduplicatePins,
    retrievePins,
    storePins,
    clearPins,
    smartGeocode,
    discoverCitiesForCountry,
    type QueryType,
    type NamedLocation,
} from "~/lib/agent/tools";
import { createAgent } from "langchain";
import type {
    PinIntent,
    AgentStage,
    AgentResponse,
    Pin,
    MessageRole,
    PinOptions,
} from "~/lib/agent/types";
import { qstash } from "~/lib/qstash";
import { BASE_URL } from "~/lib/common";

// ─── Required for raw body (QStash signature verification) ───────────────────

export const config = { api: { bodyParser: false } };

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobPayload {
    jobId: string;
}

interface AgentRunInput {
    messages: { role: MessageRole; text: string }[];
    intent: Partial<PinIntent> | null;
    pinOptions: PinOptions | null;
    creatorId: string;
    pins?: Pin[];
}

// ─── LangChain helpers ────────────────────────────────────────────────────────

function toLangChainMessages(msgs: { role: MessageRole; text: string }[]): BaseMessage[] {
    return msgs.map((m) => {
        if (m.role === "user") return new HumanMessage(m.text);
        if (m.role === "assistant") return new AIMessage(m.text);
        return new SystemMessage(m.text);
    });
}

function parseAgentOutput(raw: string): AgentResponse | null {
    const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    try {
        const parsed = JSON.parse(clean.slice(start, end + 1)) as AgentResponse;
        if (!parsed.type) return null;
        return parsed;
    } catch {
        return null;
    }
}

async function reformatToJson(rawText: string): Promise<AgentResponse> {
    const SYSTEM = `Convert the message below into one of these JSON shapes. Return ONLY valid JSON, no markdown.
1. {"type":"results","message":"...","searchType":"LANDMARK"|"EVENT","pinCount":N,"confirmPrompt":"Drop N pins?"}
2. {"type":"confirm","message":"...","summary":{"what":"...","where":"...","count":N,"type":"LANDMARK"|"EVENT"}}
3. {"type":"question","message":"...","fields":[{"id":"...","label":"...","inputType":"multiple_choice"|"text"|"number","options":["..."]}]}
4. {"type":"success","message":"...","count":N}
5. {"type":"info","message":"..."}
Rules: no pins array, strip all markdown from message fields.`;
    try {
        const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });
        const res = await llm.invoke([
            { role: "system", content: SYSTEM },
            { role: "user", content: `Convert:\n\n${rawText.slice(0, 2000)}` },
        ]);
        const text =
            typeof res.content === "string"
                ? res.content
                : Array.isArray(res.content)
                    ? res.content
                        .filter((b): b is { type: "text"; text: string } => (b as { type: string }).type === "text")
                        .map((b) => b.text)
                        .join("")
                    : "";
        return parseAgentOutput(text) ?? { type: "info", message: rawText.replace(/[*#`[\]!]/g, "").trim().slice(0, 500) };
    } catch {
        return { type: "info", message: "Something went wrong. Please try again." };
    }
}

function stageFromResponse(r: AgentResponse): AgentStage {
    switch (r.type) {
        case "question": return "clarifying";
        case "results": return "confirming";
        case "confirm": return "confirming";
        case "success": return "done";
        default: return "extracting_intent";
    }
}

function mergeIntent(
    response: AgentResponse,
    current: Partial<PinIntent> | null | undefined,
    actualPinCount?: number
): PinIntent {
    const base: PinIntent = {
        count: current?.count ?? 1,
        countSpecified: current?.countSpecified ?? false,
        query: current?.query ?? null,
        area: current?.area ?? null,
        areaType: current?.areaType ?? "unknown",
        confirmed: current?.confirmed ?? false,
        isNiche: current?.isNiche ?? false,
        pinNumber: current?.pinNumber ?? 1,
        ambiguousPinIntent: current?.ambiguousPinIntent ?? false,
    };
    if (response.type === "confirm") {
        base.query = response.summary?.what ?? base.query;
        base.area = response.summary?.where ?? base.area;
        base.count = response.summary?.count ?? base.count;
    }
    if (response.type === "results") {
        const pinCount = actualPinCount ?? (response as { pinCount?: number }).pinCount;
        if (pinCount != null) base.count = pinCount;
    }
    if (response.type === "success") {
        base.confirmed = true;
        base.count = response.count ?? base.count;
    }
    return base;
}

// ─── Intent extractor ─────────────────────────────────────────────────────────
// (Unchanged except model name: using gpt-5.4-mini consistently)

async function extractIntent(
    msgs: { role: string; text: string }[],
    prior: Partial<PinIntent> | null | undefined
): Promise<PinIntent> {
    const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });
    const convo = msgs.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join("\n");

    const res = await llm.invoke([
        {
            role: "system",
            content: `You are an intent extractor for a map pin-drop assistant.
Return ONLY valid JSON — no markdown, no explanation:
{"query":string|null,"area":string|null,"count":number,"countSpecified":boolean,"areaType":"city"|"region"|"country"|"worldwide"|"unknown","confirmed":boolean,"pinNumber":number,"ambiguousPinIntent":boolean}

RULES:
- "pin"/"pins" = ACTION VERB, never the search subject. NEVER set query="pin" or "pins".
- "drop N pins" with NO category → pinNumber=N, count=1, query=null
- When count is not specified by the user (countSpecified=false), default count=200
- N > 10 + generic category + area → count=N, pinNumber=1, countSpecified=true
- N 2-10 + generic category, no "each" phrase → ambiguousPinIntent=true
- Correct obvious typos: "hostipals"→"hospitals", "resturant"→"restaurant"
- Preserve prior values unless the latest message changes them.

VAGUE AREA RULE:
If the user says "anywhere", "everywhere", "globally", "all over", "around the world":
  → Set area="worldwide" and areaType="worldwide"
  → These mean the user wants a global search.

PRIOR: query=${prior?.query ?? "null"}, area=${prior?.area ?? "null"}, count=${prior?.count ?? 1}, pinNumber=${prior?.pinNumber ?? 1}, confirmed=${prior?.confirmed ?? false}`,
        },
        { role: "user", content: convo },
    ]);

    const raw =
        typeof res.content === "string"
            ? res.content
            : Array.isArray(res.content)
                ? res.content
                    .filter((b): b is { type: "text"; text: string } => (b as { type: string }).type === "text")
                    .map((b) => b.text)
                    .join("")
                : "";

    try {
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as Partial<PinIntent>;
        return {
            count: parsed.count ?? prior?.count ?? 200,
            countSpecified: parsed.countSpecified ?? prior?.countSpecified ?? false,
            query: parsed.query ?? prior?.query ?? null,
            area: parsed.area ?? prior?.area ?? null,
            areaType: parsed.areaType ?? prior?.areaType ?? "unknown",
            confirmed: parsed.confirmed ?? prior?.confirmed ?? false,
            isNiche: prior?.isNiche ?? false,
            pinNumber: parsed.pinNumber ?? prior?.pinNumber ?? 1,
            ambiguousPinIntent: parsed.ambiguousPinIntent ?? false,
        };
    } catch {
        return {
            count: prior?.count ?? 200,
            countSpecified: prior?.countSpecified ?? false,
            query: prior?.query ?? null,
            area: prior?.area ?? null,
            areaType: prior?.areaType ?? "unknown",
            confirmed: prior?.confirmed ?? false,
            isNiche: prior?.isNiche ?? false,
            pinNumber: prior?.pinNumber ?? 1,
            ambiguousPinIntent: false,
        };
    }
}

// ─── Intent context builder ───────────────────────────────────────────────────
// Simplified — the heavy routing logic now lives in the system prompt.

function buildIntentContext(intent: PinIntent): string {
    const today = new Date().toISOString().split("T")[0]!;
    const totalCount = intent.count ?? 1;
    const countSpecified = intent.countSpecified ?? false;
    const pinNumber = intent.pinNumber ?? 1;
    const ambiguous = intent.ambiguousPinIntent ?? false;

    // ── EARLY EXIT: query is missing ────────────────────────────────────────
    if (!intent.query) {
        const areaText = intent.area ? ` in ${intent.area}` : "";
        return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SESSION — ${today}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MISSING: query (WHAT to search for)

MANDATORY: Respond IMMEDIATELY with a "question" JSON asking what to find${areaText}.
DO NOT call any tools.`;
    }

    // ── Known fields ────────────────────────────────────────────────────────

    const known: string[] = [];
    known.push(`query="${intent.query}"`);
    if (intent.area) known.push(`area="${intent.area}"`);
    known.push(
        countSpecified
            ? `count=${totalCount} (user specified)`
            : `count=unspecified (return ALL found)`
    );

    // ── Ambiguous ───────────────────────────────────────────────────────────

    const ambiguousSection = ambiguous
        ? `\n⚠️ AMBIGUOUS: The number ${pinNumber} could mean ${pinNumber} locations total OR ${pinNumber} pins per location. Ask to clarify.`
        : "";

    // ── Search strategy ─────────────────────────────────────────────────────

    let countStrategy: string;
    if (ambiguous) {
        countStrategy = `PAUSED — ask clarifying question first.`;
    } else if (!countSpecified) {
        countStrategy = `RETURN up to 200 locations. Do not ask "how many?".`;
    } else if (totalCount === 1) {
        countStrategy = `Find exactly 1 location. Stop after first result.`;
    } else {
        countStrategy = `Find exactly ${totalCount} locations. Use gap-fill if first pass falls short.`;
    }

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SESSION — ${today}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Known: ${known.join(" | ")}
pinNumber: ${pinNumber} (stamp on each pin, NOT a search count)
Strategy: ${countStrategy}${ambiguousSection}

MANDATORY: Call classify_query("${intent.query}"${intent.area ? `, "${intent.area}"` : ""}) as your FIRST tool call.
Then follow the 5-type decision tree in the system prompt.`;
}

// ─── Detect query type from tool results ──────────────────────────────────────
// NEW: reads the 5-type classification from classify_query results

function detectQueryType(messages: BaseMessage[]): { queryType: QueryType | null; isNiche: boolean } {
    for (const msg of messages) {
        if (msg._getType() !== "tool") continue;
        try {
            const parsed = JSON.parse(msg.content as string) as {
                type?: QueryType;
                isNiche?: boolean;
                locations?: unknown[];
            };
            if (parsed.type && ["official_list", "niche_scattered", "commercial_brand", "commercial_category", "event"].includes(parsed.type)) {
                const isNiche = parsed.type === "niche_scattered" || parsed.type === "official_list";
                return { queryType: parsed.type, isNiche };
            }
        } catch { /* skip */ }
    }
    return { queryType: null, isNiche: false };
}



// ─── Core agent runner ────────────────────────────────────────────────────────

async function runAgent(input: AgentRunInput): Promise<{
    reply: string;
    stage: AgentStage;
    intent: PinIntent;
    pins?: Pin[];
    pinOptions?: { autoCollect: boolean; groupingMode: "per-location" | "single-group" };
    jobId?: string;
}> {
    const { messages, intent: currentIntent, pinOptions, creatorId, pins: incomingPins } = input;

    // ── Short-circuit: pins already collected → create job ──────────────────
    if (pinOptions && incomingPins && incomingPins.length > 0) {
        const { autoCollect, groupingMode, pinNumber } = pinOptions;
        const mappedPins = incomingPins.map((pin) => ({ ...pin, autoCollect, pinNumber }));

        const lgJob = await db.locationGroupJob.create({
            data: {
                creatorId,
                status: "pending",
                total: mappedPins.length,
                completed: 0,
                payload: JSON.stringify({ pins: mappedPins, redeemMode: groupingMode }),
                log: [],
            },
        });

        await qstash.publishJSON({
            url: `${BASE_URL}/api/create-pins`,
            body: { jobId: lgJob.id, creatorId, pins: mappedPins, redeemMode: groupingMode },
            retries: 3,
        });

        const ci = currentIntent ?? {};
        return {
            reply: JSON.stringify({ type: "success", message: `Queued ${mappedPins.length} pins for creation…`, count: mappedPins.length }),
            stage: "done",
            intent: {
                count: ci.count ?? mappedPins.length, countSpecified: ci.countSpecified ?? true,
                query: ci.query ?? null, area: ci.area ?? null, areaType: ci.areaType ?? "unknown",
                confirmed: true, isNiche: ci.isNiche ?? false, pinNumber, ambiguousPinIntent: false,
            },
            jobId: lgJob.id,
        };
    }

    // 1. Extract intent
    const intent = await extractIntent(messages, currentIntent);

    // 2. Build system prompt
    const systemPrompt = AGENT_SYSTEM_PROMPT + buildIntentContext(intent);

    // 3. Run LLM agent with the new 10-tool set
    const agent = createAgent({
        model: new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0.2 }),
        tools: [...ALL_TOOLS],
        systemPrompt,
        name: "pin_drop_agent",
    });

    const result = await agent.invoke({ messages: toLangChainMessages(messages) });

    // 4. Harvest pins from pin store (tools now store pins out-of-band)
    const storedPins = retrievePins();
    let responsePins: Pin[] = storedPins?.pins ?? [];

    // 5. Detect query type from classify_query results
    const { queryType, isNiche } = detectQueryType(result.messages);


    // 7. Parse response JSON
    const lastMsg = result.messages.at(-1);
    const rawOutput = typeof lastMsg?.content === "string" ? lastMsg.content : JSON.stringify(lastMsg?.content ?? "");
    let agentResponse = parseAgentOutput(rawOutput) ?? (await reformatToJson(rawOutput));



    if (agentResponse.type === "results" && responsePins.length > 0) {
        agentResponse.pinCount = responsePins.length;
        agentResponse.message = agentResponse.message?.replace(/\d+/, String(responsePins.length));
        if (agentResponse.confirmPrompt) {
            agentResponse.confirmPrompt = `Drop these ${responsePins.length} pins?`;
        }
    }

    // 9. If confirmed → apply options + enqueue pin-creation job
    let locationGroupJobId: string | undefined;

    if (pinOptions && responsePins.length > 0) {
        const { autoCollect, groupingMode } = pinOptions;
        responsePins = responsePins.map((pin) => ({ ...pin, autoCollect, pinNumber: pinOptions.pinNumber }));

        const lgJob = await db.locationGroupJob.create({
            data: {
                creatorId,
                status: "pending",
                total: responsePins.length,
                completed: 0,
                payload: JSON.stringify({ pins: responsePins, redeemMode: groupingMode }),
                log: [],
            },
        });
        locationGroupJobId = lgJob.id;

        await qstash.publishJSON({
            url: `${BASE_URL}/api/create-pins`,
            body: { jobId: lgJob.id, creatorId, pins: responsePins, redeemMode: groupingMode },
            retries: 3,
        });

        agentResponse = {
            type: "success",
            message: `Queued ${responsePins.length} pin${responsePins.length !== 1 ? "s" : ""} for creation…`,
            count: responsePins.length,
        };
    }

    // Clear pin store after processing
    clearPins();

    const outputIntent = mergeIntent(agentResponse, { ...intent, isNiche }, responsePins.length || undefined);

    return {
        reply: JSON.stringify(agentResponse),
        stage: stageFromResponse(agentResponse),
        intent: outputIntent,
        pins: !pinOptions && responsePins.length > 0 ? responsePins : undefined,
        pinOptions: agentResponse.type === "results"
            ? { autoCollect: false, groupingMode: "per-location" }
            : undefined,
        jobId: locationGroupJobId,
    };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    let body: JobPayload;
    try {
        body = req.body as JobPayload;
    } catch {
        return res.status(400).json({ error: "Invalid JSON body" });
    }

    const { jobId } = body;
    if (!jobId) return res.status(400).json({ error: "Missing jobId" });

    const job = await db.agentJob.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });

    await db.agentJob.update({ where: { id: jobId }, data: { status: "processing" } });

    let agentInput: AgentRunInput;
    try {
        agentInput = JSON.parse(job.payload as string) as AgentRunInput;
    } catch {
        await db.agentJob.update({ where: { id: jobId }, data: { status: "failed", error: "Invalid job payload" } });
        return res.status(200).json({ ok: false, error: "Invalid payload" });
    }

    try {
        const result = await runAgent(agentInput);
        await db.agentJob.update({
            where: { id: jobId },
            data: { status: "completed", result: result as object },
        });
        return res.status(200).json({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[/api/agent] Job ${jobId} failed:`, err);
        await db.agentJob.update({ where: { id: jobId }, data: { status: "failed", error: message } }).catch(() => null);
        return res.status(200).json({ ok: false, error: message });
    }
}

export default verifySignature(handler);