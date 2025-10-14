/* eslint-disable  */
import { z } from "zod"
import { env } from "~/env"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc"
import { handleAgentChat } from "~/lib/agent"

export const agentRouter = createTRPCRouter({
  chat: publicProcedure
    .input(
      z.object({
        message: z.string(),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant", "system"]),
              content: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Use the agent handler from lib/agent
        const result = await handleAgentChat(env.OPENAI_API_KEY, input.message, input.conversationHistory ?? [])

        return {
          message: result.message,
          events: result.events,
          type: result.type,
          success: true,
        }
      } catch (error) {
        console.error("OpenAI API error:", error)
        return {
          message: "Sorry, I'm having trouble connecting right now. Please try again later.",
          success: false,
          type: "text" as const,
        }
      }
    }),

  // Protected version for logged-in users
  chatProtected: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant", "system"]),
              content: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Use the agent handler from lib/agent
        const result = await handleAgentChat(env.OPENAI_API_KEY, input.message, input.conversationHistory ?? [])

        return {
          message: result.message,
          events: result.events,
          type: result.type,
          success: true,
          userName: ctx.session.user.name,
        }
      } catch (error) {
        console.error("OpenAI API error:", error)
        return {
          message: "Sorry, I'm having trouble connecting right now. Please try again later.",
          success: false,
          type: "text" as const,
        }
      }
    }),
})
