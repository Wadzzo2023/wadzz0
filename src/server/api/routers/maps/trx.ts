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
      // validate and parse

      // db verify
      const location = await ctx.db.location.findUniqueOrThrow({
        where: { id: input.locationId },
        include: { creator: true, asset: true },
      });

      if (!location.asset || !location.claimAmount)
        throw new Error("Not Claimable");

      const code = location.asset.code;
      const issuer = location.asset.issuer;
      const amount = location.claimAmount.toString();

      const storageSecret = location.creator.storageSecret;

      return await ClaimXDR({
        amount,
        asset: { code, issuer },
        receiver: userId,
        signWith: input.signWith,
        storageSecret: storageSecret,
      });
    }),
});
