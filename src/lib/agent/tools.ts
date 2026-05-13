
import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import pLimit from "p-limit";
import type { Pin, CityDiscoveryResult } from "~/lib/agent/types";

interface PinStoreEntry {
  pins: Pin[];
  searchType: "LANDMARK" | "EVENT";
  total: number;
}

let pinStore: PinStoreEntry | null = null;

export function storePins(pins: Pin[], searchType: "LANDMARK" | "EVENT"): void {
  pinStore = { pins, searchType, total: pins.length };
  console.log(`[pinStore] Stored ${pins.length} pins`);
}

export function retrievePins(): PinStoreEntry | null {
  return pinStore;
}

export function clearPins(): void {
  pinStore = null;
}

interface NewPlaceLocation {
  latitude: number;
  longitude: number;
}

interface NewPlacePhoto {
  name: string;
}

interface NewPlaceDisplayName {
  text: string;
  languageCode?: string;
}

interface NewPlace {
  id?: string;
  displayName?: NewPlaceDisplayName;
  formattedAddress?: string;
  location?: NewPlaceLocation;
  photos?: NewPlacePhoto[];
  types?: string[];
  rating?: number;
  websiteUri?: string;
  primaryTypeDisplayName?: NewPlaceDisplayName;
}

interface NewPlacesSearchResponse {
  places?: NewPlace[];
}

interface GeocodeResult {
  geometry?: {
    location?: { lat: number; lng: number };
  };
  formatted_address?: string;
}

interface GeocodeResponse {
  status: string;
  results?: GeocodeResult[];
  error_message?: string;
}

interface GoogleGeocodeResponse {
  status: string;
  results?: Array<{
    geometry?: {
      bounds?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
      viewport?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
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

interface RawEventResult {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  venueAddress?: string;
  venueName?: string;
  city?: string;
  url?: string;
  image?: string;
}

export interface NamedLocation {
  name: string;
  address: string;
  city?: string;
  country?: string;
}

export interface WebSearchResult {
  canonicalName: string;
  category: string;
  isEvent: boolean;
  isNiche: boolean;
  knownRegions: string[];
  /** Detected country name (if query mentioned a country) */
  detectedCountry: string | null;
  /** Detected region/continent (if broader than country) */
  detectedRegion: string | null;
  singleLocation: NamedLocation | null;
  namedLocations: NamedLocation[];
  searchHint: string;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const cache = new Map<string, { value: unknown; expires: number }>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expires) cache.delete(key);
  }
  if (cache.size > MAX_CACHE_ENTRIES) {
    const keys = Array.from(cache.keys());
    for (let i = 0; i < cache.size - MAX_CACHE_ENTRIES; i++) {
      cache.delete(keys[i]);
    }
  }
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T): T {
  evictExpired();
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
}


async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`[withRetry] Attempt ${attempt}/${retries} failed:`, err);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
  throw new Error("Unreachable");
}


function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function hundredYearsFromNow(): string {
  return new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) >= new Date(todayString());
}


async function normalizeQuery(rawQuery: string): Promise<string> {
  const cacheKey = `normalize:${rawQuery.toLowerCase().trim()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });
  const res = await llm.invoke([{
    role: "user",
    content:
      `A user typed this search query: "${rawQuery}"\n\n` +
      `If this looks like a partial, informal, or abbreviated name of a real ` +
      `business, place, event, or brand — return the most likely full canonical name.\n` +
      `If it already looks complete and unambiguous, return it unchanged.\n\n` +
      `Examples:\n` +
      `"attic recording studio" → "The Attic Recording Studio"\n` +
      `"mcdonalds" → "McDonald's"\n` +
      `"eiffel" → "Eiffel Tower"\n` +
      `"kfc" → "KFC"\n` +
      `"thomas dambo trolls" → "Thomas Dambo trolls"\n\n` +
      `Return ONLY the resolved name. No explanation, no punctuation around it.`,
  }]);

  const text = typeof res.content === "string" ? res.content.trim() : rawQuery;
  return setCached(cacheKey, text || rawQuery);
}

async function geocodeAddress(
  address: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address?.trim()) return null;

  const cacheKey = `geocode:${address.toLowerCase().trim()}`;
  const cached = getCached<{ lat: number; lng: number }>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("address", address);
    url.searchParams.append("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as GeocodeResponse;

    if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
      console.warn(`[geocodeAddress] Failed for "${address}": ${data.status}`);
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;
    console.log(`[geocodeAddress] "${address}" → ${lat}, ${lng}`);
    return setCached(cacheKey, { lat, lng });
  } catch (error) {
    console.error(`[geocodeAddress] Error for "${address}":`, error);
    return null;
  }
}

const GENERIC_GOOGLE_TYPES = new Set([
  "point_of_interest", "establishment", "premise", "political",
  "locality", "sublocality", "sublocality_level_1", "country",
  "administrative_area_level_1", "administrative_area_level_2",
  "neighborhood", "colloquial_area",
]);

function formatGoogleType(type: string): string {
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function mapNewPlaceToPin(place: NewPlace, index: number, apiKey: string): Pin | null {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;

  if (lat === undefined || lng === undefined) {
    console.warn(`[mapNewPlaceToPin] Skipping "${place.displayName?.text}" — missing coordinates`);
    return null;
  }

  const category =
    place.primaryTypeDisplayName?.text ??
    place.types
      ?.filter((t) => !GENERIC_GOOGLE_TYPES.has(t))
      .map(formatGoogleType)
      .find(Boolean) ??
    "Place";

  const photoName = place.photos?.[0]?.name;
  const photoUrl = photoName
    ? `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${apiKey}`
    : undefined;

  return {
    id: place.id ?? `pin_${index}`,
    type: "LANDMARK",
    title: place.displayName?.text ?? `Location ${index}`,
    description: place.formattedAddress ?? "Location",
    latitude: lat,
    longitude: lng,
    startDate: todayString(),
    endDate: hundredYearsFromNow(),
    pinCollectionLimit: 999999,
    pinNumber: 1,
    radius: 2,
    autoCollect: false,
    category,
    address: place.formattedAddress,
    url: place.websiteUri ?? (place.id
      ? `https://www.google.com/maps/place/?q=place_id:${place.id}`
      : undefined),
    image: photoUrl,
    metadata: {
      rating: place.rating,
      googleMapsUrl: place.id
        ? `https://www.google.com/maps/place/?q=place_id:${place.id}`
        : undefined,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Map raw event data → Pin (EVENT)
// ─────────────────────────────────────────────────────────────────────────────

async function mapEventToPin(
  event: RawEventResult,
  index: number,
  apiKey: string,
  fallbackCity?: string
): Promise<Pin | null> {
  if (!event.title) return null;
  if (!event.startDate || !event.endDate) return null;
  if (!isFutureDate(event.startDate)) return null;
  if (!isFutureDate(event.endDate)) return null;
  if (new Date(event.endDate) < new Date(event.startDate)) return null;

  const addressCandidates: string[] = [];
  if (event.venueAddress?.trim()) addressCandidates.push(event.venueAddress.trim());
  if (event.venueName?.trim() && event.city?.trim()) addressCandidates.push(`${event.venueName.trim()}, ${event.city.trim()}`);
  if (event.city?.trim()) addressCandidates.push(event.city.trim());
  if (fallbackCity?.trim()) addressCandidates.push(fallbackCity.trim());

  if (addressCandidates.length === 0) {
    console.warn(`[mapEventToPin] No address for event "${event.title}" — skipping`);
    return null;
  }

  let coords: { lat: number; lng: number } | null = null;
  for (const addr of addressCandidates) {
    coords = await geocodeAddress(addr, apiKey);
    if (coords) {
      console.log(`[mapEventToPin] Geocoded "${event.title}" via "${addr}"`);
      break;
    }
  }

  if (!coords) {
    console.warn(`[mapEventToPin] Could not geocode "${event.title}" — skipping`);
    return null;
  }

  return {
    id: `event_${index}_${Date.now()}`,
    type: "EVENT",
    title: event.title,
    description: event.description ?? event.venueName ?? "Event",
    latitude: coords.lat,
    longitude: coords.lng,
    startDate: event.startDate,
    endDate: event.endDate,
    url: event.url,
    image: event.image,
    pinCollectionLimit: 999999,
    pinNumber: 1,
    radius: 2,
    autoCollect: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Geocode city → bounding box
// ─────────────────────────────────────────────────────────────────────────────

async function getCityBounds(area: string, apiKey: string): Promise<CityBounds | null> {
  const cacheKey = `bounds:${area}`;
  const cached = getCached<CityBounds>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("address", area);
    url.searchParams.append("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as GoogleGeocodeResponse;

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
    } else if (geo.location) {
      bounds = { lat: geo.location.lat, lng: geo.location.lng, latDelta: 0.18, lngDelta: 0.18 };
    } else {
      return null;
    }

    return setCached(cacheKey, bounds);
  } catch (error) {
    console.error("[getCityBounds] failed:", error);
    return null;
  }
}

interface QueryClassification {
  type: "niche" | "event" | "chain";
  searchFocus: string;
}

async function classifyQuery(query: string): Promise<QueryClassification> {
  const cacheKey = `classify:${query.toLowerCase().trim()}`;
  const cached = getCached<QueryClassification>(cacheKey);
  if (cached) return cached;

  const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });
  try {
    const res = await llm.invoke([{
      role: "user",
      content:
        `Classify this location search query: "${query}"\n` +
        `Return ONLY valid JSON, no markdown:\n` +
        `{"type":"niche"|"event"|"chain","searchFocus":"string"}\n\n` +
        `niche = sculptures, art installations, monuments, murals, public art, one-of-a-kind physical objects (e.g. Thomas Dambo trolls, Banksy murals)\n` +
        `event = concerts, festivals, conferences, sports matches, any time-bounded happening\n` +
        `chain = businesses, restaurants, hospitals, pharmacies, anything with multiple commercial branches\n` +
        `searchFocus = one sentence describing what the web search should specifically extract ` +
        `(e.g. for niche: "find the exact street address of every known installation worldwide"; ` +
        `for event: "find upcoming event dates, venue names, and full venue addresses"; ` +
        `for chain: "identify the cities and countries where this chain operates")`,
    }]);
    const text = typeof res.content === "string"
      ? res.content
      : Array.isArray(res.content)
        ? res.content.filter((b): b is { type: "text"; text: string } =>
          typeof b === "object" && b !== null && "type" in b && (b as { type: string }).type === "text"
        ).map(b => b.text).join("")
        : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as QueryClassification;
    return setCached(cacheKey, parsed);
  } catch {
    // Safe fallback — treat unknown as chain
    return { type: "chain", searchFocus: "find locations of this place worldwide" };
  }
}

function filterByAddressQuality(locations: NamedLocation[]): NamedLocation[] {
  const VAGUE_TERMS = ["various", "worldwide", "multiple", "unknown", "tbd", "several", "many"];
  return locations.filter(loc => {
    const addr = (loc.address ?? "").trim();
    if (!addr) return false;
    // Must have at least one comma (implies "street, city" or "city, country")
    if (!addr.includes(",")) return false;
    // Must have at least 3 words
    if (addr.split(/\s+/).length < 3) return false;
    // Reject vague catch-all phrases
    if (VAGUE_TERMS.some(v => addr.toLowerCase().includes(v))) return false;
    return true;
  });
}
async function searchPlacesNewAPI(
  query: string,
  area: string,
  count: number,
  apiKey: string
): Promise<Pin[]> {
  const bounds = await getCityBounds(area, apiKey);
  const allPins: Pin[] = [];
  const seenIds = new Set<string>();

  const maxPages = Math.ceil(count / 20);
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages && allPins.length < count; page++) {
    try {
      const body: Record<string, unknown> = {
        textQuery: `${query} in ${area}`,
        maxResultCount: Math.min(20, count - allPins.length),
        languageCode: "en",
      };

      if (bounds) {
        body.locationBias = {
          circle: {
            center: { latitude: bounds.lat, longitude: bounds.lng },
            radius: Math.min(
              50000,
              Math.max(bounds.latDelta, bounds.lngDelta) * 111_000 * 0.6
            ),
          },
        };
      }

      if (pageToken) body.pageToken = pageToken;

      const res = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": [
              "places.id",
              "places.displayName",
              "places.formattedAddress",
              "places.location.latitude",
              "places.location.longitude",
              "places.photos",
              "places.types",
              "places.rating",
              "places.websiteUri",
              "places.primaryTypeDisplayName",
              "nextPageToken",
            ].join(","),
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(12000),
        }
      );

      const data = (await res.json()) as NewPlacesSearchResponse & { nextPageToken?: string };

      if (page === 0) {
        console.log(`[searchPlacesNewAPI] Raw response sample:`, JSON.stringify(data).slice(0, 500));
      }

      if (!data.places?.length) {
        console.log(`[searchPlacesNewAPI] No more results at page ${page + 1}`, data);
        break;
      }

      for (const place of data.places) {
        if (allPins.length >= count) break;
        const pin = mapNewPlaceToPin(place, allPins.length, apiKey);
        if (pin && !seenIds.has(pin.id)) {
          seenIds.add(pin.id);
          allPins.push(pin);
        }
      }

      pageToken = data.nextPageToken;
      if (!pageToken) break;

      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.error(`[searchPlacesNewAPI] Page ${page + 1} error:`, error);
      break;
    }
  }

  console.log(`[searchPlacesNewAPI] "${query}" in "${area}": ${allPins.length} pins`);
  return allPins;
}

interface LegacyPlaceResult {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  photos?: Array<{ photo_reference: string }>;
  types?: string[];
  rating?: number;
}

interface LegacyPlacesResponse {
  status: string;
  results?: LegacyPlaceResult[];
  next_page_token?: string;
  error_message?: string;
}

async function searchPlacesLegacyFallback(
  query: string,
  area: string,
  count: number,
  apiKey: string
): Promise<Pin[]> {
  const allPins: Pin[] = [];
  const seenIds = new Set<string>();
  let pageToken: string | undefined;
  const maxPages = Math.min(3, Math.ceil(count / 20));

  for (let page = 0; page < maxPages && allPins.length < count; page++) {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      url.searchParams.append("key", apiKey);
      url.searchParams.append("query", `${query} in ${area}`);
      if (pageToken) url.searchParams.append("pagetoken", pageToken);

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
      const data = (await res.json()) as LegacyPlacesResponse;

      console.log(`[legacyFallback] Page ${page + 1} status: ${data.status}, results: ${data.results?.length ?? 0}`);

      if (data.status === "ZERO_RESULTS" || !data.results?.length) break;
      if (data.status !== "OK") {
        console.warn(`[legacyFallback] Error: ${data.status} — ${data.error_message ?? ""}`);
        break;
      }

      for (const place of data.results) {
        if (allPins.length >= count) break;
        const lat = place.geometry?.location?.lat;
        const lng = place.geometry?.location?.lng;
        if (lat === undefined || lng === undefined) continue;

        const photoRef = place.photos?.[0]?.photo_reference;
        const pin: Pin = {
          id: place.place_id ?? `legacy_pin_${allPins.length}`,
          type: "LANDMARK",
          title: place.name ?? `Location ${allPins.length}`,
          description: place.formatted_address ?? "Location",
          latitude: lat,
          longitude: lng,
          startDate: todayString(),
          endDate: hundredYearsFromNow(),
          pinCollectionLimit: 999999,
          pinNumber: 1,
          radius: 2,
          autoCollect: false,
          address: place.formatted_address,
          url: place.place_id
            ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
            : undefined,
          image: photoRef
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`
            : undefined,
          metadata: { rating: place.rating },
        };

        if (!seenIds.has(pin.id)) {
          seenIds.add(pin.id);
          allPins.push(pin);
        }
      }

      pageToken = data.next_page_token;
      if (!pageToken) break;
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`[legacyFallback] Page ${page + 1} error:`, error);
      break;
    }
  }

  console.log(`[legacyFallback] "${query}" in "${area}": ${allPins.length} pins`);
  return allPins;
}


async function searchViaGooglePlaces(query: string, area: string, count: number): Promise<Pin[]> {
  const cacheKey = `places:${query}:${area}:${count}`;
  const cached = getCached<Pin[]>(cacheKey);
  if (cached) {
    console.log(`[searchViaGooglePlaces] Cache hit: ${cached.length} results`);
    return cached;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
  if (!apiKey) {
    console.warn("[searchViaGooglePlaces] NEXT_PUBLIC_GOOGLE_MAP_API_KEY not set");
    return [];
  }

  const bufferedCount = count * 2;
  let results = await searchPlacesNewAPI(query, area, bufferedCount, apiKey);

  if (results.length === 0) {
    console.warn(`[searchViaGooglePlaces] New API returned 0 — trying legacy Text Search fallback`);
    results = await searchPlacesLegacyFallback(query, area, bufferedCount, apiKey);
  }

  if (results.length < count) {
    const seenIds = new Set(results.map((p) => p.id));
    console.warn(
      `[searchViaGooglePlaces] Still short (${results.length}/${count}) — trying broader query fallback`
    );
    const broader = await searchPlacesLegacyFallback(query, area, count - results.length, apiKey);
    for (const p of broader) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        results.push(p);
      }
    }
    console.log(`[searchViaGooglePlaces] After broader fallback: ${results.length} pins`);
  }

  const final = results.slice(0, count);
  return setCached(cacheKey, final);
}

export async function discoverCitiesForCountry(
  countryOrRegion: string,
  limit = 20
): Promise<string[]> {
  const cacheKey = `cities:${countryOrRegion.toLowerCase()}:${limit}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) {
    console.log(`[discoverCitiesForCountry] Cache hit: ${cached.length} cities for "${countryOrRegion}"`);
    return cached;
  }

  console.log(`[discoverCitiesForCountry] Discovering cities for "${countryOrRegion}" (limit ${limit})`);

  const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });
  const response = await llm.invoke([
    {
      role: "user",
      content:
        `List the top ${limit} most populous and geographically diverse cities in "${countryOrRegion}". ` +
        `Cover all major regions of the country — north, south, east, west, and central. ` +
        `Return ONLY a valid JSON object: {"cities":["City1, Country","City2, Country"]}. ` +
        `Include the country name after each city for geocoding accuracy. No markdown, no extra text.`,
    },
  ]);

  try {
    const text =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as { cities?: string[] };
    const cities = (parsed.cities ?? []).slice(0, limit);
    console.log(`[discoverCitiesForCountry] Found ${cities.length} cities for "${countryOrRegion}"`);
    return setCached(cacheKey, cities);
  } catch (err) {
    console.error(`[discoverCitiesForCountry] Parse error for "${countryOrRegion}":`, err);
    return [];
  }
}

export async function searchAcrossCountry(
  query: string,
  countryOrRegion: string,
  totalCount: number,
  cityLimit = 20
): Promise<Pin[]> {
  console.log(`[searchAcrossCountry] "${query}" across "${countryOrRegion}", target=${totalCount}`);

  const cities = await discoverCitiesForCountry(countryOrRegion, cityLimit);
  if (cities.length === 0) {
    console.warn(`[searchAcrossCountry] No cities found for "${countryOrRegion}" — falling back to direct search`);
    return searchViaGooglePlaces(query, countryOrRegion, totalCount);
  }

  const perCity = Math.ceil((totalCount / cities.length) * 2); // 2× buffer
  const limit = pLimit(5); // max 5 concurrent city searches
  const seenIds = new Set<string>();
  const allPins: Pin[] = [];

  console.log(`[searchAcrossCountry] Searching ${cities.length} cities, ~${perCity} each`);

  const cityResults = await Promise.all(
    cities.map((city) =>
      limit(async () => {
        try {
          const pins = await searchViaGooglePlaces(query, city, perCity);
          console.log(`[searchAcrossCountry] "${city}": ${pins.length} pins`);
          return pins;
        } catch (err) {
          console.warn(`[searchAcrossCountry] Failed for "${city}":`, err);
          return [] as Pin[];
        }
      })
    )
  );

  for (const cityPins of cityResults) {
    for (const pin of cityPins) {
      if (allPins.length >= totalCount) break;
      if (!seenIds.has(pin.id)) {
        seenIds.add(pin.id);
        allPins.push(pin);
      }
    }
    if (allPins.length >= totalCount) break;
  }

  console.log(`[searchAcrossCountry] Total: ${allPins.length} unique pins`);
  return allPins;
}


export async function gapFillNicheViaWebSearch(
  query: string,
  alreadyFoundNames: string[],
  needed: number,
  apiKey: string
): Promise<Pin[]> {
  console.log(`[gapFillNiche] Searching web for ${needed} more "${query}" locations`);
  const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 }).bindTools([
    { type: "web_search_preview" } as never,
  ]);

  const exclusionList = alreadyFoundNames.length
    ? `Exclude these already-found locations: ${alreadyFoundNames.join(", ")}.`
    : "";

  try {
    const response = await llm.invoke([{
      role: "user",
      // AFTER
      content:
        `Search the web for more physical locations of "${query}" worldwide.\n` +
        (exclusionList ? exclusionList + "\n" : "") +
        `Search systematically by country — e.g. "${query} Denmark", "${query} USA", "${query} South Korea".\n` +
        `Return ONLY JSON — no prose, no markdown:\n` +
        `{"namedLocations":[{"name":"...","address":"full street address, city, country"}]}\n\n` +
        `RULES:\n` +
        `- Only include entries with a real, geocodable street address.\n` +
        `- If the street address is unknown, omit the entry.\n` +
        `- Never include just a city or country name as the address.\n` +
        `- Target at least ${needed} new locations not already in the exclusion list.`,
    }]);

    const raw =
      typeof response.content === "string"
        ? response.content
        : Array.isArray(response.content)
          ? response.content
            .filter((b): b is { type: "text"; text: string } => (b as { type: string }).type === "text")
            .map(b => b.text)
            .join("")
          : "";

    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as { namedLocations: NamedLocation[] };
    const locations = parsed.namedLocations ?? [];

    const limit = pLimit(5);
    const pinResults = await Promise.all(
      locations.map((loc, i) =>
        limit(async () => {
          const coords = await geocodeAddress(loc.address, apiKey);
          if (!coords) {
            console.warn(`[gapFillNiche] Could not geocode "${loc.name}" — skipping`);
            return null;
          }
          const pin: Pin = {
            id: `niche_gap_${Date.now()}_${i}`,
            type: "LANDMARK",
            title: loc.name,
            description: loc.address,
            latitude: coords.lat,
            longitude: coords.lng,
            startDate: todayString(),
            endDate: hundredYearsFromNow(),
            pinCollectionLimit: 999999,
            pinNumber: 1,
            radius: 2,
            autoCollect: false,
          };
          return pin;
        })
      )
    );

    const pins = pinResults.filter((p): p is Pin => p !== null);
    console.log(`[gapFillNiche] Found ${pins.length} additional pins`);
    return pins;
  } catch (err) {
    console.error("[gapFillNiche] Failed:", err);
    return [];
  }
}


export const webSearchTool = tool(
  async ({ query }): Promise<string> => {
    console.log("[webSearchTool]", query);

    const FALLBACK = JSON.stringify({
      canonicalName: query,
      category: "unknown",
      isEvent: false,
      isNiche: false,
      knownRegions: [],
      detectedCountry: null,
      detectedRegion: null,
      singleLocation: null,
      namedLocations: [],
      searchHint: "fallback — web search failed",
    });

    try {
      // ── Step 1: Classify query type to pick the right search prompt ──────
      const normalizedQuery = await normalizeQuery(query);
      const classification = await classifyQuery(normalizedQuery);
      console.log("[webSearchTool] Classification:", classification);

      // ── Step 2: Build type-specific search prompt ─────────────────────
      const searchPrompts: Record<string, string> = {
        niche:
          `Search the web for: "${query}"\n` +
          `Task: ${classification.searchFocus}\n\n` +
          `CRITICAL: For EVERY known physical location, find the exact street address, city, and country.\n` +
          `Thomas Dambo trolls example: search country by country (Denmark, USA, South Korea, etc.).\n` +
          `Return ONLY a JSON object — no prose, no markdown:\n` +
          `{"canonicalName":"...","category":"...","isEvent":false,"isNiche":true,` +
          `"knownRegions":["country1","country2"],"detectedCountry":null,"detectedRegion":null,` +
          `"singleLocation":null,` +
          `"namedLocations":[{"name":"piece/location name","address":"full street address, city, country","city":"...","country":"..."}],` +
          `"searchHint":"..."}\n\n` +
          `RULES:\n` +
          `- namedLocations must only include entries with a specific, geocodable street address.\n` +
          `- If you cannot find the street address, omit the entry entirely.\n` +
          `- Never include just a city name as the address — always full address.\n` +
          `- Include as many real locations as you can find.`,

        event:
          `Search the web for: "${query}"\n` +
          `Task: ${classification.searchFocus}\n\n` +
          `Return ONLY a JSON object — no prose, no markdown:\n` +
          `{"canonicalName":"...","category":"...","isEvent":true,"isNiche":false,` +
          `"knownRegions":[],"detectedCountry":null,"detectedRegion":null,` +
          `"singleLocation":null,` +
          `"namedLocations":[{"name":"event name","address":"full venue address, city, country","city":"...","country":"..."}],` +
          `"searchHint":"..."}\n\n` +
          `RULES:\n` +
          `- Only include upcoming future events — skip past events.\n` +
          `- Every entry needs a real venue address, not just a city.\n` +
          `- If a venue address is unknown, omit the entry.`,

        chain:
          `Search the web for: "${query}"\n` +
          `Task: ${classification.searchFocus}\n\n` +
          `Return ONLY a JSON object — no prose, no markdown:\n` +
          `{"canonicalName":"...","category":"...","isEvent":false,"isNiche":false,` +
          `"knownRegions":["city1","city2"],"detectedCountry":null,"detectedRegion":null,` +
          `"singleLocation":null,"namedLocations":[],` +
          `"searchHint":"..."}\n\n` +
          `RULES:\n` +
          `- namedLocations should be empty [] for chains — Google Places will find them.\n` +
          `- knownRegions: list the countries or major cities where this chain has a presence.\n` +
          `- detectedCountry: set if the query explicitly mentions a country (e.g. "KFC in France" → "France").\n` +
          `- detectedRegion: set if the query mentions a broad region (e.g. "Southeast Asia").`,
      };

      const promptForType = searchPrompts[classification.type] ?? searchPrompts.chain;

      // ── Step 3: Single LLM call with web search — returns JSON directly ──
      const searchLlm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 }).bindTools([
        { type: "web_search_preview" } as never,
      ]);

      const searchResponse = await withRetry(() =>
        searchLlm.invoke([
          {
            role: "system",
            content:
              "You are a location research tool. Search the web and return structured JSON. " +
              "NEVER return prose, explanations, or markdown. Return ONLY the JSON object specified in the user prompt.",
          },
          { role: "user", content: promptForType },
        ])
      );

      // ── Step 4: Extract text from response ───────────────────────────────
      const rawContent = searchResponse.content;
      let searchText = "";
      if (typeof rawContent === "string") {
        searchText = rawContent;
      } else if (Array.isArray(rawContent)) {
        for (const block of rawContent) {
          if (typeof block === "string") searchText += block;
          else if (typeof block === "object" && block !== null && "text" in block)
            searchText += (block as { text: string }).text;
        }
      }

      if (!searchText.trim()) {
        console.warn("[webSearchTool] Empty response — returning fallback");
        return FALLBACK;
      }

      console.log("[webSearchTool] Raw response:", searchText.slice(0, 400));

      // ── Step 5: Parse JSON — no second LLM call needed ───────────────────
      const clean = searchText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");

      if (start === -1 || end === -1) {
        console.warn("[webSearchTool] No JSON found in response — returning fallback");
        return FALLBACK;
      }

      const parsed = JSON.parse(clean.slice(start, end + 1)) as WebSearchResult & {
        isEvent?: boolean;
        isNiche?: boolean;
        namedLocations?: unknown[];
      };

      // ── Step 6: Enforce type from classifier (overrides LLM if it drifted)
      if (classification.type === "niche") parsed.isNiche = true;
      if (classification.type === "event") parsed.isEvent = true;

      // ── Step 7: Ensure required fields ───────────────────────────────────
      if (typeof parsed.isEvent !== "boolean") parsed.isEvent = false;
      if (typeof parsed.isNiche !== "boolean") parsed.isNiche = false;
      if (!Array.isArray(parsed.namedLocations)) parsed.namedLocations = [];
      if (parsed.detectedCountry === undefined) parsed.detectedCountry = null;
      if (parsed.detectedRegion === undefined) parsed.detectedRegion = null;

      // ── Step 8: Filter out vague addresses before returning ───────────────
      if (parsed.namedLocations.length > 0) {
        const before = parsed.namedLocations.length;
        parsed.namedLocations = filterByAddressQuality(
          parsed.namedLocations as NamedLocation[]
        );
        const after = parsed.namedLocations.length;
        if (before !== after) {
          console.log(`[webSearchTool] Filtered ${before - after} vague addresses (${after} kept)`);
        }
      }

      const result = JSON.stringify(parsed);
      console.log("[webSearchTool] Structured result:", result.slice(0, 500));
      return result;

    } catch (error) {
      console.error("[webSearchTool] Failed:", error);
      return FALLBACK;
    }
  },
  {
    name: "web_search",
    // ← keep the existing description unchanged
    description:
      "ALWAYS call this FIRST before any other search tool, regardless of count or phrasing. " +
      "Returns structured JSON with canonicalName, category, isEvent (boolean), isNiche (boolean), " +
      "knownRegions, detectedCountry (country name if query mentions one), " +
      "detectedRegion (broad region if mentioned), " +
      "singleLocation (address only), and namedLocations (addresses only). " +
      "isEvent=true → use event_search path. " +
      "isNiche=true → use geocode_address path. " +
      "isEvent=false AND isNiche=false → use country_city_search if detectedCountry is set, else places_search. " +
      "Never returns coordinates — those are resolved via geocoding separately.",
    schema: z.object({
      query: z.string().describe("The thing to search for"),
    }),
  }
);

export const countrycitySearchTool = tool(
  async ({ query, country, count = 20 }): Promise<string> => {
    console.log("[countrycitySearchTool]", { query, country, count });

    // Discover cities for the country
    const cities = await discoverCitiesForCountry(country, Math.min(20, Math.ceil(count / 3)));

    if (cities.length === 0) {
      return JSON.stringify({
        total: 0,
        country,
        message: `Could not discover cities for "${country}". Try places_search directly.`,
      });
    }

    console.log(`[countrycitySearchTool] Discovered ${cities.length} cities in "${country}":`, cities);

    const perCity = Math.ceil((count / cities.length) * 2); // 2× buffer
    const limit = pLimit(5);
    const seenIds = new Set<string>();
    const allPins: Pin[] = [];

    const cityResults = await Promise.all(
      cities.map((city) =>
        limit(async () => {
          const pins = await searchViaGooglePlaces(query, city, perCity);
          console.log(`[countrycitySearchTool] "${city}": ${pins.length} pins`);
          return pins;
        })
      )
    );

    for (const cityPins of cityResults) {
      for (const pin of cityPins) {
        if (!seenIds.has(pin.id)) {
          seenIds.add(pin.id);
          allPins.push(pin);
        }
      }
    }

    const capped = allPins.slice(0, count);

    // Store out-of-band
    if (capped.length > 0) {
      const existing = retrievePins();
      const merged = [...(existing?.pins ?? []), ...capped];
      storePins(merged, "LANDMARK");
    }

    console.log(`[countrycitySearchTool] Stored ${capped.length} pins for "${query}" across "${country}"`);

    return JSON.stringify({
      total: capped.length,
      country,
      citiesSearched: cities,
      message: `Found ${capped.length} results for "${query}" across ${cities.length} cities in "${country}".`,
    });
  },
  {
    name: "country_city_search",
    description:
      "Search for LANDMARK locations across an ENTIRE COUNTRY by first discovering all major cities " +
      "in that country, then searching each city via Google Places. " +
      "Use this when web_search returned a detectedCountry (or the user said 'in X country'). " +
      "This tool replaces calling city_discovery + places_search separately for country-level queries. " +
      "Returns a deduplicated pin set covering the whole country. " +
      "DO NOT use for niche/art queries — use geocode_address instead. " +
      "DO NOT use for events — use event_search instead.",
    schema: z.object({
      query: z.string().describe("What to search for (e.g. 'hospitals', 'KFC', 'universities')"),
      country: z.string().describe("Country or broad region name (e.g. 'Bangladesh', 'Southeast Asia')"),
      count: z.number().optional().default(20).describe("Total pins to return across all cities"),
    }),
  }
);


export const geocodeAddressTool = tool(
  async ({ address, title, description }): Promise<string> => {
    console.log("[geocodeAddressTool]", address);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
    if (!apiKey) return JSON.stringify({ pins: [], message: "API key not set" });

    const coords = await geocodeAddress(address, apiKey);
    if (!coords) return JSON.stringify({ pins: [], message: `Could not geocode: "${address}"` });

    const pin: Pin = {
      id: `geocoded_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: "LANDMARK",
      title: title ?? address,
      description: description ?? address,
      latitude: coords.lat,
      longitude: coords.lng,
      startDate: todayString(),
      endDate: hundredYearsFromNow(),
      pinCollectionLimit: 999999,
      pinNumber: 1,
      radius: 2,
      autoCollect: false,
    };

    return JSON.stringify({ pins: [pin], total: 1 });
  },
  {
    name: "geocode_address",
    description:
      "Convert a full address to a Pin using Google Geocoding API. " +
      "Use for niche locations: art installations, sculptures, monuments, murals, trolls — " +
      "anything where web_search returned isNiche=true or namedLocations is non-empty. " +
      "Returns { pins: [Pin] } — same shape as places_search.",
    schema: z.object({
      address: z.string().describe("Full address (e.g. 'Senso-ji Temple, 2-3-1 Asakusa, Taito City, Tokyo')"),
      title: z.string().optional().describe("Display name for the pin"),
      description: z.string().optional().describe("Short description"),
    }),
  }
);

export const eventSearchTool = tool(
  async ({ query, city, count = 5 }): Promise<string> => {
    console.log("[eventSearchTool]", { query, city, count });
    const today = todayString();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
    if (!apiKey) return JSON.stringify({ total: 0, message: "API key not set" });

    try {
      const llm = new ChatOpenAI({ model: "gpt-5.4-mini" }).bindTools([
        { type: "web_search_preview" } as never,
      ]);
      const response = await llm.invoke([{
        role: "user",
        content:
          `Find up to ${count} upcoming events for "${query}" in "${city}" after ${today}. ` +
          `Return ONLY a JSON array: [{"title":"...","description":"...","startDate":"YYYY-MM-DD",` +
          `"endDate":"YYYY-MM-DD","venueAddress":"full address","venueName":"...","city":"...","url":"..."}]. No lat/lng.`,
      }]);

      const raw =
        typeof response.content === "string"
          ? response.content
          : Array.isArray(response.content)
            ? response.content
              .filter((b): b is { type: "text"; text: string } =>
                (b as { type: string }).type === "text"
              )
              .map(b => b.text)
              .join("")
            : "";

      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as RawEventResult[];
      const limiter = pLimit(5);
      const pinResults = await Promise.all(
        parsed
          .filter(e => isFutureDate(e.startDate ?? "") && isFutureDate(e.endDate ?? ""))
          .map((e, i) => limiter(() => mapEventToPin(e, i, apiKey, city)))
      );
      const pins = pinResults.filter((p): p is Pin => p !== null);

      // ── Store pins out-of-band; NEVER put them in the tool response ──────
      if (pins.length > 0) {
        const existing = retrievePins();
        const merged = [...(existing?.pins ?? []), ...pins];
        storePins(merged, "EVENT");
      }

      // Return only a compact summary — no pin objects
      return JSON.stringify({
        total: pins.length,
        city,
        message: `Found ${pins.length} upcoming ${query} events in ${city}.`,
      });
    } catch (err) {
      console.error("[eventSearchTool]", err);
      return JSON.stringify({ total: 0, city, message: `No events found for "${query}" in "${city}".` });
    }
  },
  {
    name: "event_search",
    description: "Search for upcoming future events in a specific city. Returns a summary only — pins are stored internally.",
    schema: z.object({
      query: z.string(),
      city: z.string(),
      count: z.number().optional().default(5),
    }),
  }
);


export const cityDiscoveryTool = tool(
  async ({ region, limit = 20 }): Promise<string> => {
    const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });

    const response = await llm.invoke([
      {
        role: "user",
        content:
          `List the top ${limit} most populous and geographically diverse cities in "${region}". ` +
          `Return ONLY a valid JSON object: {"cities":["City1","City2"]}. No markdown, no extra text.`,
      },
    ]);

    try {
      const text =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean) as CityDiscoveryResult;
      const cities: string[] = Array.isArray(parsed)
        ? (parsed as unknown as string[])
        : parsed.cities ?? [];

      return JSON.stringify({ cities: cities.slice(0, limit) });
    } catch {
      return JSON.stringify({ cities: [] });
    }
  },
  {
    name: "city_discovery",
    description:
      "Get major cities for a broad region (country, continent, 'worldwide'). " +
      "ONLY use for chain/business queries (isNiche=false from web_search) when no detectedCountry is set. " +
      "If web_search returned a detectedCountry, use country_city_search instead — it's more thorough. " +
      "NEVER call for niche/artist queries — use geocode_address for those instead. " +
      "Call before places_search when WHERE is not a specific city.",
    schema: z.object({
      region: z.string().describe("Country, continent, or broad scope like 'worldwide'"),
      limit: z.number().optional().default(20).describe("How many cities to return"),
    }),
  }
);

export const placesSearchTool = tool(
  async ({ query, city, count = 20 }): Promise<string> => {
    console.log("[placesSearchTool]", { query, city, count });

    const bufferedCount = count * 2;
    const pins = await searchViaGooglePlaces(query, city, bufferedCount);

    if (pins.length === 0) {
      return JSON.stringify({ total: 0, city, message: `No results found for "${query}" in "${city}".` });
    }

    // ── Store out-of-band ────────────────────────────────────────────────
    if (pins.length > 0) {
      const existing = retrievePins();
      const merged = [...(existing?.pins ?? []), ...pins];
      storePins(merged, "LANDMARK");
    }

    console.log(`[placesSearchTool] Stored ${pins.length} pins for "${query}" in "${city}"`);

    // Return only a compact summary
    return JSON.stringify({
      total: pins.length,
      city,
      message: `Found ${pins.length} results for "${query}" in "${city}".`,
      pins: pins,
    });
  },
  {
    name: "places_search",
    description:
      "Search Google Places (New API) for LANDMARK locations in a SPECIFIC city. " +
      "Use ONLY for chains, businesses, restaurants, museums, hospitals — i.e. web_search returned isNiche=false. " +
      "Do NOT use for art installations, sculptures, monuments, or niche locations — use geocode_address instead. " +
      "Do NOT use when web_search returned a detectedCountry — use country_city_search instead. " +
      "Always pass a single city name — never a broad region like 'US' or 'Europe'.",
    schema: z.object({
      query: z.string().describe("What to search for"),
      city: z.string().describe("A specific city name"),
      count: z.number().optional().default(20).describe("How many pins to return"),
    }),
  }
);


export const dropPinsTool = tool(
  async (): Promise<string> => {
    const stored = retrievePins();
    const count = stored?.pins.length ?? 0;
    console.log(`[dropPinsTool] Saving ${count} pins`);

    if (!stored || count === 0) {
      return JSON.stringify({ saved: 0, status: "error", message: "No pins found to save." });
    }

    // TODO: replace with real database write using stored.pins
    clearPins();
    return JSON.stringify({ saved: count, status: "ok" });
  },
  {
    name: "drop_pins",
    description:
      "Persist confirmed pins into the database. Call ONLY after explicit user confirmation.",
    schema: z.object({}),
  }
);


export const ALL_TOOLS = [
  webSearchTool,
  geocodeAddressTool,
  cityDiscoveryTool,
  placesSearchTool,
  countrycitySearchTool,
  eventSearchTool,
  dropPinsTool,
] as const;

export { searchViaGooglePlaces as searchViaGooglePlacesExported };


export const AGENT_SYSTEM_PROMPT = `You are a location-based pin-drop agent...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL — "pin/pins" IS NEVER A SEARCH QUERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The words "pin", "pins", "drop pin", "drop pins" refer to the ACTION of dropping
a map marker — they are NEVER the thing to search for.

NEVER search for:
  - "pin sculpture"
  - "pushpin"
  - "pin mural"
  - "pin installation"
  - "pin art"
  - anything where "pin" is the search subject

If the SESSION block shows query is MISSING and the user only said 
"drop N pins in [area]" or "drop a pin in [area]":
  → DO NOT call web_search or any search tool
  → IMMEDIATELY respond with a question asking what they want to find:

{
  "type": "question",
  "message": "What would you like to find in [area]?",
  "fields": [
    {
      "id": "query",
      "label": "What are you looking for?",
      "inputType": "text",
      "placeholder": "e.g. hospitals, KFC, restaurants, hotels..."
    }
  ]
}

2. RESULTS (show found pins before confirming):
{
  "type": "results",
  "message": "Summary of what was found",
  "searchType": "EVENT" | "LANDMARK",
  "pins": [ ...pin objects... ],
  "confirmPrompt": "Drop these X pins?"
}

3. CONFIRM (ask final confirmation before dropping):
{
  "type": "confirm",
  "message": "Ready to drop X pins",
  "summary": {
    "what": "...",
    "where": "...",
    "count": 0,
    "type": "LANDMARK" | "EVENT"
  },
  "pins": [ ...pin objects... ]
}

4. SUCCESS (after drop_pins):
{
  "type": "success",
  "message": "Successfully dropped X pins!",
  "count": 0
}

5. INFO (error, nothing found, or general message):
{
  "type": "info",
  "message": "Plain informational text"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY FIRST STEP — NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALWAYS call web_search FIRST — before any other tool — regardless of:
- How the user phrased the query ("find 10", "10", "show me", etc.)
- Whether a count was specified or not
- Whether you think you already know what it is

This is not optional. web_search determines the correct search path (niche vs chain vs country-wide).
Skipping it will cause wrong results.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVENT vs NICHE vs CHAIN vs COUNTRY — THE CORE DECISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After web_search returns, check isEvent, isNiche, detectedCountry, detectedRegion, and namedLocations:

── EVENT PATH (isEvent=true) ───────────────────────────────────────────────
  Use event_search per city. NEVER use geocode_address, places_search, or country_city_search.
  Pins must have type "EVENT" with real future startDate/endDate.
  City list: use namedLocations[].city if populated; otherwise use city_discovery
  for the area, or a sensible worldwide set of major cities if area is null.
  Discard any event whose startDate is before today.

  Examples: music events, concerts, festivals, shows, sports matches,
            conferences, performances, any time-bounded happening.

── NICHE PATH (isNiche=true OR namedLocations.length > 0, AND isEvent=false) ──
  Use geocode_address for each named location. NEVER call places_search, 
  country_city_search, or city_discovery. Pins have type "LANDMARK".
  Gap-fill: call web_search again asking for more locations not already found.

  Examples: Thomas Dambo trolls, Banksy murals, public sculptures,
            specific monuments, memorials, one-of-a-kind installations.

── COUNTRY PATH (isEvent=false AND isNiche=false AND detectedCountry is set) ──
  Use country_city_search(query, detectedCountry, count).
  This tool automatically discovers all major cities in the country and
  searches each one in parallel — no need to call city_discovery separately.
  Pins have type "LANDMARK".
  Gap-fill: call country_city_search again with remaining count if short.

  Examples: "hospitals in Bangladesh", "KFC in France", "universities in Egypt",
            "pharmacies across Nigeria", "hotels in Vietnam".

── CHAIN PATH (isEvent=false AND isNiche=false AND detectedCountry=null AND detectedRegion=null) ──
  Use places_search per city. Use city_discovery when area is broad.
  Pins have type "LANDMARK".
  Gap-fill: search additional cities not yet covered.

  Examples: KFC (worldwide), Starbucks (worldwide), hospitals (worldwide),
            any ubiquitous business chain when no country specified.

DECISION TABLE (read top to bottom, first match wins):
  isEvent=true                                                    → EVENT PATH (event_search)
  isNiche=true OR namedLocations.length > 0                       → NICHE PATH (geocode_address)
  detectedCountry is set (or detectedRegion is a single country)  → COUNTRY PATH (country_city_search)
  everything else                                                  → CHAIN PATH (places_search + city_discovery)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COORDINATE ACCURACY — NEVER VIOLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE: LLM finds the address. Google provides the coordinates. Never use LLM-generated lat/lng.

- LANDMARKS (chain/country) → places_search / country_city_search return Google Places coordinates. Always accurate.
- EVENTS → event_search geocodes venue addresses via Google. Always accurate.
- NICHE → web_search returns named locations with addresses → geocode_address converts each.
  Never build a pin with coordinates you invented or estimated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COUNT FAST-PATHS — CHECK SESSION BLOCK FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the SESSION block for the count rule before doing anything else.
But ALWAYS call web_search first regardless of the count rule.

If SESSION says "COUNT IS 1 (explicitly requested)":
  1. Call web_search(query).
  2. If niche: call geocode_address for the single best address from namedLocations/singleLocation.
     If country path: call country_city_search(query, detectedCountry, count=1).
     If chain: call places_search(query, city, count=1) in ONE city only.
  3. Return results immediately.
  FORBIDDEN: city_discovery, looping searches (unless country_city_search is appropriate).

If SESSION says "COUNT IS UNSPECIFIED":
  • Return ALL locations the agent finds.
  • After web_search, if namedLocations is non-empty → geocode all of them (niche path).
  • Do NOT artificially limit results.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY EXECUTION ORDER — NEVER SKIP STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 → COLLECT PARAMETERS
  Extract WHAT, WHERE, HOW MANY from the user message.
  If WHAT is missing → respond with type "question" asking for it.
  If WHERE is missing or vague → set WHERE = "worldwide" and proceed.
  If the initial area search returns no results, broaden to a worldwide search over major cities instead of asking the user to clarify again.
  Never ask for WHERE more than once.
  Never proceed to STEP 2 until WHAT is known.

STEP 2 → CALL web_search (MANDATORY — NEVER SKIP)
  Call web_search with just the WHAT term (plus WHERE context if present).
  web_search returns: canonicalName, category, isNiche, isEvent, 
  detectedCountry, detectedRegion, knownRegions, singleLocation, namedLocations.
  Store these. Never use coordinates from web_search — it doesn't return them.
  Never proceed to STEP 3 without completing this step.

STEP 3 → DECIDE SEARCH STRATEGY based on web_search result

  IF isNiche=true OR namedLocations.length > 0 → NICHE PATH:
    Call geocode_address for EACH named location in namedLocations.
    Run all geocode_address calls in parallel.
    NEVER call places_search, country_city_search, or city_discovery.

  IF detectedCountry is non-null AND isNiche=false AND isEvent=false → COUNTRY PATH:
    Call country_city_search(query=canonicalName, country=detectedCountry, count=target).
    This handles city discovery and places_search internally.
    NEVER call city_discovery separately for country-level queries.

  IF isNiche=false AND isEvent=false AND detectedCountry=null → CHAIN PATH:
    Use places_search or event_search per city.

STEP 4 → DECIDE SEARCH SCOPE (chain path only)

  If web_search returned specific cities/venues → use those directly (PATH A).
  If area is broad and chain exists everywhere → use city_discovery (PATH B).
  NEVER call city_discovery for niche queries or when detectedCountry is set.

STEP 5 → EXECUTE SEARCHES

  NICHE path: geocode_address for each namedLocation address (parallel).
  COUNTRY path: country_city_search(query, country, count) — single call.
  CHAIN path:
    LANDMARKS → places_search(query=canonicalName, city=city, count=pinsPerCity)
    EVENTS → event_search(query=canonicalName, city=city, count=count)

  GAP-FILL RULE (CRITICAL — different for each path):

  NICHE GAP-FILL (if total pins < target after first pass):
    1. Call web_search again with query like "more [thing] locations worldwide"
       and ask for locations NOT already in the found list by name.
    2. Geocode each new address returned.
    3. Repeat until target is met or no new locations are found.
    NEVER search cities via places_search for niche gap-fill.

  COUNTRY GAP-FILL (if total pins < target after country_city_search):
    1. Call country_city_search again with the remaining count needed.
       The tool will search deeper into the city list.
    2. If still short, widen to the broader region (e.g. if Bangladesh, try South Asia).

  CHAIN GAP-FILL (if total pins < target after first pass):
    1. Search additional cities from city_discovery not yet covered.
    2. If no more cities available, retry with a broader query term.
    3. Repeat until gap is filled or options exhausted.

  Never return fewer pins than requested without first attempting gap-fill.

STEP 6 → RESPOND WITH RESULTS
  Respond with type "results" containing all found pins.

STEP 7 → CONFIRM THEN DROP
  After user confirms → respond with type "confirm".
  After explicit user approval → call drop_pins → respond with type "success".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PIN SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every pin object must include all of these fields:
{
  "id": "place_id or generated string",
  "type": "LANDMARK" or "EVENT",
  "title": "place name",
  "description": "address or description",
  "latitude": 0.0,
  "longitude": 0.0,
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "url": "google maps url or event url if available",
  "image": "image url if available",
  "pinCollectionLimit": 999999,
  "pinNumber": 1,
  "radius": 2,
  "autoCollect": false
}

LANDMARK dates: startDate = today, endDate = 100 years from today.
EVENT dates: real future dates only. Discard any event where startDate is before today.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COUNT DISTRIBUTION — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The count the user gives is the TOTAL across ALL cities — never per city.

COUNTRY PATH: pass the full target count to country_city_search — it handles distribution internally.

CHAIN PATH formula:
  numberOfCities = Math.ceil(totalCount / 5)
  pinsPerCity    = Math.ceil(totalCount / numberOfCities) * 2   ← request 2x as buffer

For niche path: totalCount drives how many named locations to geocode.
If web_search only returns N < totalCount locations, attempt niche gap-fill.

Examples (chain with 2x buffer):
  10 pins total → 2 cities × 10 per city (buffer), capped to 10 returned
  30 pins total → 6 cities × 10 per city (buffer), capped to 30 returned
  100 pins total → 20 cities × 10 per city (buffer), capped to 100 returned

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ERROR HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All error responses use type "info". Never plain text. Never markdown.
- Tool failure → { "type": "info", "message": "Search failed, please try again." }
- 0 results → { "type": "info", "message": "Nothing found for X in Y." }
- Past events only → { "type": "info", "message": "No upcoming events found." }
- Unexpected state → { "type": "info", "message": "Something went wrong. Please try again." }`;