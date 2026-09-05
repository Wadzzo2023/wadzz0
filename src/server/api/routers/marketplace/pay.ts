import { Client, Environment } from "square";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { env } from "~/env";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getAssetBalance,
  sendSiteAsset2pub,
} from "~/lib/stellar/marketplace/trx/site_asset_recharge";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { Keypair } from "@stellar/stellar-sdk";
import { MOTHER_SECRET } from "~/lib/stellar/marketplace/SECRET";

function describeSquareError(e: unknown): string {
  if (
    e &&
    typeof e === "object" &&
    "errors" in e &&
    Array.isArray((e as { errors: unknown }).errors)
  ) {
    const errors = (e as { errors: { code?: string; detail?: string }[] }).errors;
    return errors
      .map((err) => err.detail ?? err.code ?? "unknown error")
      .join("; ");
  }
  return e instanceof Error ? e.message : "unknown error";
}

const { paymentsApi } = new Client({
  accessToken: env.SQUARE_ACCESS_TOKEN,
  environment:
    env.SQUARE_ENVIRONMENT?.toLowerCase() === "production"
      ? Environment.Production
      : Environment.Sandbox,
});

export const payRouter = createTRPCRouter({
  getRechargeXDR: protectedProcedure
    .input(z.object({ tokenNum: z.number(), xlm: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      if (user.email) {
        return await sendSiteAsset2pub(user.id, input.tokenNum, user.email);
      } else {
        return await sendSiteAsset2pub(user.id, input.tokenNum);
      }
    }),

  payment: protectedProcedure
    .input(
      z.object({
        sourceId: z.string().optional(),
        amount: z.number(),
        tokenNum: z.number().optional(),
        verificationToken: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.sourceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment source ID is required",
        });
      }

      const { amount, sourceId, tokenNum, verificationToken } = input;
      const user = ctx.session.user;

      const idempotencyKey = randomUUID();
      let paymentResult;
      try {
        const response = await paymentsApi.createPayment({
          idempotencyKey,
          sourceId,
          verificationToken,
          amountMoney: {
            currency: "USD",
            amount: BigInt(Math.round(amount)),
          },
        });
        paymentResult = response.result;
      } catch (err: unknown) {
        console.error("Square createPayment error:", err);
        const detail = describeSquareError(err);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Card payment failed: ${detail}`,
        });
      }

      if (
        Boolean(paymentResult?.errors) ||
        paymentResult?.payment?.status !== "COMPLETED"
      ) {
        const detail =
          paymentResult?.errors
            ?.map((e) => e.detail ?? e.code)
            .join("; ") ?? "Payment was not completed";
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Card payment failed: ${detail}`,
        });
      }

      // If tokenNum is provided and user has an ID, execute the transfer server-side
      if (tokenNum && user?.id) {
        try {
          const freshXdr = await sendSiteAsset2pub(
            user.id,
            tokenNum,
            user.email ?? undefined,
          );
          const submitResult = await submitSignedXDRToServer4User(freshXdr);
          return {
            success: true,
            alreadySubmitted: true,
            hash: submitResult.hash,
          };
        } catch (trxErr: unknown) {
          console.error("Failed to transfer tokens after payment:", trxErr);
          const msg = trxErr instanceof Error ? trxErr.message : "transaction failed";
          const paymentId = paymentResult.payment?.id ?? "unknown";
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Payment successful (${paymentId}), but token transfer failed: ${msg}. Please contact support with this payment ID.`,
          });
        }
      }

      return {
        success: true,
        alreadySubmitted: false,
      };
    }),

  buyAsset: protectedProcedure
    .input(
      z.object({
        sourceId: z.string(),
        assetId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const asset = await ctx.db.marketAsset.findUniqueOrThrow({
        where: { id: input.assetId },
      });

      const priceUSD = asset.priceUSD;

      try {
        const response = await paymentsApi.createPayment({
          idempotencyKey: randomUUID(),
          sourceId: input.sourceId,
          amountMoney: {
            currency: "USD",
            amount: BigInt(Math.round(priceUSD * 100)),
          },
        });

        const data = response.result;
        if (data.payment?.status === "COMPLETED") {
          return true;
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment was not successful",
          });
        }
      } catch (e: unknown) {
        const detail = describeSquareError(e);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Payment failed: ${detail}`,
        });
      }
    }),

  getOffers: protectedProcedure.query(async ({ ctx: _ctx }) => {
    const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
    let motherBalance = 0;
    try {
      motherBalance = await getAssetBalance(
        motherAcc.publicKey(),
        PLATFORM_ASSET.code,
        PLATFORM_ASSET.issuer,
      );
    } catch (e) {
      console.error("Failed to fetch mother balance for offers:", e);
    }

    const offers = [1.99, 4.99, 9.99, 19.99, 24.99, 49.99, 99.99]
      .map((price) => {
        const num = Number((price * 100 + 1).toFixed(1));
        return {
          price,
          num,
        };
      })
      .filter((offer) => motherBalance <= 0 || offer.num <= motherBalance);
    return offers;
  }),
});
