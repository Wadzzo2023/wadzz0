/**
 * OpenAI Function Calling Tools for Event Search
 */

export const eventSearchTool = {
  type: "function" as const,
  function: {
    name: "search_events",
    description:
      "Search for events in a specific location. Returns a list of events with details including coordinates, dates, and descriptions.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location to search for events (e.g., 'Times Square, New York')",
        },
        query: {
          type: "string",
          description: "Additional search query or event type (e.g., 'concerts', 'festivals', 'food events')",
        },
        startDate: {
          type: "string",
          description: "Optional start date filter in ISO format",
        },
        endDate: {
          type: "string",
          description: "Optional end date filter in ISO format",
        },
      },
      required: ["location"],
    },
  },
}

export const updateEventConfigTool = {
  type: "function" as const,
  function: {
    name: "update_event_config",
    description:
      "Update pin configuration for a previously shown event. Use this when user wants to modify pin parameters for an event they've already seen.",
    parameters: {
      type: "object",
      properties: {
        eventTitle: {
          type: "string",
          description: "The title of the event to update",
        },
        pinCollectionLimit: {
          type: "number",
          description: "Number of times a pin can be collected (min: 1)",
        },
        pinNumber: {
          type: "number",
          description: "Number of pins to drop (min: 1)",
        },
        autoCollect: {
          type: "boolean",
          description: "Whether pins are automatically collected",
        },
        multiPin: {
          type: "boolean",
          description: "Whether multiple pins can be collected",
        },
        radius: {
          type: "number",
          description: "Radius in meters for pin placement (min: 0)",
        },
      },
      required: ["eventTitle"],
    },
  },
}

export const tools = [eventSearchTool, updateEventConfigTool]
