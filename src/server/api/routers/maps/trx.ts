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
        locationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const location = await ctx.db.location.findUniqueOrThrow({
        where: { id: input.locationId },
        include: {
          locationGroup: {
            include: { creator: { include: { pageAsset: true } }, asset: true },
          },
        },
      });

      if (!location.locationGroup?.asset && !location.locationGroup?.pageAsset)
        throw new Error("Not claimable");

      let code: string | undefined = undefined;
      let issuer: string | undefined = undefined;

      if (location.locationGroup.pageAsset) {
        if (!location.locationGroup.creator.pageAsset)
          throw new Error("No page Asset, found!");

        code = location.locationGroup.creator.pageAsset.code;
        issuer = location.locationGroup.creator.pageAsset.issuer;
      } else if (location.locationGroup.asset) {
        code = location.locationGroup.asset.code;
        issuer = location.locationGroup.asset.issuer;
      }

      const storageSecret = location.locationGroup.creator.storageSecret;

      if (code && issuer) {
        try {
          const xdr: string = await ClaimXDR({
            amount: "1",
            asset: { code, issuer },
            receiver: userId,
            signWith: input.signWith,
            storageSecret: storageSecret,
          });

          return xdr;
        } catch (error) {
          console.error(error);
        }
      } else throw new Error("Code and Issue not found");
    }),
});
