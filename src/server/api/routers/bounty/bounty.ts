
import { MediaType } from "@prisma/client";
import { z } from "zod";
import { BountyCommentSchema } from "~/components/fan/creator/bounty/Add-Bounty-Comment";
import { MediaInfo } from "~/components/fan/creator/bounty/CreateBounty";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";

export const BountyRoute = createTRPCRouter({
    createBounty: protectedProcedure.input(z.object({
        title: z.string().min(1, { message: "Title can't be empty" }),
        priceInUSD: z.number().min(1, { message: "Price can't less than 0" }),
        priceInBAND: z.number().min(1, { message: "Price can't less than 0" }),
        requiredBalance: z
            .number()
            .min(1, { message: "Required Balance can't be less that 0" }),
        content: z.string().min(2, { message: "Description can't be empty" }),
        medias: z.array(MediaInfo).optional()
    })).mutation(async ({ input, ctx }) => {


        const bounty = await ctx.db.bounty.create({
            data: {
                title: input.title,
                description: input.content,
                priceInUSD: input.priceInUSD,
                priceInBand: input.priceInBAND,
                creatorId: ctx.session.user.id,
                requiredBalance: input.requiredBalance,
                imageUrls: input.medias ? input.medias.map((media) => media.url) : [],
            },
        });
        console.log("bounty", bounty);
    }),

    getAllBounties: publicProcedure.input(z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
    })).query(async ({ input, ctx }) => {
        const { limit, cursor, skip } = input;

        const bounties = await ctx.db.bounty.findMany({
            take: limit + 1,
            skip: skip,
            cursor: cursor ? { id: cursor } : undefined,

            orderBy: {
                createdAt: "asc",
            },
            include: {
                _count: {
                    select: {
                        participants: true,
                    },
                },
                creator: {
                    select: {
                        name: true,
                    }
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
        }
    }),

    isAlreadyJoined: protectedProcedure.input(z.object({
        BountyId: z.number(),
    })).query(async ({ input, ctx }) => {
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
    }
    ),

    joinBounty: protectedProcedure.input(z.object({
        BountyId: z.number(),
    })).mutation(async ({ input, ctx }) => {
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
        await ctx.db.bountyParticipant.create({
            data: {
                bountyId: input.BountyId,
                userId: ctx.session.user.id,
            },
        });
    }),
    getAllBountyByUserId: protectedProcedure.input(z.object({
        limit: z.number(),
        cursor: z.number().nullish(),
        skip: z.number().optional(),
    })).query(async ({ input, ctx }) => {
        const { limit, cursor, skip } = input;
        const bounties = await ctx.db.bounty.findMany({
            take: limit + 1,
            skip: skip,
            cursor: cursor ? { id: cursor } : undefined,
            where: {
                creatorId: ctx.session.user.id,
            }, include: {
                _count: {
                    select: {
                        participants: true,
                    },
                },
                creator: {
                    select: {
                        name: true,
                    }
                },
            },
            orderBy: {
                createdAt: "asc",
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

    getBountyByID: publicProcedure.input(z.object({
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
                }

            },
        });
        return bounty;
    }),
    createBountyAttachment: protectedProcedure.input(z.object({
        BountyId: z.number(),
        content: z.string().min(2, { message: "Description can't be empty" }),
        medias: z.array(MediaInfo).optional(),
    })).mutation(async ({ input, ctx }) => {
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
                attachmentUrl: input.medias ? input.medias.map((media) => media.url) : [],
            },
        });



    }),

    getBountyAttachmentByUserId: protectedProcedure.input(z.object({
        BountyId: z.number(),
    })).query(async ({ input, ctx }) => {
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
    isOwnerOfBounty: protectedProcedure.input(z.object({
        BountyId: z.number(),
    })).query(async ({ input, ctx }) => {
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

    deleteBounty: protectedProcedure.input(z.object({
        BountyId: z.number(),
    })).mutation(async ({ input, ctx }) => {
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

    updateBounty: protectedProcedure.input(z.object({
        BountyId: z.number(),
        title: z.string().min(1, { message: "Title can't be empty" }),
        priceInUSD: z.number().min(1, { message: "Price can't less than 0" }),
        priceInBAND: z.number().min(1, { message: "Price can't less than 0" }),
        content: z.string().min(2, { message: "Description can't be empty" }),
        medias: z.array(MediaInfo).optional(),
    })).mutation(async ({ input, ctx }) => {
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
                priceInUSD: input.priceInUSD,
                priceInBand: input.priceInBAND,
                imageUrls: input.medias ? input.medias.map((media) => media.url) : [],
            },
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
                        bountyParentCommentID: input.parentId
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
            }
            else {
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
            return await ctx.db.bountyComment.delete({ where: { id: bountyCommentId, userId } });
        }),

    getCommentCount: protectedProcedure.input(z.object({
        bountyId: z.number(),
    })).query(async ({ input, ctx }) => {
        return await ctx.db.bountyComment.count({
            where: {
                bountyId: input.bountyId,
            },
        });
    }),
    getBountyAllSubmission: protectedProcedure.input(z.object({
        BountyId: z.number(),
    })).query(async ({ input, ctx }) => {
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
                    }
                }
            }
        });
        return bounty;
    }),

});




