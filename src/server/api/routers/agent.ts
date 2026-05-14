// server/routers/agent.ts
import { z } from "zod";
import { publicProcedure, createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { qstash } from "~/lib/qstash";
import { BASE_URL } from "~/lib/common";


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
      const creatorId = input.creatorId ?? ctx.session?.user?.id


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
});