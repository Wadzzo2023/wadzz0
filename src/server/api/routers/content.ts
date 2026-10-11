import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { ownsAsset } from "~/server/access";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { platformScope } from "~/server/platform-scope";

/** An item's locked file (video / audio / image / 3D): owners only. */
export const contentRouter = createTRPCRouter({
  /** Whether the viewer owns the item (false when signed out). */
  access: publicProcedure.input(z.object({ assetId: z.number().int() })).query(async ({ ctx, input }) => {
    const me = ctx.session?.user.id;
    if (!me) return { owner: false };
    const asset = await ctx.db.asset.findFirst({ where: { id: input.assetId, ...platformScope(ctx) }, select: { id: true, code: true, issuer: true, creatorId: true } });
    return { owner: Boolean(asset && (await ownsAsset(ctx.db, me, asset))) };
  }),

  unlock: protectedProcedure.input(z.object({ assetId: z.number().int() })).query(async ({ ctx, input }) => {
    const asset = await ctx.db.asset.findFirst({
      where: { id: input.assetId, ...platformScope(ctx) },
      select: { id: true, code: true, issuer: true, creatorId: true, mediaUrl: true, mediaType: true, thumbnail: true, name: true },
    });
    if (!asset) throw new TRPCError({ code: "NOT_FOUND" });
    if (!(await ownsAsset(ctx.db, ctx.session.user.id, asset))) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only owners of this item can open its content." });
    }
    return { mediaUrl: asset.mediaUrl, mediaType: asset.mediaType, thumbnail: asset.thumbnail, name: asset.name };
  }),
});
