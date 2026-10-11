import { ItemPrivacy, MediaType, type Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { platformScope } from "~/server/platform-scope";

/** Listings anyone may see (drafts and not-for-sale items stay hidden). */
const VISIBLE: ItemPrivacy[] = [ItemPrivacy.PUBLIC, ItemPrivacy.FOR_SALE, ItemPrivacy.PRIVATE, ItemPrivacy.TIER];

/** Everything a listing card needs. */
export const listingCardSelect = {
  id: true,
  price: true,
  priceUSD: true,
  privacy: true,
  placedAt: true,
  placerId: true,
  placer: { select: { id: true, name: true, profileUrl: true } },
  asset: {
    select: {
      id: true,
      name: true,
      code: true,
      thumbnail: true,
      mediaType: true,
      limit: true,
      mintedCount: true,
      royaltyPercent: true,
      creatorId: true,
      creator: { select: { id: true, name: true, profileUrl: true, vanityURL: true } },
      tier: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.MarketAssetSelect;

export type ListingCard = Prisma.MarketAssetGetPayload<{ select: typeof listingCardSelect }>;

const listingsInput = z.object({
  kind: z.enum(["all", "drops", "resale"]).default("all"),
  mediaType: z.nativeEnum(MediaType).optional(),
  creatorId: z.string().optional(),
  search: z.string().trim().max(80).optional(),
  sort: z.enum(["new", "price_asc", "price_desc"]).default("new"),
  limit: z.number().int().min(1).max(48).default(24),
  cursor: z.number().int().nullish(),
});

export type ListingsInput = z.input<typeof listingsInput>;

export const marketRouter = createTRPCRouter({
  /** The marketplace grid: creator drops, resales, or both. */
  listings: publicProcedure.input(listingsInput).query(async ({ ctx, input }) => {
    const where: Prisma.MarketAssetWhereInput = {
      ...platformScope(ctx),
      privacy: { in: VISIBLE },
      placerId: { not: null },
      asset: {
        ...(input.mediaType && { mediaType: input.mediaType }),
        ...(input.creatorId && { creatorId: input.creatorId }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { code: { contains: input.search, mode: "insensitive" } },
            { creator: { name: { contains: input.search, mode: "insensitive" } } },
          ],
        }),
        // hide items of brands that were banned
        OR: [{ creatorId: null }, { creator: { approved: { not: false } } }],
      },
    };
    if (input.kind !== "all") {
      // "drops" = a creator's own listing; "resale" = anyone else's (a column-to-column test Prisma can't express).
      const drops = input.kind === "drops";
      const ids = await ctx.db.$queryRaw<{ id: number }[]>`
        SELECT m.id FROM "MarketAsset" m JOIN "Asset" a ON a.id = m."assetId"
        WHERE (m."placerId" = a."creatorId") = ${drops}`;
      where.id = { in: ids.map((r) => r.id) };
    }
    const rows = await ctx.db.marketAsset.findMany({
      where,
      select: listingCardSelect,
      orderBy: input.sort === "new" ? { id: "desc" } : [{ price: input.sort === "price_asc" ? "asc" : "desc" }, { id: "desc" }],
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      skip: input.cursor ? 1 : 0,
    });
    const items = rows.slice(0, input.limit);
    const nextCursor = rows.length > input.limit ? (items.at(-1)?.id ?? null) : null;
    return { items, nextCursor };
  }),

  /** One item: the asset, its creator, and every listing (the creator's first, then resales by price). */
  item: publicProcedure.input(z.object({ assetId: z.number().int() })).query(async ({ ctx, input }) => {
    const asset = await ctx.db.asset.findFirst({
      where: { id: input.assetId, ...platformScope(ctx) },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        issuer: true,
        mediaType: true,
        // mediaUrl is owner-only: see content.unlock
        thumbnail: true,
        privacy: true,
        limit: true,
        mintedCount: true,
        royaltyPercent: true,
        createdAt: true,
        creatorId: true,
        creator: { select: { id: true, name: true, bio: true, profileUrl: true, vanityURL: true, approved: true } },
        tier: { select: { id: true, name: true, price: true } },
        marketItems: {
          where: { privacy: { in: VISIBLE }, placerId: { not: null } },
          select: { id: true, price: true, priceUSD: true, privacy: true, placedAt: true, placerId: true, placer: { select: { id: true, name: true, profileUrl: true } } },
          orderBy: { price: "asc" },
        },
        _count: { select: { buyers: true } },
      },
    });
    if (!asset || asset.creator?.approved === false) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
    const original = asset.marketItems.find((m) => m.placerId === asset.creatorId) ?? null;
    const resales = asset.marketItems.filter((m) => m.placerId !== asset.creatorId);
    return { ...asset, original, resales };
  }),

  /** Recent successful sales of an item (public activity on the item page). */
  itemActivity: publicProcedure.input(z.object({ assetId: z.number().int() })).query(({ ctx, input }) =>
    ctx.db.assetTransaction.findMany({
      where: { assetId: input.assetId, status: "SUCCESS", type: { in: ["PURCHASE", "RESALE_PURCHASE", "CLAIM", "GIFT"] } },
      select: { id: true, type: true, price: true, currency: true, createdAt: true, buyer: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ),

  /** Creators selling their page tokens. */
  pageTokenSales: publicProcedure.input(z.object({ limit: z.number().int().max(24).default(12) }).optional()).query(({ ctx, input }) =>
    ctx.db.sellPageAsset.findMany({
      where: { isSold: false, placer: { approved: true, ...platformScope(ctx) } },
      select: {
        id: true,
        title: true,
        description: true,
        amountToSell: true,
        price: true,
        priceUSD: true,
        priceXLM: true,
        placer: { select: { id: true, name: true, profileUrl: true, vanityURL: true, pageAsset: { select: { code: true, thumbnail: true } } } },
      },
      orderBy: { placedAt: "desc" },
      take: input?.limit ?? 12,
    }),
  ),
});
