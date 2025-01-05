
import { ItemPrivacy } from "@prisma/client";
import { z } from "zod";
import { SongFormSchema } from "~/components/fan/creator/music/create-song";
import {
    createTRPCRouter,
    creatorProcedure,

} from "~/server/api/trpc";
import { AssetSelectAllProperty } from "../marketplace/marketplace";

export const musicRouter = createTRPCRouter({

    getCreatorAlbums: creatorProcedure.query(async ({ ctx }) => {
        const creatorId = ctx.session.user.id;

        const creator = await ctx.db.creator.findUnique({
            where: {
                id: creatorId,
            }

        });


        if (!creator) {
            throw new Error("Creator not found");
        }
        const albums = await ctx.db.album.findMany({
            where: {
                creatorId: ctx.session.user.id,
            },
        });
        return albums;
    }),

    createAlbum: creatorProcedure.input(z.object({
        name: z
            .string()
            .max(20, { message: "Album name must be between 3 to 20 characters" })
            .min(3, { message: "Album name must be between 3 to 20 characters" }),
        description: z.string(),
        coverImgUrl: z.string({
            required_error: "Cover image is required",
            message: "Cover image is required",
        }),
    })).mutation(async ({ ctx, input }) => {
        const { name, description, coverImgUrl } = input;
        const album = await ctx.db.album.create({
            data: {
                name,
                description,
                coverImgUrl,
                creatorId: ctx.session.user.id,
            },
        });
        return album;
    }),

    getAlbum: creatorProcedure.input(z.object({
        id: z.number(),
    })).query(async ({ ctx, input }) => {
        const album = await ctx.db.album.findUnique({
            where: {
                id: Number(input.id),
            },
            include: {
                songs: {
                    include: {
                        asset: {
                            select: AssetSelectAllProperty,
                        },

                    },
                },
            }
        });
        if (!album) {
            throw new Error("Album not found");
        }
        return album;
    }),
    create: creatorProcedure
        .input(SongFormSchema)
        .mutation(async ({ input, ctx }) => {
            const {
                artist,
                coverImgUrl,
                albumId,
                musicUrl,
                description,
                priceUSD,
                price,
                limit,
                name,
                code,
                issuer,
                tier
            } = input;

            if (issuer) {
                const userId = ctx.session.user.id;


                let tierId: number | undefined;
                let privacy: ItemPrivacy = ItemPrivacy.PUBLIC;

                if (!tier) {
                    privacy = ItemPrivacy.PUBLIC;
                } else if (tier == "public") {
                    privacy = ItemPrivacy.PUBLIC;
                } else if (tier == "private") {
                    privacy = ItemPrivacy.PRIVATE;
                } else {
                    tierId = Number(tier);
                    privacy = ItemPrivacy.TIER;
                }

                return await ctx.db.asset.create({
                    data: {
                        code,
                        issuer: issuer.publicKey,
                        issuerPrivate: issuer.secretKey,
                        song: {
                            create: {
                                artist,
                                price,
                                albumId,
                                priceUSD,
                                creatorId: userId,
                            },
                        },
                        marketItems: { create: { price, type: "SONG", placerId: userId } },
                        mediaType: "MUSIC",
                        name,
                        mediaUrl: musicUrl,
                        thumbnail: coverImgUrl,
                        description: description,
                        limit,
                        privacy,
                        tierId,
                        creatorId: userId,
                    },
                });
            }
        }),


    getUnlistedSongs: creatorProcedure
        .input(
            z.object({
                limit: z.number(),
                // cursor is a reference to the last item in the previous batch
                // it's used to fetch the next batch
                cursor: z.number().nullish(),
                skip: z.number().optional(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const { limit, cursor, skip } = input;
            const creatorId = ctx.session.user.id;

            const items = await ctx.db.marketAsset.findMany({
                take: limit + 1,
                skip: skip,
                cursor: cursor ? { id: cursor } : undefined,
                include: {
                    asset: {
                        select: AssetSelectAllProperty,
                    },
                },
                where: {
                    asset: {
                        creatorId,
                        AND: {
                            mediaType: "MUSIC",
                        },
                        song: null
                    }
                }
            });

            let nextCursor: typeof cursor | undefined = undefined;
            if (items.length > limit) {
                const nextItem = items.pop(); // return the last item from the array
                nextCursor = nextItem?.id;
            }

            return {
                nfts: items,
                nextCursor,
            };
        }),
});
