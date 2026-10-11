import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { platformScope } from "~/server/platform-scope";

/** One search box across items, creators, posts and bounties. */
export const searchRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({ q: z.string().trim().min(2).max(80) })).query(async ({ ctx, input }) => {
    const like = { contains: input.q, mode: "insensitive" as const };
    const scope = platformScope(ctx);
    const [items, creators, posts, bounties] = await Promise.all([
      ctx.db.asset.findMany({
        where: { ...scope, OR: [{ name: like }, { code: like }], marketItems: { some: {} }, creator: { approved: true } },
        select: { id: true, name: true, code: true, thumbnail: true, mediaType: true, creator: { select: { name: true } } },
        take: 8,
      }),
      ctx.db.creator.findMany({ where: { ...scope, approved: true, OR: [{ name: like }, { bio: like }] }, select: { id: true, name: true, profileUrl: true, vanityURL: true }, take: 6 }),
      ctx.db.post.findMany({ where: { ...scope, heading: like, creator: { approved: true } }, select: { id: true, heading: true, creator: { select: { name: true } } }, take: 6 }),
      ctx.db.bounty.findMany({ where: { ...scope, status: "APPROVED", title: like }, select: { id: true, title: true, imageUrls: true }, take: 6 }),
    ]);
    return { items, creators, posts, bounties };
  }),
});
