import { context } from "@react-three/fiber";
import { z } from "zod";
import {
  extractMultipleValues,
  SerializedFormState,
} from "~/lib/agent/form-filling";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const chatRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getAgentStateState: protectedProcedure
    .input(
      z.object({
        userMessage: z.string(),
        formState: z.any().optional(),
        messages: z
          .object({
            content: z.string(),
            role: z.enum(["user", "data", "system", "assistant"]),
          })
          .array()
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentFormState = input.formState as SerializedFormState;
      const { messages } = input;

      const userMessage = input.userMessage;
      if (!userMessage) throw new Error("No user message provided");

      // Process user input if we have remaining fields
      if (
        currentFormState &&
        !currentFormState.isComplete &&
        currentFormState.remainingFields.length > 0
      ) {
        const fieldsToExtract = currentFormState.fields.filter((field) =>
          currentFormState.remainingFields.includes(field.name),
        );

        const fieldAlreadyFilled = currentFormState.fields
          .filter((field) => currentFormState.currentData[field.name])
          .map((f) => ({ ...f, value: currentFormState.currentData[f.name] }));

        const extractedValues = await extractMultipleValues(
          userMessage,
          fieldsToExtract,
          fieldAlreadyFilled,
          messages.filter((m) => m.role == "user").map((m) => m.content),
        );

        return extractedValues;
      }
    }),
});
