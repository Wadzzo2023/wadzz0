import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { StellarAccount } from "~/lib/stellar/account";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { platformToUsd } from "~/server/stellar/prices";
import {
  getStorage,
  prepareListing,
  prepareStorageSetup,
  prepareUnlisting,
  quoteListing,
  quoteStorageSetup,
} from "~/server/stellar/resale";
import { signerFor } from "~/server/stellar/session-signer";

const payIn = z.enum(["PLATFORM_ASSET", "XLM"]);

const assetCardSelect = {
  id: true,
  name: true,
  code: true,
  issuer: true,
  thumbnail: true,
  mediaType: true,
  royaltyPercent: true,
  creator: { select: { id: true, name: true, profileUrl: true } },
} as const;

/** My items: what I own, what I'm reselling, and the resale actions. */
export const collectionRouter = createTRPCRouter({
  /** Items in my wallet (on-chain balances matched to Wadzzo items) and how many of each I'm reselling. */
  owned: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const [wallet, storageRow] = await Promise.all([StellarAccount.load(me), getStorage(ctx.db, me)]);
    const storage = storageRow ? await StellarAccount.load(storageRow.storagePub) : null;

    const held = new Map<string, { wallet: number; listed: number }>();
    const add = (acc: StellarAccount | null, key: "wallet" | "listed") => {
      for (const b of acc?.balances ?? []) {
        if ((b.asset_type === "credit_alphanum4" || b.asset_type === "credit_alphanum12") && Number(b.balance) > 0) {
          const k = `${b.asset_code}:${b.asset_issuer}`;
          const cur = held.get(k) ?? { wallet: 0, listed: 0 };
          cur[key] += Number(b.balance);
          held.set(k, cur);
        }
      }
    };
    add(wallet, "wallet");
    add(storage, "listed");
    if (!held.size) return [];

    const pairs = [...held.keys()].map((k) => {
      const [code, issuer] = k.split(":") as [string, string];
      return { code, issuer };
    });
    const assets = await ctx.db.asset.findMany({ where: { OR: pairs }, select: assetCardSelect });
    const listings = await ctx.db.marketAsset.findMany({
      where: { placerId: me, assetId: { in: assets.map((a) => a.id) } },
      select: { id: true, assetId: true, price: true, priceUSD: true },
    });
    return assets
      .map((a) => {
        const h = held.get(`${a.code}:${a.issuer}`)!;
        // A creator's own items in their storage are their stock (shown under Created), not resale listings.
        const isMine = a.creator?.id === me;
        return {
          asset: a,
          owned: Math.floor(h.wallet),
          listed: isMine ? 0 : Math.floor(h.listed),
          listing: isMine ? null : (listings.find((l) => l.assetId === a.id) ?? null),
        };
      })
      .filter((x) => x.owned > 0 || x.listed > 0)
      .sort((x, y) => y.asset.id - x.asset.id);
  }),

  /** My resale storage: whether I have one and whether it's live. */
  storage: protectedProcedure.query(async ({ ctx }) => {
    const row = await getStorage(ctx.db, ctx.session.user.id);
    if (!row) return { exists: false as const };
    const acc = await StellarAccount.load(row.storagePub);
    return { exists: true as const, active: Boolean(acc), publicKey: row.storagePub, isBrand: !row.notCreatorButSeller };
  }),

  storageQuote: protectedProcedure.input(z.object({ payIn })).query(({ ctx, input }) => quoteStorageSetup(ctx.session.user.id, input.payIn)),

  storagePrepare: protectedProcedure
    .input(z.object({ payIn }))
    .mutation(({ ctx, input }) => prepareStorageSetup(ctx, { userId: ctx.session.user.id, payIn: input.payIn, signer: signerFor(ctx.session) })),

  listQuote: protectedProcedure
    .input(z.object({ assetId: z.number().int(), copies: z.number().int().min(1), payIn }))
    .query(async ({ ctx, input }) => {
      const { quote } = await quoteListing(ctx, { userId: ctx.session.user.id, ...input });
      return quote;
    }),

  listPrepare: protectedProcedure
    .input(z.object({ assetId: z.number().int(), copies: z.number().int().min(1), price: z.number().positive(), payIn }))
    .mutation(({ ctx, input }) => prepareListing(ctx, { userId: ctx.session.user.id, signer: signerFor(ctx.session), ...input })),

  unlistPrepare: protectedProcedure
    .input(z.object({ listingId: z.number().int(), copies: z.number().int().min(1).optional() }))
    .mutation(({ ctx, input }) => prepareUnlisting(ctx, { userId: ctx.session.user.id, signer: signerFor(ctx.session), ...input })),

  /** Change the asking price of one of my listings (no transaction needed). */
  updatePrice: protectedProcedure
    .input(z.object({ listingId: z.number().int(), price: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const l = await ctx.db.marketAsset.findUnique({ where: { id: input.listingId }, select: { placerId: true } });
      if (!l || l.placerId !== ctx.session.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.marketAsset.update({ where: { id: input.listingId }, data: { price: input.price, priceUSD: await platformToUsd(input.price) } });
    }),

  /** Items I created (as a brand): mint progress, copies waiting in my storage (stock), and whether they're on sale. */
  created: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const [assets, storageRow] = await Promise.all([
      ctx.db.asset.findMany({
        where: { creatorId: me },
        select: { ...assetCardSelect, limit: true, mintedCount: true, privacy: true, marketItems: { where: { placerId: me }, select: { id: true, price: true } } },
        orderBy: { id: "desc" },
      }),
      getStorage(ctx.db, me),
    ]);
    const storage = storageRow ? await StellarAccount.load(storageRow.storagePub) : null;
    return assets.map((a) => ({ ...a, stock: Math.floor(storage?.tokenBalance(a.code, a.issuer) ?? 0) }));
  }),
});
