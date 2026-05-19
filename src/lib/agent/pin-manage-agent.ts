// ~/lib/agent/creator-agent.ts
// Management agent — handles all creator dashboard actions:
// view, edit, delete, analytics, reports, recommendations.

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { createAgent, providerStrategy } from "langchain";
import { z } from "zod";
import { createDbTools } from "~/lib/agent/pin-db-tools";
import type { AgentStage, PinIntent, MessageRole, PinListResponse } from "~/lib/agent/types";

// ─────────────────────────────────────────────────────────────────────────────
// I/O types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreatorAgentInput {
  messages: { role: MessageRole; text: string }[];
  creatorId: string;
  priorIntent?: Partial<PinIntent> | null;
  loadMore?: boolean;
  loadMoreOffset?: number;
  loadMoreType?: string;
}

export interface CreatorAgentOutput {
  reply: string;
  stage: AgentStage;
  intent: PinIntent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod response schema — LLM must return one of these shapes
// ─────────────────────────────────────────────────────────────────────────────

const AgentResponseSchema = z.object({
  response: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("pin_list"),
      mode: z.enum(["view", "edit", "delete"]),
      data: z.object({
        standalone: z.array(z.object({
          id: z.string(),
          title: z.string(),
          startDate: z.string().nullable(),
          endDate: z.string().nullable(),
          status: z.enum(["active", "expired", "fully_claimed", "collection_disabled"]),
          claimed: z.number(),
          redeemed: z.number(),
          remaining: z.number(),
          hotspotId: z.string().nullable(),
          latitude: z.number().nullable(),
          longitude: z.number().nullable(),
          radius: z.number().nullable(),
          description: z.string().nullable(),
          image: z.string().nullable(),
          link: z.string().nullable(),
          multiPin: z.boolean(),
          hidden: z.boolean(),
          locations: z.array(z.object({
            id: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            autoCollect: z.boolean(),
            hidden: z.boolean(),
            totalClaimed: z.number().nullable(),
            totalRedeemed: z.number().nullable(),
            totalViewed: z.number().nullable(),
          })),
        })),
        hotspots: z.array(z.object({
          id: z.string(),
          hotspotName: z.string(),
          isActive: z.boolean(),
          dropEveryDays: z.number().nullable(),
          dropCount: z.number(),
          locationGroups: z.array(z.object({
            id: z.string(),
            title: z.string(),
            startDate: z.string().nullable(),
            endDate: z.string().nullable(),
            status: z.enum(["active", "expired", "fully_claimed", "collection_disabled"]),
            claimed: z.number(),
            redeemed: z.number(),
            remaining: z.number(),
            locations: z.array(z.object({
              id: z.string(),
              latitude: z.number(),
              longitude: z.number(),
              autoCollect: z.boolean(),
              hidden: z.boolean(),
              totalClaimed: z.number().nullable(),
              totalRedeemed: z.number().nullable(),
              totalViewed: z.number().nullable(),
            })),
          })),
        })),
        pagination: z.object({
          total: z.number(),
          offset: z.number(),
          limit: z.number(),
          hasMore: z.boolean(),
          nextOffset: z.number().nullable(),
          showing: z.string(),
        }),
        geoContext: z.object({
          area: z.string(),
          radiusKm: z.number(),
        }).nullable(),
      }),
    }),

    // ── Hotspot list ──────────────────────────────────────────────────────────
    z.object({
      type: z.literal("hotspot_list"),
      mode: z.enum(["view", "edit", "delete", "pause", "resume"]),
      data: z.object({
        hotspots: z.array(z.object({
          id: z.string(),
          hotspotName: z.string(),
          isActive: z.boolean(),
          dropEveryDays: z.number().nullable(),
          dropCount: z.number(),
          locationGroups: z.array(z.object({
            id: z.string(),
            title: z.string(),
            startDate: z.string().nullable(),
            endDate: z.string().nullable(),
            status: z.enum(["active", "expired", "fully_claimed", "collection_disabled"]),
            claimed: z.number(),
            redeemed: z.number(),
            remaining: z.number(),
            locations: z.array(z.object({
              id: z.string(),
              latitude: z.number(),
              longitude: z.number(),
              autoCollect: z.boolean(),
              hidden: z.boolean(),
              totalClaimed: z.number().nullable(),
              totalRedeemed: z.number().nullable(),
              totalViewed: z.number().nullable(),
            })),
          })),
        })),
        pagination: z.object({
          total: z.number(),
          offset: z.number(),
          limit: z.number(),
          hasMore: z.boolean(),
          nextOffset: z.number().nullable(),
          showing: z.string(),
        }),
      }),
    }),

    // ── Analytics summary ─────────────────────────────────────────────────────
    z.object({
      type: z.literal("analytics"),
      data: z.object({
        totalClaimed: z.number(),
        totalRedeemed: z.number(),
        claimRate: z.string(),
        redeemRate: z.string(),
        perPin: z.array(z.object({
          id: z.string().nullable(),
          title: z.string(),
          type: z.string().nullable(),
          claimed: z.number(),
          redeemed: z.number(),
          limit: z.number(),
          remaining: z.number(),
          claimRate: z.string(),
          redeemRate: z.string().nullable(),
        })),
        insights: z.string().nullable(),
      }),
    }),

    // ── Full report ───────────────────────────────────────────────────────────
    z.object({
      type: z.literal("report"),
      data: z.object({
        summary: z.object({
          totalClaimed: z.number(),
          totalRedeemed: z.number(),
          claimRate: z.string(),
          redeemRate: z.string(),
          totalPins: z.number(),
          activePins: z.number(),
          expiredPins: z.number(),
          fullyClaimedPins: z.number(),
        }),
        topPerformers: z.array(z.object({
          id: z.string(),
          title: z.string(),
          claimed: z.number(),
          limit: z.number(),
          remaining: z.number(),
          claimRate: z.string(),
        })),
        perPin: z.array(z.object({
          id: z.string().nullable(),
          title: z.string(),
          type: z.string().nullable(),
          claimed: z.number(),
          redeemed: z.number(),
          limit: z.number(),
          remaining: z.number(),
          claimRate: z.string(),
          redeemRate: z.string().nullable(),
        })),
        pagination: z.object({
          total: z.number(),
          offset: z.number(),
          limit: z.number(),
          hasMore: z.boolean(),
          nextOffset: z.number().nullable(),
          showing: z.string(),
        }),
        generatedAt: z.string(),
      }),
    }),

    // ── Single pin deep analysis ──────────────────────────────────────────────
    z.object({
      type: z.literal("single_pin_report"),
      data: z.object({
        pin: z.object({
          id: z.string(),
          title: z.string(),
          startDate: z.string().nullable(),
          endDate: z.string().nullable(),
          status: z.enum(["active", "expired", "fully_claimed", "collection_disabled"]),
          type: z.string(),
          radius: z.number().nullable(),
          isHotspotPin: z.boolean(),
          hotspotId: z.string().nullable(),
        }),
        stats: z.object({
          claimed: z.number(),
          redeemed: z.number(),
          limit: z.number(),
          remaining: z.number(),
          claimRate: z.string(),
          redeemRate: z.string(),
          totalViewed: z.number().nullable(),
          viewToClaimRate: z.string().nullable(),
        }),
        locations: z.array(z.object({
          id: z.string(),
          latitude: z.number(),
          longitude: z.number(),
          totalClaimed: z.number(),
          totalRedeemed: z.number(),
          totalViewed: z.number(),
          claimRate: z.string(),
        })),
        topCollectors: z.array(z.object({
          name: z.string(),
          email: z.string(),
          image: z.string().nullable(),
          claimedAt: z.string().nullable(),
          redeemedAt: z.string().nullable(),
          isRedeemed: z.boolean(),
          viewedAt: z.string().nullable(),
        })),
        totalCollectors: z.number(),
        insights: z.string().nullable(),
      }),
    }),

    // ── Top N pins ranked ─────────────────────────────────────────────────────
    z.object({
      type: z.literal("top_pins_report"),
      data: z.object({
        sortedBy: z.enum(["claimRate", "claimed", "redeemed"]),
        total: z.number(),
        ranked: z.array(z.object({
          rank: z.number(),
          pin: z.object({
            id: z.string(),
            title: z.string(),
            startDate: z.string().nullable(),
            endDate: z.string().nullable(),
            status: z.enum(["active", "expired", "fully_claimed", "collection_disabled"]),
            type: z.string(),
          }),
          stats: z.object({
            claimed: z.number(),
            redeemed: z.number(),
            limit: z.number(),
            remaining: z.number(),
            claimRate: z.string(),
            redeemRate: z.string(),
          }),
          locations: z.array(z.object({
            id: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            totalClaimed: z.number(),
            totalRedeemed: z.number(),
          })),
          topCollectors: z.array(z.object({
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
            claimedAt: z.string().nullable(),
            redeemedAt: z.string().nullable(),
            isRedeemed: z.boolean(),
            viewedAt: z.string().nullable(),
          })),
        })),
        generatedAt: z.string(),
      }),
    }),

    // ── Hotspot trend ─────────────────────────────────────────────────────────
    z.object({
      type: z.literal("hotspot_trend"),
      data: z.object({
        hotspotId: z.string(),
        hotspotName: z.string(),
        totalDrops: z.number(),
        trend: z.enum(["improving", "declining", "stable", "peaked"]),
        drops: z.array(z.object({
          dropNumber: z.number(),
          startDate: z.string(),
          endDate: z.string(),
          claimed: z.number(),
          limit: z.number(),
          claimRate: z.string(),
          redeemed: z.number(),
        })),
        peakDrop: z.number(),
        avgClaimRate: z.string(),
        insight: z.string(),
      }),
    }),

    // ── Time analytics ────────────────────────────────────────────────────────
    z.object({
      type: z.literal("time_analytics"),
      data: z.object({
        bestDayOfWeek: z.string(),
        bestHour: z.number(),
        claimsByDayOfWeek: z.array(z.object({
          day: z.string(),
          claims: z.number(),
        })),
        claimsByHour: z.array(z.object({
          hour: z.number(),
          claims: z.number(),
        })),
        avgRedemptionLagHours: z.number().nullable(),
        viewToClaimRate: z.string().nullable(),
        insight: z.string(),
      }),
    }),

    // ── Pin type analytics ────────────────────────────────────────────────────
    z.object({
      type: z.literal("pin_type_analytics"),
      data: z.object({
        byType: z.array(z.object({
          type: z.string(),
          count: z.number(),
          totalClaimed: z.number(),
          avgClaimRate: z.string(),
          avgRedeemRate: z.string(),
        })),
        bestType: z.string(),
        insight: z.string(),
      }),
    }),

    // ── Collector report ──────────────────────────────────────────────────────
    z.object({
      type: z.literal("collector_report"),
      data: z.object({
        mode: z.enum(["single_collector", "all_collectors"]),
        collector: z.object({
          name: z.string(),
          email: z.string(),
          image: z.string().nullable(),
          totalCollected: z.number(),
          totalRedeemed: z.number(),
        }).nullable(),
        collections: z.array(z.object({
          pinId: z.string(),
          pinTitle: z.string(),
          pinStartDate: z.string().nullable(),
          pinEndDate: z.string().nullable(),
          claimedAt: z.string().nullable(),
          isRedeemed: z.boolean(),
        })).nullable(),
        collectors: z.array(z.object({
          name: z.string(),
          email: z.string(),
          image: z.string().nullable(),
          collected: z.number(),
          redeemed: z.number(),
          lastClaimedAt: z.string().nullable(),
        })).nullable(),
        pagination: z.object({
          total: z.number(),
          offset: z.number(),
          limit: z.number(),
          hasMore: z.boolean(),
          nextOffset: z.number().nullable(),
          showing: z.string(),
        }),
      }),
    }),

    // ── Collector loyalty ─────────────────────────────────────────────────────
    z.object({
      type: z.literal("collector_loyalty"),
      data: z.object({
        segments: z.object({
          champions: z.array(z.object({
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
            totalCollected: z.number(),
            totalRedeemed: z.number(),
            redemptionRate: z.string(),
            firstCollectedAt: z.string(),
            lastCollectedAt: z.string(),
            daysSinceLastSeen: z.number(),
            segment: z.enum(["champion", "new", "at_risk", "collector_only"]),
          })),
          collectorsOnly: z.array(z.object({
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
            totalCollected: z.number(),
            totalRedeemed: z.number(),
            redemptionRate: z.string(),
            firstCollectedAt: z.string(),
            lastCollectedAt: z.string(),
            daysSinceLastSeen: z.number(),
            segment: z.enum(["champion", "new", "at_risk", "collector_only"]),
          })),
          atRisk: z.array(z.object({
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
            totalCollected: z.number(),
            totalRedeemed: z.number(),
            redemptionRate: z.string(),
            firstCollectedAt: z.string(),
            lastCollectedAt: z.string(),
            daysSinceLastSeen: z.number(),
            segment: z.enum(["champion", "new", "at_risk", "collector_only"]),
          })),
          newThisWeek: z.array(z.object({
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
            totalCollected: z.number(),
            totalRedeemed: z.number(),
            redemptionRate: z.string(),
            firstCollectedAt: z.string(),
            lastCollectedAt: z.string(),
            daysSinceLastSeen: z.number(),
            segment: z.enum(["champion", "new", "at_risk", "collector_only"]),
          })),
        }),
        topLoyal: z.array(z.object({
          name: z.string(),
          email: z.string(),
          image: z.string().nullable(),
          totalCollected: z.number(),
          totalRedeemed: z.number(),
          redemptionRate: z.string(),
          firstCollectedAt: z.string(),
          lastCollectedAt: z.string(),
          daysSinceLastSeen: z.number(),
          segment: z.enum(["champion", "new", "at_risk", "collector_only"]),
        })),
        pagination: z.object({
          total: z.number(),
          offset: z.number(),
          limit: z.number(),
          hasMore: z.boolean(),
          nextOffset: z.number().nullable(),
          showing: z.string(),
        }),
      }),
    }),

    // ── Location collectors (Level 3 drill-down) ──────────────────────────────
    z.object({
      type: z.literal("location_collectors"),
      data: z.object({
        locationId: z.string(),
        pinTitle: z.string(),
        totalClaimed: z.number(),
        totalRedeemed: z.number(),
        collectors: z.array(z.object({
          name: z.string(),
          email: z.string(),
          image: z.string().nullable(),
          claimedAt: z.string().nullable(),
          redeemedAt: z.string().nullable(),
          isRedeemed: z.boolean(),
          viewedAt: z.string().nullable(),
        })),
        pagination: z.object({
          total: z.number(),
          offset: z.number(),
          limit: z.number(),
          hasMore: z.boolean(),
          nextOffset: z.number().nullable(),
          showing: z.string(),
        }),
      }),
    }),

    // ── Area recommendation ───────────────────────────────────────────────────
    z.object({
      type: z.literal("area_recommendation"),
      data: z.object({
        area: z.string(),
        recommendations: z.array(z.object({
          rank: z.number(),
          area: z.string(),
          reason: z.string(),
          yourHistory: z.string().nullable(),
          realWorldData: z.string().nullable(),
          recommendation: z.string(),
          isUntried: z.boolean(),
        })),
        avoidAreas: z.array(z.object({
          area: z.string(),
          reason: z.string(),
        })),
        yourPatterns: z.object({
          bestPinType: z.string(),
          bestRadius: z.number().nullable(),
          bestDay: z.string(),
          bestHour: z.number().nullable(),
        }),
        generatedAt: z.string(),
      }),
    }),

    // ── Geo pin list ──────────────────────────────────────────────────────────
    z.object({
      type: z.literal("geo_pin_list"),
      mode: z.enum(["view", "edit", "delete"]),
      data: z.object({
        area: z.string(),
        radiusKm: z.number(),
        standalone: z.array(z.object({
          id: z.string(),
          title: z.string(),
          startDate: z.string().nullable(),
          endDate: z.string().nullable(),
          status: z.enum(["active", "expired", "fully_claimed", "collection_disabled"]),
          claimed: z.number(),
          redeemed: z.number(),
          remaining: z.number(),
          hotspotId: z.string().nullable(),
          latitude: z.number().nullable(),
          longitude: z.number().nullable(),
          radius: z.number().nullable(),
          description: z.string().nullable(),
          image: z.string().nullable(),
          link: z.string().nullable(),
          multiPin: z.boolean(),
          hidden: z.boolean(),
          locations: z.array(z.object({
            id: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            autoCollect: z.boolean(),
            hidden: z.boolean(),
            totalClaimed: z.number().nullable(),
            totalRedeemed: z.number().nullable(),
            totalViewed: z.number().nullable(),
          })),
        })),
        hotspots: z.array(z.object({
          id: z.string(),
          hotspotName: z.string(),
          isActive: z.boolean(),
          dropEveryDays: z.number().nullable(),
          dropCount: z.number(),
          locationGroups: z.array(z.object({
            id: z.string(),
            title: z.string(),
            startDate: z.string().nullable(),
            endDate: z.string().nullable(),
            status: z.enum(["active", "expired", "fully_claimed", "collection_disabled"]),
            claimed: z.number(),
            redeemed: z.number(),
            remaining: z.number(),
            locations: z.array(z.object({
              id: z.string(),
              latitude: z.number(),
              longitude: z.number(),
              autoCollect: z.boolean(),
              hidden: z.boolean(),
              totalClaimed: z.number().nullable(),
              totalRedeemed: z.number().nullable(),
              totalViewed: z.number().nullable(),
            })),
          })),
        })),
        pagination: z.object({
          total: z.number(),
          offset: z.number(),
          limit: z.number(),
          hasMore: z.boolean(),
          nextOffset: z.number().nullable(),
          showing: z.string(),
        }),
      }),
    }),

    // ── Question (clarification needed) ──────────────────────────────────────
    z.object({
      type: z.literal("question"),
      message: z.string(),
      fields: z.array(z.object({
        id: z.string(),
        label: z.string(),
        inputType: z.enum(["multiple_choice", "text", "number"]),
        options: z.array(z.string()).nullable(),
      })),
    }),

    // ── Confirm (before any write) ────────────────────────────────────────────
    z.object({
      type: z.literal("confirm"),
      message: z.string(),
      summary: z.object({
        action: z.enum(["edit", "delete", "pause", "resume"]).nullable(),
        targets: z.array(z.string()).nullable(),
        count: z.number().nullable(),
        affected: z.string().nullable(),
        unaffected: z.string().nullable(),
        hotspotEditScope: z.enum(["this_drop", "future_drops", "all_drops"]).nullable(),
      }),
    }),

    // ── Success ───────────────────────────────────────────────────────────────
    z.object({
      type: z.literal("success"),
      message: z.string(),
      count: z.number(),
    }),

    // ── Info / error ──────────────────────────────────────────────────────────
    z.object({
      type: z.literal("info"),
      message: z.string(),
    }),

  ]),
});


type StructuredResponse = z.infer<typeof AgentResponseSchema>["response"];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toLangChainMessages(msgs: { role: MessageRole; text: string }[]): BaseMessage[] {
  return msgs.map(m => {
    if (m.role === "user") return new HumanMessage(m.text);
    if (m.role === "assistant") return new AIMessage(m.text);
    return new SystemMessage(m.text);
  });
}

function stageFromResponse(r: StructuredResponse): AgentStage {
  switch (r.type) {
    case "question": return "clarifying";
    case "confirm": return "confirming";
    case "success": return "done";
    default: return "extracting_intent";
  }
}

function buildDefaultIntent(prior?: Partial<PinIntent> | null): PinIntent {
  return {
    count: prior?.count ?? 0,
    countSpecified: prior?.countSpecified ?? false,
    query: prior?.query ?? null,
    area: prior?.area ?? null,
    areaType: prior?.areaType ?? "unknown",
    confirmed: false,
    isNiche: prior?.isNiche ?? false,
    pinNumber: prior?.pinNumber ?? 1,
    ambiguousPinIntent: false,
    lastPinFilter: prior?.lastPinFilter,
    lastPinSearch: prior?.lastPinSearch,
    lastPinArea: prior?.lastPinArea,
  };
}

/** Builds the session context block appended to the system prompt each turn. */
function buildSessionContext(
  prior?: Partial<PinIntent> | null,
  loadMore?: boolean,
  loadMoreOffset?: number,
  loadMoreType?: string,
): string {
  const today = new Date().toISOString().split("T")[0]!;

  // Load-more short-circuits — tell the LLM exactly what to call
  if (loadMore && loadMoreType && loadMoreOffset !== undefined) {
    const toolMap: Record<string, string> = {
      pin_list: `query_pins with offset=${loadMoreOffset} and limit=10`,
      report: `query_analytics_detail with offset=${loadMoreOffset} and limit=10 and sortBy="claimRate"`,
      collector_report: `query_collector_report with offset=${loadMoreOffset} and limit=10`,
      location_collectors: `query_location_collectors with offset=${loadMoreOffset} and limit=10`,
      collector_loyalty: `query_collector_loyalty with offset=${loadMoreOffset} and limit=20`,
    };
    const instruction = toolMap[loadMoreType] ?? `query_pins with offset=${loadMoreOffset}`;

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION — ${today}  [LOAD MORE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Call ${instruction} immediately.
Return type="${loadMoreType}".
Copy pagination object verbatim from tool response.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION — ${today}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prior query : ${prior?.query ?? "none"}
Prior area  : ${prior?.area ?? "none"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/** Fast path for load-more pin list — skips LLM entirely. */
async function handleLoadMorePins(
  creatorId: string,
  priorIntent: Partial<PinIntent> | null | undefined,
  loadMoreOffset: number,
): Promise<CreatorAgentOutput> {
  const tools = createDbTools(creatorId);
  const queryPinsTool = tools.find(t => t.name === "query_pins")!;
  const today = new Date();

  const raw = await queryPinsTool.invoke({
    filter: priorIntent?.lastPinFilter ?? "all",
    search: priorIntent?.lastPinSearch ?? null,
    area: priorIntent?.lastPinArea ?? null,
    radiusKm: null,
    limit: 10,
    offset: loadMoreOffset,
  });

  const { pins, pagination } = JSON.parse(raw) as {
    pins: Array<{
      id: string; title: string; startDate: string | null; endDate: string | null;
      hotspotId: string | null; latitude: number | null; longitude: number | null;
      radius: number | null; description: string | null; image: string | null;
      link: string | null; multiPin: boolean; hidden: boolean;
      limit: number; remaining: number;
      locations?: Array<{ id: string; latitude: number; longitude: number; autoCollect: boolean; hidden: boolean; totalClaimed?: number; totalRedeemed?: number; totalViewed?: number }>;
    }>;
    pagination: PinListResponse["data"]["pagination"];
  };

  const standalone = pins
    .filter(p => !p.hotspotId)
    .map(p => ({
      id: p.id,
      title: p.title,
      startDate: p.startDate,
      endDate: p.endDate,
      status: (
        p.endDate && new Date(p.endDate) < today ? "expired" as const :
          p.remaining === 0 && p.limit > 0 ? "fully_claimed" as const :
            p.limit === 0 ? "collection_disabled" as const :
              "active" as const
      ),
      claimed: p.limit - p.remaining,
      redeemed: 0,
      remaining: p.remaining,
      hotspotId: p.hotspotId,
      latitude: p.latitude,
      longitude: p.longitude,
      radius: p.radius,
      description: p.description,
      image: p.image,
      link: p.link,
      multiPin: p.multiPin,
      hidden: p.hidden,
      locations: p.locations ?? [],
    }));

  const response: PinListResponse = {
    type: "pin_list",
    mode: "view",
    data: { standalone, hotspots: [], pagination },
  };

  return {
    reply: JSON.stringify(response),
    stage: "extracting_intent",
    intent: buildDefaultIntent(priorIntent),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an intelligent assistant for a location-based pin platform.
You help creators manage pins, hotspots, analytics, and collectors via DB tools.
You never call external APIs except query_area_insights for recommendations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTENT → TOOL → RESPONSE TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

view pins                   → query_pins                                        → pin_list
view pins around [area]     → query_pins(area, radiusKm)                        → pin_list (with geoContext)
edit pins                   → query_pins → [user selects] → edit_pins           → pin_list mode=edit
delete pins                 → query_pins → [user selects] → delete_pins         → pin_list mode=delete
view hotspots               → query_hotspots + query_hotspot_drops              → hotspot_list
edit hotspot                → query_hotspots → edit_hotspot                     → hotspot_list mode=edit
delete hotspot              → query_hotspots → delete_hotspot                   → hotspot_list mode=delete
pause / resume hotspot      → query_hotspots → pause/resume_hotspot             → hotspot_list mode=pause/resume
analyze [specific pin]      → query_single_pin_report                           → single_pin_report
analyze [hotspot/multi-pin] → query_hotspot_trend                               → hotspot_trend
top N pins                  → query_analytics_detail + query_single_pin_report  → top_pins_report
analytics summary           → query_analytics_summary                           → analytics
full report                 → query_analytics_summary + query_analytics_detail  → report
by pin type                 → query_pin_type_analytics                          → pin_type_analytics
best time to drop           → query_time_analytics                              → time_analytics
collectors                  → query_collector_report                            → collector_report
unredeemed collectors       → query_collector_report(onlyUnredeemed=true)       → collector_report
loyalty / segments          → query_collector_loyalty                           → collector_loyalty
location drill-down         → query_location_collectors                         → location_collectors
best drop area              → query_time_analytics + query_pin_type_analytics
                               + query_area_insights                            → area_recommendation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTING RULE — NEVER ASK "WHICH PIN?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When user wants to edit, delete, pause, or resume:
  → Query immediately, return the list, let the UI handle selection.
  → For requests like "edit my [pin name]", search by the pin name and return type="pin_list" with mode="edit".
  → NEVER ask "which pin?" before querying.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GEO FILTER RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"pins in [city]"        → radiusKm=10
"pins around [city]"    → radiusKm=50
"pins near [city]"      → radiusKm=50
"pins across [country]" → radiusKm=500
"pins worldwide"        → area=null, no geo filter

Return type="pin_list" with geoContext: { area, radiusKm } in data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANALYZE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"analyze [pin name]":
  1. Call query_pins(search="pin name") to find matches.
  2. IF one match AND no hotspotId:
       → call query_single_pin_report → type="single_pin_report"
  3. IF multiple matches share the SAME hotspotId:
       → call query_hotspot_trend → type="hotspot_trend"
  4. IF multiple matches with DIFFERENT hotspotIds or null:
       → return type="question" asking which one
  5. IF match is a hotspot drop (hotspotId set), ask:
       "Analyze this drop only, or the full hotspot trend?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EDIT FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"SYSTEM: locationGroupIds=abc,def":
  → query_pins_by_ids([ids]) → proceed with edit_pins or delete_pins

"SYSTEM: locationGroupIds=abc,def action=delete":
  → delete_pins([ids]) → confirm → success

For direct pin-name edit requests like "edit my Los Amigos pin":
  → query_pins(search="Los Amigos") → return pin_list mode=edit
  → let the UI handle selection after the list is returned

"SYSTEM: hotspotId=xxx action=edit":
  → show scope question first: "this drop only / all future drops / all drops"
  → then edit_hotspot(hotspotId, editScope, fields)

"SYSTEM: locationId=xxx":
  → query_location_collectors for that locationId

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOTSPOT EDIT SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For hotspot-linked pin edits, always clarify scope first:
  this_drop    → edit only this LocationGroup
  future_drops → edit LocationGroups where startDate >= today
  all_drops    → edit all linked LocationGroups

Pass editScope to edit_hotspot. Include hotspotEditScope in confirm summary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMENDATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"best drop area" / "where should I drop" / "suggest drop locations":
  1. query_time_analytics         → find best day/hour pattern
  2. query_pin_type_analytics     → find best pin type
  3. query_area_insights(area)    → real-world context (foot traffic, events)
  4. Combine all three into area_recommendation response.

Always use query_area_insights — never guess foot traffic or events.
area comes from: prior intent area, or ask the user.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NESTED DATA RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Level 1 — pin_list: pins with location points (no consumer rows)
Level 2 — single_pin_report / top_pins_report: location points WITH totalClaimed/totalRedeemed counts
Level 3 — location_collectors: full collector list for ONE location, paginated

Never load Level 3 data inside a pin_list. It's always a separate drill-down.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGINATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All paginated tools return { total, offset, limit, hasMore, nextOffset, showing }.
ALWAYS copy pagination verbatim into your response data.pagination.
Default limit=10. Load more appears when hasMore=true.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOOL DISCIPLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Max 4 tool calls per turn. Never call the same tool twice.
0 results → respond with type="info" immediately.
query_area_insights → only for recommendation requests, never for viewing/editing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD RULES — NEVER VIOLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Never expose redeemCode under any circumstance
2. Never write to User records
3. All queries scoped to creatorId (tools enforce this)
4. Never show template LocationGroups
5. Confirm before any write (edit, delete, pause, resume)
6. Analytics → aggregates only, never individual consumer rows
7. Null/empty edit fields → preserve existing value
8. LocationConsumer records → never written, never deleted
9. Never put raw cuid strings in user-facing labels
10. isActive on Hotspot controls scheduling only, not visibility
`;

// ─────────────────────────────────────────────────────────────────────────────
// Main runner
// ─────────────────────────────────────────────────────────────────────────────

export async function runCreatorAgent(input: CreatorAgentInput): Promise<CreatorAgentOutput> {
  const { messages, creatorId, priorIntent, loadMore, loadMoreOffset, loadMoreType } = input;

  // ── Fast path: paginating a pin list — skip LLM ──────────────────────────
  if (loadMore && loadMoreType === "pin_list" && loadMoreOffset !== undefined) {
    return handleLoadMorePins(creatorId, priorIntent, loadMoreOffset);
  }

  // ── LLM path ─────────────────────────────────────────────────────────────
  const tools = createDbTools(creatorId);
  const systemPrompt = SYSTEM_PROMPT + buildSessionContext(priorIntent, loadMore, loadMoreOffset, loadMoreType);

  const agent = createAgent({
    model: new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 }),
    tools,
    systemPrompt,
    name: "CreatorAgent",
    responseFormat: providerStrategy(AgentResponseSchema),
  });

  console.log("[CreatorAgent] Start", { creatorId, messages: messages.length });

  const result = await agent.invoke(
    { messages: toLangChainMessages(messages) },
    { recursionLimit: 12 },
  );
  const agentResponse = result.structuredResponse.response;

  console.log("[CreatorAgent] Done", { type: agentResponse.type });

  return {
    reply: JSON.stringify(agentResponse),
    stage: stageFromResponse(agentResponse),
    intent: {
      ...buildDefaultIntent(priorIntent),
      confirmed: agentResponse.type === "success",
    },
  };
}