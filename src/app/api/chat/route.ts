import { createDataStreamResponse, streamText } from "ai";
import { openai } from "@ai-sdk/openai";

import {
  updateFormState,
  streamNextPrompt,
  extractMultipleValues,
  FormState,
  SerializedFormState,
} from "~/lib/agent/form-filling";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Get data from client
  const { messages, formState: clientFormState } = (await req.json()) as {
    messages: { role: "user" | "assistance"; content: string }[];
    formState: SerializedFormState;
  };

  // Ensure we have a valid last message
  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lastMessage = messages.pop();
  const userMessage = lastMessage?.content;

  console.log("userMessage", userMessage);

  if (!userMessage) {
    return new Response(JSON.stringify({ error: "No user message provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Server doesn't need schema, just use the data from client
  let currentFormState = clientFormState as SerializedFormState;

  console.log("currentFormState", currentFormState);

  // Stream response back to client with updated form state
  return createDataStreamResponse({
    execute: async (dataStream) => {
      // Generate assistant response
      const result = await streamNextPrompt(
        currentFormState,
        userMessage,
        (output) => {
          // Send back the updated form state
          dataStream.writeMessageAnnotation({
            formState: currentFormState,
          });
        },
      );

      result.mergeIntoDataStream(dataStream);
    },

    onError: (error) => {
      return error instanceof Error ? error.message : String(error);
    },
  });
}
