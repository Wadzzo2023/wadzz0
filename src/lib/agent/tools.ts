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
          description:
            "The location to search for events (e.g., 'Times Square, New York')",
        },
        query: {
          type: "string",
          description:
            "Additional search query or event type (e.g., 'concerts', 'festivals', 'food events')",
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
};

export const tools = [eventSearchTool];
