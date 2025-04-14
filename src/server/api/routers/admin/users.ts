import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { createTransport, Transporter } from "nodemailer";

export const userRouter = createTRPCRouter({
  getUsers: protectedProcedure.query(({ ctx, input }) => {
    const users = ctx.db.user.findMany({ orderBy: { joinedAt: "desc" } });

    return users;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
  deleteUser: adminProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.user.delete({ where: { id: input } });
  }),

  deleteAPost: adminProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return ctx.db.post.delete({ where: { id: input } });
  }),
  sendEmail: publicProcedure
    .input(
      z.object({
        userEmail: z.string(),
        name: z.string(),
        message: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return sendEmail(input.userEmail, input.name, input.message);
    }),

  hasStorage: protectedProcedure.query(async ({ ctx }) => {
    const creator = await ctx.db.creator.findUnique({
      where: {
        id: ctx.session.user.id,
      },
    });

    return { storage: creator?.storagePub };
  }),
});

const transporter: Transporter = createTransport({
  service: "Gmail",
  auth: {
    user: process.env.NEXT_PUBLIC_NODEMAILER_USER,
    pass: process.env.NEXT_PUBLIC_NODEMAILER_PASS,
  },
});

const sendEmail = async (
  userEmail: string,
  name: string,
  message: string,
): Promise<void> => {
  try {
    const mailOptions = {
      from: userEmail,
      to: "support@bandcoin.io",
      subject: `Support Request: ${name}`,
      text: message,
    };

    const result = transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send email");
  }
};
