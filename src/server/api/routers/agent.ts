// server/routers/agent.ts
import { z } from "zod";
import { publicProcedure, createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { taskClient } from "~/lib/express/taskClient-sdk";
import { AgentPollResult } from "~/types/agent/types";


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
        loadMore: z.boolean().optional(),
        loadMoreOffset: z.number().int().min(0).optional(),
        loadMoreType: z.enum(["pin_list",
          "report",
          "collector_report",
          "collector_loyalty",
          "location_collectors"]).optional(),
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
            pins: input.loadMore ? null : (input.pins ?? null), // ← strip pins on loadMore
            loadMore: input.loadMore ?? false,
            loadMoreOffset: input.loadMoreOffset ?? 0,
            loadMoreType: input.loadMoreType ?? null,
          }),
        },
      });


      const { jobId } = await taskClient.enqueue("agent_run", creatorId, {
        messages: input.messages,
        intent: input.intent ?? null,
        pinOptions: input.pinOptions ?? null,
        creatorId,
        pins: input.pins ?? null,
        loadMore: input.loadMore ?? false,
        loadMoreOffset: input.loadMoreOffset ?? 0,
        loadMoreType: input.loadMoreType ?? null,
      });
      return { jobId };
    }),

  /**
   * Unified polling endpoint for AgentJob.
   * Returns status + typed result fields directly (no need to parse job.result on the client).
   * The frontend calls this every ~1.5s until status is "completed" | "failed".
   */
  pollJobResult: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const job = await taskClient.poll(input.jobId);

      console.log("job,", job);

      return {
        jobId: job.jobId,
        status: job.status,
        result: job.result as AgentPollResult | null,
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


  editPinDirect: protectedProcedure
    .input(z.object({
      locationGroupIds: z.array(z.string()),
      fields: z.object({
        title: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
        radius: z.number().nullable().optional(),
        image: z.string().nullable().optional(),
        link: z.string().nullable().optional(),
        multiPin: z.boolean().nullable().optional(),
      }),
      locationEdits: z.record(
        z.string(),
        z.object({
          latitude: z.number().nullable().optional(),
          longitude: z.number().nullable().optional(),
          autoCollect: z.boolean().nullable().optional(),
          hidden: z.boolean().nullable().optional(),
        })
      ).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      const { locationGroupIds, fields, locationEdits } = input;

      // 1. Update LocationGroup fields
      const pinFields = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== null && v !== undefined)
      );
      if (Object.keys(pinFields).length > 0) {
        await ctx.db.locationGroup.updateMany({
          where: { id: { in: locationGroupIds }, creatorId },
          data: pinFields,
        });
      }

      // 2. Update Location fields
      if (locationEdits) {
        await Promise.all(
          Object.entries(locationEdits).map(([locationId, locFields]) => {
            const clean = Object.fromEntries(
              Object.entries(locFields).filter(([, v]) => v !== null && v !== undefined)
            );
            if (Object.keys(clean).length === 0) return Promise.resolve();
            return ctx.db.location.updateMany({
              where: { id: locationId, locationGroup: { creatorId } },
              data: clean,
            });
          })
        );
      }

      return { ok: true, updated: locationGroupIds.length };
    }),

  deletePinDirect: protectedProcedure
    .input(z.object({
      locationGroupIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;

      await ctx.db.locationGroup.updateMany({
        where: { id: { in: input.locationGroupIds }, creatorId },
        data: { hidden: true },
      });

      return { ok: true, deleted: input.locationGroupIds.length };
    }),
});