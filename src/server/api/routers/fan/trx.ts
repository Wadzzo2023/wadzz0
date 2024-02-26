import { getAccSecret } from "package/connect_wallet";
import { Asset } from "stellar-sdk";
import { z } from "zod";
import { buyAssetTrx } from "~/lib/stellar/wallete/buy_asset";
import { clawBackAccCreate } from "~/lib/stellar/wallete/clawback";
import { createAsset } from "~/lib/stellar/wallete/create_asset";
import {
  getAssetNumberForXLM,
  getBandcoinPrice,
  getPlatfromAssetPrice,
} from "~/lib/stellar/wallete/get_token_price";
import { signXdrTransaction } from "~/lib/stellar/wallete/signXDR";
import { getClawbackAsPayment } from "~/lib/stellar/wallete/subscribe";
import { AssetSchema } from "~/lib/stellar/wallete/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const SignUser = z
  .object({ uid: z.string(), email: z.string() })
  .optional();
type SignUserType = z.TypeOf<typeof SignUser>;

export const trxRouter = createTRPCRouter({
  clawbackAssetCreationTrx: protectedProcedure
    .input(z.object({ code: z.string(), signWith: SignUser }))
    .mutation(async ({ ctx, input }) => {
      const { code, signWith } = input;
      const assetAmout = await getAssetNumberForXLM();

      const data = await clawBackAccCreate({
        actionAmount: assetAmout.toString(),
        pubkey: ctx.session.user.id,
        assetCode: code,
      });
      const signedXDr = await WithSing({ xdr: data.trx, signWith });
      data.trx = signedXDr;
      return data;
    }),

  clawbackAssetPaymentTrx: protectedProcedure
    .input(
      AssetSchema.extend({
        creatorId: z.string(),
        price: z.number(),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const price = input.price.toString();
      const xdr = await getClawbackAsPayment({
        creatorId: input.creatorId,
        price: price,
        assetInfo: input,
        userPubkey: ctx.session.user.id,
      });

      return await WithSing({ xdr, signWith: input.signWith });
    }),

  createAssetTrx: protectedProcedure
    .input(
      z.object({ code: z.string(), limit: z.number(), signWith: SignUser }),
    )
    .mutation(async ({ ctx, input }) => {
      const assetAmout = await getAssetNumberForXLM();

      const data = await createAsset({
        actionAmount: assetAmout.toString(),
        pubkey: ctx.session.user.id,
        code: input.code,
        limit: input.limit,
      });

      const signedXDr = await WithSing({
        xdr: data.xdr,
        signWith: input.signWith,
      });
      data.xdr = signedXDr;
      return data;
    }),

  buyAssetTrx: protectedProcedure
    .input(
      AssetSchema.extend({
        signWith: SignUser,
        price: z.number(),
        creatorId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const price = input.price.toString();
      const customerPubkey = ctx.session.user.id; // is the custeomr
      const xdr = await buyAssetTrx({
        customerPubkey,
        assetType: input,
        creatorId: input.creatorId,
        price: price,
      });

      return await WithSing({ xdr, signWith: input.signWith });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getAssetPrice: publicProcedure.query(async () => {
    return await getPlatfromAssetPrice();
  }),

  getAssetNumberforXlm: publicProcedure
    .input(z.number().optional())
    .query(async ({ input }) => {
      return await getAssetNumberForXLM(input);
    }),

  signXDRForFbGoogleEmail: protectedProcedure
    .input(z.object({ xdr: z.string(), uid: z.string(), email: z.string() }))
    .query(async ({ ctx, input }) => {
      const { xdr, uid, email } = input;
      const secret = await getAccSecret(uid, email);
      return signXdrTransaction(xdr, secret);
    }),
});

async function WithSing({
  xdr,
  signWith,
}: {
  xdr: string;
  signWith: SignUserType;
}) {
  if (signWith) {
    const secret = await getAccSecret(signWith.uid, signWith.email);
    return signXdrTransaction(xdr, secret);
  } else return xdr;
}
