// src/server/api/routers/agent.ts
// Key changes vs previous version:
//   • DETERMINISTIC_STEPS removed — all steps now route through the LLM
//     so user messages are always read and responded to naturally
//   • detectIntentReset() — checks if the user is abandoning the current
//     flow before any step logic runs; resets state to clarify_task
//   • Tool prompt now instructs model on mid-flow intent changes
//   • buildQuickMessagePrompt receives userMessage so it can respond to
//     the actual message, not just emit a canned confirmation
//   • enforceStepTransition only fires if detectIntentReset() is false

import { z } from "zod";
import { createTRPCRouter, creatorProcedure } from "~/server/api/trpc";
import { generateText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { agentTools } from "~/lib/agent/tools";
import { qstash } from "~/lib/qstash";
import type {
  AgentState,
  AgentStep,
  EventData,
  LandmarkData,
  Message,
  PinItem,
} from "~/lib/agent/types";
import { BASE_URL } from "~/lib/common";




// ─── Zod input schema ─────────────────────────────────────────────────────────

const AgentStateSchema = z.object({
  step: z.string(),
  task: z.enum(["event", "landmark"]).nullable().optional(),
  searchQuery: z.string().nullish(),
  searchArea: z.string().nullish(),
  events: z.array(z.any()).nullish(),
  selectedEvents: z.array(z.any()).nullish(),
  landmarks: z.array(z.any()).nullish(),
  selectedLandmarks: z.array(z.any()).nullish(),
  pinConfig: z.record(z.string(), z.any()).nullish(),
  pins: z.array(z.any()).nullish(),
  redeemMode: z.enum(["separate", "single"]).nullish(),
  pendingModification: z.object({
    indices: z.array(z.number()).optional(),
    names: z.array(z.string()).optional(),
  }).nullish(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const agentRouter = createTRPCRouter({
  // ── poll job progress ──────────────────────────────────────────────────────
  jobStatus: creatorProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.locationGroupJob.findUnique({
        where: { id: input.jobId },
        select: {
          id: true,
          status: true,
          total: true,
          completed: true,
          log: true,
          error: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!job) throw new Error("Job not found");
      return {
        jobId: job.id,
        status: job.status as "pending" | "processing" | "completed" | "failed",
        total: job.total,
        completed: job.completed,
        log: job.log as Array<{ title: string; status: "ok" | "error"; error?: string }>,
        error: job.error,
        createdAt: job.createdAt.getTime(),
        updatedAt: job.updatedAt.getTime(),
      };
    }),

  // ── main chat mutation ─────────────────────────────────────────────────────
  // ── main chat mutation — now just enqueues to QStash ──────────────────────
  chat: creatorProcedure
    .input(z.object({
      message: z.string(),
      history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })),
      state: AgentStateSchema,
      creatorId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { message, history, state, creatorId } = input;
      const creator_Id = creatorId ?? ctx.session?.user.id ?? "";

      // Create job record
      const job = await ctx.db.agentJob.create({
        data: {
          creatorId: creator_Id,
          status: "pending",
        },
      });

      // Enqueue to QStash — returns immediately, no timeout risk
      await qstash.publishJSON({
        url: `${BASE_URL}/api/agent`,
        body: {
          jobId: job.id,
          message,
          history,
          state,
          creatorId: creator_Id,
        },
        retries: 0, // don't retry AI calls
      });

      return { jobId: job.id };
    }),

  // ── poll agent job result ──────────────────────────────────────────────────
  agentJobResult: creatorProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.agentJob.findUnique({
        where: { id: input.jobId },
      });
      if (!job) throw new Error("Job not found");
      return {
        status: job.status as "pending" | "completed" | "failed",
        result: job.result as {
          message: string;
          state: AgentState;
          uiData?: Message["uiData"];
          jobId?: string;
        } | null,
        error: job.error,
      };
    }),

});