import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

import {
  initializeFormState,
  updateFormState,
  streamNextPrompt,
  extractMultipleValues,
  FormState,
} from "~/lib/agent/form-filling";

// Session storage (in a real app, use a database)
const sessions: Record<
  string,
  {
    formState: FormState;
    conversation: string[];
  }
> = {};

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const pinFormSchema = z.object({
  title: z
    .string()
    .max(20, { message: "Title must be less than 20 characters" }),
  description: z.string().optional(),
  pinNumber: z.number().min(1).max(20),
  asset: z.enum(["image", "video", "audio"]),
});

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();
  const lastMessage = messages[messages.length - 1];
  const message = lastMessage.content;

  const schema = pinFormSchema;

  if (!sessions[sessionId]) {
    // Parse the schema JSON if provided, otherwise use default
    // let schema = pinFormSchema;
    // if (schemaJson) {
    //   // In production, you'd need a safer way to reconstruct the Zod schema
    //   schema = z.object(JSON.parse(schemaJson));
    // }

    sessions[sessionId] = {
      formState: initializeFormState(schema),
      conversation: [],
    };
  }

  const session = sessions[sessionId];

  // Store conversation for context
  session.conversation.push(`User: ${message}`);

  // Try to extract values for ALL remaining fields
  if (
    !session.formState.isComplete &&
    session.formState.remainingFields.length > 0
  ) {
    const fieldsToExtract = session.formState.fields.filter((field) =>
      session.formState.remainingFields.includes(field.name),
    );

    const extractedValues = await extractMultipleValues(
      message,
      fieldsToExtract,
      session.conversation,
    );

    // If we got any values, update the state
    if (Object.keys(extractedValues).length > 0) {
      session.formState = updateFormState(session.formState, extractedValues);
    }
  }

  // console.log(sessionId);

  // const lastMessage = messages[messages.length - 1];
  // const lastMessageContent = lastMessage.content;

  // Generate the next message
  const botResponse = await streamNextPrompt(
    session.formState,
    message,
    (botres) => {
      session.conversation.push(`Assistant: ${botres}`);
    },
  );

  // Store AI response in conversation history

  // const result = streamText({
  //   model: openai("gpt-4o-mini"),
  //   // messages,
  //   tools: {
  //     weather: tool({
  //       description: "Get the weather in a location",
  //       parameters: z.object({
  //         location: z.string().describe("The location to get the weather for"),
  //       }),
  //       execute: async ({ location }) => ({
  //         location,
  //         temperature: 72 + Math.floor(Math.random() * 21) - 10,
  //       }),
  //     }),
  //   },
  //   maxSteps: 5,
  //   prompt: message,
  // });

  return botResponse.toDataStreamResponse();
}

/*
import { OpenAIStream, StreamingTextResponse } from "@vercel/ai";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory storage (use database in production)
const sessionMemory = new Map<string, any>();

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();

  // Retrieve or initialize session data
  const userSession = sessionMemory.get(sessionId) || { pinData: {} };

  // Process the latest user message
  const userMessage = messages[messages.length - 1]?.content.toLowerCase();
  let responseText = "";

  if (userMessage.includes("create a pin")) {
    responseText = "Great! What’s the title of your pin?";
  } else {
    const pinData = userSession.pinData;

    if (!pinData.title) {
      pinData.title = userMessage;
      responseText = "Got it! Now, please provide a description.";
    } else if (!pinData.description) {
      pinData.description = userMessage;
      responseText = "Thanks! What’s the pin number?";
    } else if (!pinData.pinNumber) {
      if (isNaN(Number(userMessage))) {
        responseText = "Pin number must be a number. Please enter a valid one.";
      } else {
        pinData.pinNumber = Number(userMessage);
        responseText = "Almost done! Which asset would you like to include?";
      }
    } else if (!pinData.asset) {
      pinData.asset = userMessage;
      responseText = `Pin created successfully! 🎉\nTitle: ${pinData.title}\nDescription: ${pinData.description}\nPin Number: ${pinData.pinNumber}\nAsset: ${pinData.asset}`;
      sessionMemory.delete(sessionId); // Clear session after completion
    }
  }

  // Store session data
  sessionMemory.set(sessionId, userSession);

  return new Response(JSON.stringify({ response: responseText }), {
    headers: { "Content-Type": "application/json" },
  });
}

*/
