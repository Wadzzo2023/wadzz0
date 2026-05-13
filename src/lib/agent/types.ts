// types.ts
// ─── Shared types for the PinDrop Agent ──────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export type AreaType = "city" | "region" | "country" | "worldwide" | "unknown";

// ─────────────────────────────────────────────────────────────────────────────
// Pin
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratedPin {
  id: string;
  type: "EVENT" | "LANDMARK";
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  url?: string;
  image?: string;
  address?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface Pin extends GeneratedPin {
  startDate: string;
  endDate: string;
  url?: string;
  image?: string;
  pinCollectionLimit: number;
  pinNumber: number;
  radius: number;
  autoCollect: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pin options — chosen by the user on the results screen before confirming
// ─────────────────────────────────────────────────────────────────────────────

export type GroupingMode = "per-location" | "single-group";

export interface PinOptions {
  /** Whether pins are auto-collected on proximity. Default: false. */
  autoCollect: boolean;
  /**
   * "per-location" → N pins into N location groups (one group per pin).
   * "single-group"  → N pins all share 1 location group.
   * Default: "per-location".
   */
  groupingMode: GroupingMode;
  pinNumber: number;

}

// ─────────────────────────────────────────────────────────────────────────────
// Intent
// ─────────────────────────────────────────────────────────────────────────────

export interface PinIntent {
  query: string | null;
  area: string | null;
  count: number | null;
  countSpecified: boolean;   // true only when user gave an explicit number
  areaType: AreaType;
  confirmed: boolean;
  isNiche: boolean;          // true = geocode_address path; false = places_search path
  pinNumber?: number;         // how many pins the user wants to drop (default: 1)
  ambiguousPinIntent: boolean; // ← new
}

// ─────────────────────────────────────────────────────────────────────────────
// AgentStage
// ─────────────────────────────────────────────────────────────────────────────

export type AgentStage =
  | "idle"
  | "extracting_intent"
  | "clarifying"
  | "searching"
  | "confirming"
  | "dropping_pins"
  | "done"
  | "error";

// ─────────────────────────────────────────────────────────────────────────────
// Clarify question
// ─────────────────────────────────────────────────────────────────────────────

export type InputType = "multiple_choice" | "text" | "number";

export interface ClarifyQuestion {
  id: string;
  label: string;
  inputType: InputType;
  options?: string[];
  placeholder?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// City discovery
// ─────────────────────────────────────────────────────────────────────────────

export interface CityDiscoveryResult {
  cities: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// tRPC output
// NOTE: pins are returned here directly from the server-side pin store.
//       They are NOT embedded in the agent's JSON text response (avoids truncation).
//       The frontend reads pins from this field, not from AgentResponse.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatCreateOutput {
  reply: string;              // JSON string of a lightweight AgentResponse (no pins array inside)
  stage: AgentStage;
  intent: PinIntent;
  questions?: ClarifyQuestion[];
  pins?: Pin[];               // Full pin array injected server-side — not from LLM text
  /**
   * Present only when stage === "confirming" and agentResponse.type === "results".
   * Contains the default PinOptions the UI should pre-select.
   */
  pinOptions?: PinOptions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured agent response types
//
// IMPORTANT: ResultsResponse and ConfirmResponse no longer carry a pins array.
// Pins travel via ChatCreateOutput.pins (server-side store), not through LLM text.
// ─────────────────────────────────────────────────────────────────────────────

export interface QuestionResponse {
  type: "question";
  message: string;
  fields: ClarifyQuestion[];
}

export interface ResultsResponse {
  type: "results";
  message: string;
  searchType: "EVENT" | "LANDMARK";
  pinCount: number;           // count only — full pins come from ChatCreateOutput.pins
  confirmPrompt: string;
}

export interface ConfirmResponse {
  type: "confirm";
  message: string;
  summary: {
    what: string;
    where: string;
    count: number;
    type: "EVENT" | "LANDMARK";
  };
  // no pins array — frontend uses locally stored pins from the results step
}

export interface SuccessResponse {
  type: "success";
  message: string;
  count: number;
}

export interface InfoResponse {
  type: "info";
  message: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: AgentResponse[];
  createdAt: Date;
}

export type AgentResponse =
  | QuestionResponse
  | ResultsResponse
  | ConfirmResponse
  | SuccessResponse
  | InfoResponse;

// ─────────────────────────────────────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────────────────────────────────────

export const isQuestionResponse = (r: AgentResponse): r is QuestionResponse => r.type === "question";
export const isResultsResponse = (r: AgentResponse): r is ResultsResponse => r.type === "results";
export const isConfirmResponse = (r: AgentResponse): r is ConfirmResponse => r.type === "confirm";
export const isSuccessResponse = (r: AgentResponse): r is SuccessResponse => r.type === "success";
export const isInfoResponse = (r: AgentResponse): r is InfoResponse => r.type === "info";

// ─────────────────────────────────────────────────────────────────────────────
// Parser
// ─────────────────────────────────────────────────────────────────────────────

export function parseAgentResponse(raw: string): AgentResponse {
  try {
    const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(clean) as AgentResponse;
    if (!parsed.type) throw new Error("Missing type field");
    return parsed;
  } catch (err) {
    console.error("[parseAgentResponse] Failed to parse:", err);
    return { type: "info", message: raw };
  }
}