import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc"
import { TRPCError } from "@trpc/server"

export const qrRouter = createTRPCRouter({
    // Get all QR items for the current user/organization
    getQRItems: protectedProcedure.query(async ({ ctx }) => {
        const qrItems = await ctx.db.qRItem.findMany({
            where: {
                creatorId: ctx.session.user.id,
            },
            include: {
                descriptions: {
                    orderBy: {
                        order: "asc",
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return qrItems.map((item) => ({
            ...item,
            isActive: new Date() >= item.startDate && new Date() <= item.endDate,
        }))
    }),

    // Get a single QR item by ID (public access)
    getQRItemById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        const qrItem = await ctx.db.qRItem.findUnique({
            where: {
                id: input.id,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        })

        if (!qrItem) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "QR item not found",
            })
        }

        return {
            ...qrItem,
            isActive: new Date() >= qrItem.startDate && new Date() <= qrItem.endDate,
        }
    }),

    // Create a new QR item
    createQRItem: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1, "Title is required").max(100, "Title too long"),
                descriptions: z // Changed from 'description' to 'descriptions'
                    .array(
                        z.object({
                            title: z.string().min(1, "Description title is required").max(50, "Description title too long"),
                            content: z.string().min(1, "Description content cannot be empty"),
                            order: z.number().int().positive(),
                        }),
                    )
                    .min(1, "At least one description is required")
                    .max(4, "Maximum 4 descriptions allowed"),
                modelUrl: z.string().url("Invalid model URL"),
                externalLink: z.string().url().optional(),
                startDate: z.date(),
                endDate: z.date(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Validate dates
            if (input.startDate >= input.endDate) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "End date must be after start date",
                })
            }

            // Generate QR code data
            const qrData = JSON.stringify({
                title: input.title,
                startDate: input.startDate,
                endDate: input.endDate,
                type: "qr-item",
            })

            // Create QR item with descriptions in transaction
            const result = await ctx.db.$transaction(async (tx) => {
                const qrItem = await tx.qRItem.create({
                    data: {
                        title: input.title,
                        modelUrl: input.modelUrl,
                        externalLink: input.externalLink,
                        startDate: input.startDate,
                        endDate: input.endDate,
                        qrCode: qrData,
                        creatorId: ctx.session.user.id,
                    },
                })

                // Create descriptions
                await tx.qRDescription.createMany({
                    data: input.descriptions.map((desc) => ({
                        title: desc.title,
                        content: desc.content,
                        order: desc.order,
                        qrItemId: qrItem.id,
                    })),
                })

                return qrItem
            })

            return {
                ...result,
                isActive: new Date() >= result.startDate && new Date() <= result.endDate,
            }
        }),
    // Update a QR item
    updateQRItem: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1, "Title is required").max(100, "Title too long").optional(),
                description: z.string().min(1, "Description is required").max(500, "Description too long").optional(),
                modelUrl: z.string().url().optional().nullable(),
                externalLink: z.string().url().optional().nullable(),
                startDate: z.date().optional(),
                endDate: z.date().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Check if the QR item exists and belongs to the user
            const existingItem = await ctx.db.qRItem.findFirst({
                where: {
                    id: input.id,
                    creatorId: ctx.session.user.id,
                },
            })

            if (!existingItem) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "QR item not found or you don't have permission to edit it",
                })
            }

            // Validate dates if provided
            const startDate = input.startDate ?? existingItem.startDate
            const endDate = input.endDate ?? existingItem.endDate

            if (startDate >= endDate) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "End date must be after start date",
                })
            }

            // Update the item
            const updatedData: {
                title?: string
                description?: string
                modelUrl?: string
                externalLink?: string | null
                startDate?: Date
                endDate?: Date
                qrCode?: string
            } = {
                ...(input.title !== undefined && { title: input.title }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.modelUrl !== undefined && { modelUrl: input.modelUrl ?? undefined }),
                ...(input.externalLink !== undefined && { externalLink: input.externalLink }),
                ...(input.startDate !== undefined && { startDate: input.startDate }),
                ...(input.endDate !== undefined && { endDate: input.endDate }),
            }

            // Generate new QR code data if content changed
            if (Object.keys(updatedData).length > 0) {
                const qrData = JSON.stringify({
                    title: input.title ?? existingItem.title,
                    description: input.description ?? null,
                    modelUrl: input.modelUrl ?? existingItem.modelUrl,
                    externalLink: input.externalLink ?? existingItem.externalLink,
                    startDate: startDate,
                    endDate: endDate,
                    type: "qr-item",
                })
                updatedData.qrCode = qrData
            }

            const qrItem = await ctx.db.qRItem.update({
                where: {
                    id: input.id,
                },
                data: updatedData,
            })

            return {
                ...qrItem,
                isActive: new Date() >= qrItem.startDate && new Date() <= qrItem.endDate,
            }
        }),

    // Delete a QR item
    deleteQRItem: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        // Check if the QR item exists and belongs to the user
        const existingItem = await ctx.db.qRItem.findFirst({
            where: {
                id: input.id,
                creatorId: ctx.session.user.id,
            },
        })

        if (!existingItem) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "QR item not found or you don't have permission to delete it",
            })
        }

        await ctx.db.qRItem.delete({
            where: {
                id: input.id,
            },
        })

        return { success: true }
    }),

    // Toggle QR item active status
    toggleQRItemStatus: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        const existingItem = await ctx.db.qRItem.findFirst({
            where: {
                id: input.id,
                creatorId: ctx.session.user.id,
            },
        })

        if (!existingItem) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "QR item not found or you don't have permission to modify it",
            })
        }

        const qrItem = await ctx.db.qRItem.update({
            where: {
                id: input.id,
            },
            data: {
                isActive: !existingItem.isActive,
            },
        })

        return {
            ...qrItem,
            isActive: new Date() >= qrItem.startDate && new Date() <= qrItem.endDate && qrItem.isActive,
        }
    }),

    // Get QR item statistics
    getQRItemStats: protectedProcedure.query(async ({ ctx }) => {
        const totalItems = await ctx.db.qRItem.count({
            where: {
                creatorId: ctx.session.user.id,
            },
        })

        const activeItems = await ctx.db.qRItem.count({
            where: {
                creatorId: ctx.session.user.id,
                isActive: true,
                startDate: {
                    lte: new Date(),
                },
                endDate: {
                    gte: new Date(),
                },
            },
        })

        const expiredItems = await ctx.db.qRItem.count({
            where: {
                creatorId: ctx.session.user.id,
                endDate: {
                    lt: new Date(),
                },
            },
        })

        const upcomingItems = await ctx.db.qRItem.count({
            where: {
                creatorId: ctx.session.user.id,
                startDate: {
                    gt: new Date(),
                },
            },
        })

        return {
            total: totalItems,
            active: activeItems,
            expired: expiredItems,
            upcoming: upcomingItems,
        }
    }),
})
