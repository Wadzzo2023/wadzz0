// ~/lib/agent/classify-intent.ts
//
// Two responsibilities:
// 1. classifyIntent() — dedicated LLM call to determine
//    whether a message is "management", "pin_drop", or "ambiguous"
// 2. dbPresenceCheck() — quick Prisma query to detect if the
//    creator already has pins matching the extracted subject
//
// Called at the TOP of /api/agent/run before any pipeline runs.
// Neither function mutates any data.

import { ChatOpenAI } from "@langchain/openai";
import { db } from "~/server/db";
import type { PinIntent } from "~/lib/agent/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntentType = "management" | "pin_drop" | "ambiguous";

export interface IntentClassification {
    intent: IntentType;
    confidence: number;          // 0.0 – 1.0
    reasoning: string;           // one sentence why
    missingInfo: string | null;  // what is missing to be certain
    extractedSubject: string | null; // the THING mentioned (e.g. "thomas dambo trolls")
}

export interface DbPresenceCheck {
    found: boolean;
    count: number;
    sample: { id: string; title: string; startDate: Date | null; endDate: Date | null }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripJsonFences(text: string): string {
    return text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
}

function parseLooseJson<T>(raw: string): T | null {
    const clean = stripJsonFences(raw).trim();
    const start = clean.search(/[{[]/);
    if (start === -1) return null;
    const candidate = clean.slice(start);
    try { return JSON.parse(candidate) as T; } catch { /* continue */ }
    // attempt repair
    const repaired = candidate
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    try { return JSON.parse(repaired) as T; } catch { return null; }
}

function extractTextContent(content: unknown): string {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content
            .map((b) => {
                if (typeof b === "string") return b;
                if (typeof b === "object" && b !== null) {
                    const r = b as Record<string, unknown>;
                    if (typeof r.text === "string") return r.text;
                }
                return "";
            })
            .join("");
    }
    return "";
}

// ─── CLASSIFY INTENT ─────────────────────────────────────────────────────────
//
// Dedicated LLM call — no tools, no DB, pure classification.
// Reads full conversation history to handle follow-ups correctly.

export async function classifyIntent(
    messages: { role: string; text: string }[],
    priorIntent?: Partial<PinIntent> | null
): Promise<IntentClassification> {

    const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });

    // build conversation string for context
    const convo = messages
        .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
        .join("\n");

    // prior context hint
    const priorContext = priorIntent?.query
        ? `Prior conversation was about: "${priorIntent.query}" in "${priorIntent.area ?? "unspecified area"}".`
        : "No prior conversation context.";

    const res = await llm.invoke([
        {
            role: "system",
            content: `You are an intent router for a location-based pin platform.

A CREATOR can do exactly two things:

1. MANAGEMENT — work with their OWN existing pins stored in the database.
   Includes: view, list, show, edit, update, rename, delete, hide, remove,
   archive, pause, resume, analyze, performance, stats, claim rate,
   redemption, collectors, who collected, best performing, worst performing,
   where should I drop (uses own historical data).
   Signal words: "my", "mine", possessive language, past tense about own data.

2. PIN_DROP — find external real-world locations and create NEW pins from them.
   Includes: find, search, drop pins at, create pins for, all X in Y,
   locations of X, external brands (KFC, Starbucks), external categories
   (hospitals, restaurants, parks), art installations, UNESCO sites, events.
   Signal words: external subject + location, no possessive, "find", "search".

HARD CLASSIFICATION RULES:
- "my pins / my hotspot / my analytics" → management, high confidence
- external brand/place + area, no possessive → pin_drop, high confidence
- "delete / hide / edit / pause / resume" → management, high confidence
- "find / search / drop pins at [external thing]" → pin_drop
- verb missing entirely → ambiguous, low confidence
- subject missing entirely → ambiguous, missingInfo = "missing WHAT"
- conversation history matters:
    if prior turn was pin_drop and follow-up is "add more" → pin_drop
    if prior turn was management and follow-up is "what about X" → management
- typos do NOT lower confidence — understand semantically
- NEVER classify based on tone alone

EXTRACTED SUBJECT:
- The THING being talked about (not the action, not "pins")
- "find thomas dambo trolls" → "thomas dambo trolls"
- "hide my coffee shop pin" → "coffee shop"
- "drop pins at KFC in Dhaka" → "KFC"
- "show me my pins" → null (no specific subject)
- "drop 5 pins" → null (no subject stated)

${priorContext}

Return ONLY valid JSON — no markdown, no explanation:
{
  "intent": "management" | "pin_drop" | "ambiguous",
  "confidence": 0.0 to 1.0,
  "reasoning": "one sentence",
  "missingInfo": "what is missing to be certain, or null",
  "extractedSubject": "the thing being searched or acted on, or null"
}`,
        },
        {
            role: "user",
            content: `Classify this conversation:\n\n${convo}`,
        },
    ]);

    const raw = extractTextContent(res.content);

    const parsed = parseLooseJson<IntentClassification>(raw);

    if (!parsed) {
        // safe fallback — ask rather than guess wrong
        console.warn("[classifyIntent] Failed to parse LLM response:", raw);
        return {
            intent: "ambiguous",
            confidence: 0.0,
            reasoning: "Could not parse classifier response",
            missingInfo: "Unable to determine intent",
            extractedSubject: null,
        };
    }

    // clamp confidence to valid range
    parsed.confidence = Math.max(0, Math.min(1, parsed.confidence ?? 0));

    if (!parsed.extractedSubject) parsed.extractedSubject = null;
    if (!parsed.missingInfo) parsed.missingInfo = null;

    console.log("[classifyIntent]", {
        intent: parsed.intent,
        confidence: parsed.confidence,
        extractedSubject: parsed.extractedSubject,
        reasoning: parsed.reasoning,
    });

    return parsed;
}

// ─── DB PRESENCE CHECK ────────────────────────────────────────────────────────
//
// Quick Prisma query to detect if the creator already has pins
// matching the extracted subject from classifyIntent.
//
// Only called when:
//   - intent is "pin_drop" AND confidence < 0.85
//   - OR intent is "ambiguous"
//   - AND extractedSubject is not null
//
// Never mutates data.

export async function dbPresenceCheck(
    creatorId: string,
    subject: string
): Promise<DbPresenceCheck> {

    if (!subject?.trim()) {
        return { found: false, count: 0, sample: [] };
    }

    try {
        const matches = await db.locationGroup.findMany({
            where: {
                creatorId,
                hidden: false,
                title: {
                    contains: subject.trim(),
                    mode: "insensitive",
                },
            },
            select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                hotspotId: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        if (matches.length === 0) {
            return { found: false, count: 0, sample: [] };
        }

        // filter out templates (earliest createdAt per hotspot)
        const hotspotIds = [
            ...new Set(
                matches
                    .map((m) => m.hotspotId)
                    .filter(Boolean) as string[]
            ),
        ];

        const templateIds = new Set<string>();

        if (hotspotIds.length > 0) {
            const hotspots = await db.hotspot.findMany({
                where: { id: { in: hotspotIds }, creatorId },
                select: {
                    locationGroups: {
                        orderBy: { createdAt: "asc" },
                        take: 1,
                        select: { id: true },
                    },
                },
            });
            for (const h of hotspots) {
                const tid = h.locationGroups[0]?.id;
                if (tid) templateIds.add(tid);
            }
        }

        const filtered = matches.filter((m) => !templateIds.has(m.id));

        console.log("[dbPresenceCheck]", {
            subject,
            totalFound: matches.length,
            afterTemplateFilter: filtered.length,
        });

        return {
            found: filtered.length > 0,
            count: filtered.length,
            sample: filtered.slice(0, 5).map((m) => ({
                id: m.id,
                title: m.title,
                startDate: m.startDate,
                endDate: m.endDate,
            })),
        };
    } catch (err) {
        console.error("[dbPresenceCheck] Error:", err);
        return { found: false, count: 0, sample: [] };
    }
}

// ─── ROUTING DECISION ─────────────────────────────────────────────────────────
//
// Single function that combines classifyIntent + dbPresenceCheck
// and returns a clean routing decision for /api/agent/run.

export type RoutingDecision =
    | { route: "management"; classification: IntentClassification }
    | { route: "pin_drop"; classification: IntentClassification }
    | { route: "clarify"; classification: IntentClassification; dbCheck: DbPresenceCheck | null; reason: "ambiguous" | "low_confidence" | "db_conflict" }

export async function resolveRoute(
    messages: { role: string; text: string }[],
    creatorId: string,
    priorIntent?: Partial<PinIntent> | null
): Promise<RoutingDecision> {

    // ── STEP 1: classify intent ──────────────────────────────────────────────
    const classification = await classifyIntent(messages, priorIntent);

    const { intent, confidence, extractedSubject } = classification;

    // ── STEP 2: high confidence management → route directly ─────────────────
    if (intent === "management" && confidence >= 0.85) {
        return { route: "management", classification };
    }

    // ── STEP 3: high confidence pin_drop → DB check before routing ──────────
    if (intent === "pin_drop" && confidence >= 0.85) {
        if (extractedSubject) {
            const dbCheck = await dbPresenceCheck(creatorId, extractedSubject);
            if (dbCheck.found) {
                // creator already has these pins → ask what they want
                return {
                    route: "clarify",
                    classification,
                    dbCheck,
                    reason: "db_conflict",
                };
            }
        }
        // no conflict → route to pin_drop
        return { route: "pin_drop", classification };
    }

    // ── STEP 4: medium confidence → DB check to help decide ─────────────────
    if (confidence >= 0.60 && confidence < 0.85) {
        let dbCheck: DbPresenceCheck | null = null;

        if (extractedSubject) {
            dbCheck = await dbPresenceCheck(creatorId, extractedSubject);

            // DB has matching pins → lean management
            if (dbCheck.found && intent === "pin_drop") {
                return {
                    route: "clarify",
                    classification,
                    dbCheck,
                    reason: "db_conflict",
                };
            }

            // DB empty + pin_drop intent → proceed with pin_drop
            if (!dbCheck.found && intent === "pin_drop") {
                return { route: "pin_drop", classification };
            }

            // DB empty + management intent → proceed with management
            if (intent === "management") {
                return { route: "management", classification };
            }
        }

        // no subject extracted, medium confidence
        // route based on intent with soft warning
        if (intent === "management") {
            return { route: "management", classification };
        }
        if (intent === "pin_drop") {
            return { route: "pin_drop", classification };
        }
    }

    // ── STEP 5: low confidence or ambiguous → ask creator ───────────────────
    let dbCheck: DbPresenceCheck | null = null;
    if (extractedSubject) {
        dbCheck = await dbPresenceCheck(creatorId, extractedSubject);
    }

    return {
        route: "clarify",
        classification,
        dbCheck,
        reason: intent === "ambiguous" ? "ambiguous" : "low_confidence",
    };
}

// ─── CLARIFICATION MESSAGE BUILDER ───────────────────────────────────────────
//
// Generates the question shown to the creator when routing
// cannot be determined confidently.
//
// Returns an AgentResponse-compatible object.

export function buildClarificationResponse(
    decision: Extract<RoutingDecision, { route: "clarify" }>
): {
    type: "question";
    message: string;
    fields: { id: string; label: string; inputType: string; options?: string[] }[];
} {
    const { reason, classification, dbCheck } = decision;
    const subject = classification.extractedSubject;
    const missingInfo = classification.missingInfo;

    // ── DB conflict: creator has matching pins ───────────────────────────────
    if (reason === "db_conflict" && dbCheck && subject) {
        return {
            type: "question",
            message: `I found ${dbCheck.count} pin${dbCheck.count !== 1 ? "s" : ""} matching "${subject}" in your account. What would you like to do?`,
            fields: [
                {
                    id: "db_conflict_action",
                    label: "Choose an action",
                    inputType: "multiple_choice",
                    options: [
                        "Show my existing pins",
                        "Find more & add to collection",
                        "Search fresh — ignore existing",
                    ],
                },
            ],
        };
    }

    // ── No subject: missing WHAT ─────────────────────────────────────────────
    if (!subject && missingInfo?.toLowerCase().includes("what")) {
        return {
            type: "question",
            message: "What would you like to find or drop pins for?",
            fields: [
                {
                    id: "query",
                    label: "What are you looking for?",
                    inputType: "text",
                },
            ],
        };
    }

    // ── General ambiguity: management vs pin_drop ────────────────────────────
    if (subject) {
        return {
            type: "question",
            message: `What would you like to do with "${subject}"?`,
            fields: [
                {
                    id: "intent_choice",
                    label: "Choose what you mean",
                    inputType: "multiple_choice",
                    options: [
                        "Show or manage my existing pins",
                        "Find new locations & drop pins",
                    ],
                },
            ],
        };
    }

    // ── Fallback ─────────────────────────────────────────────────────────────
    return {
        type: "question",
        message: missingInfo ?? "Could you clarify what you'd like to do?",
        fields: [
            {
                id: "clarification",
                label: "What would you like to do?",
                inputType: "text",
            },
        ],
    };
}