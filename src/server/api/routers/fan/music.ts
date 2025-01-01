
import { z } from "zod";
import {
    createTRPCRouter,
    creatorProcedure,

} from "~/server/api/trpc";

export const musicRouter = createTRPCRouter({

    getCreatorAlbums: creatorProcedure.query(async ({ ctx }) => {
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

});
