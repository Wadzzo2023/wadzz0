/**
 * Main handler for Agent Chat functionality
 */

import OpenAI from "openai";
import type { EventData, AgentResponse } from "./types";
import { tools } from "./tools";
import { SYSTEM_PROMPT } from "./prompt";

/**
 * Mock event generator - simulates finding events based on location
 * In a real implementation, this would call external APIs
 */
function generateEventsForLocation(
  location: string,
  query?: string,
  startDate?: string,
  endDate?: string,
): EventData[] {
  // This is a mock implementation
  // In production, you'd integrate with real event APIs

  // For now, return empty array - OpenAI will generate appropriate responses
  // based on its knowledge and the tool schema
  return [];
}

/**
 * Process OpenAI tool calls and generate event data
 */
async function handleToolCall(
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
): Promise<string> {
  if (toolCall.function.name === "search_events") {
    const args = JSON.parse(toolCall.function.arguments);

    // Generate mock events based on the search parameters
    // In reality, OpenAI will provide structured data in its response
    // We return a message that tells OpenAI to format the events properly

    return JSON.stringify({
      success: true,
      message: `Please provide a list of real events for ${args.location}${args.query ? ` related to ${args.query}` : ""}. Include accurate coordinates, venues, dates, and descriptions. Format each event with: title, description, latitude, longitude, startDate (ISO), endDate (ISO), venue, address, and url if available.`,
    });
  }

  return JSON.stringify({ success: false, message: "Unknown tool" });
}

/**
 * Parse OpenAI response to extract event data
 */
function parseEventsFromResponse(content: string): EventData[] | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]!);
      if (Array.isArray(parsed) || parsed.events) {
        return Array.isArray(parsed) ? parsed : parsed.events;
      }
    }

    // Try direct JSON parse
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.events && Array.isArray(parsed.events)) return parsed.events;
  } catch {
    // Not JSON, that's okay
  }

  return null;
}

/**
 * Main handler for agent chat requests
 */
export async function handleAgentChat(
  apiKey: string,
  message: string,
  conversationHistory: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> = [],
): Promise<AgentResponse> {
  const openai = new OpenAI({ apiKey });

  try {
    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    // First completion with tools
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools,
      tool_choice: "auto",
    });

    const responseMessage = completion.choices[0]?.message;

    if (!responseMessage) {
      throw new Error("No response from OpenAI");
    }

    // Check if the model wants to call a function
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Add assistant's response to messages
      messages.push(responseMessage);

      // Handle tool calls
      for (const toolCall of responseMessage.tool_calls) {
        const functionResponse = await handleToolCall(toolCall);
        messages.push({
          role: "tool",
          content: functionResponse,
          tool_call_id: toolCall.id,
        });
      }

      // Get final response after tool calls
      const secondCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
      });

      const finalMessage = secondCompletion.choices[0]?.message?.content ?? "";

      // Try to parse events from the response
      const events = parseEventsFromResponse(finalMessage);

      if (events && events.length > 0) {
        return {
          message: "Here are some events I found:",
          events,
          type: "events",
        };
      }

      return {
        message: finalMessage,
        type: "text",
      };
    }

    // No tool calls, return direct response
    const content = responseMessage.content ?? "";
    const events = parseEventsFromResponse(content);

    if (events && events.length > 0) {
      return {
        message: "Here are some events I found:",
        events,
        type: "events",
      };
    }

    return {
      message: content,
      type: "text",
    };
  } catch (error) {
    console.error("Error in handleAgentChat:", error);
    throw error;
  }
}
