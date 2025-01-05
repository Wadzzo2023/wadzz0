import { NotificationType } from "@prisma/client";
import { z } from "zod";
import { PostSchema } from "~/components/fan/creator/CreatPost";
import { CommentSchema } from "~/components/fan/post/add-comment";
import { StellarAccount } from "~/lib/stellar/marketplace/test/Account";

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

      // console.log("media", input.medias);

      const post = await ctx.db.post.create({
        data: {
          heading: input.heading,
          content: input.content,
          creatorId: ctx.session.user.id,
          subscriptionId: input.subscription
            ? Number(input.subscription)
            : null,
          medias: input.medias
            ? {
                createMany: {
                  data: input.medias,
                },
              }
            : undefined,
        },
      });

      const followers = await ctx.db.follow.findMany({
        where: { creatorId: ctx.session.user.id },
        select: { userId: true },
      });

      const followerIds = followers.map((follower) => follower.userId);

      const createNotification = async (notifierId: string) => {
        await ctx.db.notificationObject.create({
          data: {
            actorId: ctx.session.user.id,
            entityType: NotificationType.POST,
            entityId: post.id,
            isUser: true,
            Notification: {
              create: [
                {
                  notifierId,
                  isCreator: false,
                },
              ],
            },
          },
        });
      };

      for (const followerId of followerIds) {
        await createNotification(followerId);
      }

      return post;
    }),

  getPosts: protectedProcedure
    .input(
      z.object({
        pubkey: z.string().min(56, { message: "pubkey is more than 56" }),
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, skip, cursor } = input;
      const items = await ctx.db.post.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          creatorId: input.pubkey,
        },
        include: {
          _count: {
            select: {
              likes: {
                where: { status: true },
              },
              comments: true,
            },
          },
          medias: true,
          subscription: true,
          creator: {
            select: { name: true, id: true, profileUrl: true, pageAsset: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        posts: items,
        nextCursor,
      };
    }),

  getAllRecentPosts: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, skip, cursor } = input;

      const items = await ctx.db.post.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,

        orderBy: { createdAt: "desc" },
        include: {
          subscription: true,
          _count: {
            select: { likes: true, comments: true },
          },

          creator: {
            select: {
              name: true,
              id: true,
              pageAsset: { select: { code: true, issuer: true } },
              profileUrl: true,
              customPageAssetCodeIssuer: true,
            },
          },
          medias: true,
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        posts: items,
        nextCursor,
      };
    }),

  getAPost: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const post = await ctx.db.post.findUnique({
        where: { id: input },
        include: {
          _count: { select: { likes: true, comments: true } },
          creator: {
            select: {
              name: true,
              id: true,
              profileUrl: true,
              pageAsset: true,
              customPageAssetCodeIssuer: true,
            },
          },
          subscription: { select: { price: true } },
          medias: true,
        },
      });






      if (post) {
        if (post.subscription) {
          let pageAssetCode: string | undefined;
          let pageAssetIssuer: string | undefined;

          const pageAsset = post.creator.pageAsset;
          if (pageAsset) {
            pageAssetCode = pageAsset.code;
            pageAssetIssuer = pageAsset.issuer;
          } else {
            const customPageAssetCodeIssuer =
              post.creator.customPageAssetCodeIssuer;
            if (customPageAssetCodeIssuer) {
              const [code, issuer] = customPageAssetCodeIssuer.split("-");
              pageAssetCode = code;
              pageAssetIssuer = issuer;
            }
          }

          const acc = await StellarAccount.create(userId);

          if (
            acc.getTokenBalance(pageAssetCode ?? "", pageAssetIssuer ?? "") >=
            post.subscription.price
          ) {
            return post;
          } else {
            return false;
          }
        }

        if (!post.subscription) return post;
      }
    }),

  deletePost: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const post = await ctx.db.post.findUnique({
        where: { id: input },
        select: { creatorId: true },
      });
      if (post?.creatorId === userId) {
        await ctx.db.post.delete({ where: { id: input } });
      }
    }),

  getSecretMessage: protectedProcedure.query(async ({ ctx }) => {
    return "secret message";
  }),

  likeApost: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: postId, ctx }) => {
      const userId = ctx.session.user.id;

      const oldLike = await ctx.db.like.findUnique({
        where: { postId_userId: { postId, userId } },
        include: {
          post: {
            select: {
              creatorId: true,
            },
          },
        },
      });

      if (oldLike) {
        await ctx.db.like.update({
          data: { status: true },
          where: {
            postId_userId: { postId: postId, userId },
          },
        });
        return oldLike;
      } else {
        // first time.
        const like = await ctx.db.like.create({
          data: { userId, postId },
          include: {
            post: {
              select: {
                creatorId: true,
              },
            },
          },
        });
        if (like.post.creatorId === userId) return like;
        await ctx.db.notificationObject.create({
          data: {
            actorId: ctx.session.user.id,
            entityType: NotificationType.LIKE,
            entityId: postId,
            isUser: false,
            Notification: {
              create: [
                {
                  notifierId: like.post.creatorId,
                  isCreator: true,
                },
              ],
            },
          },
        });
        // create notification
        // void ctx.db.post
        //   .findUnique({ where: { id: postId }, select: { creatorId: true } })
        //   .then(async (creator) => {
        //     if (creator) {
        //       await ctx.db.notificationObject.create({
        //         data: {
        //           actorId: userId,
        //           entityId: postId,
        //           entityType: NotificationType.LIKE,
        //           Notification: {
        //             create: [{ notifierId: creator.creatorId }],
        //           },
        //         },
        //       });
        //     }
        //   })
        //   .catch(console.error);

        return like;
      }
    }),

  unLike: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: postId, ctx }) => {
      await ctx.db.like.update({
        data: { status: false },
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
        where: { userId: ctx.session.user.id, postId, status: true },
      });
    }),

  getComments: publicProcedure
    .input(z.object({ postId: z.number(), limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      if (input.limit) {
        return await ctx.db.comment.findMany({
          where: {
            postId: input.postId,
            parentCommentID: null, // Fetch only top-level comments (not replies)
          },

          include: {
            user: { select: { name: true, image: true } }, // Include user details
            childComments: {
              include: {
                user: { select: { name: true, image: true } }, // Include user details for child comments
              },
              orderBy: { createdAt: "asc" }, // Order child comments by createdAt in ascending order
            },
          },
          take: input.limit, // Limit the number of comments
          orderBy: { createdAt: "desc" }, // Order top-level comments by createdAt in descending order
        });
      } else {
        return await ctx.db.comment.findMany({
          where: {
            postId: input.postId,
            parentCommentID: null, // Fetch only top-level comments (not replies)
          },

          include: {
            user: { select: { name: true, image: true } }, // Include user details
            childComments: {
              include: {
                user: { select: { name: true, image: true } }, // Include user details for child comments
              },
              orderBy: { createdAt: "asc" }, // Order child comments by createdAt in ascending order
            },
          },

          orderBy: { createdAt: "desc" }, // Order top-level comments by createdAt in descending order
        });
      }
    }),

  createComment: protectedProcedure
    .input(CommentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      let comment;

      if (input.parentId) {
        comment = await ctx.db.comment.create({
          data: {
            content: input.content,
            postId: input.postId,
            userId,
            parentCommentID: input.parentId,
          },
        });
      } else {
        comment = await ctx.db.comment.create({
          data: {
            content: input.content,
            postId: input.postId,
            userId,
          },
        });
      }

      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        select: { creatorId: true },
      });

      const previousCommenters = await ctx.db.comment.findMany({
        where: {
          postId: input.postId,
          userId: { not: userId },
        },
        distinct: ["userId"],
        select: { userId: true },
      });

      const previousCommenterIds = previousCommenters.map(
        (comment) => comment.userId,
      );

      const usersToNotify = new Set([post?.creatorId, ...previousCommenterIds]);

      usersToNotify.delete(userId);

      if (usersToNotify.size > 0) {
        await ctx.db.notificationObject.create({
          data: {
            actorId: userId,
            entityType: input.parentId
              ? NotificationType.REPLY
              : NotificationType.COMMENT,
            entityId: input.postId,
            isUser: false,
            Notification: {
              create: Array.from(usersToNotify)
                .filter(
                  (notifierId): notifierId is string =>
                    notifierId !== undefined,
                )
                .map((notifierId) => ({
                  notifierId,
                  isCreator: notifierId === post?.creatorId, // Mark if the notifier is the post creator
                })),
            },
          },
        });
      }

      return comment;
    }),
  deleteComment: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: commentId, ctx }) => {
      const userId = ctx.session.user.id;
      return await ctx.db.comment.delete({ where: { id: commentId, userId } });
    }),

  search: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
        searchInput: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, skip, cursor, searchInput } = input;
      const items = await ctx.db.post.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          OR: [
            // {
            //   content: {
            //     contains: searchInput,
            //     // how can i make this case insensitive?
            //     mode: "insensitive",
            //   },
            // },
            {
              heading: {
                contains: searchInput,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        posts: items,
        nextCursor,
      };
    }),
});
