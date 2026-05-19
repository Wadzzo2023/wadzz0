// ~/lib/agent/pin-drop-agent.ts
//
// Extracted and renamed from /api/agent/run route.ts.
// Was: runAgent()
// Now: runPinDropAgent()
//
// Handles the full external search pipeline:
//   classify_query → backbone_fetch / places_search /
//   subcategory_fanout / event_search / brand_country_search
//   → smart_geocode → storePins → confirm → create job
//
// Called by /api/agent/run when resolveRoute() returns "pin_drop".
// Nothing inside this file has changed from the original runAgent()
// except the function name and the import paths being explicit.

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { createAgent } from "langchain";
import { db } from "~/server/db";
import { qstash } from "~/lib/qstash";
import { BASE_URL } from "~/lib/common";

import {
    ALL_TOOLS,
    AGENT_SYSTEM_PROMPT,
    deduplicatePins,
    retrievePins,
    storePins,
    clearPins,
    type QueryType,
    type NamedLocation,
} from "~/lib/agent/pin-drop-tools";

import type {
    PinIntent,
    AgentStage,
    AgentResponse,
    Pin,
    MessageRole,
    PinOptions,
} from "~/lib/agent/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PinDropAgentInput {
    messages: { role: MessageRole; text: string }[];
    intent: Partial<PinIntent> | null;
    pinOptions: PinOptions | null;
    creatorId: string;
    pins?: Pin[];
}

export interface PinDropAgentOutput {
    reply: string;
    stage: AgentStage;
    intent: PinIntent;
    pins?: Pin[];
    pinOptions?: {
        autoCollect: boolean;
        groupingMode: "per-location" | "single-group";
    };
    jobId?: string;
}

// ─── LangChain helpers ────────────────────────────────────────────────────────

function toLangChainMessages(
    msgs: { role: MessageRole; text: string }[]
): BaseMessage[] {
    return msgs.map((m) => {
        if (m.role === "user") return new HumanMessage(m.text);
        if (m.role === "assistant") return new AIMessage(m.text);
        return new SystemMessage(m.text);
    });
}

function extractTextContent(content: unknown): string {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content
            .map((b) => {
                if (typeof b === "string") return b;
                if (typeof b === "object" && b !== null) {
                    const r = b as Record<string, unknown>;
                    if (r.type === "text" && typeof r.text === "string") return r.text;
                    if (typeof r.text === "string") return r.text;
                }
                return "";
            })
            .join("");
    }
    return String(content ?? "");
}

function stripJsonFences(text: string): string {
    return text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
}

function parseAgentOutput(raw: string): AgentResponse | null {
    const clean = stripJsonFences(raw);
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
        const text = extractTextContent(res.content);
        return (
            parseAgentOutput(text) ?? {
                type: "info",
                message: rawText.replace(/[*#`[\]!]/g, "").trim().slice(0, 500),
            }
        );
    } catch {
        return {
            type: "info",
            message: "Something went wrong. Please try again.",
        };
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

// ─── Intent extractor ─────────────────────────────────────────────────────────
// Unchanged from original runAgent — extracts structured intent from messages.

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

AREA RESET RULE:
- If the new query is clearly a DIFFERENT topic from the prior query → reset area to null
- Only preserve area if the user is refining/continuing the same search
- "thomas dambo trolls" is a different topic from "music events" → reset area`
        },
        { role: "user", content: convo },
    ]);

    const raw = extractTextContent(res.content);

    try {
        const parsed = JSON.parse(
            raw.replace(/```json|```/g, "").trim()
        ) as Partial<PinIntent>;
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
// Unchanged from original — builds the per-session context block appended
// to the system prompt so the agent knows what to search for.

function buildIntentContext(intent: PinIntent): string {
    const today = new Date().toISOString().split("T")[0]!;
    const totalCount = intent.count ?? 1;
    const countSpecified = intent.countSpecified ?? false;
    const pinNumber = intent.pinNumber ?? 1;
    const ambiguous = intent.ambiguousPinIntent ?? false;

    // ── missing query → ask immediately ────────────────────────────────────
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

    const known: string[] = [];
    known.push(`query="${intent.query}"`);
    if (intent.area) known.push(`area="${intent.area}"`);
    known.push(
        countSpecified
            ? `count=${totalCount} (user specified)`
            : `count=unspecified (return ALL found)`
    );

    const ambiguousSection = ambiguous
        ? `\n⚠️ AMBIGUOUS: The number ${pinNumber} could mean ${pinNumber} locations total OR ${pinNumber} pins per location. Ask to clarify.`
        : "";

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
// Reads classify_query results out of the LangChain message history.

function detectQueryType(
    messages: BaseMessage[]
): { queryType: QueryType | null; isNiche: boolean } {
    for (const msg of messages) {
        if (msg._getType() !== "tool") continue;
        try {
            const parsed = JSON.parse(msg.content as string) as {
                type?: QueryType;
                isNiche?: boolean;
                locations?: unknown[];
            };
            if (
                parsed.type &&
                [
                    "official_list",
                    "niche_scattered",
                    "commercial_brand",
                    "commercial_category",
                    "event",
                ].includes(parsed.type)
            ) {
                const isNiche =
                    parsed.type === "niche_scattered" ||
                    parsed.type === "official_list";
                return { queryType: parsed.type, isNiche };
            }
        } catch {
            /* skip non-JSON tool messages */
        }
    }
    return { queryType: null, isNiche: false };
}

// ─── Merge intent ─────────────────────────────────────────────────────────────

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
        const pinCount =
            actualPinCount ??
            (response as { pinCount?: number }).pinCount;
        if (pinCount != null) base.count = pinCount;
    }
    if (response.type === "success") {
        base.confirmed = true;
        base.count = response.count ?? base.count;
    }

    return base;
}

// ─── SHORT-CIRCUIT: pins already collected → create job directly ──────────────
// When the frontend sends back confirmed pins with pinOptions,
// skip the LLM entirely and enqueue the creation job.

async function handleConfirmedPins(
    input: PinDropAgentInput
): Promise<PinDropAgentOutput | null> {
    const { pinOptions, pins: incomingPins, creatorId, intent: currentIntent } = input;

    if (!pinOptions || !incomingPins || incomingPins.length === 0) return null;

    const { autoCollect, groupingMode, pinNumber } = pinOptions;
    const mappedPins = incomingPins.map((pin) => ({
        ...pin,
        autoCollect,
        pinNumber,
    }));

    const lgJob = await db.locationGroupJob.create({
        data: {
            creatorId,
            status: "pending",
            total: mappedPins.length,
            completed: 0,
            payload: JSON.stringify({
                pins: mappedPins,
                redeemMode: groupingMode,
            }),
            log: [],
        },
    });

    await qstash.publishJSON({
        url: `${BASE_URL}/api/create-pins`,
        body: {
            jobId: lgJob.id,
            creatorId,
            pins: mappedPins,
            redeemMode: groupingMode,
        },
        retries: 3,
    });

    const ci = currentIntent ?? {};

    return {
        reply: JSON.stringify({
            type: "success",
            message: `Queued ${mappedPins.length} pin${mappedPins.length !== 1 ? "s" : ""} for creation…`,
            count: mappedPins.length,
        }),
        stage: "done",
        intent: {
            count: ci.count ?? mappedPins.length,
            countSpecified: ci.countSpecified ?? true,
            query: ci.query ?? null,
            area: ci.area ?? null,
            areaType: ci.areaType ?? "unknown",
            confirmed: true,
            isNiche: ci.isNiche ?? false,
            pinNumber,
            ambiguousPinIntent: false,
        },
        jobId: lgJob.id,
    };
}

// ─── MAIN RUNNER ──────────────────────────────────────────────────────────────

export async function runPinDropAgent(
    input: PinDropAgentInput
): Promise<PinDropAgentOutput> {
    const { messages, intent: currentIntent, pinOptions, creatorId } = input;

    // ── short-circuit: confirmed pins → skip LLM, create job ────────────────
    const confirmedResult = await handleConfirmedPins(input);
    if (confirmedResult) return confirmedResult;

    // ── 1. extract intent from messages ────────────────────────────────────
    const intent = await extractIntent(messages, currentIntent);

    console.log("[runPinDropAgent] Intent extracted:", {
        query: intent.query,
        area: intent.area,
        count: intent.count,
        pinNumber: intent.pinNumber,
    });

    // ── 2. build system prompt with session context ─────────────────────────
    const systemPrompt = AGENT_SYSTEM_PROMPT + buildIntentContext(intent);

    // ── 3. run LangChain agent with pin-drop tools ──────────────────────────
    const agent = createAgent({
        model: new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0.2 }),
        tools: [...ALL_TOOLS],
        systemPrompt,
        name: "PinDropAgent",
    });

    const result = await agent.invoke({
        messages: toLangChainMessages(messages),
    });

    // ── 4. harvest pins from pin store ──────────────────────────────────────
    // tools store pins out-of-band via storePins()
    const storedPins = retrievePins();
    let responsePins: Pin[] = storedPins?.pins ?? [];

    // ── 5. detect query type from classify_query tool results ───────────────
    const { isNiche } = detectQueryType(result.messages);

    // ── 6. parse agent response ─────────────────────────────────────────────
    const lastMsg = result.messages?.at(-1);
    const rawOutput = extractTextContent(lastMsg?.content ?? "");
    let agentResponse =
        parseAgentOutput(rawOutput) ?? (await reformatToJson(rawOutput));

    // sync pin count into response message
    if (agentResponse.type === "results" && responsePins.length > 0) {
        agentResponse.pinCount = responsePins.length;
        agentResponse.message = agentResponse.message?.replace(
            /\d+/,
            String(responsePins.length)
        );
        if (agentResponse.confirmPrompt) {
            agentResponse.confirmPrompt = `Drop these ${responsePins.length} pins?`;
        }
    }

    // ── 7. if pinOptions sent → enqueue pin-creation job ───────────────────
    // This path fires when creator confirmed and frontend sends pinOptions
    // back with the same message history.
    let locationGroupJobId: string | undefined;

    if (pinOptions && responsePins.length > 0) {
        const { autoCollect, groupingMode } = pinOptions;
        responsePins = responsePins.map((pin) => ({
            ...pin,
            autoCollect,
            pinNumber: pinOptions.pinNumber,
        }));

        const lgJob = await db.locationGroupJob.create({
            data: {
                creatorId,
                status: "pending",
                total: responsePins.length,
                completed: 0,
                payload: JSON.stringify({
                    pins: responsePins,
                    redeemMode: groupingMode,
                }),
                log: [],
            },
        });
        locationGroupJobId = lgJob.id;

        await qstash.publishJSON({
            url: `${BASE_URL}/api/create-pins`,
            body: {
                jobId: lgJob.id,
                creatorId,
                pins: responsePins,
                redeemMode: groupingMode,
            },
            retries: 3,
        });

        agentResponse = {
            type: "success",
            message: `Queued ${responsePins.length} pin${responsePins.length !== 1 ? "s" : ""} for creation…`,
            count: responsePins.length,
        };
    }

    // ── 8. clear pin store after processing ────────────────────────────────
    clearPins();

    // ── 9. merge final intent ───────────────────────────────────────────────
    const outputIntent = mergeIntent(
        agentResponse,
        { ...intent, isNiche },
        responsePins.length || undefined
    );

    console.log("[runPinDropAgent] Done:", {
        type: agentResponse.type,
        pins: responsePins.length,
        jobId: locationGroupJobId,
    });

    return {
        reply: JSON.stringify(agentResponse),
        stage: stageFromResponse(agentResponse),
        intent: outputIntent,
        pins: !pinOptions && responsePins.length > 0 ? responsePins : undefined,
        pinOptions:
            agentResponse.type === "results"
                ? { autoCollect: false, groupingMode: "per-location" }
                : undefined,
        jobId: locationGroupJobId,
    };
}