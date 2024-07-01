import { z } from "zod";
import { ClaimXDR } from "~/lib/stellar/map/claim";
import { SignUser } from "~/lib/stellar/utils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const trxRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
  getClaimXDR: protectedProcedure
    .input(
      z.object({
        signWith: SignUser,
        locationId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const location = await ctx.db.location.findUniqueOrThrow({
        where: { id: input.locationId },
        include: { creator: { include: { pageAsset: true } }, asset: true },
      });
      
      if (!location.claimAmount) throw new Error("No claimant ammount");

      if (!location.asset && !location.pageAsset)
        throw new Error("Not claimable");

      let code: string | undefined = undefined;
      let issuer: string | undefined = undefined;

      if (location.pageAsset) {
        if (!location.creator.pageAsset)
          throw new Error("No page Asset, found!");

        code = location.creator.pageAsset.code;
        issuer = location.creator.pageAsset.issuer;
      } else if (location.asset) {
        code = location.asset.code;
        issuer = location.asset.issuer;
      }

      const amount = location.claimAmount.toFixed(7);

      const storageSecret = location.creator.storageSecret;

      if (code && issuer)
      {
        try {
          const xdr:string  = await ClaimXDR({
          amount,
          asset: { code, issuer },
          receiver: userId,
          signWith: input.signWith,
          storageSecret: storageSecret,
          });

          return xdr;
        }
        catch (error) {
          console.error(error);
        }
      }
      else throw new Error("Code and Issue not found");
    }),
});
