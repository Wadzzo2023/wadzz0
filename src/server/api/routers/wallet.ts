import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { isCustodial } from "~/lib/custodial";
import { StellarAccount } from "~/lib/stellar/account";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { platformToUsd, platformToXlm } from "~/server/stellar/prices";
import { signerFor } from "~/server/stellar/session-signer";
import { prepareSend, quoteSend } from "~/server/stellar/transfer";
import { buyTokenPack, pendingGifts, prepareGiftClaim, prepareSwap, quoteSwap, tokenPacks } from "~/server/stellar/wallet";

const sendInput = z.object({
  code: z.string().min(1).max(12),
  issuer: z.string().length(56).nullable(),
  to: z.string().trim(),
  amount: z.number().positive(),
});

/** My wallet: balances, buying tokens, swapping, sending, pending gifts. */
export const walletRouter = createTRPCRouter({
  balances: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const acc = await StellarAccount.load(me);
    if (!acc) return { active: false as const, address: me };

    const others = acc.balances.filter(
      (b): b is Extract<typeof b, { asset_code: string }> =>
        (b.asset_type === "credit_alphanum4" || b.asset_type === "credit_alphanum12") &&
        !(b.asset_code === PLATFORM_ASSET.code && b.asset_issuer === PLATFORM_ASSET.issuer),
    );
    // Name the creators' page tokens; items are listed in the collection instead.
    const pageTokens = await ctx.db.creatorPageAsset.findMany({
      where: { OR: others.map((b) => ({ code: b.asset_code, issuer: b.asset_issuer })) },
      select: { code: true, issuer: true, thumbnail: true, creator: { select: { id: true, name: true } } },
    });
    // Everything else: items (named from the Asset table) and any other token.
    const isPage = (b: { asset_code: string; asset_issuer: string }) => pageTokens.some((p) => p.code === b.asset_code && p.issuer === b.asset_issuer);
    const rest = others.filter((b) => !isPage(b));
    const items = rest.length
      ? await ctx.db.asset.findMany({ where: { OR: rest.map((b) => ({ code: b.asset_code, issuer: b.asset_issuer })) }, select: { id: true, name: true, code: true, issuer: true, thumbnail: true } })
      : [];
    const tokens = rest
      .map((b) => {
        const item = items.find((i) => i.code === b.asset_code && i.issuer === b.asset_issuer);
        return { code: b.asset_code, issuer: b.asset_issuer, balance: Number(b.balance), name: item?.name ?? null, thumbnail: item?.thumbnail ?? null, itemId: item?.id ?? null };
      })
      .filter((t) => t.balance > 0);
    const platformTokens = acc.platformBalance();
    return {
      active: true as const,
      address: me,
      xlm: { total: acc.nativeBalance(), spendable: acc.spendableXlm(), reserved: acc.minimumBalance() },
      platform: { code: PLATFORM_ASSET.code, balance: platformTokens, trusted: acc.trustsPlatformAsset(), usd: await platformToUsd(platformTokens).catch(() => null) },
      pageTokens: pageTokens.map((p) => ({ ...p, balance: acc.tokenBalance(p.code, p.issuer) })),
      tokens,
    };
  }),

  /** Card packs and the token's value, for the "Get tokens" screen. */
  packs: publicProcedure.query(async () => ({ code: PLATFORM_ASSET.code, packs: await tokenPacks(), xlmPerToken: await platformToXlm(1).catch(() => null) })),

  buyPack: protectedProcedure
    .input(z.object({ usd: z.number(), sourceId: z.string().min(1), verificationToken: z.string().optional() }))
    .mutation(({ ctx, input }) => {
      // Card packs are for custodial (email/social) accounts; wallet users bring their own tokens.
      if (!isCustodial(ctx.session.user.walletType)) throw new TRPCError({ code: "FORBIDDEN", message: "Card top-ups are only available for email and social accounts." });
      return buyTokenPack(ctx, { userId: ctx.session.user.id, email: ctx.session.user.email, ...input });
    }),

  swapQuote: protectedProcedure.input(z.object({ tokens: z.number().positive() })).query(({ ctx, input }) => quoteSwap(ctx.session.user.id, input.tokens)),

  swapPrepare: protectedProcedure
    .input(z.object({ tokens: z.number().positive() }))
    .mutation(({ ctx, input }) => prepareSwap(ctx, { userId: ctx.session.user.id, tokens: input.tokens, signer: signerFor(ctx.session) })),

  /** Sending XLM or any token to another address: a quote first, then the transaction to sign. */
  sendQuote: protectedProcedure.input(sendInput).query(({ ctx, input }) => quoteSend(ctx.session.user.id, input)),

  sendPrepare: protectedProcedure
    .input(sendInput)
    .mutation(({ ctx, input }) => prepareSend(ctx, { userId: ctx.session.user.id, signer: signerFor(ctx.session), ...input })),

  gifts: protectedProcedure.query(({ ctx }) => pendingGifts(ctx.session.user.id)),

  claimGift: protectedProcedure
    .input(z.object({ balanceId: z.string().min(1) }))
    .mutation(({ ctx, input }) => prepareGiftClaim(ctx, { userId: ctx.session.user.id, balanceId: input.balanceId, signer: signerFor(ctx.session) })),
});
