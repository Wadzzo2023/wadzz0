import { z } from "zod";
import { PostSchema } from "~/components/creator/CreatPost";
import { CommentSchema } from "~/pages/posts/[id]";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(PostSchema)
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return ctx.db.post.create({
        data: {
          heading: input.heading,
          content: input.content,
          creatorId: input.id,
          subscriptionId: input.subscription
            ? Number(input.subscription)
            : null,
        },
      });
    }),

  getPosts: protectedProcedure
    .input(
      z.object({
        pubkey: z.string().min(56, { message: "pubkey is more than 56" }),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await ctx.db.post.findMany({
        where: {
          creatorId: input.pubkey,
        },
      });
    }),

  getAllRecentPosts: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.post.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    });
  }),

  getAPost: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      return await ctx.db.post.findUnique({
        where: { id: input },
      });
    }),

  getSecretMessage: protectedProcedure.query(async ({ ctx }) => {
    return "secret message";
  }),

  likeApost: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: postId, ctx }) => {
      const userId = ctx.session.user.id;
      return await ctx.db.like.create({
        data: { userId, postId },
      });
    }),

  deleteALike: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: postId, ctx }) => {
      await ctx.db.like.delete({
        where: {
          postId_userId: { postId: postId, userId: ctx.session.user.id },
        },
      });
    }),

  getLikes: publicProcedure
    .input(z.number())
    .query(async ({ input: postId, ctx }) => {
      return await ctx.db.like.count({
        where: { postId },
      });
    }),

  isLiked: protectedProcedure
    .input(z.number())
    .query(async ({ input: postId, ctx }) => {
      return await ctx.db.like.findFirst({
        where: { userId: ctx.session.user.id, postId },
      });
    }),

  getComments: publicProcedure
    .input(z.number())
    .query(async ({ input: postId, ctx }) => {
      return await ctx.db.comment.findMany({
        where: { postId },
      });
    }),

  createComment: protectedProcedure
    .input(CommentSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.comment.create({
        data: {
          content: input.content,
          postId: input.postId,
          userId: ctx.session.user.id,
        },
      });
    }),
});
