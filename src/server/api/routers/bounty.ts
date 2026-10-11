import {
  NotificationType,
  Prisma,
  UserRole,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { StellarAccount } from "~/lib/stellar/account";
import type { Db } from "~/server/db";
import { inPlatformScope, platformScope, type PlatformCtx } from "~/server/platform-scope";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  isOwnS3Url,
  MAX_ENTRY_FILE_BYTES,
  MAX_ENTRY_FILES,
  signEntryUpload,
} from "~/server/s3";

/**
 * ── Bounty ─────────────────────────────────────────────────────────────────
 *
 * The fan's half of the bounty system (shared with wadzzoAR): browse, join,
 * submit entries, talk to the brand, and see whether you won. Creating,
 * reviewing and paying out happen in the brand portal (brand-wadzzo) —
 * nothing here can create a bounty or change another user's entry.
 *
 * Rewards need no claim step. In the old app the brand pays the winner
 * directly when marking them (`makeBountyWinner` → `SendBountyBalanceToWinner`),
 * so by the time a `BountyWinner` row exists the asset is already in the
 * winner's wallet. The optional USDC swap is deferred.
 *
 * Deliberate divergences from the old app, each a bug there:
 *
 *  1. Lists only `APPROVED` bounties. `getAllBounties` has no status filter,
 *     so pending and admin-rejected bounties show up to fans.
 *  2. `join` checks `requiredBalance` on the server. The old app only
 *     disables the button in the browser; the mutation itself never checks.
 *  3. Entries require having joined, and a bounty that is still open (not
 *     past its end date, winner slots not all filled). The old app accepts
 *     a submission from anyone, at any time.
 *  4. Chat messages are written with the fan as `senderId`. The old app's
 *     `createUpdateBountyDoubtForUserCreator` writes every message as sent by
 *     the *creator*, and drops attached media on a thread's first message.
 *     Sides are read from `role`, which the old app does record correctly,
 *     so older threads still render the right way round.
 *  5. Attachment URLs must point at our own bucket — otherwise any link could
 *     be passed off as an uploaded file.
 */

const ENTRY_MEDIA = z.object({
  url: z.string().url(),
  name: z.string().max(255),
  size: z.number().int().nonnegative().max(MAX_ENTRY_FILE_BYTES),
  type: z.string().max(120),
});

const ENTRY_INPUT = {
  content: z
    .string()
    .trim()
    .min(2, { message: "Tell the brand a little about your entry" })
    .max(5000),
  medias: z.array(ENTRY_MEDIA).max(MAX_ENTRY_FILES).default([]),
};

const LIST_FILTERS = ["open", "top"] as const;

const creatorSelect = { id: true, name: true, profileUrl: true } as const;

/** Only what a list card needs, plus the viewer's own join/win/entry facts. */
function cardInclude(userId: string | undefined) {
  return {
    creator: { select: creatorSelect },
    _count: { select: { participants: true } },
    participants: {
      where: { userId: userId ?? "" },
      select: { userId: true },
    },
    BountyWinner: {
      where: { userId: userId ?? "" },
      select: { id: true },
    },
    submissions: {
      where: { userId: userId ?? "" },
      select: { status: true, createdAt: true },
      orderBy: { createdAt: "desc" as const },
    },
  } satisfies Prisma.BountyInclude;
}

type CardRow = Prisma.BountyGetPayload<{
  include: ReturnType<typeof cardInclude>;
}>;

/**
 * Open means still accepting entries: approved and with at least one winner
 * slot left (bounties have no end date). `currentWinnerCount` is what the
 * old app itself compares against (`currentWinnerCount === totalWinner`
 * disables "Submit"), and unlike counting `BountyWinner` rows it isn't
 * inflated by the old app's swap flow, which inserts extra winner rows.
 */
function isOpen(b: {
  status: string;
  currentWinnerCount: number;
  totalWinner: number;
}) {
  return (
    b.status === "APPROVED" &&
    b.currentWinnerCount < b.totalWinner
  );
}

/** Bounty descriptions are rich-text HTML; a card only needs a short plain-text teaser. */
function toSummary(html: string | null) {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 220 ? `${text.slice(0, 217).trimEnd()}…` : text;
}

function toCard(row: CardRow, userId: string | undefined) {
  const perWinner = row.totalWinner > 0 ? row.totalWinner : 1;
  const latest = row.submissions[0];
  return {
    id: row.id,
    title: row.title,
    summary: toSummary(row.description),
    imageUrl: row.imageUrls[0] ?? null,
    brand: {
      id: row.creator.id,
      name: row.creator.name,
      avatarUrl: row.creator.profileUrl,
    },
    rewardUsd: row.priceInUSD / perWinner,
    rewardAsset: row.priceInBand / perWinner,
    assetCode: PLATFORM_ASSET.code,
    totalWinners: row.totalWinner,
    spotsLeft: Math.max(0, row.totalWinner - row.currentWinnerCount),
    participants: row._count.participants,
    requiredBalance: row.requiredBalance,
    createdAt: row.createdAt,
    open: isOpen(row),
    isOwner: !!userId && userId === row.creatorId,
    viewer: {
      joined: row.participants.length > 0,
      won: row.BountyWinner.length > 0,
      entryCount: row.submissions.length,
      latestEntryStatus: latest?.status ?? null,
    },
  };
}

export type BountyCard = ReturnType<typeof toCard>;

/** Plain text from the entry box → the HTML the brand's review screen renders. */
function textToHtml(text: string) {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escape(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function assertOwnMedia(medias: { url: string }[]) {
  if (medias.some((m) => !isOwnS3Url(m.url))) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Attachments must be uploaded through the app",
    });
  }
}

/**
 * Loads a bounty and the viewer's membership, throwing the error a fan should
 * actually see. Unapproved bounties are invisible to everyone but people who
 * already joined (a bounty can be pulled after the fact).
 */
async function loadForViewer(
  db: Db,
  bountyId: number,
  userId: string,
  ctx: PlatformCtx,
) {
  const bounty = await db.bounty.findUnique({
    where: { id: bountyId },
    include: { participants: { where: { userId }, select: { id: true } } },
  });
  const joined = Boolean(bounty?.participants.length);
  // Another platform's bounty doesn't exist here (web.wadzzo.com sees all).
  if (!bounty || !inPlatformScope(ctx, bounty.platformId) || (bounty.status !== "APPROVED" && !joined)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Bounty not found" });
  }
  return { bounty, joined };
}

async function requireOpenMembership(
  db: Db,
  bountyId: number,
  userId: string,
  ctx: PlatformCtx,
) {
  const { bounty, joined } = await loadForViewer(db, bountyId, userId, ctx);
  if (!joined) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Join this bounty first",
    });
  }
  if (!isOpen(bounty)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This bounty is closed",
    });
  }
  return bounty;
}

async function notifyCreator(
  db: Db,
  args: {
    actorId: string;
    creatorId: string;
    bountyId: number;
    type: NotificationType;
  },
) {
  if (args.actorId === args.creatorId) return;
  await db.notificationObject.create({
    data: {
      actorId: args.actorId,
      entityType: args.type,
      entityId: args.bountyId,
      isUser: true,
      Notification: {
        create: [{ notifierId: args.creatorId, isCreator: true }],
      },
    },
  });
}

export const bountyRouter = createTRPCRouter({
  /** Explore. Public — signed-out viewers browse, only joining is gated. */
  list: publicProcedure
    .input(
      z.object({
        filter: z.enum(LIST_FILTERS).default("open"),
        search: z.string().trim().max(80).optional(),
        /** one brand's bounties (the creator page) */
        creatorId: z.string().optional(),
        limit: z.number().int().min(1).max(40).default(20),
        cursor: z.number().int().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      const where: Prisma.BountyWhereInput = {
        ...platformScope(ctx),
        ...(input.creatorId && { creatorId: input.creatorId }),
        status: "APPROVED",
        currentWinnerCount: { lt: ctx.db.bounty.fields.totalWinner },
        AND: [
          ...(input.search
            ? [
                {
                  OR: [
                    {
                      title: {
                        contains: input.search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      creator: {
                        name: {
                          contains: input.search,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  ],
                },
              ]
            : []),
        ],
      };

      const orderBy: Prisma.BountyOrderByWithRelationInput[] =
        input.filter === "top"
          ? [{ priceInUSD: "desc" }, { id: "desc" }]
          : [{ createdAt: "desc" }, { id: "desc" }];

      const rows = await ctx.db.bounty.findMany({
        where,
        orderBy,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
        include: cardInclude(userId),
      });

      const nextCursor =
        rows.length > input.limit ? rows.pop()!.id : null;
      return { items: rows.map((r) => toCard(r, userId)), nextCursor };
    }),

  /** Header numbers for the bounty page: open bounties and their total reward pool. */
  stats: publicProcedure.query(async ({ ctx }) => {
    const open = await ctx.db.bounty.aggregate({
      where: {
        ...platformScope(ctx),
        status: "APPROVED",
        currentWinnerCount: { lt: ctx.db.bounty.fields.totalWinner },
      },
      _count: { _all: true },
      _sum: { priceInUSD: true },
    });
    return { open: open._count._all, poolUsd: open._sum.priceInUSD ?? 0 };
  }),

  /** Everything the viewer has joined, open or closed, newest join first. */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const joins = await ctx.db.bountyParticipant.findMany({
      where: { userId, bounty: platformScope(ctx) },
      orderBy: { joinedAt: "desc" },
      select: { bounty: { include: cardInclude(userId) } },
    });
    return joins.map((j) => toCard(j.bounty, userId));
  }),

  byId: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      const row = await ctx.db.bounty.findUnique({
        where: { id: input.id },
        include: {
          ...cardInclude(userId),
          _count: {
            select: { participants: true, submissions: true, comments: true },
          },
        },
      });
      if (!row || !inPlatformScope(ctx, row.platformId)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bounty not found" });
      }
      const card = toCard(row, userId);
      if (row.status !== "APPROVED" && !card.viewer.joined) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bounty not found" });
      }
      return {
        ...card,
        description: row.description,
        imageUrls: row.imageUrls,
        status: row.status,
        totalEntries: row._count.submissions,
        commentCount: row._count.comments,
      };
    }),

  join: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { bounty, joined } = await loadForViewer(ctx.db, input.id, userId, ctx);
      if (joined) return { joined: true };

      if (bounty.creatorId === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't join your own bounty",
        });
      }
      if (!isOpen(bounty)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This bounty is closed",
        });
      }

      if (bounty.requiredBalance > 0) {
        const account = await StellarAccount.load(userId);
        const balance =
          account?.tokenBalance(PLATFORM_ASSET.code, PLATFORM_ASSET.issuer) ??
          0;
        if (balance < bounty.requiredBalance) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You need at least ${bounty.requiredBalance} ${PLATFORM_ASSET.code} to join`,
          });
        }
      }

      try {
        await ctx.db.bountyParticipant.create({
          data: { bountyId: bounty.id, userId, platformId: ctx.platform.id },
        });
      } catch (e) {
        // A double tap racing itself — the unique (bountyId, userId) index
        // already did the right thing.
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          return { joined: true };
        }
        throw e;
      }

      await notifyCreator(ctx.db, {
        actorId: userId,
        creatorId: bounty.creatorId,
        bountyId: bounty.id,
        type: NotificationType.BOUNTY_PARTICIPANT,
      });
      return { joined: true };
    }),

  // ── Entries ────────────────────────────────────────────────────────────

  entries: protectedProcedure
    .input(z.object({ bountyId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.bountySubmission.findMany({
        where: { bountyId: input.bountyId, userId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          status: true,
          createdAt: true,
          medias: {
            select: { id: true, url: true, name: true, size: true, type: true },
          },
        },
      });
    }),

  createEntry: protectedProcedure
    .input(z.object({ bountyId: z.number().int(), ...ENTRY_INPUT }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const bounty = await requireOpenMembership(ctx.db, input.bountyId, userId, ctx);
      assertOwnMedia(input.medias);

      const entry = await ctx.db.bountySubmission.create({
        data: {
          bountyId: bounty.id,
          userId,
          content: textToHtml(input.content),
          medias: input.medias.length
            ? { createMany: { data: input.medias } }
            : undefined,
        },
        select: { id: true },
      });

      await notifyCreator(ctx.db, {
        actorId: userId,
        creatorId: bounty.creatorId,
        bountyId: bounty.id,
        type: NotificationType.BOUNTY_SUBMISSION,
      });
      return entry;
    }),

  updateEntry: protectedProcedure
    .input(z.object({ entryId: z.number().int(), ...ENTRY_INPUT }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const entry = await ctx.db.bountySubmission.findUnique({
        where: { id: input.entryId },
        select: { userId: true, bountyId: true },
      });
      if (!entry || entry.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      }
      await requireOpenMembership(ctx.db, entry.bountyId, userId, ctx);
      assertOwnMedia(input.medias);

      await ctx.db.bountySubmission.update({
        where: { id: input.entryId },
        data: {
          content: textToHtml(input.content),
          medias: {
            deleteMany: {},
            createMany: { data: input.medias },
          },
        },
      });
      return { id: input.entryId };
    }),

  deleteEntry: protectedProcedure
    .input(z.object({ entryId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const entry = await ctx.db.bountySubmission.findUnique({
        where: { id: input.entryId },
        select: { userId: true, bountyId: true },
      });
      if (!entry || entry.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      }
      await requireOpenMembership(ctx.db, entry.bountyId, userId, ctx);
      await ctx.db.bountySubmission.delete({ where: { id: input.entryId } });
      return { id: input.entryId };
    }),

  /** Presigned PUTs for up to five attachments, signed only for members. */
  uploadUrls: protectedProcedure
    .input(
      z.object({
        bountyId: z.number().int(),
        files: z
          .array(
            z.object({
              fileName: z.string().max(255),
              fileType: z.string().max(120),
              fileSize: z.number().int().positive(),
              checksum: z.string().max(100),
            }),
          )
          .min(1)
          .max(MAX_ENTRY_FILES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireOpenMembership(ctx.db, input.bountyId, ctx.session.user.id, ctx);
      try {
        return await Promise.all(input.files.map((f) => signEntryUpload(f)));
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Upload refused",
        });
      }
    }),

  // ── Discussion (public comments) ───────────────────────────────────────

  comments: publicProcedure
    .input(z.object({ bountyId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      const userSelect = { select: { id: true, name: true, image: true } };
      const rows = await ctx.db.bountyComment.findMany({
        where: { bountyId: input.bountyId, bountyParentCommentID: null },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: userSelect,
          bountyChildComments: {
            orderBy: { createdAt: "asc" },
            include: { user: userSelect },
          },
        },
      });
      const shape = (c: (typeof rows)[number] | (typeof rows)[number]["bountyChildComments"][number]) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: { id: c.user.id, name: c.user.name, image: c.user.image },
        mine: c.userId === userId,
      });
      return rows.map((c) => ({
        ...shape(c),
        replies: c.bountyChildComments.map(shape),
      }));
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        bountyId: z.number().int(),
        parentId: z.number().int().optional(),
        content: z.string().trim().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { bounty } = await loadForViewer(ctx.db, input.bountyId, userId, ctx);

      if (input.parentId) {
        const parent = await ctx.db.bountyComment.findUnique({
          where: { id: input.parentId },
          select: { bountyId: true, bountyParentCommentID: true },
        });
        // One level of replies, and only within the same bounty.
        if (
          !parent ||
          parent.bountyId !== bounty.id ||
          parent.bountyParentCommentID !== null
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Can't reply here" });
        }
      }

      const comment = await ctx.db.bountyComment.create({
        data: {
          bountyId: bounty.id,
          userId,
          content: input.content,
          bountyParentCommentID: input.parentId,
        },
        select: { id: true },
      });

      // Same audience as the old app: the brand plus everyone who has
      // already commented, minus the author.
      const earlier = await ctx.db.bountyComment.findMany({
        where: { bountyId: bounty.id, userId: { not: userId } },
        distinct: ["userId"],
        select: { userId: true },
      });
      const notify = new Set([bounty.creatorId, ...earlier.map((c) => c.userId)]);
      notify.delete(userId);
      if (notify.size > 0) {
        await ctx.db.notificationObject.create({
          data: {
            actorId: userId,
            entityType: input.parentId
              ? NotificationType.BOUNTY_REPLY
              : NotificationType.BOUNTY_COMMENT,
            entityId: bounty.id,
            isUser: false,
            Notification: {
              create: [...notify].map((notifierId) => ({
                notifierId,
                isCreator: notifierId === bounty.creatorId,
              })),
            },
          },
        });
      }
      return comment;
    }),

  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await ctx.db.bountyComment.deleteMany({
        where: { id: input.commentId, userId: ctx.session.user.id },
      });
      if (count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
      }
      return { id: input.commentId };
    }),

  // ── Private chat with the brand ────────────────────────────────────────

  thread: protectedProcedure
    .input(z.object({ bountyId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { joined } = await loadForViewer(ctx.db, input.bountyId, userId, ctx);
      if (!joined) return [];
      const doubt = await ctx.db.bountyDoubt.findFirst({
        where: { bountyId: input.bountyId, userId },
        select: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: { id: true, content: true, role: true, createdAt: true },
          },
        },
      });
      return (doubt?.messages ?? []).map((m) => ({
        id: m.id,
        content: m.content,
        fromBrand: m.role === UserRole.CREATOR,
        createdAt: m.createdAt,
      }));
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        bountyId: z.number().int(),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { bounty, joined } = await loadForViewer(ctx.db, input.bountyId, userId, ctx);
      if (!joined) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Join this bounty first" });
      }

      const existing = await ctx.db.bountyDoubt.findFirst({
        where: { bountyId: bounty.id, userId },
        select: { id: true },
      });

      const message = { senderId: userId, role: UserRole.USER, content: input.content };
      if (existing) {
        await ctx.db.bountyDoubt.update({
          where: { id: existing.id },
          data: { updatedAt: new Date(), messages: { create: message } },
        });
      } else {
        await ctx.db.bountyDoubt.create({
          data: {
            bountyId: bounty.id,
            userId,
            updatedAt: new Date(),
            messages: { create: message },
          },
        });
      }

      await notifyCreator(ctx.db, {
        actorId: userId,
        creatorId: bounty.creatorId,
        bountyId: bounty.id,
        type: existing
          ? NotificationType.BOUNTY_DOUBT_REPLY
          : NotificationType.BOUNTY_DOUBT_CREATE,
      });
      return { ok: true };
    }),

  /**
   * What the tab dot and "Needs you" row are built from: bounties the viewer
   * won, and threads whose latest message came from the brand. Each carries a
   * timestamp so the client can tell new from already-seen without the
   * server storing read receipts (there's no column for them).
   */
  attention: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [wins, threads] = await Promise.all([
      ctx.db.bountyWinner.findMany({
        where: { userId },
        distinct: ["bountyId"],
        orderBy: { awardedAt: "asc" },
        select: {
          bountyId: true,
          awardedAt: true,
          bounty: { select: { title: true } },
        },
      }),
      ctx.db.bountyDoubt.findMany({
        where: { userId },
        select: {
          bountyId: true,
          bounty: { select: { title: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { role: true, createdAt: true },
          },
        },
      }),
    ]);

    return [
      ...wins.map((w) => ({
        kind: "won" as const,
        bountyId: w.bountyId,
        title: w.bounty.title,
        at: w.awardedAt,
      })),
      ...threads
        .filter((t) => t.messages[0]?.role === UserRole.CREATOR)
        .map((t) => ({
          kind: "reply" as const,
          bountyId: t.bountyId,
          title: t.bounty.title,
          at: t.messages[0]!.createdAt,
        })),
    ];
  }),
});
