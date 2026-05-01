// tools.ts — Optimized data fetching tools with caching, error handling & dynamic grid search

import { tool } from "ai";
import { z } from "zod";
import OpenAI from "openai";
import type { EventData, LandmarkData, PinItem } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
});

// ─── Request caching ──────────────────────────────────────────────────────────

const requestCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = requestCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    requestCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): T {
  requestCache.set(key, { data, timestamp: Date.now() });
  return data;
}

// ─── Concurrency limiter ──────────────────────────────────────────────────────
// Runs up to `limit` async tasks in parallel. Much faster than sequential for
// large grids (e.g. 9×9 = 81 cells for count=1000) while avoiding QPS bursts.

async function pLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]!();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ─── Category map ─────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  restaurant: "Restaurant", cafe: "Cafe", bar: "Bar", night_club: "Nightclub",
  bakery: "Bakery", shopping_mall: "Shopping Mall", store: "Store",
  grocery_or_supermarket: "Grocery", book_store: "Bookstore",
  clothing_store: "Clothing Store", park: "Park", museum: "Museum",
  art_gallery: "Art Gallery", movie_theater: "Movie Theater",
  amusement_park: "Amusement Park", gym: "Gym", hotel: "Hotel",
  hospital: "Hospital", school: "School", university: "University",
  tourist_attraction: "Tourist Attraction", historical_landmark: "Historical Landmark",
  mosque: "Mosque", temple: "Temple", church: "Church",
  market: "Market", pharmacy: "Pharmacy", bank: "Bank",
  gas_station: "Gas Station", beach: "Beach", library: "Library",
};

// ─── Google Place type map ─────────────────────────────────────────────────────
// Maps query keywords → valid Google Places `type` param values.
// Passing `type` to nearbysearch tightens relevance and reduces off-topic
// hits that waste the 20-per-page quota.

const QUERY_TO_PLACE_TYPE: Record<string, string> = {
  restaurant: "restaurant", cafe: "cafe", coffee: "cafe",
  bar: "bar", nightclub: "night_club", bakery: "bakery",
  gym: "gym", hotel: "lodging", hospital: "hospital",
  pharmacy: "pharmacy", bank: "bank", atm: "atm",
  park: "park", museum: "museum", library: "library",
  school: "school", university: "university",
  supermarket: "grocery_or_supermarket", grocery: "grocery_or_supermarket",
  store: "store", mall: "shopping_mall",
  gas: "gas_station", petrol: "gas_station",
  church: "church", mosque: "mosque", temple: "hindu_temple",
  beach: "tourist_attraction", airport: "airport",
};

function inferPlaceType(query: string): string | undefined {
  const q = query.toLowerCase();
  for (const [keyword, type] of Object.entries(QUERY_TO_PLACE_TYPE)) {
    if (q.includes(keyword)) return type;
  }
  return undefined;
}

// ─── Web search ───────────────────────────────────────────────────────────────

async function webSearch(query: string): Promise<string> {
  const cacheKey = `search:${query}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: query,
    });
    const result = response.output
      .filter((item) => item.type === "message")
      .flatMap((item) => item.content ?? [])
      .filter((c) => c.type === "output_text")
      .map((c) => c.text)
      .join("\n");
    return setCached(cacheKey, result);
  } catch (error) {
    console.error("[Agent] Web search failed:", error);
    throw new Error(`Failed to search web: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// ─── Parse events ─────────────────────────────────────────────────────────────

async function parseEvents(rawText: string, area: string, count: number, queryType?: string): Promise<EventData[]> {
  const cacheKey = `events:${area}:${count}:${queryType}`;
  const cached = getCached<EventData[]>(cacheKey);
  if (cached) return cached;

  const today = new Date().toISOString().split("T")[0]!;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Extract exactly ${count} upcoming events (or as many as found, max ${count}). Return ONLY JSON:
{
  "events": [
    {
      "id": "evt_1",
      "title": "Event Name",
      "description": "1-2 sentences",
      "startDate": "2024-12-15T19:00:00Z",
      "endDate": "2024-12-16T22:00:00Z",
      "latitude": 23.8,
      "longitude": 90.4,
      "venue": "Venue Name",
      "address": "Address",
      "url": "https://...",
      "image": "https://..."
    }
  ]
}
Rules: Today=${today}. Skip events before today. Infer missing coords from "${area}". Default endDate=startDate+3 days. Return up to ${count} events only.`,
        },
        {
          role: "user",
          content: `${queryType ? `Type: ${queryType}. ` : ""}Area: ${area}. Need: ${count} events.\n\n${rawText.slice(0, 2000)}`,
        },
      ],
    });

    const json = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as { events?: EventData[] };
    const events = (json.events ?? []).slice(0, count).map((e, i) => ({
      ...e,
      id: e.id || `evt_${i + 1}`,
      endDate: e.endDate ?? new Date(new Date(e.startDate).getTime() + 3 * 86400000).toISOString(),
    }));

    console.log(`[Agent] Parsed ${events.length} events from "${queryType} in ${area}"`);
    return setCached(cacheKey, events);
  } catch (error) {
    console.error("[Agent] Event parsing failed:", error);
    throw new Error(`Failed to parse events: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// ─── Google Places types ──────────────────────────────────────────────────────

interface GooglePlaceResult {
  name?: string;
  formatted_address?: string;
  vicinity?: string;
  geometry?: { location?: { lat: number; lng: number } };
  photos?: Array<{ photo_reference: string }>;
  types?: string[];
  rating?: number;
  place_id?: string;
}

interface GooglePlacesResponse {
  results?: GooglePlaceResult[];
  next_page_token?: string;
  status: string;
  error_message?: string;
}

interface GoogleGeocodeResponse {
  status: string;
  results?: Array<{
    geometry?: {
      bounds?: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } };
      viewport?: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } };
      location?: { lat: number; lng: number };
    };
  }>;
}

interface CityBounds {
  lat: number;
  lng: number;
  latDelta: number;
  lngDelta: number;
}

interface GridCell {
  location: string; // "lat,lng"
}

// ─── Map Google Place → LandmarkData ─────────────────────────────────────────

function mapPlaceToLandmark(place: GooglePlaceResult, index: number, apiKey: string): LandmarkData {
  const photoRef = place.photos?.[0]?.photo_reference;
  const address = place.formatted_address ?? place.vicinity;
  return {
    id: place.place_id ?? `lm_${index}`,
    title: place.name ?? `Location ${index}`,
    description: [address, place.rating ? `Rating: ${place.rating}/5` : null]
      .filter(Boolean).join(" • "),
    latitude: place.geometry?.location?.lat ?? 0,
    longitude: place.geometry?.location?.lng ?? 0,
    venue: place.name,
    address,
    image: photoRef
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`
      : undefined,
    category: place.types?.map((t) => CATEGORY_MAP[t]).find(Boolean) ?? "Place",
    url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
  };
}

// ─── Geocode area → bounding box ──────────────────────────────────────────────

// Validate that bounds make sense: lat ∈ [-90, 90], lng ∈ [-180, 180], deltas reasonable
function isValidBounds(bounds: CityBounds): boolean {
  return (
    bounds.lat >= -90 && bounds.lat <= 90 &&
    bounds.lng >= -180 && bounds.lng <= 180 &&
    bounds.latDelta > 0 && bounds.lngDelta > 0 &&
    bounds.latDelta <= 180 && bounds.lngDelta <= 180  // Both deltas max at 180° (hemisphere)
  );
}

async function getCityBounds(area: string, apiKey: string): Promise<CityBounds | null> {
  const cacheKey = `bounds:${area}`;
  const cached = getCached<CityBounds>(cacheKey);
  if (cached) {
    console.log(`[Agent] Bounds cache hit for "${area}":`, cached);
    return cached;
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("address", area);
    url.searchParams.append("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as GoogleGeocodeResponse;

    console.log(`[Agent] Geocode status for "${area}": ${data.status}`);
    if (data.status !== "OK" || !data.results?.[0]) return null;

    const geo = data.results[0].geometry!;
    const box = geo.bounds ?? geo.viewport;

    let bounds: CityBounds;
    if (box) {
      bounds = {
        lat: (box.northeast.lat + box.southwest.lat) / 2,
        lng: (box.northeast.lng + box.southwest.lng) / 2,
        latDelta: Math.abs(box.northeast.lat - box.southwest.lat),
        lngDelta: Math.abs(box.northeast.lng - box.southwest.lng),
      };
    } else {
      bounds = { lat: geo.location!.lat, lng: geo.location!.lng, latDelta: 0.18, lngDelta: 0.18 };
    }

    // Validate bounds — reject invalid coordinates
    if (!isValidBounds(bounds)) {
      console.warn(
        `[Agent] Invalid bounds for "${area}" — raw: ${JSON.stringify(bounds)}, using point fallback`,
      );
      if (geo.location) {
        bounds = { lat: geo.location.lat, lng: geo.location.lng, latDelta: 0.18, lngDelta: 0.18 };
      } else {
        return null;
      }
    }

    console.log(`[Agent] Bounds for "${area}":`, bounds);
    return setCached(cacheKey, bounds);
  } catch (error) {
    console.error("[Agent] Geocoding failed:", error);
    return null;
  }
}

// ─── Build NxN grid cells ─────────────────────────────────────────────────────
//
// Uses a conservative yield of 15 unique results per cell — the realistic
// floor for brand/chain queries (e.g. "KFC") after cross-cell dedup in a
// dense city. Generic queries (e.g. "restaurant") yield more, so this sizing
// deliberately overshoots to guarantee the count target is met.
//
// Grid capacity (cells × 15 unique yield per cell):
//
//   count ≤   15 →  1×1  =   1 cell
//   count ≤   60 →  2×2  =   4 cells
//   count ≤  135 →  3×3  =   9 cells  ← count=100
//   count ≤  240 →  4×4  =  16 cells
//   count ≤  375 →  5×5  =  25 cells  ← count=200, count=300
//   count ≤  540 →  6×6  =  36 cells
//   count ≤  735 →  7×7  =  49 cells  ← count=500
//   count ≤  960 →  8×8  =  64 cells
//   count ≤ 1215 →  9×9  =  81 cells
//   count ≤ 1500 → 10×10 = 100 cells  ← count=1000 (max grid)
//
// No radius (incompatible with rankby=distance).
// No overlap (small cell size makes gaps unlikely; overlap increases dedup waste).

const UNIQUE_YIELD_PER_CELL = 15;
const MAX_GRID_SIZE = 10;

function buildGridCells(bounds: CityBounds, count: number): GridCell[] {
  const cellsNeeded = Math.ceil(count / UNIQUE_YIELD_PER_CELL);
  const rawGridSize = Math.ceil(Math.sqrt(cellsNeeded));
  const gridSize = Math.min(rawGridSize, MAX_GRID_SIZE);

  console.log(
    `[Agent] Grid: ${gridSize}×${gridSize} (${gridSize * gridSize} cells) for count=${count}`,
  );

  const cellLatDelta = bounds.latDelta / gridSize;
  const cellLngDelta = bounds.lngDelta / gridSize;

  console.log(
    `[Agent] Cell size: ${cellLatDelta.toFixed(4)}°lat × ${cellLngDelta.toFixed(4)}°lng` +
    ` (rankby=distance, no radius, no overlap)`,
  );

  const cells: GridCell[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cellLat = bounds.lat - bounds.latDelta / 2 + (row + 0.5) * cellLatDelta;
      const cellLng = bounds.lng - bounds.lngDelta / 2 + (col + 0.5) * cellLngDelta;
      cells.push({ location: `${cellLat.toFixed(6)},${cellLng.toFixed(6)}` });
    }
  }

  return cells;
}

// ─── Fetch one page (nearbysearch, rankby=distance) ───────────────────────────
//
// nearbysearch + rankby=distance returns places nearest to the cell centre
// first, so every cell surfaces a geographically distinct slice of results.
// `type` further tightens relevance for category queries.
// Pages 2/3: only pagetoken + key are recognised by Google.

async function fetchOnePage(
  keyword: string,
  apiKey: string,
  placeType: string | undefined,
  pageToken?: string,
  cell?: GridCell,
): Promise<{ results: LandmarkData[]; nextPageToken?: string }> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.append("key", apiKey);

  if (pageToken) {
    url.searchParams.append("pagetoken", pageToken);
  } else {
    url.searchParams.append("keyword", keyword);
    url.searchParams.append("rankby", "distance");
    if (cell?.location) url.searchParams.append("location", cell.location);
    if (placeType) url.searchParams.append("type", placeType);
  }

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
  const data = (await response.json()) as GooglePlacesResponse;

  if (data.status === "ZERO_RESULTS") return { results: [] };

  if (data.status !== "OK") {
    console.warn(`[Agent] Places status: ${data.status}`, data.error_message ?? "");
    return { results: [] };
  }

  const results = (data.results ?? []).map((p, i) => mapPlaceToLandmark(p, i, apiKey));
  return { results, nextPageToken: data.next_page_token };
}

// ─── Drain all 3 pages for one cell (up to 60 raw results) ───────────────────

async function drainCell(
  keyword: string,
  apiKey: string,
  placeType: string | undefined,
  cell: GridCell | undefined,
): Promise<LandmarkData[]> {
  const collected: LandmarkData[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 3; page++) {
    // ⚠️ Google silently returns empty results if next_page_token is used
    // too quickly — it needs ~2 s to become active server-side.
    if (pageToken) await new Promise((r) => setTimeout(r, 2000));

    try {
      const { results, nextPageToken } = await fetchOnePage(
        keyword, apiKey, placeType, pageToken, cell,
      );
      console.log(
        `[Agent] Page ${page + 1} @ ${cell?.location ?? "global"}: ${results.length} results`,
      );
      collected.push(...results);
      if (!nextPageToken) break;
      pageToken = nextPageToken;
    } catch (error) {
      console.error(`[Agent] Page ${page + 1} failed:`, error);
      break;
    }
  }

  return collected;
}

// ─── Location fallback priority ───────────────────────────────────────────────
// When area is not specified or is vague (e.g., "anywhere", "anywhere in US", etc.),
// or when user provides only a country name, use that country's capital as primary search location.
//
// NOTE: Users MUST provide a city/area for landmark search, not just a country.
// If they provide only a country or vague location, fall back to these defaults.

const LANDMARK_LOCATION_PRIORITY = {
  us: ["New York City, USA", "Geneseo, New York, USA"],
  canada: ["Toronto, Canada", "Vancouver, Canada"],
  default: ["New York City, USA", "Geneseo, New York, USA"],
};

function isVagueLandmarkLocation(area: string): boolean {
  const q = area.toLowerCase().trim();
  return (
    !area ||
    q === "" ||
    q.includes("anywhere")
  );
}

function getLandmarkLocationPriority(area: string): string[] {
  const q = area.toLowerCase().trim();
  if (q.includes("canada")) {
    return LANDMARK_LOCATION_PRIORITY.canada;
  }
  return LANDMARK_LOCATION_PRIORITY.default;
}

// ─── Main landmark search ─────────────────────────────────────────────────────
//
// Fetches all grid cells in parallel (up to CELL_CONCURRENCY at once), then
// merges batches into a global dedup set keyed by place_id.
//
// Handles vague locations (country-only, "anywhere", etc.) by falling back to
// priority cities: NYC → Geneseo → related by distance.
//
// CELL_CONCURRENCY = 5 is safe for the Places API free tier (~10 QPS).
// Raise to 10 on a paid plan with higher quota.

const CELL_CONCURRENCY = 5;

async function searchLandmarksSingleArea(
  query: string,
  area: string,
  count: number,
): Promise<LandmarkData[]> {
  const cacheKey = `landmarks:${query}:${area}:${count}`;
  const cached = getCached<LandmarkData[]>(cacheKey);
  if (cached) {
    console.log(`[Agent] Landmark cache hit: ${cached.length} results`);
    return cached;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
  if (!apiKey) {
    console.warn("[Agent] GOOGLE_MAP_API_KEY not configured");
    return [];
  }

  const placeType = inferPlaceType(query);
  if (placeType) {
    console.log(`[Agent] Inferred place type: "${placeType}" from query "${query}"`);
  }

  // Step 1 — geocode → bounding box
  const bounds = await getCityBounds(area, apiKey);
  if (!bounds) {
    console.warn(`[Agent] No bounds for "${area}" — falling back to single query (max 60)`);
  }

  // Step 2 — build grid (or single fallback cell)
  const cells: Array<GridCell | undefined> = bounds
    ? buildGridCells(bounds, count)
    : [undefined];

  console.log(
    `[Agent] Launching ${cells.length} cell(s) with concurrency=${CELL_CONCURRENCY}`,
  );

  // Step 3 — drain all cells in parallel, then merge into shared dedup set.
  // All cells run to completion so partial batches are never wasted; we just
  // stop inserting once the count target is reached.
  const tasks = cells.map((cell) => async () => {
    try {
      return await drainCell(query, apiKey, placeType, cell);
    } catch (error) {
      console.error(`[Agent] Cell failed (${cell?.location ?? "global"}):`, error);
      return [] as LandmarkData[];
    }
  });

  const batches = await pLimit(tasks, CELL_CONCURRENCY);

  const seenIds = new Set<string>();
  const allResults: LandmarkData[] = [];

  for (const batch of batches) {
    console.log(`[Agent] Merging batch: ${batch.length} raw results`);
    for (const item of batch) {
      if (allResults.length >= count) break;
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allResults.push(item);
      }
    }
    if (allResults.length >= count) break;
  }

  console.log(`[Agent] Done: ${allResults.length} unique results for "${query} in ${area}"`);

  const finalResults = allResults.slice(0, count);
  return setCached(cacheKey, finalResults);
}

async function searchLandmarksViaGooglePlaces(
  query: string,
  area: string,
  count: number,
): Promise<LandmarkData[]> {
  // Handle vague locations with priority fallback
  if (isVagueLandmarkLocation(area)) {
    const priorities = getLandmarkLocationPriority(area);
    console.log(
      `[Agent] Vague landmark location detected "${area}". Trying priority order: ${priorities.join(" → ")}`,
    );

    const allResults: LandmarkData[] = [];
    const seenIds = new Set<string>();

    for (const priorityArea of priorities) {
      if (allResults.length >= count) break;

      const results = await searchLandmarksSingleArea(
        query,
        priorityArea,
        count - allResults.length,
      );

      for (const item of results) {
        if (allResults.length >= count) break;
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allResults.push(item);
        }
      }
    }

    console.log(
      `[Agent] Final merged result for vague location: ${allResults.length} landmarks`,
    );
    return allResults.slice(0, count);
  }

  // For specific city/area searches, search directly
  return searchLandmarksSingleArea(query, area, count);
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const PinItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  url: z.string().optional(),
  image: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  pinCollectionLimit: z.number().int().min(1).optional(),
  pinNumber: z.number().int().min(1).optional(),
  autoCollect: z.boolean().optional(),
  multiPin: z.boolean().optional(),
  radius: z.number().optional(),
}) satisfies z.ZodType<PinItem>;

// ─── Exported tools ───────────────────────────────────────────────────────────

export const agentTools = {
  search_events: tool({
    description:
      "Search the web for real upcoming events of a specific type in a given location. Returns EventData[].",
    parameters: z.object({
      query: z.string().describe("Type of event, e.g. 'music', 'sports', 'festival', 'conference'"),
      count: z.number().int().min(1).max(100).describe("How many events to return (1-100)"),
      area: z.string().describe("Country, city, or area to search, e.g. 'Bangladesh', 'Dhaka', 'USA', 'New York'"),
    }),
    execute: async ({ query, count, area }) => {
      console.log(`[Agent] search_events: query="${query}", area="${area}", count=${count}`);
      try {
        const rawText = await webSearch(
          `top ${query} events in ${area} ${new Date().getFullYear()}`,
        );
        if (!rawText || rawText.length < 50) {
          console.warn(`[Agent] Web search returned insufficient data for "${query} in ${area}"`);
          return { events: [] };
        }
        const events = await parseEvents(rawText, area, count, query);
        return { events };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[Agent] Event search failed: ${errorMsg}`);
        throw new Error(`Event search failed: ${errorMsg}`);
      }
    },
  }),

  search_landmarks: tool({
    description:
      "Search for landmark places (restaurants, cafes, hotels, gyms, parks, hospitals, etc.) using Google Places API. " +
      "REQUIRES a city or area (NOT just a country). " +
      "Dynamically grids the location's bounding box and fetches cells in parallel to reliably hit any count target up to 1000. " +
      "If area is not specified or is vague (e.g., 'anywhere', 'anywhere in US'), defaults to priority order: NYC → Geneseo → related cities. " +
      "Returns LandmarkData[].",
    parameters: z.object({
      query: z.string().describe("Type or name of place, e.g. 'KFC', 'gym', 'restaurant', 'hospital'"),
      count: z.number().int().min(1).max(1000).describe("How many results to return"),
      area: z.string().describe("CITY or AREA required (e.g. 'Dhaka', 'New York', 'Tokyo'). NOT just country. If vague like 'anywhere', defaults to NYC/Geneseo."),
    }),
    execute: async ({ query, count, area }) => {
      console.log(`[Agent] search_landmarks: query="${query}", area="${area}", count=${count}`);
      const landmarks = await searchLandmarksViaGooglePlaces(query, area, count);
      return { landmarks };
    },
  }),

  // ── generate_pins ──────────────────────────────────────────────────────────
  // This tool ONLY validates and echoes the pin payloads back.
  // The actual DB write (locationGroup.create) happens in the router AFTER
  // extractToolData(), so it has access to ctx.db and ctx.session.
  // Keeping DB logic here would require passing ctx into the tool which
  // breaks the stateless tool pattern and causes context window bloat
  // from serialising the full pin array into the LLM response messages.
  generate_pins: tool({
    description:
      "Called after the user confirms all configuration. Validates the final PinItem[] and signals the router to persist them to the database.",
    parameters: z.object({
      pins: z.array(PinItemSchema).describe("Fully configured PinItem array ready for creation"),
    }),
    execute: async ({ pins }) => {
      const invalid = pins.filter(
        (p) => !p.latitude || !p.longitude || p.latitude === 0 || p.longitude === 0,
      );
      if (invalid.length > 0) {
        return {
          success: false,
          error: `${invalid.length} pin(s) have missing coordinates: ${invalid.map((p) => p.title).join(", ")}`,
          pins: [],
          count: 0,
        };
      }
      return { success: true, count: pins.length, pins };
    },
  }),
};