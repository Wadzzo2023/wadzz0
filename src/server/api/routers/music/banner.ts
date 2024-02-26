import { getDoc, setDoc } from "firebase/firestore";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const bannerRouter = createTRPCRouter({
  get: publicProcedure.query(async () => {
    const docSnapshot = await getDoc(firebaseDoc.banner);
    return docSnapshot.data() as Banner;
  }),

  create: protectedProcedure
    .input(
      z.object({
        heading: z.string(),
        imgUrl: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { heading, imgUrl } = input;
      const newBanner: Banner = {
        heading,
        imgUrl,
      };

      try {
        await setDoc(firebaseDoc.banner, newBanner);
        return input.imgUrl;
      } catch (e) {
        throw new TRPCError({
          code: "PARSE_ERROR",
          message: "Some error happens",
          // optional: pass the original error to retain stack trace
          cause: e,
        });
      }
    }),
});
