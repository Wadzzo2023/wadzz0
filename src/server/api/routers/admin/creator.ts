import { z } from "zod";
import { MAX_ASSET_LIMIT } from "~/components/fan/creator/page_asset/new";
import { creatorAprovalTrx } from "~/lib/stellar/fan/creator-aproval";
import { AccountSchema } from "~/lib/stellar/fan/utils";
import {
  adminProcedure,
  createTRPCRouter,
  creatorProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { urlToIpfsHash } from "~/utils/ipfs";

export const creatorRouter = createTRPCRouter({
  getCreators: adminProcedure.query(async ({ ctx }) => {
    const creators = await ctx.db.creator.findMany({
      where: { aprovalSend: true },
    });
    return creators;
  }),

  deleteCreator: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.creator.delete({ where: { id: input } });
    }),

  creatorAction: adminProcedure
    .input(
      z.object({
        status: z.boolean().nullable(),
        creatorId: z.string(),
        storage: AccountSchema,
        escrow: AccountSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { status, creatorId } = input;

      await ctx.db.creator.update({
        where: { id: creatorId },
        data: {
          approved: status,
          storagePub: input.storage.publicKey,
          storageSecret: input.storage.secretKey,
          pageAsset: {
            update: {
              issuer: input.escrow.publicKey,
              issuerPrivate: input.escrow.secretKey,
            },
          },
        },
      });
    }),

  creatorRequestXdr: adminProcedure
    .input(z.object({ creatorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // create storage acc and create page asset trx.
      const creator = await ctx.db.creator.findUniqueOrThrow({
        where: { id: input.creatorId },
        include: {
          pageAsset: true,
        },
      });

      const pageAsset = creator.pageAsset;
      if (pageAsset) {
        const thumbnail = pageAsset.thumbnail;
        const ipfs = urlToIpfsHash(thumbnail) ?? "ipfs";
        return await creatorAprovalTrx({
          pageAsset: {
            code: pageAsset.code,
            ipfs: ipfs,
            limit: MAX_ASSET_LIMIT.toString(),
          },
        });
      }
    }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
  creatorIDfromVanityURL: creatorProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const creator = await ctx.db.creator.findUnique({
        where: { vanityURL: input },
        include: {
          vanitySubscription: true,
        },
      });
      return creator;
    }),
});
