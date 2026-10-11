import { type Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { pageAssetRef, tierBalances } from "~/server/access";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import type { Db } from "~/server/db";
import { notify } from "~/server/notify";
import { platformScope } from "~/server/platform-scope";

const postSelect = {
  id: true,
  heading: true,
  content: true,
  createdAt: true,
  creatorId: true,
  creator: {
    select: { id: true, name: true, profileUrl: true, vanityURL: true, pageAsset: { select: { code: true, issuer: true } }, customPageAssetCodeIssuer: true },
  },
  subscription: { select: { id: true, name: true, price: true, color: true } },
  medias: { select: { id: true, url: true, type: true } },
  _count: { select: { likes: { where: { status: true } }, comments: true } },
} satisfies Prisma.PostSelect;

type PostRow = Prisma.PostGetPayload<{ select: typeof postSelect }>;

/**
 * Gated posts reach the browser only for members of their tier (or the brand
 * itself): everyone else gets the heading, the brand and what unlocks it.
 */
async function present(db: Db, viewerId: string | undefined, rows: PostRow[]) {
  const balanceOf = await tierBalances(viewerId);
  const liked = viewerId
    ? new Set((await db.like.findMany({ where: { userId: viewerId, status: true, postId: { in: rows.map((r) => r.id) } }, select: { postId: true } })).map((l) => l.postId))
    : new Set<number>();

  return rows.map(({ creator, ...p }) => {
    const page = pageAssetRef(creator);
    const locked = Boolean(p.subscription) && viewerId !== creator.id && balanceOf(page) < (p.subscription?.price ?? 0);
    const { customPageAssetCodeIssuer: _c, pageAsset: _p, ...creatorOut } = creator;
    return {
      ...p,
      creator: creatorOut,
      content: locked ? null : p.content,
      medias: locked ? [] : p.medias,
      /** media kinds behind the lock, for a hint like "2 photos · 1 video" */
      lockedMedia: locked ? p.medias.map((m) => m.type) : [],
      locked,
      unlock: locked && p.subscription ? { tierName: p.subscription.name, price: p.subscription.price, code: page?.code ?? null } : null,
      liked: liked.has(p.id),
    };
  });
}

export const postRouter = createTRPCRouter({
  /** Latest posts: everyone's, the brands I follow, or one brand's. */
  feed: publicProcedure
    .input(
      z.object({
        scope: z.enum(["all", "following"]).default("all"),
        creatorId: z.string().optional(),
        limit: z.number().int().min(1).max(30).default(10),
        cursor: z.number().int().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const me = ctx.session?.user.id;
      if (input.scope === "following" && !me) return { items: [], nextCursor: null };
      const rows = await ctx.db.post.findMany({
        where: {
          ...platformScope(ctx),
          creator: { approved: true },
          ...(input.creatorId && { creatorId: input.creatorId }),
          ...(input.scope === "following" && me && { creator: { approved: true, followers: { some: { userId: me } } } }),
        },
        select: postSelect,
        orderBy: { id: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
      });
      const items = await present(ctx.db, me, rows.slice(0, input.limit));
      return { items, nextCursor: rows.length > input.limit ? (items.at(-1)?.id ?? null) : null };
    }),

  get: publicProcedure.input(z.object({ id: z.number().int() })).query(async ({ ctx, input }) => {
    const row = await ctx.db.post.findFirst({ where: { id: input.id, ...platformScope(ctx), creator: { approved: true } }, select: postSelect });
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
    const [post] = await present(ctx.db, ctx.session?.user.id, [row]);
    return post!;
  }),

  like: protectedProcedure.input(z.object({ postId: z.number().int(), liked: z.boolean() })).mutation(async ({ ctx, input }) => {
    const me = ctx.session.user.id;
    const post = await ctx.db.post.findUnique({ where: { id: input.postId }, select: { creatorId: true } });
    if (!post) throw new TRPCError({ code: "NOT_FOUND" });
    const existing = await ctx.db.like.findUnique({ where: { postId_userId: { postId: input.postId, userId: me } } });
    if (existing) {
      await ctx.db.like.update({ where: { id: existing.id }, data: { status: input.liked } });
    } else if (input.liked) {
      await ctx.db.like.create({ data: { postId: input.postId, userId: me } });
      await notify(ctx.db, { actorId: me, type: "LIKE", entityId: input.postId, recipients: [post.creatorId], creatorIds: [post.creatorId] });
    }
  }),

  comments: publicProcedure.input(z.object({ postId: z.number().int() })).query(({ ctx, input }) =>
    ctx.db.comment.findMany({
      where: { postId: input.postId, parentCommentID: null },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: { select: { name: true, image: true } },
        childComments: {
          select: { id: true, content: true, createdAt: true, userId: true, user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ),

  comment: protectedProcedure
    .input(z.object({ postId: z.number().int(), content: z.string().trim().min(1).max(2000), parentId: z.number().int().optional() }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      const post = await ctx.db.post.findUnique({ where: { id: input.postId }, select: { creatorId: true } });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      const comment = await ctx.db.comment.create({ data: { postId: input.postId, userId: me, content: input.content, parentCommentID: input.parentId } });
      const others = await ctx.db.comment.findMany({ where: { postId: input.postId }, distinct: ["userId"], select: { userId: true } });
      await notify(ctx.db, {
        actorId: me,
        type: input.parentId ? "REPLY" : "COMMENT",
        entityId: input.postId,
        recipients: [post.creatorId, ...others.map((o) => o.userId)],
        creatorIds: [post.creatorId],
      });
      return comment;
    }),

  deleteComment: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    await ctx.db.comment.deleteMany({ where: { id: input.id, userId: ctx.session.user.id } });
  }),
});
