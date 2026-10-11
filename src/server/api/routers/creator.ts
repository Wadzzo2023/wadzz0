import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { pageAssetRef, tierBalances } from "~/server/access";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { notify } from "~/server/notify";
import { platformScope } from "~/server/platform-scope";
import { followTrustlineXdr } from "~/server/stellar/follow";
import { preparePageTokens, quotePageTokens } from "~/server/stellar/page-tokens";
import { signerFor } from "~/server/stellar/session-signer";

const pageAssetSelect = { pageAsset: { select: { code: true, issuer: true, thumbnail: true } }, customPageAssetCodeIssuer: true } as const;

/** Brands as fans see them: browse, profile, tiers, follow. */
export const creatorRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ search: z.string().trim().max(80).optional(), limit: z.number().int().min(1).max(48).default(24), cursor: z.string().nullish() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.creator.findMany({
        where: {
          ...platformScope(ctx),
          approved: true,
          ...(input.search && { OR: [{ name: { contains: input.search, mode: "insensitive" } }, { bio: { contains: input.search, mode: "insensitive" } }] }),
        },
        select: {
          id: true,
          name: true,
          bio: true,
          profileUrl: true,
          coverUrl: true,
          vanityURL: true,
          pageAsset: { select: { code: true } },
          _count: { select: { followers: true, posts: true } },
        },
        orderBy: { followers: { _count: "desc" } },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
      });
      const items = rows.slice(0, input.limit);
      return { items, nextCursor: rows.length > input.limit ? (items.at(-1)?.id ?? null) : null };
    }),

  /** A brand's page, by id (wallet key) or vanity URL. */
  profile: publicProcedure.input(z.object({ key: z.string().min(1) })).query(async ({ ctx, input }) => {
    const creator = await ctx.db.creator.findFirst({
      where: { ...platformScope(ctx), approved: true, OR: [{ id: input.key }, { vanityURL: { equals: input.key, mode: "insensitive" } }] },
      select: {
        id: true,
        name: true,
        bio: true,
        profileUrl: true,
        coverUrl: true,
        vanityURL: true,
        joinedAt: true,
        ...pageAssetSelect,
        subscriptions: {
          where: { isActive: true },
          select: { id: true, name: true, description: true, features: true, color: true, popular: true, price: true },
          orderBy: { price: "asc" },
        },
        _count: {
          select: {
            followers: true,
            posts: true,
            // same rules as bounty.list, so the tab count matches its list
            Bounty: { where: { ...platformScope(ctx), status: "APPROVED", currentWinnerCount: { lt: ctx.db.bounty.fields.totalWinner } } },
          },
        },
      },
    });
    if (!creator) throw new TRPCError({ code: "NOT_FOUND", message: "Creator not found" });

    // same rules as market.listings({ creatorId }): the brand's drops plus fan resales of its items
    const items = await ctx.db.marketAsset.count({
      where: { ...platformScope(ctx), privacy: { in: ["PUBLIC", "FOR_SALE", "PRIVATE", "TIER"] }, placerId: { not: null }, asset: { creatorId: creator.id } },
    });

    const me = ctx.session?.user.id;
    const page = pageAssetRef(creator);
    const balanceOf = await tierBalances(me);
    const held = balanceOf(page);
    const following = me ? Boolean(await ctx.db.follow.findUnique({ where: { userId_creatorId: { userId: me, creatorId: creator.id } } })) : false;
    // Highest tier the viewer's page-token balance reaches.
    const myTier = [...creator.subscriptions].reverse().find((t) => held >= t.price) ?? null;

    const { customPageAssetCodeIssuer: _c, ...rest } = creator;
    return { ...rest, counts: { followers: creator._count.followers, posts: creator._count.posts, bounties: creator._count.Bounty, items }, pageAsset: page ? { ...page, thumbnail: creator.pageAsset?.thumbnail ?? null } : null, viewer: { signedIn: Boolean(me), following, pageTokens: held, tierId: myTier?.id ?? null, isSelf: me === creator.id } };
  }),

  /**
   * Follow a brand. Saved right away; when the brand has a page token and the
   * fan doesn't trust it yet, also returns a transaction adding that trustline
   * (the platform covers its 0.5 XLM reserve, as before).
   */
  follow: protectedProcedure.input(z.object({ creatorId: z.string() })).mutation(async ({ ctx, input }) => {
    const me = ctx.session.user.id;
    if (me === input.creatorId) throw new TRPCError({ code: "BAD_REQUEST", message: "You can't follow yourself." });
    const creator = await ctx.db.creator.findFirst({ where: { id: input.creatorId, approved: true }, select: { id: true, ...pageAssetSelect } });
    if (!creator) throw new TRPCError({ code: "NOT_FOUND" });

    const existing = await ctx.db.follow.findUnique({ where: { userId_creatorId: { userId: me, creatorId: creator.id } } });
    if (!existing) {
      const f = await ctx.db.follow.create({ data: { userId: me, creatorId: creator.id } });
      await notify(ctx.db, { actorId: me, type: "FOLLOW", entityId: f.id, recipients: [creator.id], creatorIds: [creator.id] });
    }

    const page = pageAssetRef(creator);
    return { xdr: page ? await followTrustlineXdr(me, page, signerFor(ctx.session)) : null };
  }),

  unfollow: protectedProcedure.input(z.object({ creatorId: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.follow.deleteMany({ where: { userId: ctx.session.user.id, creatorId: input.creatorId } });
  }),

  /** Brands I follow. */
  following: protectedProcedure.query(({ ctx }) =>
    ctx.db.follow.findMany({
      where: { userId: ctx.session.user.id, creator: { approved: true } },
      select: { creator: { select: { id: true, name: true, profileUrl: true, vanityURL: true } } },
      orderBy: { followAt: "desc" },
    }),
  ),

  /** Buying a creator's page-token pack (joins / moves up their membership tiers). */
  pageTokenQuote: protectedProcedure
    .input(z.object({ saleId: z.number().int(), payIn: z.enum(["PLATFORM_ASSET", "XLM"]) }))
    .query(({ ctx, input }) => quotePageTokens(ctx, ctx.session.user.id, input.saleId, input.payIn)),

  pageTokenPrepare: protectedProcedure
    .input(z.object({ saleId: z.number().int(), payIn: z.enum(["PLATFORM_ASSET", "XLM"]) }))
    .mutation(({ ctx, input }) => preparePageTokens(ctx, { buyerId: ctx.session.user.id, signer: signerFor(ctx.session), ...input })),
});
