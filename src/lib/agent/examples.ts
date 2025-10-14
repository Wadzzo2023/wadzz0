/**
 * Example responses for testing the Pin Creation Agent
 */

export const EXAMPLE_QUERIES_AND_RESPONSES = {
  query1: {
    user: "Tell me about events near Times Square",
    expectedResponse: {
      message: "Here are some events I found:",
      type: "events",
      events: [
        {
          title: "Broadway Week: Hamilton",
          description:
            "Experience the award-winning musical Hamilton at the Richard Rodgers Theatre. Get 2-for-1 tickets during Broadway Week!",
          latitude: 40.7590833,
          longitude: -73.9845806,
          startDate: "2025-10-25T19:00:00Z",
          endDate: "2025-10-25T22:00:00Z",
          venue: "Richard Rodgers Theatre",
          address: "226 W 46th St, New York, NY 10036",
          url: "https://hamiltonmusical.com",
          image: "https://example.com/hamilton.jpg",
        },
        {
          title: "Times Square New Year's Eve 2026",
          description:
            "Join the iconic ball drop celebration with live performances from top artists. Get there early for the best viewing spots!",
          latitude: 40.758896,
          longitude: -73.98513,
          startDate: "2025-12-31T20:00:00Z",
          endDate: "2026-01-01T01:00:00Z",
          venue: "Times Square",
          address: "Times Square, Manhattan, NY 10036",
          url: "https://timessquarenyc.org/nye",
          image: "https://example.com/nye.jpg",
        },
        {
          title: "Late Night Shopping & Street Fair",
          description:
            "Browse local vendors, enjoy street food, and shop till you drop at this weekly Times Square event.",
          latitude: 40.7589,
          longitude: -73.9851,
          startDate: "2025-10-18T18:00:00Z",
          endDate: "2025-10-18T23:00:00Z",
          venue: "Times Square Plaza",
          address: "Broadway & 42nd St, New York, NY",
          url: "https://example.com/street-fair",
        },
      ],
    },
  },

  query2: {
    user: "Find concerts in Central Park",
    expectedResponse: {
      message: "Here are some concerts I found in Central Park:",
      type: "events",
      events: [
        {
          title: "SummerStage: Jazz Night",
          description:
            "Free outdoor jazz concert featuring renowned artists. Bring a blanket and enjoy world-class music under the stars.",
          latitude: 40.785091,
          longitude: -73.968285,
          startDate: "2025-07-15T19:00:00Z",
          endDate: "2025-07-15T22:00:00Z",
          venue: "Rumsey Playfield, Central Park",
          address: "Central Park, 72nd St, New York, NY",
          url: "https://summerstage.org",
          image: "https://example.com/jazz-night.jpg",
        },
        {
          title: "New York Philharmonic in the Park",
          description: "Annual free concert by the NY Philharmonic on the Great Lawn. A beloved NYC summer tradition!",
          latitude: 40.7829,
          longitude: -73.9654,
          startDate: "2025-08-10T20:00:00Z",
          endDate: "2025-08-10T22:30:00Z",
          venue: "Great Lawn, Central Park",
          address: "Central Park, between 79th & 85th St",
          url: "https://nyphil.org",
          image: "https://example.com/philharmonic.jpg",
        },
      ],
    },
  },

  query3: {
    user: "What food events are in Brooklyn this weekend?",
    expectedResponse: {
      message: "Here are some food events in Brooklyn this weekend:",
      type: "events",
      events: [
        {
          title: "Smorgasburg Brooklyn",
          description:
            "The largest weekly open-air food market in America! Try dishes from 100+ vendors with cuisines from around the world.",
          latitude: 40.7081,
          longitude: -73.9571,
          startDate: "2025-10-19T11:00:00Z",
          endDate: "2025-10-19T18:00:00Z",
          venue: "Prospect Park",
          address: "Breeze Hill, Prospect Park, Brooklyn, NY",
          url: "https://smorgasburg.com",
          image: "https://example.com/smorgasburg.jpg",
        },
        {
          title: "Brooklyn Night Bazaar",
          description: "Food, shopping, and live music all in one place. Featuring local food vendors and artisans.",
          latitude: 40.7128,
          longitude: -73.9494,
          startDate: "2025-10-18T18:00:00Z",
          endDate: "2025-10-19T01:00:00Z",
          venue: "Brooklyn Night Bazaar",
          address: "165 Banker St, Brooklyn, NY 11222",
          url: "https://bknightbazaar.com",
          image: "https://example.com/night-bazaar.jpg",
        },
        {
          title: "Williamsburg Food Festival",
          description:
            "Annual celebration of Brooklyn's diverse food scene with tastings, cooking demos, and chef meetups.",
          latitude: 40.7081,
          longitude: -73.9571,
          startDate: "2025-10-20T12:00:00Z",
          endDate: "2025-10-20T20:00:00Z",
          venue: "McCarren Park",
          address: "776 Lorimer St, Brooklyn, NY 11222",
          url: "https://example.com/wburg-food-fest",
        },
      ],
    },
  },
}

/**
 * Template for AI to follow when generating events
 */
export const EVENT_RESPONSE_TEMPLATE = `
When the search_events tool is called, respond with ONLY a JSON array in this exact format:

\`\`\`json
[
  {
    "title": "Event Title",
    "description": "Detailed 1-2 sentence description",
    "latitude": 40.123456,
    "longitude": -73.123456,
    "startDate": "2025-10-20T10:00:00Z",
    "endDate": "2025-10-20T18:00:00Z",
    "venue": "Venue Name",
    "address": "Street Address, City, State ZIP",
    "url": "https://example.com/event",
    "image": "https://example.com/image.jpg"
  }
]
\`\`\`

Rules:
- Generate 2-5 relevant events
- Use accurate coordinates for well-known locations
- Dates must be in future (after October 13, 2025)
- All fields are required except url and image (optional)
- Keep descriptions concise but informative
`
