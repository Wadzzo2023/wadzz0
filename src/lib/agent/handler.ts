/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import OpenAI from "openai"
import type { EventData, AgentResponse, PinConfiguration } from "./types"
import { tools } from "./tools"
import { SYSTEM_PROMPT } from "./prompt"

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
  return []
}

/**
 * Extract pin configuration from user message
 */
function extractPinConfiguration(message: string): Partial<PinConfiguration> | null {
  const config: Partial<PinConfiguration> = {}

  // Extract pin number (e.g., "500 pins", "drop 500 pins")
  const pinNumberMatch = message.match(/(\d+)\s*pins?/i)
  if (pinNumberMatch) {
    config.pinNumber = Number.parseInt(pinNumberMatch[1]!)
  }

  // Extract radius (e.g., "100 meters", "around 100 meters", "100m radius")
  const radiusMatch = message.match(/(\d+)\s*(meters?|m)\b/i)
  if (radiusMatch) {
    config.radius = Number.parseInt(radiusMatch[1]!)
  }

  // Extract collection limit (e.g., "collection limit 50", "limit 50")
  const limitMatch = message.match(/(?:collection\s+)?limit\s*(\d+)/i)
  if (limitMatch) {
    config.pinCollectionLimit = Number.parseInt(limitMatch[1]!)
  }

  // Check for auto collect
  if (message.match(/auto\s*collect/i)) {
    config.autoCollect = true
    config.multiPin = false // Mutually exclusive
  }

  // Check for multi pin
  if (message.match(/multi\s*pin/i)) {
    config.multiPin = true
    config.autoCollect = false // Mutually exclusive
  }

  return Object.keys(config).length > 0 ? config : null
}

/**
 * Process OpenAI tool calls and generate event data
 */
async function handleToolCall(
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant" | "system"; content: string }>,
): Promise<{ response: string; isUpdate: boolean }> {
  if (toolCall.function.name === "search_events") {
    const args = JSON.parse(toolCall.function.arguments)

    // Extract pin configuration from user message
    const pinConfig = extractPinConfiguration(userMessage)

    let configInstruction = ""
    if (pinConfig) {
      configInstruction = ` Include these pin parameters in each event: ${JSON.stringify(pinConfig)}`
    }

    return {
      response: JSON.stringify({
        success: true,
        message: `Please provide a list of real events for ${args.location}${args.query ? ` related to ${args.query}` : ""}. Include accurate coordinates, venues, dates, and descriptions. Format each event with: title, description, latitude, longitude, startDate (ISO), endDate (ISO), venue, address, url if available, and default pin parameters (pinCollectionLimit: 1, pinNumber: 1, autoCollect: false, multiPin: false, radius: 50).${configInstruction}`,
      }),
      isUpdate: false,
    }
  }

  if (toolCall.function.name === "update_event_config") {
    const args = JSON.parse(toolCall.function.arguments)

    // Find the event in conversation history
    let targetEvent: EventData | null = null
    for (const msg of conversationHistory) {
      if (msg.role === "assistant" && msg.content) {
        const events = parseEventsFromResponse(msg.content)
        if (events) {
          targetEvent = events.find((e) => e.title.toLowerCase().includes(args.eventTitle.toLowerCase())) ?? null
          if (targetEvent) break
        }
      }
    }

    if (!targetEvent) {
      return {
        response: JSON.stringify({
          success: false,
          message: "Could not find the specified event in conversation history",
        }),
        isUpdate: true,
      }
    }

    // Update the event with new parameters
    const updatedEvent: EventData = {
      ...targetEvent,
      pinCollectionLimit: args.pinCollectionLimit ?? targetEvent.pinCollectionLimit,
      pinNumber: args.pinNumber ?? targetEvent.pinNumber,
      autoCollect: args.autoCollect ?? targetEvent.autoCollect,
      multiPin: args.multiPin ?? targetEvent.multiPin,
      radius: args.radius ?? targetEvent.radius,
    }

    return {
      response: JSON.stringify({
        success: true,
        message: `Return this single updated event as JSON: ${JSON.stringify([updatedEvent])}`,
        isUpdate: true,
      }),
      isUpdate: true,
    }
  }

  return {
    response: JSON.stringify({ success: false, message: "Unknown tool" }),
    isUpdate: false,
  }
}

/**
 * Parse OpenAI response to extract event data
 */
function parseEventsFromResponse(content: string): EventData[] | null {
  try {
    // Remove any markdown code blocks
    let cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    // Remove any leading text before JSON array
    const arrayStart = cleanContent.indexOf("[")
    if (arrayStart > 0) {
      cleanContent = cleanContent.substring(arrayStart)
    }

    // Remove any trailing text after JSON array
    const arrayEnd = cleanContent.lastIndexOf("]")
    if (arrayEnd > 0 && arrayEnd < cleanContent.length - 1) {
      cleanContent = cleanContent.substring(0, arrayEnd + 1)
    }

    // Try direct JSON parse
    const parsed = JSON.parse(cleanContent)
    if (Array.isArray(parsed)) {
      return parsed.map((event: EventData) => ({
        ...event,
        pinCollectionLimit: event.pinCollectionLimit ?? 1,
        pinNumber: event.pinNumber ?? 1,
        autoCollect: event.autoCollect ?? false,
        multiPin: event.multiPin ?? false,
        radius: event.radius ?? 50,
      }))
    }
    if (parsed.events && Array.isArray(parsed.events)) {
      return parsed.events.map((event: EventData) => ({
        ...event,
        pinCollectionLimit: event.pinCollectionLimit ?? 1,
        pinNumber: event.pinNumber ?? 1,
        autoCollect: event.autoCollect ?? false,
        multiPin: event.multiPin ?? false,
        radius: event.radius ?? 50,
      }))
    }
  } catch {
    // Not JSON, that's okay
  }

  return null
}

/**
 * Main handler for agent chat requests
 */
export async function handleAgentChat(
  apiKey: string,
  message: string,
  conversationHistory: Array<{
    role: "user" | "assistant" | "system"
    content: string
  }> = [],
): Promise<AgentResponse> {
  const openai = new OpenAI({ apiKey })

  try {
    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user", content: message },
    ]

    let isUpdateOperation = false

    // First completion with tools
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools,
      tool_choice: "auto",
    })

    const responseMessage = completion.choices[0]?.message

    if (!responseMessage) {
      throw new Error("No response from OpenAI")
    }

    // Check if the model wants to call a function
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Add assistant's response to messages
      messages.push(responseMessage)

      // Handle tool calls
      for (const toolCall of responseMessage.tool_calls) {
        const { response: functionResponse, isUpdate } = await handleToolCall(toolCall, message, conversationHistory)
        isUpdateOperation = isUpdate || isUpdateOperation
        messages.push({
          role: "tool",
          content: functionResponse,
          tool_call_id: toolCall.id,
        })
      }

      // Get final response after tool calls
      const secondCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
      })

      const finalMessage = secondCompletion.choices[0]?.message?.content ?? ""

      // Try to parse events from the response
      const events = parseEventsFromResponse(finalMessage)

      if (events && events.length > 0) {
        const responseMessage = isUpdateOperation
          ? "I have updated the event with the given information"
          : "Here are some events I found:"

        return {
          message: responseMessage,
          events,
          type: isUpdateOperation ? "update" : "events",
        }
      }

      return {
        message: finalMessage,
        type: "text",
      }
    }

    // No tool calls, return direct response
    const content = responseMessage.content ?? ""
    const events = parseEventsFromResponse(content)

    if (events && events.length > 0) {
      return {
        message: "Here are some events I found:",
        events,
        type: "events",
      }
    }

    return {
      message: content,
      type: "text",
    }
  } catch (error) {
    console.error("Error in handleAgentChat:", error)
    throw error
  }
}
