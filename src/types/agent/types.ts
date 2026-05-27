// ~/lib/agent/types.ts
// Unified types for Pin Agent — management + pin-drop

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";
export type AreaType = "city" | "region" | "country" | "worldwide" | "unknown";
export type GroupingMode = "per-location" | "single-group";
export type InputType = "multiple_choice" | "text" | "number";
export type AgentMode = "management" | "pin_drop";
export type IntentType = "management" | "pin_drop" | "ambiguous";
export type PinListMode = "view" | "edit" | "delete";
export type HotspotListMode = "view" | "edit" | "delete" | "pause" | "resume";
export type PinStatus = "active" | "expired" | "fully_claimed" | "collection_disabled";
export type TrendDirection = "improving" | "declining" | "stable" | "peaked";
export type HotspotEditScope = "this_drop" | "future_drops" | "all_drops";

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
// Shared sub-schemas
// ─────────────────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
  nextOffset: z.number().nullable(),
  showing: z.string(),
});

// Location point — with optional consumer summary counts (Level 2)
export const LocationSchema = z.object({
  id: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  autoCollect: z.boolean(),
  hidden: z.boolean(),
  // consumer summary — present when pin is expanded
  totalClaimed: z.number().optional(),
  totalRedeemed: z.number().optional(),
  totalViewed: z.number().optional(),
});

// Pin row used in pin_list
export const PinRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  status: z.enum(["active", "expired", "fully_claimed", "collection_disabled"]),
  claimed: z.number(),
  redeemed: z.number(),
  remaining: z.number(),
  hotspotId: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  radius: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  multiPin: z.boolean().optional(),
  hidden: z.boolean().optional(),
  locations: z.array(LocationSchema).optional(),
});

// LocationGroup row inside a hotspot
export const HotspotLocationGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  status: z.enum(["active", "expired", "fully_claimed", "collection_disabled"]),
  claimed: z.number(),
  redeemed: z.number(),
  remaining: z.number(),
  locations: z.array(LocationSchema),
});

export const HotspotRowSchema = z.object({
  id: z.string(),
  hotspotName: z.string(),
  isActive: z.boolean(),
  dropEveryDays: z.number().nullable(),
  dropCount: z.number(),
  locationGroups: z.array(HotspotLocationGroupSchema),
});

// Analytics per-pin row
export const PerPinStatSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  claimed: z.number(),
  redeemed: z.number(),
  limit: z.number(),
  remaining: z.number(),
  claimRate: z.string(),
});

export const TopPerformerSchema = z.object({
  id: z.string(),
  title: z.string(),
  claimed: z.number(),
  limit: z.number(),
  remaining: z.number(),
  claimRate: z.string(),
});

export const ReportSummarySchema = z.object({
  totalClaimed: z.number(),
  totalRedeemed: z.number(),
  claimRate: z.string(),
  redeemRate: z.string(),
  totalPins: z.number(),
  activePins: z.number(),
  expiredPins: z.number(),
  fullyClaimedPins: z.number(),
});

// Collector schemas
export const CollectorProfileSchema = z.object({
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  totalCollected: z.number(),
  totalRedeemed: z.number(),
});

export const CollectionSchema = z.object({
  pinId: z.string(),
  pinTitle: z.string(),
  pinStartDate: z.string().nullable(),
  pinEndDate: z.string().nullable(),
  claimedAt: z.string().nullable(),
  isRedeemed: z.boolean(),
});

export const CollectorSummarySchema = z.object({
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  collected: z.number(),
  redeemed: z.number(),
  lastClaimedAt: z.string().nullable(),
});

// ─── New: richer collector with loyalty data ──────────────────────────────────
export const CollectorLoyaltySchema = z.object({
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  totalCollected: z.number(),
  totalRedeemed: z.number(),
  redemptionRate: z.string(),         // "72%"
  firstCollectedAt: z.string().nullable(),
  lastCollectedAt: z.string().nullable(),
  daysSinceLastSeen: z.number().nullable(),
  hotspotStreak: z.number().optional(), // consecutive drops collected
  segment: z.enum(["champion", "collector_only", "at_risk", "new"]).optional(),
});

// ─── New: per-location collector row (Level 3 drill-down) ────────────────────
export const LocationCollectorSchema = z.object({
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  claimedAt: z.string().nullable(),
  redeemedAt: z.string().nullable(),
  isRedeemed: z.boolean(),
  viewedAt: z.string().nullable(),
});

// ─── New: hotspot trend per drop ─────────────────────────────────────────────
export const HotspotDropStatSchema = z.object({
  dropNumber: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  claimed: z.number(),
  limit: z.number(),
  claimRate: z.string(),
  redeemed: z.number(),
});

// ─── New: time analytics ─────────────────────────────────────────────────────
export const DayClaimsSchema = z.object({
  day: z.string(),   // "Monday", "Saturday" etc
  claims: z.number(),
  avgClaimRate: z.string(),
});

export const HourClaimsSchema = z.object({
  hour: z.number(),  // 0–23
  claims: z.number(),
});

// ─── New: recommendation item ────────────────────────────────────────────────
export const RecommendationItemSchema = z.object({
  rank: z.number(),
  area: z.string(),
  reason: z.string(),         // "High foot traffic + your best performing area"
  yourHistory: z.string().nullable(), // "84% avg claim rate, 3 drops"
  realWorldData: z.string().nullable(), // "Upcoming food festival this weekend"
  recommendation: z.string(),         // "EVENT pin, 600m radius, Saturday 3pm"
  isUntried: z.boolean(),        // creator never dropped here
});

// ─────────────────────────────────────────────────────────────────────────────
// Response shapes — management agent
// ─────────────────────────────────────────────────────────────────────────────

export interface PinListResponse {
  type: "pin_list";
  mode: PinListMode;
  data: {
    standalone: z.infer<typeof PinRowSchema>[];
    hotspots: z.infer<typeof HotspotRowSchema>[];
    pagination: z.infer<typeof PaginationSchema>;
  };
}

export interface HotspotListResponse {
  type: "hotspot_list";
  mode: HotspotListMode;
  data: {
    hotspots: z.infer<typeof HotspotRowSchema>[];
    pagination: z.infer<typeof PaginationSchema>;
  };
}

export interface AnalyticsResponse {
  type: "analytics";
  data: {
    totalClaimed: number;
    totalRedeemed: number;
    claimRate: string;
    redeemRate: string;
    perPin: z.infer<typeof PerPinStatSchema>[];
    insights: string | null;
  };
}

export interface ReportResponse {
  type: "report";
  data: {
    summary: z.infer<typeof ReportSummarySchema>;
    topPerformers: z.infer<typeof TopPerformerSchema>[];
    perPin: z.infer<typeof PerPinStatSchema>[];
    pagination: z.infer<typeof PaginationSchema>;
    generatedAt: string;
  };
}

export interface CollectorReportResponse {
  type: "collector_report";
  data: {
    mode: "single_collector" | "all_collectors";
    collector?: z.infer<typeof CollectorProfileSchema>;
    collections?: z.infer<typeof CollectionSchema>[];
    collectors?: z.infer<typeof CollectorSummarySchema>[];
    pagination: z.infer<typeof PaginationSchema>;
  };
}

// ─── New response types ───────────────────────────────────────────────────────

// Deep single-pin analysis — "analyze Coffee Shop Launch"
export interface SinglePinReportResponse {
  type: "single_pin_report";
  data: {
    pin: {
      id: string;
      title: string;
      startDate: string | null;
      endDate: string | null;
      status: PinStatus;
      type: string;  // PinType enum value
      radius: number | null;
      isHotspotPin: boolean;
      hotspotId: string | null;
    };
    stats: {
      claimed: number;
      redeemed: number;
      limit: number;
      remaining: number;
      claimRate: string;
      redeemRate: string;
      // view funnel — if viewedAt data available
      totalViewed: number | null;
      viewToClaimRate: string | null;
    };
    // Level 2 — locations with consumer counts
    locations: Array<{
      id: string;
      latitude: number;
      longitude: number;
      totalClaimed: number;
      totalRedeemed: number;
      totalViewed: number;
      claimRate: string;
    }>;
    // Top collectors inline (max 5), full list via drill-down
    topCollectors: z.infer<typeof LocationCollectorSchema>[];
    totalCollectors: number;
    insights: string | null;  // LLM-generated natural language insight
  };
}

// Top N pins ranked — "show me top 5 pins with full details"
export interface TopPinsReportResponse {
  type: "top_pins_report";
  data: {
    sortedBy: "claimRate" | "claimed" | "redeemed";
    total: number;
    ranked: Array<{
      rank: number;
      pin: {
        id: string;
        title: string;
        startDate: string | null;
        endDate: string | null;
        status: PinStatus;
        type: string;
      };
      stats: {
        claimed: number;
        redeemed: number;
        limit: number;
        remaining: number;
        claimRate: string;
        redeemRate: string;
      };
      // Location breakdown with counts
      locations: Array<{
        id: string;
        latitude: number;
        longitude: number;
        totalClaimed: number;
        totalRedeemed: number;
      }>;
      // Top 5 collectors per pin inline
      topCollectors: z.infer<typeof LocationCollectorSchema>[];
    }>;
    generatedAt: string;
  };
}

// Hotspot trend across drops — "how is Weekly Market trending"
export interface HotspotTrendResponse {
  type: "hotspot_trend";
  data: {
    hotspotId: string;
    hotspotName: string;
    totalDrops: number;
    trend: TrendDirection;
    drops: z.infer<typeof HotspotDropStatSchema>[];
    peakDrop: number;  // drop number with highest claim rate
    avgClaimRate: string;
    insight: string;  // "Peaked at drop 3, declining since. Recommend refreshing location."
  };
}

// Time-based performance — "when do my pins perform best"
export interface TimeAnalyticsResponse {
  type: "time_analytics";
  data: {
    bestDayOfWeek: string;        // "Saturday"
    bestHour: number;        // 14
    claimsByDayOfWeek: z.infer<typeof DayClaimsSchema>[];
    claimsByHour: z.infer<typeof HourClaimsSchema>[];
    avgRedemptionLagHours: number | null;  // avg time between claim and redeem
    viewToClaimRate: string | null;     // overall view funnel rate
    insight: string;
  };
}

// Per-pin type breakdown — "do EVENT pins perform better"
export interface PinTypeAnalyticsResponse {
  type: "pin_type_analytics";
  data: {
    byType: Array<{
      type: string;        // "EVENT", "LANDMARK", etc
      count: number;
      avgClaimRate: string;
      avgRedeemRate: string;
      totalClaimed: number;
    }>;
    bestType: string;
    insight: string;
  };
}

// Collector loyalty — "who are my most loyal collectors"
export interface CollectorLoyaltyResponse {
  type: "collector_loyalty";
  data: {
    segments: {
      champions: z.infer<typeof CollectorLoyaltySchema>[];  // high collect + high redeem
      collectorsOnly: z.infer<typeof CollectorLoyaltySchema>[];  // collect but never redeem
      atRisk: z.infer<typeof CollectorLoyaltySchema>[];  // gone quiet
      newThisWeek: z.infer<typeof CollectorLoyaltySchema>[];  // first collection < 7 days
    };
    topLoyal: z.infer<typeof CollectorLoyaltySchema>[];
    pagination: z.infer<typeof PaginationSchema>;
  };
}

// Level 3 drill-down — collectors for a specific location point
export interface LocationCollectorsResponse {
  type: "location_collectors";
  data: {
    locationId: string;
    pinTitle: string;
    totalClaimed: number;
    totalRedeemed: number;
    collectors: z.infer<typeof LocationCollectorSchema>[];
    pagination: z.infer<typeof PaginationSchema>;
  };
}

// Drop area recommendation — "where should I drop next"
export interface AreaRecommendationResponse {
  type: "area_recommendation";
  data: {
    area: string;  // city/region the recs are for
    recommendations: z.infer<typeof RecommendationItemSchema>[];
    avoidAreas: Array<{ area: string; reason: string }>;
    yourPatterns: {
      bestPinType: string;
      bestRadius: number | null;
      bestDay: string;
      bestHour: number | null;
    };
    generatedAt: string;
  };
}

// Geo-filtered pin list — "show my pins around Dhaka"
export interface GeoPinListResponse {
  type: "geo_pin_list";
  mode: PinListMode;
  data: {
    area: string;       // "Dhaka"
    radiusKm: number;       // 50
    standalone: z.infer<typeof PinRowSchema>[];
    hotspots: z.infer<typeof HotspotRowSchema>[];
    pagination: z.infer<typeof PaginationSchema>;
  };
}

// Simple info / error
export interface InfoResponse {
  type: "info";
  message: string;
  data?: Record<string, unknown>;
}

// ─── Shared confirm / success / question (both agents) ───────────────────────

export interface QuestionResponse {
  type: "question";
  message: string;
  fields: ClarifyQuestion[];
}

export interface ConfirmResponse {
  type: "confirm";
  message: string;
  summary: {
    action: "edit" | "delete" | "pause" | "resume" | null;
    targets: string[] | null;
    count: number | null;
    affected: string | null;
    unaffected: string | null;
    // hotspot edit scope selector
    hotspotEditScope?: HotspotEditScope;
  };
}

export interface SuccessResponse {
  type: "success";
  message: string;
  count: number;
}

// Pin drop only
export interface ResultsResponse {
  type: "results";
  message: string;
  searchType: "EVENT" | "LANDMARK";
  pinCount: number;
  confirmPrompt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Union type — all possible agent responses
// ─────────────────────────────────────────────────────────────────────────────

export type AgentResponse =
  // existing
  | PinListResponse
  | HotspotListResponse
  | AnalyticsResponse
  | ReportResponse
  | CollectorReportResponse
  // new management
  | SinglePinReportResponse
  | TopPinsReportResponse
  | HotspotTrendResponse
  | TimeAnalyticsResponse
  | PinTypeAnalyticsResponse
  | CollectorLoyaltyResponse
  | LocationCollectorsResponse
  | AreaRecommendationResponse
  | GeoPinListResponse
  // shared
  | QuestionResponse
  | ConfirmResponse
  | SuccessResponse
  | InfoResponse
  // pin drop only
  | ResultsResponse;

// ─────────────────────────────────────────────────────────────────────────────
// Intent
// ─────────────────────────────────────────────────────────────────────────────

export interface IntentClassification {
  intent: IntentType;
  confidence: number;
  reasoning: string;
  missingInfo: string | null;
  extractedSubject: string | null;
}

export interface DbPresenceCheck {
  found: boolean;
  count: number;
  sample: { id: string; title: string; startDate: Date | null; endDate: Date | null }[];
}

export interface PinIntent {
  query: string | null;
  area: string | null;
  count: number | null;
  countSpecified: boolean;
  areaType: AreaType;
  confirmed: boolean;
  isNiche: boolean;
  pinNumber?: number;
  ambiguousPinIntent: boolean;
  // management pagination state
  lastPinFilter?: "all" | "active" | "expired" | "fully_claimed" | "collection_disabled";
  lastPinSearch?: string | null;
  lastPinArea?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pin (pin-drop agent)
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
  gPlaceId?: string;
}

export interface Pin extends GeneratedPin {
  startDate: string;
  endDate: string;
  pinCollectionLimit: number;
  pinNumber: number;
  radius: number;
  autoCollect: boolean;
}

export interface PinOptions {
  autoCollect: boolean;
  groupingMode: GroupingMode;
  pinNumber: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Clarify question
// ─────────────────────────────────────────────────────────────────────────────

export interface ClarifyQuestion {
  id: string;
  label: string;
  inputType: InputType;
  options?: string[];
  placeholder?: string;
}

export interface AgentRunInput {
  messages: { role: MessageRole; text: string }[];
  intent: Partial<PinIntent> | null;
  pinOptions: PinOptions | null;
  creatorId: string;
  pins?: Pin[];
  loadMore?: boolean;
  loadMoreOffset?: number;
  loadMoreType?: string;
}

export interface AgentRunOutput {
  reply: string;
  stage: AgentStage;
  intent: PinIntent;
  pins?: Pin[];
  pinOptions?: { autoCollect: boolean; groupingMode: GroupingMode };
  jobId?: string;
  mode?: AgentMode;
}
// ─────────────────────────────────────────────────────────────────────────────
// tRPC / poll output
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatCreateOutput {
  reply: string;
  stage: AgentStage;
  intent: PinIntent;
  questions?: ClarifyQuestion[];
  pins?: Pin[];
  pinOptions?: PinOptions;
  jobId?: string;
}

export interface AgentPollResult {
  reply: string;
  stage: AgentStage;
  intent: PinIntent;
  pins?: Pin[];
  pinOptions?: PinOptions;
  jobId?: string;
  mode?: AgentMode;
}

export interface CityDiscoveryResult {
  cities: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Local chat message (frontend only)
// ─────────────────────────────────────────────────────────────────────────────

export type LocalMessageContent =
  | { kind: "text"; text: string }
  | { kind: "loading"; label?: string }
  | {
    kind: "response";
    data: AgentResponse;
    pins: Pin[];
    mode?: AgentMode;
    questionAnswered?: boolean;
    questionAnsweredValues?: Record<string, string>;
    resultsConfirmed?: boolean;
    resultsJobId?: string;
    managementConfirmed?: boolean;
  };

export interface LocalChatMessage {
  id: string;
  role: "user" | "assistant";
  content: LocalMessageContent;
  createdAt: Date;
  mode?: AgentMode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived types
// ─────────────────────────────────────────────────────────────────────────────

export type PaginationMeta = z.infer<typeof PaginationSchema>;
export type LocationRow = z.infer<typeof LocationSchema>;
export type PinListPinRow = z.infer<typeof PinRowSchema>;
export type HotspotLocationGroup = z.infer<typeof HotspotLocationGroupSchema>;
export type HotspotRow = z.infer<typeof HotspotRowSchema>;
export type PerPinStat = z.infer<typeof PerPinStatSchema>;
export type TopPerformer = z.infer<typeof TopPerformerSchema>;
export type ReportSummary = z.infer<typeof ReportSummarySchema>;
export type CollectorProfile = z.infer<typeof CollectorProfileSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type CollectorSummary = z.infer<typeof CollectorSummarySchema>;
export type CollectorLoyalty = z.infer<typeof CollectorLoyaltySchema>;
export type LocationCollector = z.infer<typeof LocationCollectorSchema>;
export type HotspotDropStat = z.infer<typeof HotspotDropStatSchema>;
export type RecommendationItem = z.infer<typeof RecommendationItemSchema>;
export type PinListData = PinListResponse["data"];
export type HotspotListData = HotspotListResponse["data"];
export type AnalyticsData = AnalyticsResponse["data"];
export type ReportData = ReportResponse["data"];
export type CollectorReportData = CollectorReportResponse["data"];

// ─────────────────────────────────────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────────────────────────────────────

export const isPinListResponse = (r: AgentResponse): r is PinListResponse => r.type === "pin_list";
export const isHotspotListResponse = (r: AgentResponse): r is HotspotListResponse => r.type === "hotspot_list";
export const isAnalyticsResponse = (r: AgentResponse): r is AnalyticsResponse => r.type === "analytics";
export const isReportResponse = (r: AgentResponse): r is ReportResponse => r.type === "report";
export const isCollectorReportResponse = (r: AgentResponse): r is CollectorReportResponse => r.type === "collector_report";
export const isQuestionResponse = (r: AgentResponse): r is QuestionResponse => r.type === "question";
export const isConfirmResponse = (r: AgentResponse): r is ConfirmResponse => r.type === "confirm";
export const isSuccessResponse = (r: AgentResponse): r is SuccessResponse => r.type === "success";
export const isSinglePinReport = (r: AgentResponse): r is SinglePinReportResponse => r.type === "single_pin_report";
export const isTopPinsReport = (r: AgentResponse): r is TopPinsReportResponse => r.type === "top_pins_report";
export const isHotspotTrendResponse = (r: AgentResponse): r is HotspotTrendResponse => r.type === "hotspot_trend";
export const isTimeAnalyticsResponse = (r: AgentResponse): r is TimeAnalyticsResponse => r.type === "time_analytics";
export const isPinTypeAnalyticsResponse = (r: AgentResponse): r is PinTypeAnalyticsResponse => r.type === "pin_type_analytics";
export const isCollectorLoyaltyResponse = (r: AgentResponse): r is CollectorLoyaltyResponse => r.type === "collector_loyalty";
export const isLocationCollectors = (r: AgentResponse): r is LocationCollectorsResponse => r.type === "location_collectors";
export const isAreaRecommendation = (r: AgentResponse): r is AreaRecommendationResponse => r.type === "area_recommendation";
export const isGeoPinList = (r: AgentResponse): r is GeoPinListResponse => r.type === "geo_pin_list";

// ─────────────────────────────────────────────────────────────────────────────
// Response parser
// ─────────────────────────────────────────────────────────────────────────────

export function parseAgentResponse(raw: string): AgentResponse {
  try {
    const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found");
    const parsed = JSON.parse(clean.slice(start, end + 1)) as AgentResponse;
    if (!parsed.type) throw new Error("Missing type field");
    return parsed;
  } catch (err) {
    console.error("[parseAgentResponse] Failed:", err);
    return {
      type: "info",
      message: "Something went wrong parsing the response.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage labels
// ─────────────────────────────────────────────────────────────────────────────

export const STAGE_LABEL: Record<AgentStage, string> = {
  idle: "",
  extracting_intent: "Understanding request…",
  clarifying: "",
  searching: "Searching for places…",
  confirming: "Ready to drop pins",
  dropping_pins: "Dropping pins…",
  done: "All done!",
  error: "Something went wrong",
};