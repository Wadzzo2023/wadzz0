import { where } from "firebase/firestore";
import { z } from "zod";
import { PlaceMarketFormSchema } from "~/components/marketplace/modal/place_market_modal";
import { copyToBalance } from "~/lib/stellar/marketplace/test/acc";
import { sendNft2StorageXDR } from "~/lib/stellar/marketplace/trx/nft_2_storage";
import { SignUser } from "~/lib/stellar/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const marketRouter = createTRPCRouter({
  placeNft2MarketXdr: protectedProcedure
    .input(PlaceMarketFormSchema.extend({ signWith: SignUser }))
    .mutation(async ({ input, ctx }) => {
      // validate and transfor input
      const { code, issuer, placingCopies, price, signWith } = input;

      const creatorId = ctx.session.user.id;
      const storage = await ctx.db.creator.findUnique({
        where: { id: creatorId },
        select: { storagePub: true },
      });
      if (!storage || !storage.storagePub) {
        throw new Error("storage does not exist");
      }

      const assetAmount = copyToBalance(placingCopies);

      // stellear sdk for xdr
      return await sendNft2StorageXDR({
        assetAmount,
        assetCode: code,
        signWith,
        issuerPub: issuer,
        storagePub: storage.storagePub,
        userPub: creatorId,
      });
    }),

  placeToMarketDB: protectedProcedure
    .input(PlaceMarketFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { code, issuer, placingCopies, price } = input;
      const creatorId = ctx.session.user.id;
      const asset = await ctx.db.asset.findUnique({
        where: { code_issuer: { code, issuer } },
        select: { id: true },
      });

      if (!asset) throw new Error("asset not found");

      await ctx.db.marketAsset.create({
        data: {
          limit: 99999999999,
          assetId: asset.id,
          creatorId: ctx.session.user.id,
        },
      });
    }),
});
