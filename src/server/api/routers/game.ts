import { z } from "zod";
import { decode } from "next-auth/jwt";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { env } from "~/env";

export const gameRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  decodeSessionToken: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const sessionToken = input;
      const decoded = await decode({
        token: sessionToken,
        secret: env.NEXTAUTH_SECRET ?? "",
      });
      // console.log(decoded);
      return decoded;
    }),
});
