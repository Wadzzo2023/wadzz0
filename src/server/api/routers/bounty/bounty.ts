import { BountyStatus, NotificationType, Prisma } from "@prisma/client"; // Assuming you are using Prisma
import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";
import { z } from "zod";
import { BountyCommentSchema } from "~/components/fan/creator/bounty/Add-Bounty-Comment";
import {
  sortOptionEnum,
  statusFilterEnum,
} from "~/components/fan/creator/bounty/BountyList";
import { MediaInfo } from "~/components/fan/creator/bounty/CreateBounty";
import {
  SendBountyBalanceToMotherAccount,
  SendBountyBalanceToUserAccount,
  SendBountyBalanceToWinner,
} from "~/lib/stellar/bounty/bounty";
import { getPlatfromAssetPrice } from "~/lib/stellar/fan/get_token_price";
import { SignUser } from "~/lib/stellar/utils";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const getAllBountyByUserIdInput = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().uuid().nullish(),
  search: z.string().optional(),
  sortBy: z
    .enum(["DATE_ASC", "DATE_DESC", "PRICE_ASC", "PRICE_DESC"])
    .optional(),
  status: z.enum(["ALL", "ACTIVE", "FINISHED"]).optional(),
});

// Define the orderBy type for the specific query

export const BountyRoute = createTRPCRouter({
  sendBountyBalanceToMotherAcc: protectedProcedure
    .input(
      z.object({
        signWith: SignUser,
        prize: z.number().min(0.00001, { message: "Prize can't less than 0" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userPubKey = ctx.session.user.id;

      let secretKey;
      if (ctx.session.user.email && ctx.session.user.email.length > 0) {
        secretKey = await getAccSecretFromRubyApi(ctx.session.user.email);
      }
      return await SendBountyBalanceToMotherAccount({
        userPubKey: userPubKey,
        prize: input.prize,
        signWith: input.signWith,
        secretKey: secretKey,
      });
    }),

  createBounty: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, { message: "Title can't be empty" }),
        prizeInUSD: z
          .number()
          .min(0.00001, { message: "Prize can't less than 0" }),
        prize: z.number().min(0.00001, { message: "Prize can't less than 0" }),
        requiredBalance: z
          .number()
          .min(0, { message: "Required Balance can't be less than 0" }),
        content: z.string().min(2, { message: "Description can't be empty" }),

        medias: z.array(MediaInfo).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const bounty = await ctx.db.bounty.create({
        data: {
          title: input.title,
          description: input.content,
          priceInUSD: input.prizeInUSD,
          priceInBand: input.prize,
          creatorId: ctx.session.user.id,
          requiredBalance: input.requiredBalance,
          imageUrls: input.medias ? input.medias.map((media) => media.url) : [],
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
            entityType: NotificationType.BOUNTY,
            entityId: bounty.id,
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



    }),

  getAllBounties: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().nullish(),
        skip: z.number().optional(),
        search: z.string().optional(),
        sortBy: z
          .enum(["DATE_ASC", "DATE_DESC", "PRICE_ASC", "PRICE_DESC"])
          .optional(),
        status: z.enum(["ALL", "ACTIVE", "FINISHED"]).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, skip, search, sortBy, status } = input;

      const orderBy: Prisma.BountyOrderByWithRelationInput = {};
      if (sortBy === sortOptionEnum.DATE_ASC) {
        orderBy.createdAt = "asc";
      } else if (sortBy === sortOptionEnum.DATE_DESC) {
        orderBy.createdAt = "desc";
      } else if (sortBy === sortOptionEnum.PRICE_ASC) {
        orderBy.priceInUSD = "asc";
      } else if (sortBy === sortOptionEnum.PRICE_DESC) {
        orderBy.priceInUSD = "desc";
      }

      const where: Prisma.BountyWhereInput = {
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(status === statusFilterEnum.ACTIVE && {
          winnerId: null, // Bounties with no winner
        }),
        ...(status === statusFilterEnum.FINISHED && {
          winnerId: { not: null }, // Bounties with a winner
        }),
      };

      const bounties = await ctx.db.bounty.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        where: where,
        orderBy: orderBy,
        include: {
          _count: {
            select: {
              participants: true,
            },
          },
          creator: {
            select: {
              name: true,
            },
          },
          winner: {
            select: {
              name: true,
            },
          },
        },
      });
      let nextCursor: typeof cursor | undefined = undefined;
      if (bounties.length > limit) {
        const nextItem = bounties.pop();
        nextCursor = nextItem?.id;
      }
      return {
        bounties: bounties,
        nextCursor: nextCursor,
      };
    }),

  isAlreadyJoined: protectedProcedure
    .input(
      z.object({
        BountyId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const bounty = await ctx.db.bounty.findUnique({
        where: {
          id: input.BountyId,
        },
        include: {
          participants: {
            where: {
              userId: ctx.session.user.id,
            },
          },
        },
      });
      return {
        isJoined: !!bounty?.participants.length,
      };
    }),

  joinBounty: protectedProcedure
    .input(
      z.object({
        BountyId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const bounty = await ctx.db.bounty.findUnique({
        where: {
          id: input.BountyId,
        },
        include: {
          participants: {
            where: {
              userId: ctx.session.user.id,
            },
          },
        },
      });
      if (bounty?.participants.length) {
        throw new Error("You already joined this bounty");
      }
      if (bounty?.creatorId === ctx.session.user.id) {
        throw new Error("You can't join your own bounty");
      }
      await ctx.db.bountyParticipant.create({
        data: {
          bountyId: input.BountyId,
          userId: ctx.session.user.id,
        },
      });
      // Notify the bounty creator about the new participant
      if (bounty?.creatorId) {
        await ctx.db.notificationObject.create({
          data: {
            actorId: ctx.session.user.id,
            entityType: NotificationType.BOUNTY_PARTICIPANT,
            entityId: input.BountyId,
            isUser: true,
            Notification: {
              create: [
                {
                  notifierId: bounty.creatorId,
                  isCreator: true,
                },
              ],
            },
          },
        });
      }
    }),

  getAllBountyByUserId: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().nullish(),
        skip: z.number().optional(),
        search: z.string().optional(),
        sortBy: z.nativeEnum(sortOptionEnum).optional(),
        status: z.nativeEnum(statusFilterEnum).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, skip, search, sortBy, status } = input;

      const orderBy: Prisma.BountyOrderByWithRelationInput = {};
      if (sortBy === sortOptionEnum.DATE_ASC) {
        orderBy.createdAt = "asc";
      } else if (sortBy === sortOptionEnum.DATE_DESC) {
        orderBy.createdAt = "desc";
      } else if (sortBy === sortOptionEnum.PRICE_ASC) {
        orderBy.priceInUSD = "asc";
      } else if (sortBy === sortOptionEnum.PRICE_DESC) {
        orderBy.priceInUSD = "desc";
      }

      const where: Prisma.BountyWhereInput = {
        creatorId: ctx.session.user.id,
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(status === statusFilterEnum.ACTIVE && {
          winnerId: null, // Bounties with no winner
        }),
        ...(status === statusFilterEnum.FINISHED && {
          winnerId: { not: null }, // Bounties with a winner
        }),
      };

      const bounties = await ctx.db.bounty.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        where: where,
        include: {
          _count: {
            select: {
              participants: true,
            },
          },
          winner: {
            select: {
              name: true,
            },
          },
          creator: {
            select: {
              name: true,
            },
          },
        },
        orderBy: orderBy,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (bounties.length > limit) {
        const nextItem = bounties.pop();
        nextCursor = nextItem?.id;
      }

      return {
        bounties: bounties,
        nextCursor: nextCursor,
      };
    }),

  getBountyByID: publicProcedure
    .input(
      z.object({
        BountyId: z.number(),
      })).query(async ({ input, ctx }) => {
        const bounty = await ctx.db.bounty.findUnique({
          where: {
            id: input.BountyId,
          },
          include: {
            participants: {
              select: {
                user: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                profileUrl: true,

              },
            },
            winner: {
              select: {
                name: true,
              }
            },
            submissions: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                },
                attachmentUrl: true,
              }
            },
            comments: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                },
                content: true
              }
            },
            _count: {
              select: {
                participants: true,
                submissions: true,
                comments: true
              }

            }

          },
        });
        return bounty;
      }),
  createBountyAttachment: protectedProcedure
    .input(
      z.object({
        BountyId: z.number(),
        content: z.string().min(2, { message: "Description can't be empty" }),
        medias: z.array(MediaInfo).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      console.log("input", input.content);
      const bounty = await ctx.db.bounty.findUnique({
        where: {
          id: input.BountyId,
        },
      });
      if (!bounty) {
        throw new Error("Bounty not found");
      }
      await ctx.db.bountySubmission.create({
        data: {
          userId: ctx.session.user.id,
          content: input.content,
          bountyId: input.BountyId,
          attachmentUrl: input.medias
            ? input.medias.map((media) => media.url)
            : [],
        },
      });

      await ctx.db.notificationObject.create({
        data: {
          actorId: ctx.session.user.id,
          entityType: NotificationType.BOUNTY_SUBMISSION,
          entityId: input.BountyId,
          isUser: true,
          Notification: {
            create: [
              {
                notifierId: bounty.creatorId,
                isCreator: true,
              },
            ],
          },
        },
      });


    }),

  getBountyAttachmentByUserId: protectedProcedure
    .input(
      z.object({
        BountyId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const bounty = await ctx.db.bountySubmission.findMany({
        where: {
          bountyId: input.BountyId,
          userId: ctx.session.user.id,
        },
      });

      if (!bounty) {
        throw new Error("Bounty not found");
      }
      return bounty;
    }),
  isOwnerOfBounty: protectedProcedure
    .input(
      z.object({
        BountyId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const bounty = await ctx.db.bounty.findUnique({
        where: {
          id: input.BountyId,
        },
      });
      if (!bounty) {
        throw new Error("Bounty not found");
      }
      return {
        isOwner: bounty.creatorId === ctx.session.user.id,
      };
    }),

  deleteBounty: protectedProcedure
    .input(
      z.object({
        BountyId: z
          .number()
          .min(1, { message: "Bounty ID can't be less than 0" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const bounty = await ctx.db.bounty.findUnique({
        where: {
          id: input.BountyId,
        },
      });
      if (!bounty) {
        throw new Error("Bounty not found");
      }
      if (bounty.creatorId !== ctx.session.user.id) {
        throw new Error("You are not the owner of this bounty");
      }
      await ctx.db.bounty.delete({
        where: {
          id: input.BountyId,
        },
      });
    }),
  getCurrentUSDFromAsset: protectedProcedure.query(async ({ ctx }) => {
    return await getPlatfromAssetPrice();
  }),
  getSendBalanceToWinnerXdr: protectedProcedure
    .input(
      z.object({
        prize: z
          .number()
          .min(0.00001, { message: "Prize can't less than 00001" }),
        userId: z
          .string()
          .min(1, { message: "Bounty ID can't be less than 0" }),
        BountyId: z
          .number()
          .min(1, { message: "Bounty ID can't be less than 0" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userPubKey = input.userId;
      const hasBountyWinner = await ctx.db.bounty.findUnique({
        where: {
          id: input.BountyId,
          winnerId: {
            not: null,
          },
        },
        select: {
          id: true,
          title: true,
          winnerId: true,
        },
      });

      if (hasBountyWinner) {
        throw new Error(
          "Bounty has a winner, you can't send balance to winner",
        );
      }

      return await SendBountyBalanceToWinner({
        recipientID: userPubKey,
        prize: input.prize,
      });
    }),
  makeBountyWinner: protectedProcedure
    .input(
      z.object({
        BountyId: z
          .number()
          .min(1, { message: "Bounty ID can't be less than 0" }),
        userId: z.string().min(1, { message: "User ID can't be less than 0" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const bounty = await ctx.db.bounty.findUnique({
        where: {
          id: input.BountyId,
        },
      });
      if (!bounty) {
        throw new Error("Bounty not found");
      }
      if (bounty.creatorId !== ctx.session.user.id) {
        throw new Error("You are not the owner of this bounty");
      }
      await ctx.db.bounty.update({
        where: {
          id: input.BountyId,
        },
        data: {
          winnerId: input.userId,
        },
      });

      await ctx.db.notificationObject.create({
        data: {
          actorId: ctx.session.user.id,
          entityType: NotificationType.BOUNTY_WINNER,
          entityId: input.BountyId,
          isUser: true,
          Notification: {
            create: [
              {
                notifierId: input.userId,
                isCreator: false,
              },
            ],
          },
        },
      });

    }),
  getDeleteXdr: protectedProcedure
    .input(
      z.object({
        prize: z.number().min(0.00001, { message: "Prize can't less than 0" }),
        creatorId: z
          .string()
          .min(1, { message: "User ID can't be less than 0" })
          .optional(),
        bountyId: z
          .number()
          .min(1, { message: "Bounty ID can't be less than 0" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userPubKey = ctx.session.user.id;
      const hasBountyWinner = await ctx.db.bounty.findUnique({
        where: {
          id: input.bountyId,
          winnerId: {
            not: null,
          },
        },
        select: {
          id: true,
          title: true,
          winnerId: true,
        },
      });
      if (hasBountyWinner) {
        throw new Error("Bounty has a winner, you can't delete this bounty");
      }
      console.log("hasBountyWinner", hasBountyWinner);
      return await SendBountyBalanceToUserAccount({
        userPubKey: input.creatorId ? input.creatorId : userPubKey,
        prize: input.prize,
      });
    }),

  updateBounty: protectedProcedure
    .input(
      z.object({
        BountyId: z.number(),
        title: z.string().min(1, { message: "Title can't be empty" }),
        status: z.nativeEnum(BountyStatus).optional(),
        requiredBalance: z
          .number()
          .min(0, { message: "Required Balance can't be less than 0" }),
        content: z.string().min(2, { message: "Description can't be empty" }),
        medias: z.array(MediaInfo).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const bounty = await ctx.db.bounty.findUnique({
        where: {
          id: input.BountyId,
        },
      });
      if (!bounty) {
        throw new Error("Bounty not found");
      }
      if (bounty.creatorId !== ctx.session.user.id) {
        throw new Error("You are not the owner of this bounty");
      }
      await ctx.db.bounty.update({
        where: {
          id: input.BountyId,
        },
        data: {
          title: input.title,
          description: input.content,
          requiredBalance: input.requiredBalance,
          status: input.status,
          imageUrls: input.medias ? input.medias.map((media) => media.url) : [],
        },
      });
    }),
  deleteBountySubmission: protectedProcedure
    .input(
      z.object({
        submissionId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return await ctx.db.bountySubmission.delete({
        where: { id: input.submissionId, userId },
      });
    }),

  createBountyComment: protectedProcedure
    .input(BountyCommentSchema)
    .mutation(async ({ ctx, input }) => {
      let comment;

      if (input.parentId) {
        comment = await ctx.db.bountyComment.create({
          data: {
            content: input.content,
            bountyId: input.bountyId,
            userId: ctx.session.user.id,
            bountyParentCommentID: input.parentId,
          },
        });
      } else {
        comment = await ctx.db.bountyComment.create({
          data: {
            content: input.content,
            bountyId: input.bountyId,
            userId: ctx.session.user.id,
          },
        });
      }


      const bountys = await ctx.db.bounty.findUnique({
        where: { id: input.bountyId },
        select: { creatorId: true },
      });


      const previousCommenters = await ctx.db.bountyComment.findMany({
        where: {
          bountyId: input.bountyId,
          userId: { not: ctx.session.user.id },
        },
        distinct: ['userId'],
        select: { userId: true },
      });


      const previousCommenterIds = previousCommenters.map(comment => comment.userId);


      const usersToNotify = new Set([
        bountys?.creatorId,
        ...previousCommenterIds,
      ]);


      usersToNotify.delete(ctx.session.user.id);

      if (usersToNotify.size > 0) {
        await ctx.db.notificationObject.create({
          data: {
            actorId: ctx.session.user.id,
            entityType: input.parentId ? NotificationType.BOUNTY_REPLY : NotificationType.BOUNTY_COMMENT,
            entityId: input.bountyId,
            isUser: false,
            Notification: {
              create: Array.from(usersToNotify)
                .filter((notifierId): notifierId is string => notifierId !== undefined)
                .map((notifierId) => ({
                  notifierId,
                  isCreator: notifierId === bountys?.creatorId,
                })),
            },
          },
        });
      }
      return comment;
    }),

  getBountyComments: publicProcedure
    .input(z.object({ bountyId: z.number(), limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      if (input.limit) {
        return await ctx.db.bountyComment.findMany({
          where: {
            bountyId: input.bountyId,
            bountyParentBComment: null, // Fetch only top-level comments (not replies)
          },

          include: {
            user: { select: { name: true, image: true } }, // Include user details
            bountyChildComments: {
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
        return await ctx.db.bountyComment.findMany({
          where: {
            bountyId: input.bountyId,
            bountyParentBComment: null, // Fetch only top-level comments (not replies)
          },

          include: {
            user: { select: { name: true, image: true } }, // Include user details
            bountyChildComments: {
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
  deleteBountyComment: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: bountyCommentId, ctx }) => {
      const userId = ctx.session.user.id;
      return await ctx.db.bountyComment.delete({
        where: { id: bountyCommentId, userId },
      });
    }),

  getCommentCount: protectedProcedure
    .input(
      z.object({
        bountyId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await ctx.db.bountyComment.count({
        where: {
          bountyId: input.bountyId,
        },
      });
    }),
  getBountyAllSubmission: protectedProcedure
    .input(
      z.object({
        BountyId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const bounty = await ctx.db.bountySubmission.findMany({
        where: {
          bountyId: input.BountyId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
      return bounty;
    }),
});
