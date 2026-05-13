// server/routers/agent.ts
import { z } from "zod";
import { publicProcedure, createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { qstash } from "~/lib/qstash";
import { BASE_URL } from "~/lib/common";


<<<<<<< HEAD


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
=======
// ─── Schemas ──────────────────────────────────────────────────────────────────

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"] as const),
  text: z.string(),
});

const IntentSchema = z.object({
  count: z.number().nullable().optional(),
  countSpecified: z.boolean().optional(),
  query: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  areaType: z
    .enum(["city", "region", "country", "worldwide", "unknown"] as const)
    .optional(),
  confirmed: z.boolean().optional(),
  isNiche: z.boolean().optional(),
  pinNumber: z.number().min(1).default(1).optional(),
});

const PinOptionsSchema = z.object({
  autoCollect: z.boolean().default(false),
  groupingMode: z.enum(["per-location", "single-group"]).default("per-location"),
  pinNumber: z.number().min(1).max(200).default(1), // ← add this
>>>>>>> 5657b4d4 (refactor: update agent types and pin creation logic)
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const agentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        messages: z.array(MessageSchema).min(1),
        intent: IntentSchema.optional(),
        pinOptions: PinOptionsSchema.optional(),
        creatorId: z.string().optional(),
        pins: z.array(z.any()).optional(),

      })
    )
    .mutation(async ({ input, ctx }) => {
      const creatorId = ctx.session?.user?.id ??
        input.creatorId;

      if (!creatorId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Must be signed in to drop pins.",
        });
      }
      console.log("[runAgent] pinOptions received:", input.pinOptions);

      // 1. Persist a pending job row so the frontend can start polling right away
      const job = await db.agentJob.create({
        data: {
          creatorId,
          status: "pending",
          payload: JSON.stringify({
            messages: input.messages,
            intent: input.intent ?? null,
            pinOptions: input.pinOptions ?? null,
            creatorId,
            pins: input.pins ?? null,
          }),
        },
      });


      await qstash.publishJSON({
        url: `${BASE_URL}/api/agent`,
        body: { jobId: job.id },
        retries: 2,
      });

      // 3. Return immediately — UI polls pollJobResult
      return { jobId: job.id };
    }),

  /**
   * Unified polling endpoint for AgentJob.
   * Returns status + typed result fields directly (no need to parse job.result on the client).
   * The frontend calls this every ~1.5s until status is "completed" | "failed".
   */
  pollJobResult: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const job = await db.agentJob.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      type JobStatus = "pending" | "processing" | "completed" | "failed";
      type JobResult = {
        reply: string;
        stage: string;
        intent: unknown;
        pins?: unknown[];
        pinOptions?: unknown;
        jobId?: string; // locationGroupJob id (pin-drop phase)
      } | null;

      return {
        jobId: job.id,
        status: job.status as JobStatus,
        result: job.result as JobResult,
        error: job.error,
      };
    }),

  /**
   * @deprecated Use pollJobResult instead.
   * Kept for any legacy callers.
   */
  agentJobResult: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const job = await db.agentJob.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      return {
        jobId: job.id,
        status: job.status as "pending" | "processing" | "completed" | "failed",
        result: job.result as {
          reply: string;
          stage: string;
          intent: unknown;
          pins?: unknown[];
          pinOptions?: unknown;
          jobId?: string;
        } | null,
        error: job.error,
      };
    }),

  /**
   * Polls the pin-creation background job started after confirm.
   */
  jobStatus: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const job = await db.locationGroupJob.findUnique({
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

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      return {
        jobId: job.id,
        status: job.status as "pending" | "processing" | "completed" | "failed",
        total: job.total,
        completed: job.completed,
        log: (job.log ?? []) as Array<{
          title: string;
          status: "ok" | "error";
          error?: string;
        }>,
        error: job.error,
        createdAt: job.createdAt.getTime(),
        updatedAt: job.updatedAt.getTime(),
      };
    }),
<<<<<<< HEAD

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

=======
>>>>>>> 5657b4d4 (refactor: update agent types and pin creation logic)
});