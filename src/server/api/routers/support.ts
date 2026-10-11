import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { mailer, SUPPORT_EMAIL } from "~/server/mail";

const SUPPORT_TOPICS = ["Account & sign-in", "Payments & wallet", "Items & collection", "Bounties", "Brands & memberships", "Something else"] as const;

// A light brake on repeat sends from one address (per server instance).
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 3;

function throttle(email: string) {
  const now = Date.now();
  const hits = (recent.get(email) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You've sent a few messages already — we'll get back to you soon." });
  recent.set(email, [...hits, now]);
}

/** The Support page's contact form: emails support, with the sender as reply-to. */
export const supportRouter = createTRPCRouter({
  send: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "Tell us your name").max(100),
        email: z.string().trim().email("Enter a valid email"),
        topic: z.enum(SUPPORT_TOPICS),
        message: z.string().trim().min(10, "Tell us a little more").max(5000),
        /** honeypot: real people never fill this in */
        website: z.string().max(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      throttle(input.email.toLowerCase());
      const { transporter, from } = mailer();
      const account = ctx.session?.user.id;
      await transporter.sendMail({
        from: `Wadzzo Support Form <${from}>`,
        to: SUPPORT_EMAIL,
        replyTo: `${input.name} <${input.email}>`,
        subject: `[${input.topic}] ${input.name}`,
        text: [
          `From: ${input.name} <${input.email}>`,
          `Topic: ${input.topic}`,
          account ? `Signed in as: ${account}` : "Not signed in",
          `Platform: ${ctx.platform.id}`,
          "",
          input.message,
        ].join("\n"),
      });
      return { ok: true };
    }),
});
