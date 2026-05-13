// src/app/api/agent/run/route.ts  (or pages/api/agent/run.ts — see config below)
//
// QStash calls this endpoint after agent.create enqueues a job.
// It runs the full LLM agent pipeline and writes the result back to AgentJob.
// The frontend polls agentJobResult until status === "completed" | "failed".

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
    gapFillNicheViaWebSearch,
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
    pins?: Pin[];  // ← add this line
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

async function extractIntent(
    msgs: { role: string; text: string }[],
    prior: Partial<PinIntent> | null | undefined
): Promise<PinIntent> {
    const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
    const convo = msgs.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join("\n");

    const res = await llm.invoke([
        {
            role: "system",
            content: `You are an intent extractor for a map pin-drop assistant.
Return ONLY valid JSON — no markdown, no explanation, no code fences:
{"query":string|null,"area":string|null,"count":number,"countSpecified":boolean,"areaType":"city"|"region"|"country"|"worldwide"|"unknown","confirmed":boolean,"pinNumber":number,"ambiguousPinIntent":boolean}

════════════════════════════════════════
CRITICAL — "pin/pins" AS ACTION WORD
════════════════════════════════════════

The words "pin" and "pins" are the ACTION VERB meaning "drop a map marker".
They are NEVER the subject/category to search for.

NEVER set query="pin" or query="pins" under any circumstances.

════════════════════════════════════════
CORE RULE — "drop/place/put N pins"
════════════════════════════════════════

"drop N pins", "place N pins", "put N pins" WITH NO CATEGORY always means:
  → pinNumber=N   (N pins at each location found)
  → count=1       (find 1 location unless area implies more)
  → countSpecified=false
  → query=null    (ask the user what to search for)
  → ambiguousPinIntent=false

This is NEVER ambiguous when query is null.

Examples:
  "drop 5 pins in dhaka"          → pinNumber=5,  count=1, query=null, countSpecified=false
  "drop 10 pins in tokyo"         → pinNumber=10, count=1, query=null, countSpecified=false
  "place 3 pins in london"        → pinNumber=3,  count=1, query=null, countSpecified=false
  "put 2 pins in paris"           → pinNumber=2,  count=1, query=null, countSpecified=false
  "drop a pin in berlin"          → pinNumber=1,  count=1, query=null, countSpecified=false
  "drop 100 pins in new york"     → pinNumber=100, count=1, query=null, countSpecified=false

════════════════════════════════════════
FIELD RULES
════════════════════════════════════════

query:
  - The thing to search for (e.g. "KFC", "hospitals", "attic recording studio")
  - ALWAYS correct obvious typos: "hostipals"→"hospitals", "resturant"→"restaurant"
  - null if no category/subject is mentioned
  - NEVER "pin" or "pins"
  - Preserve prior if not updated: PRIOR="${prior?.query ?? "null"}"

area:
  - Geographic area (e.g. "Tokyo", "United States", "worldwide")
  - null if target is a specific named venue
  - null if not mentioned
  - Preserve prior if not updated: PRIOR="${prior?.area ?? "null"}"

count:
  - Total number of DISTINCT LOCATIONS to find
  - Default: 1
  - Only set >1 when a category is present AND a large number is given
  - Preserve prior if not updated: PRIOR=${prior?.count ?? 1}

countSpecified:
  - true ONLY if user explicitly gave a number that maps to count (category present + N>10)
  - false when query=null (N maps to pinNumber instead)
  - Default: false
  - PRIOR: ${prior?.countSpecified ?? false}

areaType:
  - "city"      → single city
  - "region"    → state/province/area
  - "country"   → full country
  - "worldwide" → global
  - "unknown"   → not specified
  - Preserve prior if not updated: PRIOR="${prior?.areaType ?? "unknown"}"

confirmed:
  - true ONLY if user says "yes", "confirm", "drop it", "go ahead", "do it", "ok drop"
  - false otherwise
  - PRIOR: ${prior?.confirmed ?? false}

════════════════════════════════════════
pinNumber RULES
════════════════════════════════════════

pinNumber = how many pins to place AT EACH individual location.
Default: 1
PRIOR: ${prior?.pinNumber ?? 1}

━━ STEP 1 — "drop/place/put N pins" with NO category (HIGHEST PRIORITY) ━━
If the user says "drop/place/put N pins" and there is NO category/subject:
  → pinNumber=N, count=1, countSpecified=false, query=null
  → This wins over ALL other steps

Examples:
  "drop 5 pins in dhaka"          → pinNumber=5,  count=1,    query=null
  "drop 100 pins in new york"     → pinNumber=100, count=1,   query=null
  "place 3 pins in london"        → pinNumber=3,  count=1,    query=null

━━ STEP 2 — Explicit per-location phrase ━━
Any of these patterns set pinNumber=N:
  "N pins at each [thing]"        → pinNumber=N
  "N per location"                → pinNumber=N
  "N at every location"           → pinNumber=N
  "N at each"                     → pinNumber=N
  "N pins at/around each [thing]" → pinNumber=N

Examples:
  "drop 5 pins at each KFC in London"       → pinNumber=5,  count=auto, query="KFC"
  "3 per location at hospitals in Tokyo"    → pinNumber=3,  count=auto, query="hospitals"
  "drop 10 at every restaurant in Berlin"   → pinNumber=10, count=auto, query="restaurants"

━━ STEP 3 — Specific named venue + number ━━
A specific named venue = a unique individually-identifiable place (not a category).
  ✓ Specific: "the attic recording studio", "McDonald's Times Square", "Central Park"
  ✗ Generic:  "hospitals", "KFC", "restaurants", "banks", "schools"

If query IS a specific named venue AND a number N is given:
  → pinNumber=N, count=1, countSpecified=false

Examples:
  "drop 100 pin at the attic recording studio" → pinNumber=100, count=1
  "drop 50 pins at Central Park"               → pinNumber=50,  count=1
  "5 pins at the Eiffel Tower"                 → pinNumber=5,   count=1

━━ STEP 4 — Large N (>10) + generic category + area ━━
If query IS a generic category AND N > 10 AND area is specified:
  → count=N, countSpecified=true, pinNumber=1

Examples:
  "100 KFC pins in the US"            → count=100, pinNumber=1, query="KFC"
  "drop 50 hospitals in California"   → count=50,  pinNumber=1, query="hospitals"
  "200 restaurants worldwide"         → count=200, pinNumber=1, query="restaurants"
  "drop 15 cafes in Paris"            → count=15,  pinNumber=1, query="cafes"

━━ STEP 5 — Ambiguous: small N (2–10) + generic category + area ━━
ONLY applies when ALL of these are true:
  1. A category/subject IS present
  2. N is between 2 and 10
  3. No "each/per location" phrase
  → ambiguousPinIntent=true, pinNumber=N, count=1, countSpecified=false

Examples:
  "place 5 pins in USA restaurant"    → ambiguousPinIntent=true, pinNumber=5,  query="restaurant"
  "drop 3 pins in Tokyo hospital"     → ambiguousPinIntent=true, pinNumber=3,  query="hospital"
  "put 2 pins in London cafe"         → ambiguousPinIntent=true, pinNumber=2,  query="cafe"

━━ STEP 6 — Default ━━
  pinNumber=1, ambiguousPinIntent=false

════════════════════════════════════════
FULL DISAMBIGUATION TABLE
════════════════════════════════════════

Message                                               | count | pinNumber | countSpec | ambiguous | query
"drop 5 pins in dhaka"                                |   1   |     5     |   false   |   false   | null  ← ask what
"drop 10 pins in tokyo"                               |   1   |    10     |   false   |   false   | null  ← ask what
"drop 100 pins in new york"                           |   1   |   100     |   false   |   false   | null  ← ask what
"place 3 pins in london"                              |   1   |     3     |   false   |   false   | null  ← ask what
"drop a pin in berlin"                                |   1   |     1     |   false   |   false   | null  ← ask what
"drop 100 KFC pins in the US"                         |  100  |     1     |   true    |   false   | "KFC"
"drop 5 pins at each KFC in London"                   | auto  |     5     |   false   |   false   | "KFC"
"drop 50 pins at Central Park"                        |   1   |    50     |   false   |   false   | "Central Park"
"drop 10 pins at McDonald's Times Square"             |   1   |    10     |   false   |   false   | "McDonald's Times Square"
"drop a pin at Eiffel Tower"                          |   1   |     1     |   false   |   false   | "Eiffel Tower"
"drop pins at hospitals in Tokyo"                     | auto  |     2     |   false   |   false   | "hospitals"
"5 per location at pharmacies in NY"                  | auto  |     5     |   false   |   false   | "pharmacies"
"drop 3 pins at each of 10 hospitals"                 |  10   |     3     |   true    |   false   | "hospitals"
"place 5 pins in USA restaurant"                      |   1   |     5     |   false   |   true    | "restaurant"
"drop 3 pins in Tokyo hospital"                       |   1   |     3     |   false   |   true    | "hospital"
"drop 50 pins in Tokyo restaurant"                    |  50   |     1     |   true    |   false   | "restaurant"
"drop 15 cafes in Paris"                              |  15   |     1     |   true    |   false   | "cafes"
"put 2 pins in London cafe"                           |   1   |     2     |   false   |   true    | "cafe"
"drop 8 pins in Berlin pharmacy"                      |   1   |     8     |   false   |   true    | "pharmacy"
"drop 11 pins in Berlin pharmacy"                     |  11   |     1     |   true    |   false   | "pharmacy"
"drop 100 pin at the attic recording studio"          |   1   |   100     |   false   |   false   | "The Attic Recording Studio"

CRITICAL RULES (in priority order):
  1. "drop/place/put N pins" with NO category       → pinNumber=N, count=1, query=null (STEP 1 wins)
  2. "each/per location/at each" phrase present     → ALWAYS pinNumber (STEP 2)
  3. specific named place + number                  → ALWAYS pinNumber (STEP 3)
  4. N > 10 + generic category + area               → ALWAYS count (STEP 4)
  5. N 2–10 + generic category, no "each"           → ambiguous=true (STEP 5)
  6. category BEFORE "pins" in sentence             → count wins
     "drop 100 restaurant pins in USA"              → count=100, pinNumber=1, query="restaurants"
  7. NEVER set query="pin" or query="pins"
  8. NEVER set ambiguousPinIntent=true when query=null

════════════════════════════════════════
PRIOR VALUES (preserve unless message updates them)
════════════════════════════════════════
query          = ${prior?.query ?? "null"}
area           = ${prior?.area ?? "null"}
count          = ${prior?.count ?? 1}
countSpecified = ${prior?.countSpecified ?? false}
areaType       = ${prior?.areaType ?? "unknown"}
confirmed      = ${prior?.confirmed ?? false}
pinNumber      = ${prior?.pinNumber ?? 1}

Only update a field if the latest user message changes it.
Never null out a prior value unless the user explicitly resets.`,
        },
        {
            role: "user",
            content: `Full conversation:\n${convo}`,
        },
    ]);

    const raw =
        typeof res.content === "string"
            ? res.content
            : Array.isArray(res.content)
                ? res.content
                    .filter(
                        (b): b is { type: "text"; text: string } =>
                            (b as { type: string }).type === "text"
                    )
                    .map((b) => b.text)
                    .join("")
                : "";

    try {
        const parsed = JSON.parse(
            raw.replace(/```json|```/g, "").trim()
        ) as Partial<PinIntent> & { pinNumber?: number; ambiguousPinIntent?: boolean };

        return {
            count: parsed.count ?? prior?.count ?? 1,
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
            count: prior?.count ?? 1,
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

function buildIntentContext(intent: PinIntent): string {
    const today = new Date().toISOString().split("T")[0]!;
    const totalCount = intent.count ?? 1;
    const countSpecified = intent.countSpecified ?? false;
    const pinNumber = intent.pinNumber ?? 1;
    const ambiguous = intent.ambiguousPinIntent ?? false;

    // ── EARLY EXIT: query is missing — force agent to ask immediately ─────
    if (!intent.query) {
        const areaText = intent.area ? ` in ${intent.area}` : "";
        return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SESSION — ${today}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MISSING: query (WHAT to search for)

MANDATORY INSTRUCTION:
The user has not specified what to search for.
You MUST NOT call any tools (no web_search, no places_search, nothing).
You MUST respond IMMEDIATELY with this exact JSON and nothing else:

{
  "type": "question",
  "message": "What would you like to find${areaText}?",
  "fields": [
    {
      "id": "query",
      "label": "What are you looking for?",
      "inputType": "text",
      "placeholder": "e.g. hospitals, restaurants, KFC, hotels..."
    }
  ]
}

DO NOT call web_search. DO NOT search for "pin" or "pins".
DO NOT proceed until the user answers this question.
`;
    }

    // ── Known / missing fields ────────────────────────────────────────────────

    const known: string[] = [
        countSpecified
            ? `count=${totalCount} (user specified)`
            : `count=unspecified (return ALL found)`,
    ];
    const missing: string[] = [];

    if (intent.query) known.push(`query="${intent.query}"`);
    else missing.push("query (WHAT to search for)");

    if (intent.area) known.push(`area="${intent.area}"`);

    // ── Ambiguous pin intent — must clarify before anything ──────────────────

    const ambiguousSection = ambiguous
        ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  AMBIGUOUS INTENT — CLARIFY FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The user gave the number ${pinNumber} with a generic category and area.
It is unclear whether they meant:
  (A) Find ${pinNumber} locations total
  (B) Drop ${pinNumber} pins at each location found

You MUST respond with this clarifying question ONLY.
Do NOT call any search tools. Do NOT search anything yet.
Respond with ONLY this exact JSON:
{
  "type": "question",
  "message": "Just to clarify — what did you mean by the number ${pinNumber}?",
  "fields": [
    {
      "id": "pinIntent",
      "label": "What did you mean by ${pinNumber}?",
      "inputType": "multiple_choice",
      "options": [
        "Find ${pinNumber} locations total (1 pin each)",
        "Drop ${pinNumber} pins at each location found"
      ]
    }
  ]
}
`
        : "";

    // ── Count / search strategy (ONLY about finding locations) ───────────────

    let countSection: string;

    if (ambiguous) {
        countSection = `SEARCH STRATEGY: Paused — awaiting clarification above. Do not search.`;

    } else if (!countSpecified || totalCount == null) {
        countSection = `
SEARCH STRATEGY — RETURN ALL:
  - count is unspecified — return every location found, do not cap.
  - Run places_search with area="${intent.area ?? ""}" as the location constraint.
  - ONLY return results physically located in "${intent.area ?? "the specified area"}". 
  - Discard any result whose address does not match the area. Do not return worldwide results.
  - Do not ask the user how many.`;

    } else if (totalCount === 1) {
        countSection = `
SEARCH STRATEGY — SINGLE LOCATION:
  - Find exactly 1 location.
  - Run one web_search + one places_search or geocode_address.
  - Stop after the first valid result. Do not over-fetch.`;

    } else {
        const numCities = Math.ceil(totalCount / 5);
        const perCityBuffered = Math.ceil(totalCount / numCities) * 2;

        countSection = `
SEARCH STRATEGY — MULTI LOCATION:
  - Find exactly ${totalCount} distinct locations. This is the ONLY goal of the search phase.
  - Step 1: call web_search("${intent.query ?? ""}") to understand what you are looking for.
  - Step 2 (choose one):
      If isNiche=true OR query is a specific named chain/brand:
        → geocode_address for each named location found.
      If a specific country is detected in area:
        → country_city_search(query, country, ${totalCount}).
      Otherwise (general category across region):
        → search ${numCities} cities × ${perCityBuffered} results each (2× buffer to cover duplicates).
  - De-duplicate across all cities.
  - Cap final list to exactly ${totalCount} locations before responding.
  - Buffer rule: always fetch 2× needed per city to account for failures/duplicates.`;
    }

    // ── pinNumber — completely separate from search, just a pin property ─────

    const pinNumberSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PIN NUMBER PROPERTY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pinNumber = ${pinNumber}

This is a PROPERTY VALUE that gets stamped onto each pin object.
It has NO effect on how many locations to search for.
It has NO effect on search strategy or result count.
It is NOT the number of locations. It is NOT the count.

Rules:
  - Do NOT use pinNumber to decide how many places to search.
  - Do NOT multiply it with count for any purpose.
  - Do NOT mention it in your search logic.
  - Do NOT ask the user about it again — it is already resolved.
  - Simply pass pinNumber=${pinNumber} through to the results response
    so the UI can pre-fill the stepper correctly.`;

    // ── Output format ─────────────────────────────────────────────────────────

    const outputRules = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  * Never include a raw pins array in your JSON response.
  * Never ask for count or area if they are already known.
  * Only ask if query is genuinely unknown.
  * Allowed response shapes:

  Found locations:
  {
    "type": "results",
    "message": "Found <N> <query> in <area>",
    "searchType": "LANDMARK" | "EVENT",
    "pinCount": <number of locations found>,
    "confirmPrompt": "Drop these pins?"
  }

  Clarifying question:
  {
    "type": "question",
    "message": "...",
    "fields": [{ "id": "...", "label": "...", "inputType": "multiple_choice" | "text" | "number", "options": ["..."] }]
  }

  Info / error:
  { "type": "info", "message": "..." }`;

    // ── Assemble ──────────────────────────────────────────────────────────────

    return [
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `[SESSION — ${today}]`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Known : ${known.join(" | ")}`,
        missing.length
            ? `Missing : ${missing.join(", ")}`
            : `Status  : ALL PARAMS KNOWN — proceed immediately`,
        ambiguousSection,
        countSection,
        pinNumberSection,
        outputRules,
    ]
        .filter(Boolean)
        .join("\n");
}
// ─── Gap-fill ─────────────────────────────────────────────────────────────────

async function gapFillPins(
    current: Pin[],
    target: number,
    query: string,
    alreadySearchedCities: string[],
    area: string | null,
    isNiche: boolean
): Promise<Pin[]> {
    if (current.length >= target) return current;

    if (isNiche) {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY ?? "";
        const foundNames = current.map((p) => p.title);
        const seenIds = new Set(current.map((p) => p.id));
        const combined = [...current];
        for (let round = 0; round < 3 && combined.length < target; round++) {
            const newPins = await gapFillNicheViaWebSearch(query, foundNames, target - combined.length, apiKey);
            if (!newPins.length) break;
            for (const p of newPins) {
                if (combined.length >= target) break;
                if (!seenIds.has(p.id)) { seenIds.add(p.id); foundNames.push(p.title); combined.push(p); }
            }
        }
        return combined;
    }

    const seenIds = new Set(current.map((p) => p.id));
    const combined = [...current];
    const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });
    const cityRes = await llm.invoke([{
        role: "user",
        content: `List ${Math.ceil((target - current.length) / 5) + alreadySearchedCities.length} major cities in "${area ?? "worldwide"}". Return ONLY: {"cities":["City1","City2"]}`,
    }]);
    const cityText = typeof cityRes.content === "string" ? cityRes.content : "";
    let allCities: string[] = [];
    try {
        allCities = (JSON.parse(cityText.replace(/```json|```/g, "").trim()) as { cities: string[] }).cities ?? [];
    } catch { return combined; }

    const searched = new Set(alreadySearchedCities.map((c) => c.toLowerCase()));
    const newCities = allCities.filter((c) => !searched.has(c.toLowerCase()));
    const perCity = Math.ceil((target - combined.length) / Math.max(newCities.length, 1)) * 2;

    const results = await Promise.all(
        newCities.map((city) => searchViaGooglePlacesExported(query, city, perCity).catch(() => [] as Pin[]))
    );
    for (const cityPins of results) {
        for (const p of cityPins) {
            if (combined.length >= target) break;
            if (!seenIds.has(p.id)) { seenIds.add(p.id); combined.push(p); }
        }
        if (combined.length >= target) break;
    }
    return combined;
}

function detectIsNiche(messages: BaseMessage[]): boolean {
    for (const msg of messages) {
        if (msg._getType() !== "tool") continue;
        try {
            const parsed = JSON.parse(msg.content as string) as { isNiche?: boolean; namedLocations?: unknown[] };
            if (parsed.isNiche === true) return true;
            if (Array.isArray(parsed.namedLocations) && parsed.namedLocations.length > 0) return true;
        } catch { /* skip */ }
    }
    return false;
}

// ─── Core agent runner ────────────────────────────────────────────────────────

async function runAgent(input: AgentRunInput): Promise<{
    reply: string;
    stage: AgentStage;
    intent: PinIntent;
    pins?: Pin[];
    pinOptions?: { autoCollect: boolean; groupingMode: "per-location" | "single-group" };
    jobId?: string; // set when pins are enqueued for creation
}> {
    const { messages, intent: currentIntent, pinOptions, creatorId, pins: incomingPins } = input;
    // ── Short-circuit: pins already collected, just create the job ────────
    if (pinOptions && incomingPins && incomingPins.length > 0) {
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
                payload: JSON.stringify({ pins: mappedPins, redeemMode: groupingMode }),
                log: [],
            },
        });

        await qstash.publishJSON({
            url: `${BASE_URL}/api/create-pins`,
            body: { jobId: lgJob.id, creatorId, pins: mappedPins, redeemMode: groupingMode },
            retries: 3,
        });

        const currentIntent2 = currentIntent ?? {};
        return {
            reply: JSON.stringify({
                type: "success",
                message: `Queued ${mappedPins.length} pins for creation…`,
                count: mappedPins.length,
            }),
            stage: "done" as AgentStage,
            intent: {
                count: currentIntent2.count ?? mappedPins.length,
                countSpecified: currentIntent2.countSpecified ?? true,
                query: currentIntent2.query ?? null,
                area: currentIntent2.area ?? null,
                areaType: currentIntent2.areaType ?? "unknown",
                confirmed: true,
                isNiche: currentIntent2.isNiche ?? false,
                pinNumber,
                ambiguousPinIntent: false,
            },
            jobId: lgJob.id,
        };
    }
    // ── End short-circuit ─────────────────────────────────────────────────
    // 1. Extract intent
    const intent = await extractIntent(messages, currentIntent);

    // 2. Build system prompt
    const systemPrompt = AGENT_SYSTEM_PROMPT + buildIntentContext(intent);

    // 3. Run LLM agent
    const agent = createAgent({
        model: new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0.2 }),
        tools: [...ALL_TOOLS],
        systemPrompt,
        name: "pin_drop_agent",
    });

    const result = await agent.invoke({ messages: toLangChainMessages(messages) });

    // 4. Harvest pins from tool call results
    const responsePins: Pin[] = [];
    const searchedCities: string[] = [];

    for (const msg of result.messages) {
        if (msg._getType() !== "tool") continue;
        try {
            const toolInput = (msg as unknown as { additional_kwargs?: { tool_input?: string } })
                .additional_kwargs?.tool_input;
            if (toolInput) {
                const parsed = JSON.parse(toolInput) as { city?: string };
                if (parsed.city) searchedCities.push(parsed.city);
            }
        } catch { /* ignore */ }

        try {
            const parsed = JSON.parse(msg.content as string) as { pins?: Pin[] };
            if (Array.isArray(parsed.pins) && parsed.pins.length > 0) {
                responsePins.push(...parsed.pins);
                (msg as unknown as { content: string }).content = JSON.stringify({
                    total: parsed.pins.length,
                    message: `Found ${parsed.pins.length} pins.`,
                });
            }
        } catch { /* not a pin result */ }
    }

    // 5. Detect niche flag
    const isNiche = detectIsNiche(result.messages) || (intent.isNiche ?? false);

    // 6. Cap / gap-fill
    let cappedPins: Pin[];
    if (!intent.countSpecified || intent.count == null) {
        cappedPins = responsePins;
    } else {
        const target = intent.count;
        cappedPins =
            responsePins.length >= target
                ? responsePins.slice(0, target)
                : (await gapFillPins(responsePins, target, intent.query ?? "", searchedCities, intent.area ?? null, isNiche)).slice(0, target);
    }

    // 7. Parse response JSON
    const lastMsg = result.messages.at(-1);
    const rawOutput = typeof lastMsg?.content === "string" ? lastMsg.content : JSON.stringify(lastMsg?.content ?? "");
    let agentResponse = parseAgentOutput(rawOutput) ?? (await reformatToJson(rawOutput));

    // 8. Guard: 0 pins → attempt worldwide fallback before giving up
    const shouldFallbackInfo =
        agentResponse.type === "info" &&
        cappedPins.length === 0 &&
        intent.query &&
        /no locations found|try a different search/i.test(agentResponse.message);

    if ((agentResponse.type === "results" && cappedPins.length === 0) || shouldFallbackInfo) {
        const fallbackTarget = intent.countSpecified && intent.count != null ? intent.count : 10;
        const worldwidePins = intent.query
            ? await gapFillPins(responsePins, fallbackTarget, intent.query, searchedCities, null, isNiche)
            : [];

        if (worldwidePins.length > 0) {
            cappedPins = intent.countSpecified && intent.count != null ? worldwidePins.slice(0, intent.count) : worldwidePins;
            agentResponse = {
                type: "results",
                message: `Found ${cappedPins.length} ${intent.query ?? "locations"} worldwide.`,
                searchType: (agentResponse.type === "results" ? agentResponse.searchType : "LANDMARK"),
                pinCount: cappedPins.length,
                confirmPrompt: `Drop these ${cappedPins.length} pins?`,
            };
        } else {
            agentResponse = {
                type: "info",
                message: `No locations found for "${intent.query}" in "${intent.area ?? "worldwide"}". Try a different search.`,
            };
        }
    }

    if (agentResponse.type === "results" && cappedPins.length > 0) {
        agentResponse.pinCount = cappedPins.length;
        agentResponse.message = agentResponse.message?.replace(/\d+/, String(cappedPins.length));
        if (agentResponse.confirmPrompt) {
            agentResponse.confirmPrompt = `Drop these ${cappedPins.length} pins?`;
        }
    }

    // 9. If confirmed → apply options + enqueue pin-creation job
    let locationGroupJobId: string | undefined;

    if (pinOptions && cappedPins.length > 0) {
        const { autoCollect, groupingMode } = pinOptions;

        cappedPins = cappedPins.map((pin) => ({
            ...pin,
            autoCollect,
            pinNumber: pinOptions.pinNumber,
        }));
        // Create LocationGroupJob
        const lgJob = await db.locationGroupJob.create({
            data: {
                creatorId,
                status: "pending",
                total: cappedPins.length,
                completed: 0,
                payload: JSON.stringify({ pins: cappedPins, redeemMode: groupingMode }),
                log: [],
            },
        });
        locationGroupJobId = lgJob.id;

        await qstash.publishJSON({
            url: `${BASE_URL}/api/create-pins`,
            body: { jobId: lgJob.id, creatorId, pins: cappedPins, redeemMode: groupingMode },
            retries: 3,
        });

        agentResponse = {
            type: "success",
            message: `Queued ${cappedPins.length} pin${cappedPins.length !== 1 ? "s" : ""} for creation…`,
            count: cappedPins.length,
        };
    }

    const outputIntent = mergeIntent(agentResponse, { ...intent, isNiche }, cappedPins.length || undefined);

    return {
        reply: JSON.stringify(agentResponse),
        stage: stageFromResponse(agentResponse),
        intent: outputIntent,
        pins: !pinOptions && cappedPins.length > 0 ? cappedPins : undefined,
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

    // Load the AgentJob row
    const job = await db.agentJob.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Mark as processing
    await db.agentJob.update({
        where: { id: jobId },
        data: { status: "processing" },
    });

    let agentInput: AgentRunInput;
    try {
        agentInput = JSON.parse(job.payload as string) as AgentRunInput;
    } catch {
        await db.agentJob.update({
            where: { id: jobId },
            data: { status: "failed", error: "Invalid job payload" },
        });
        return res.status(200).json({ ok: false, error: "Invalid payload" });
    }

    try {
        const result = await runAgent(agentInput);

        await db.agentJob.update({
            where: { id: jobId },
            data: {
                status: "completed",
                result: result as object,
            },
        });

        return res.status(200).json({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[/api/agent] Job ${jobId} failed:`, err);

        await db.agentJob.update({
            where: { id: jobId },
            data: { status: "failed", error: message },
        }).catch(() => null);

        return res.status(200).json({ ok: false, error: message });
    }
}

export default verifySignature(handler);