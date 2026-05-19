import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import pLimit from "p-limit";
import type { Pin, CityDiscoveryResult } from "~/lib/agent/types";

// ═══════════════════════════════════════════════════════════════════════════════
// PIN STORE  (unchanged — keeps out-of-band pin state)
// ═══════════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** The five data-type buckets that drive the entire pipeline. */
export type QueryType =
  | "official_list"       // National parks, UNESCO sites — one authoritative source
  | "niche_scattered"     // Dambo trolls, Banksy murals — scattered across many sources
  | "commercial_brand"    // KFC, Starbucks — single brand, geographic fan-out
  | "commercial_category" // "restaurants", "hospitals" — subcategory + geographic fan-out
  | "event";              // Concerts, festivals — time-bounded

export interface QueryClassification {
  type: QueryType;
  backboneSearchQuery: string | null;
  fanOutAxis1: "geography" | "subcategory" | "country" | "source_type" | "none";
  fanOutAxis2: "geography" | "subcategory" | "source_type" | "none";
  estimatedTotal: number | null;
  countries: string[];
  subcategories: string[];
  searchFocus: string;
}

export interface NamedLocation {
  name: string;
  address: string;
  city?: string;
  country?: string;
}

export interface BackboneResult {
  locations: NamedLocation[];
  source: string | null;
  rawExcerpt?: string;
}

interface NewPlaceLocation { latitude: number; longitude: number; }
interface NewPlacePhoto { name: string; }
interface NewPlaceDisplayName { text: string; languageCode?: string; }

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
  nextPageToken?: string;
}

interface GeocodeResult {
  geometry?: { location?: { lat: number; lng: number } };
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

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try { return await fn(); } catch (err) {
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
  return new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) >= new Date(todayString());
}

/** Haversine distance in meters. */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


function stripJsonFences(text: string): string {
  return text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
}

function repairJsonText(text: string): string {
  return text
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ': "$1"');
}

function stringifyToolResponseContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (typeof block === "object" && block !== null) {
          const record = block as Record<string, unknown>;
          if (typeof record.text === "string") return record.text;
          if (typeof record.content === "string") return record.content;
          if (Array.isArray(record.content)) return stringifyToolResponseContent(record.content);
        }
        return typeof block === "object" && block !== null ? JSON.stringify(block) : String(block);
      })
      .join("");
  }
  if (typeof content === "object" && content !== null) {
    const record = content as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (typeof record.content === "string") return record.content;
    if (Array.isArray(record.content)) return stringifyToolResponseContent(record.content);
    return JSON.stringify(content);
  }
  return String(content ?? "");
}

function extractBalancedJson(raw: string): string | null {
  const clean = stripJsonFences(raw);
  const start = clean.search(/[\[{]/);
  if (start === -1) return null;

  const text = clean.slice(start);
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{" || char === "[") {
      stack.push(char);
    } else if (char === "}" || char === "]") {
      const last = stack[stack.length - 1];
      if ((char === "}" && last === "{") || (char === "]" && last === "[")) {
        stack.pop();
        if (stack.length === 0) {
          return text.slice(0, i + 1);
        }
      } else {
        return null;
      }
    }
  }
  return null;
}

function parseLooseJson<T>(raw: string): T | null {
  const clean = stripJsonFences(raw).trim();
  if (!clean) return null;

  const start = clean.search(/[\[{]/);
  if (start === -1) return null;

  const candidate = clean.slice(start);
  const attempts = [candidate];
  const balanced = extractBalancedJson(candidate);
  if (balanced && balanced !== candidate) attempts.unshift(balanced);

  for (const attempt of attempts) {
    try { return JSON.parse(attempt) as T; } catch { /* continue */ }
    try { return JSON.parse(repairJsonText(attempt)) as T; } catch { /* continue */ }
  }

  const isArray = candidate[0] === "[";
  const closingChar = isArray ? "]" : "}";
  let pos = candidate.lastIndexOf(closingChar);
  while (pos > 0) {
    const slice = candidate.slice(0, pos + 1);
    try { return JSON.parse(slice) as T; } catch { /* try shorter */ }
    try { return JSON.parse(repairJsonText(slice)) as T; } catch { /* try shorter */ }
    pos = candidate.lastIndexOf(closingChar, pos - 1);
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NORMALIZE QUERY  (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════

async function normalizeQuery(rawQuery: string): Promise<string> {
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
      `"thomas dambo trolls" → "Thomas Dambo trolls"\n\n` +
      `Return ONLY the resolved name. No explanation.`,
  }]);
  const text = typeof res.content === "string" ? res.content.trim() : rawQuery;
  return text || rawQuery;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEOCODING  — now with 4-strategy fallback chain
// ═══════════════════════════════════════════════════════════════════════════════

async function geocodeRaw(
  address: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address?.trim()) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("address", address);
    url.searchParams.append("key", apiKey);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as GeocodeResponse;
    if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) return null;
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  } catch {
    return null;
  }
}
function extractTextFromLLMContent(content: unknown): string {
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (typeof block === "object" && block !== null) {
          const record = block as Record<string, unknown>;
          if (record.type === "text" && typeof record.text === "string") return record.text;
          if (typeof record.text === "string") return record.text;
          if (typeof record.content === "string") return record.content;
          if (Array.isArray(record.content)) return stringifyToolResponseContent(record.content);
        }
        return "";
      })
      .join("");
  }
  return stringifyToolResponseContent(content);
}

export async function smartGeocode(
  location: NamedLocation,
  apiKey: string
): Promise<{ lat: number; lng: number; image?: string; url?: string } | null> {
  // Strategy 1: full address
  // if (isAddressGeocodeWorthy(location.address)) {
  //   const coords = await geocodeRaw(location.address, apiKey);
  //   if (coords) {
  //     console.log(`[smartGeocode] ✓ Strategy 1 (address) for "${location.name}"`);
  //     return coords;
  //   }
  // }

  // // Strategy 2: "Name, City, Country"
  // if (location.name && (location.city || location.country)) {
  //   const parts = [location.name, location.city, location.country].filter(Boolean);
  //   const coords = await geocodeRaw(parts.join(", "), apiKey);
  //   if (coords) {
  //     console.log(`[smartGeocode] ✓ Strategy 2 (name+city) for "${location.name}"`);
  //     return coords;
  //   }
  // }

  // Strategy 3: Google Places Text Search — finds landmarks by name
  if (location.name) {
    const area = location.address ?? location.city ?? location.country ?? "";
    console.log("name, area", location.name, area);
    const pins = await searchPlacesNewAPI(
      location.name,
      area,
      1,
      apiKey
    );
    if (pins.length > 0) {
      return {
        lat: pins[0].latitude,
        lng: pins[0].longitude,
        image: pins[0].image,
        url: pins[0].url,
      }
    }

  }


  // Strategy 4: coarse — just city + country
  // if (location.city && location.country) {
  //   const coords = await geocodeRaw(`${location.city}, ${location.country}`, apiKey);
  //   if (coords) {
  //     console.log(`[smartGeocode] ✓ Strategy 4 (city only) for "${location.name}" — coarse`);
  //     return coords;
  //   }
  // }

  console.warn(`[smartGeocode] ✗ All strategies failed for "${location.name}"`);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CITY BOUNDS + CITY DISCOVERY
// ═══════════════════════════════════════════════════════════════════════════════

async function getCityBounds(area: string, apiKey: string): Promise<CityBounds | null> {
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
    return bounds;
  } catch {
    return null;
  }
}
/**
 * Truncation recovery: when the LLM response is cut off mid-JSON,
 * extract every complete {"name":...} object that was fully emitted
 * before the stream ended. Returns a partial result rather than nothing.
 */
function recoverTruncatedLocations(
  text: string
): { source?: string; locations: NamedLocation[] } | null {
  const clean = stripJsonFences(text);

  // Extract source URL if present
  const sourceMatch = clean.match(/"source"\s*:\s*"([^"]+)"/);
  const source = sourceMatch?.[1] ?? undefined;

  // Match every complete location object: { ... } where the block closes properly.
  // We look for objects that have at least a "name" key and end with a closing brace.
  const locations: NamedLocation[] = [];
  const objectPattern = /\{[^{}]*"name"\s*:\s*"[^"]*"[^{}]*\}/g;
  let match: RegExpExecArray | null;

  while ((match = objectPattern.exec(clean)) !== null) {
    try {
      const obj = JSON.parse(repairJsonText(match[0])) as Partial<NamedLocation>;
      if (obj.name && (obj.address || obj.city)) {
        locations.push({
          name: obj.name,
          address: obj.address ?? "",
          city: obj.city,
          country: obj.country,
        });
      }
    } catch {
      // skip malformed object
    }
  }

  if (locations.length === 0) return null;

  console.log(`[recoverTruncatedLocations] Salvaged ${locations.length} complete objects from truncated response`);
  return { source, locations };
}
export async function discoverCitiesForCountry(
  countryOrRegion: string,
  limit = 20
): Promise<string[]> {
  const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });
  const response = await llm.invoke([{
    role: "user",
    content:
      `List the top ${limit} most populous and geographically diverse cities in "${countryOrRegion}". ` +
      `Cover all major regions — north, south, east, west, and central. ` +
      `Return ONLY valid JSON: {"cities":["City1, Country","City2, Country"]}. ` +
      `Include the country name after each city. No markdown, no extra text.`,
  }]);

  try {
    const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    const parsed = parseLooseJson<{ cities?: string[] }>(text);
    const cities = (parsed?.cities ?? []).slice(0, limit);
    return cities;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE PLACES SEARCH — New API + Legacy fallback  (mostly unchanged)
// ═══════════════════════════════════════════════════════════════════════════════

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
  if (lat === undefined || lng === undefined) return null;

  const category =
    place.primaryTypeDisplayName?.text ??
    place.types?.filter((t) => !GENERIC_GOOGLE_TYPES.has(t)).map(formatGoogleType).find(Boolean) ??
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
            radius: Math.min(50000, Math.max(bounds.latDelta, bounds.lngDelta) * 111_000 * 0.6),
          },
        };
      }
      if (pageToken) body.pageToken = pageToken;

      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": [
            "places.id", "places.displayName", "places.formattedAddress",
            "places.location.latitude", "places.location.longitude",
            "places.photos", "places.types", "places.rating",
            "places.websiteUri", "places.primaryTypeDisplayName", "nextPageToken",
          ].join(","),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      });
      const data = (await res.json()) as NewPlacesSearchResponse;

      if (!data.places?.length) break;
      for (const place of data.places) {
        if (allPins.length >= count) break;
        const pin = mapNewPlaceToPin(place, allPins.length, apiKey);
        if (pin && !seenIds.has(pin.id)) { seenIds.add(pin.id); allPins.push(pin); }
      }
      pageToken = data.nextPageToken;
      if (!pageToken) break;
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.error(`[searchPlacesNewAPI] Page ${page + 1} error:`, error);
      break;
    }
  }
  return allPins;
}

interface LegacyPlaceResult {
  place_id?: string; name?: string; formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  photos?: Array<{ photo_reference: string }>; types?: string[]; rating?: number;
}
interface LegacyPlacesResponse {
  status: string; results?: LegacyPlaceResult[];
  next_page_token?: string; error_message?: string;
}

async function searchPlacesLegacyFallback(
  query: string, area: string, count: number, apiKey: string
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
      if (data.status === "ZERO_RESULTS" || !data.results?.length) break;
      if (data.status !== "OK") break;

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
          latitude: lat, longitude: lng,
          startDate: todayString(), endDate: hundredYearsFromNow(),
          pinCollectionLimit: 999999, pinNumber: 1, radius: 2, autoCollect: false,
          address: place.formatted_address,
          url: place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : undefined,
          image: photoRef ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}` : undefined,
          metadata: { rating: place.rating },
        };
        if (!seenIds.has(pin.id)) { seenIds.add(pin.id); allPins.push(pin); }
      }
      pageToken = data.next_page_token;
      if (!pageToken) break;
      await new Promise((r) => setTimeout(r, 2000));
    } catch { break; }
  }
  return allPins;
}

/** Combined Places search: New API first, then legacy fallback. */
export async function searchViaGooglePlaces(query: string, area: string, count: number): Promise<Pin[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
  if (!apiKey) return [];

  const bufferedCount = count * 2;
  let results = await searchPlacesNewAPI(query, area, bufferedCount, apiKey);

  if (results.length === 0) {
    results = await searchPlacesLegacyFallback(query, area, bufferedCount, apiKey);
  }

  if (results.length < count) {
    const seenIds = new Set(results.map((p) => p.id));
    const broader = await searchPlacesLegacyFallback(query, area, count - results.length, apiKey);
    for (const p of broader) {
      if (!seenIds.has(p.id)) { seenIds.add(p.id); results.push(p); }
    }
  }

  const final = results.slice(0, count);
  return final;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT → PIN  (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════

async function mapEventToPin(
  event: RawEventResult, index: number, apiKey: string, fallbackCity?: string
): Promise<Pin | null> {
  if (!event.title || !event.startDate || !event.endDate) return null;
  if (!isFutureDate(event.startDate) || !isFutureDate(event.endDate)) return null;
  if (new Date(event.endDate) < new Date(event.startDate)) return null;

  const candidates: string[] = [];
  if (event.venueAddress?.trim()) candidates.push(event.venueAddress.trim());
  if (event.venueName?.trim() && event.city?.trim()) candidates.push(`${event.venueName}, ${event.city}`);
  if (event.city?.trim()) candidates.push(event.city.trim());
  if (fallbackCity?.trim()) candidates.push(fallbackCity.trim());
  if (candidates.length === 0) return null;

  let coords: { lat: number; lng: number } | null = null;
  for (const addr of candidates) {
    coords = await geocodeRaw(addr, apiKey);
    if (coords) break;
  }
  if (!coords) return null;

  return {
    id: `event_${index}_${Date.now()}`,
    type: "EVENT",
    title: event.title,
    description: event.description ?? event.venueName ?? "Event",
    latitude: coords.lat, longitude: coords.lng,
    startDate: event.startDate, endDate: event.endDate,
    url: event.url, image: event.image,
    pinCollectionLimit: 999999, pinNumber: 1, radius: 2, autoCollect: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEDUPLICATION  (NEW — dedup by place_id AND lat/lng proximity)
// ═══════════════════════════════════════════════════════════════════════════════

const DEDUP_DISTANCE_M = 50;

export function deduplicatePins(pins: Pin[], skipProximity = false): Pin[] {
  const unique: Pin[] = [];
  const seenIds = new Set<string>();

  for (const pin of pins) {
    if (seenIds.has(pin.id)) continue;

    // For niche results, skip proximity check — multiple installations
    // can legitimately exist at the same park/venue
    if (!skipProximity) {
      const tooClose = unique.some(
        (u) => haversineM(u.latitude, u.longitude, pin.latitude, pin.longitude) < DEDUP_DISTANCE_M
      );
      if (tooClose) continue;
    }

    seenIds.add(pin.id);
    unique.push(pin);
  }
  return unique;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  TOOL 1 — classify_query                                                 ┃
// ┃  Replaces the old web_search tool as the mandatory first step.           ┃
// ┃  Returns the 5-type classification + backbone search query.              ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// ═══════════════════════════════════════════════════════════════════════════════

export const classifyQueryTool = tool(
  async ({ query, area }): Promise<string> => {
    console.log("[classifyQueryTool]", { query, area });

    const normalized = await normalizeQuery(query);

    const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });
    const res = await llm.invoke([{
      role: "user",
      content:
        `Classify this location search: "${normalized}" ${area ? `in "${area}"` : ""}\n\n` +
        `Return ONLY valid JSON — no markdown:\n` +
        `{\n` +
        `  "type": "official_list" | "niche_scattered" | "commercial_brand" | "commercial_category" | "event",\n` +
        `  "backboneSearchQuery": "google search query to find one comprehensive list/article, or null if Google Places is better",\n` +
        `  "fanOutAxis1": "geography" | "subcategory" | "country" | "source_type" | "none",\n` +
        `  "fanOutAxis2": "geography" | "subcategory" | "source_type" | "none",\n` +
        `  "estimatedTotal": number | null,\n` +
        `  "countries": ["countries where this exists — empty for commercial"],\n` +
        `  "subcategories": ["subcategories for fan-out — e.g. cuisine types for restaurants"],\n` +
        `  "searchFocus": "one sentence: what exactly to extract from web pages"\n` +
        `}\n\n` +
        `TYPE RULES:\n` +
        `- official_list: a government/institution maintains a definitive list (national parks, UNESCO sites, embassies, state capitals)\n` +
        `- niche_scattered: art installations, sculptures, murals, one-of-a-kind objects across multiple sites with NO central commercial database (Thomas Dambo trolls, Banksy murals, LOVE sculptures)\n` +
        `- commercial_brand: a specific named brand/chain with commercial branches (KFC, McDonald's, Hilton, Walmart)\n` +
        `- commercial_category: generic category, not a specific brand (restaurants, hospitals, cafes, hotels, pharmacies)\n` +
        `- event: time-bounded happenings (concerts, festivals, conferences, sports matches)\n\n` +
        `BACKBONE SEARCH QUERY:\n` +
        `- For official_list → "list of [thing] wikipedia" or "[thing] official list"\n` +
        `- For niche_scattered → "all [thing] locations worldwide" or "[creator] [thing] complete list"\n` +
        `- For commercial_brand → null (Google Places handles it)\n` +
        `- For commercial_category → null (Google Places handles it)\n` +
        `- For event → "[thing] upcoming events ${area ?? "2024 2025"}"  \n\n` +
        `SUBCATEGORIES (only for commercial_category):\n` +
        `- "restaurants" → ["pizza", "sushi", "chinese", "mexican", "italian", "fast food", "cafe", "steakhouse", "indian", "thai"]\n` +
        `- "hospitals" → ["hospital", "medical center", "clinic", "urgent care"]\n` +
        `- For other types → empty []\n\n` +
        `COUNTRIES (only for niche_scattered and official_list):\n` +
        `- List all countries where these are known to exist\n` +
        `- For commercial types → empty []`,
    }]);

    try {
      const text = typeof res.content === "string" ? res.content : "";
      const parsed = parseLooseJson<QueryClassification>(text);
      if (!parsed) throw new Error("No JSON found");

      // Enforce defaults
      if (!parsed.countries) parsed.countries = [];
      if (!parsed.subcategories) parsed.subcategories = [];

      return JSON.stringify({ ...parsed, canonicalName: normalized });
    } catch (err) {
      console.error("[classifyQueryTool] Parse error:", err);
      return JSON.stringify({
        type: "commercial_brand",
        canonicalName: normalized,
        backboneSearchQuery: null,
        fanOutAxis1: "geography",
        fanOutAxis2: "none",
        estimatedTotal: null,
        countries: [],
        subcategories: [],
        searchFocus: "find locations",
      });
    }
  },
  {
    name: "classify_query",
    description:
      "ALWAYS call this FIRST before any other tool. Classifies the query into one of 5 types " +
      "(official_list, niche_scattered, commercial_brand, commercial_category, event) " +
      "and returns a backbone search query for fetching the richest data source. " +
      "The classification determines which tools to use next:\n" +
      "  official_list OR niche_scattered → backbone_fetch → smart_geocode\n" +
      "  commercial_brand → brand_country_search OR places_search\n" +
      "  commercial_category → subcategory_fanout\n" +
      "  event → event_search",
    schema: z.object({
      query: z.string().describe("What to search for (the THING, never 'pin' or 'pins')"),
      area: z.string().optional().describe("Geographic area if specified"),
    }),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  TOOL 2 — backbone_fetch                                                 ┃
// ┃  NEW — Fetches the single richest webpage and extracts locations.        ┃
// ┃  One Wikipedia fetch can return 30-60 locations in a single call.        ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// ═══════════════════════════════════════════════════════════════════════════════

export const backboneFetchTool = tool(
  async ({ searchQuery, query, area }): Promise<string> => {
    console.log("[backboneFetchTool]", { searchQuery, query, area });

    const areaClause = area ? ` in ${area}` : "";

    const queries = [
      searchQuery,
      `list of all ${query}${areaClause} complete`,
      `${query}${areaClause} all locations site:wikipedia.org`,
    ].filter(Boolean);


    const llm = new ChatOpenAI({
      model: "gpt-5.4-mini",
      temperature: 0,
      maxTokens: 8000,
    }).bindTools([{ type: "web_search_preview" } as never]);

    const limit = pLimit(3);

    // ── Run all 3 searches in parallel ────────────────────────
    const allResults = await Promise.all(
      queries.map((q) =>
        limit(async (): Promise<NamedLocation[]> => {
          try {
            const response = await llm.invoke([{
              role: "user",
              content:
                `Search the web for: ${q}\n\n` +
                `Find a COMPREHENSIVE LIST of "${query}"${areaClause} and extract EVERY physical location.\n` +
                `Return ONLY JSON:\n` +
                `{"source":"URL","locations":[{"name":"...","address":"...","city":"...","country":"..."}]}\n\n` +
                `RULES:\n` +
                `- Find a LIST page, not a single item's detail page.\n` +
                `- Include EVERY location, not just highlights.\n` +
                `- Minimum: name + city + country for each location.`,
            }]);

            const text = extractTextFromLLMContent(response.content);
            let parsed = parseLooseJson<{ locations?: NamedLocation[] }>(text);
            if (!parsed) parsed = recoverTruncatedLocations(text);
            const locations = (parsed?.locations ?? []).filter(
              (loc) => loc.name && (loc.address || loc.city)
            );
            console.log(`[backboneFetchTool] Query "${q.slice(0, 50)}..." → ${locations.length} locations`);
            return locations;
          } catch (err) {
            console.warn(`[backboneFetchTool] Query failed: "${q.slice(0, 50)}..."`, err);
            return [];
          }
        })
      )
    );

    // ── Merge all results, deduplicate by name ────────────────
    const seenNames = new Set<string>();
    const merged: NamedLocation[] = [];

    // Sort by result count descending — richest source first
    const sorted = allResults.sort((a, b) => b.length - a.length);

    for (const resultSet of sorted) {
      for (const loc of resultSet) {
        const key = loc.name.toLowerCase().trim();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          merged.push(loc);
        }
      }
    }

    console.log(
      `[backboneFetchTool] Merged: ${merged.length} unique locations from ${queries.length} queries ` +
      `(individual: ${allResults.map((r) => r.length).join(", ")})`
    );

    const result: BackboneResult = { locations: merged, source: null };

    return JSON.stringify({
      total: merged.length,
      source: null,
      locations: merged,
    });
  },
  {
    name: "backbone_fetch",
    description:
      "Fetch the richest web sources for a query and extract ALL physical locations. " +
      "Runs 3 parallel searches with different queries and merges results for maximum coverage. " +
      "Use for official_list and niche_scattered types AFTER classify_query. " +
      "DO NOT use for commercial_brand or commercial_category.",
    schema: z.object({
      searchQuery: z.string().describe("Primary search query from classify_query"),
      query: z.string().describe("The original user query"),
      area: z.string().optional().describe("Geographic area to scope results (e.g. 'USA', 'Denmark')"),
    }),
  }
);
// ═══════════════════════════════════════════════════════════════════════════════
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  TOOL 3 — regional_search                                               ┃
// ┃  NEW — Searches for niche items in a specific country/region.            ┃
// ┃  Used for gap-fill: "more Thomas Dambo trolls in Denmark"               ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// ═══════════════════════════════════════════════════════════════════════════════

export const regionalSearchTool = tool(
  async ({ query, region, excludeNames }): Promise<string> => {
    console.log("[regionalSearchTool]", { query, region, excludeCount: excludeNames?.length ?? 0 });

    const llm = new ChatOpenAI({
      model: "gpt-5.4-mini",
      temperature: 0,
      maxTokens: 8000, // ← critical: default 1024 truncates large location lists
    }).bindTools([
      { type: "web_search_preview" } as never,
    ]);

    const exclusionClause = excludeNames?.length
      ? `\nExclude these already-found locations: ${excludeNames.join(", ")}`
      : "";

    try {
      const response = await withRetry(() => llm.invoke([{
        role: "user",
        content:
          `Search the web for: "${query}" locations in ${region}\n` +
          exclusionClause + "\n\n" +
          `Find ALL physical locations of "${query}" specifically in ${region}.\n` +
          `Return ONLY JSON — no prose:\n` +
          `{"locations":[{"name":"...","address":"full address or landmark, city, country","city":"...","country":"..."}]}\n\n` +
          `RULES:\n` +
          `- Only include locations physically in ${region}.\n` +
          `- Each entry needs enough address info to geocode (minimum: name + city + country).\n` +
          `- Include ALL locations you can find, not just highlights.\n` +
          `- Search for region-specific sources (tourism sites, local news, regional guides).`,
      }]));

      // Extract only `type: "text"` blocks — web_search_preview injects
      // tool_use + tool_result blocks before the model's final JSON output.
      const rawContent = response.content;
      const rawJson = extractTextFromLLMContent(rawContent);

      console.log("[regionalSearchTool] Extracted text length:", rawJson.length);

      // Primary parse attempt
      let parsed = parseLooseJson<{ locations?: NamedLocation[] }>(rawJson);

      // Truncation recovery: if the JSON was cut off mid-stream, salvage
      // all complete location objects that were emitted before the cut.
      if (!parsed) {
        console.warn(`[regionalSearchTool] Primary parse failed for ${region} — attempting truncation recovery`);
        parsed = recoverTruncatedLocations(rawJson);
      }

      if (!parsed) {
        console.warn(`[regionalSearchTool] Could not parse JSON response for ${region}`);
        return JSON.stringify({ total: 0, region, locations: [] });
      }

      const locations = (parsed.locations ?? []).filter((l) => l.name && (l.address || l.city));

      console.log(`[regionalSearchTool] Found ${locations.length} locations in ${region}`);
      return JSON.stringify({ total: locations.length, region, locations });
    } catch (err) {
      console.error("[regionalSearchTool] Failed:", err);
      return JSON.stringify({ total: 0, region, locations: [] });
    }
  },
  {
    name: "regional_search",
    description:
      "Search for niche/scattered locations in a SPECIFIC country or region. " +
      "Use for gap-filling niche_scattered queries AFTER backbone_fetch. " +
      "Example: after backbone_fetch found 30 Thomas Dambo trolls, call this for each country " +
      "(Denmark, South Korea, Australia, etc.) to find more. " +
      "Pass excludeNames to avoid duplicates. " +
      "DO NOT use for commercial queries — use places_search or brand_country_search instead.",
    schema: z.object({
      query: z.string().describe("What to search for"),
      region: z.string().describe("Specific country or region to search within"),
      excludeNames: z.array(z.string()).optional().describe("Names of already-found locations to skip"),
    }),
  }
);
// ═══════════════════════════════════════════════════════════════════════════════
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  TOOL 4 — smart_geocode  (batch)                                         ┃
// ┃  Geocodes an array of NamedLocations using the 4-strategy fallback.      ┃
// ┃  Runs in parallel (5 concurrent). Returns pins.                          ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// ═══════════════════════════════════════════════════════════════════════════════

const GEOCODE_BATCH_SIZE = 50;
const GEOCODE_CONCURRENCY = 10; // bump from 5 to 10

export const smartGeocodeTool = tool(
  async ({ locations }): Promise<string> => {
    console.log(`[smartGeocodeTool] Geocoding ${locations.length} locations`);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
    if (!apiKey) return JSON.stringify({ total: 0, failed: locations.length });

    const limit = pLimit(GEOCODE_CONCURRENCY);
    const allPins: Pin[] = [];

    // Process in batches to avoid memory/timeout issues
    for (let i = 0; i < locations.length; i += GEOCODE_BATCH_SIZE) {
      const batch = locations.slice(i, i + GEOCODE_BATCH_SIZE);

      const results = await Promise.all(
        batch.map((loc: NamedLocation, idx: number) =>
          limit(async (): Promise<Pin | null> => {
            const coords = await smartGeocode(loc, apiKey);
            if (!coords) return null;
            return {
              id: `niche_${Date.now()}_${i + idx}_${Math.random().toString(36).slice(2, 6)}`,
              type: "LANDMARK" as const,
              title: loc.name,
              description: loc.address || `${loc.city ?? ""}, ${loc.country ?? ""}`.trim(),
              latitude: coords.lat,
              longitude: coords.lng,
              startDate: todayString(),
              endDate: hundredYearsFromNow(),
              pinCollectionLimit: 999999,
              pinNumber: 1,
              radius: 2,
              autoCollect: false,
              address: loc.address,
              image: coords.image,
              url: coords.url,
            };
          })
        )
      );

      allPins.push(...results.filter((p): p is Pin => p !== null));
      console.log(`[smartGeocodeTool] Batch ${Math.floor(i / GEOCODE_BATCH_SIZE) + 1}: ${allPins.length} pins so far`);
    }

    const dedupedPins = deduplicatePins(allPins, true);

    if (dedupedPins.length > 0) {
      const existing = retrievePins();
      const merged = deduplicatePins([...(existing?.pins ?? []), ...dedupedPins], true);
      storePins(merged, "LANDMARK");
    }

    console.log(`[smartGeocodeTool] Done: ${dedupedPins.length} success, ${locations.length - allPins.length} failed`);

    return JSON.stringify({
      total: dedupedPins.length,
      failed: locations.length - allPins.length,
      message: `Geocoded ${dedupedPins.length}/${locations.length} locations.`,
    });
  },
  {
    name: "smart_geocode",
    description:
      "Batch-geocode an array of named locations into pins using a 4-strategy fallback chain " +
      "(full address → name+city+country → Google Places text search → city+country). " +
      "Use AFTER backbone_fetch or regional_search returns named locations. " +
      "Runs up to 5 geocode operations in parallel. " +
      "Returns the count of successful/failed geocodes. Pins are stored internally.",
    schema: z.object({
      locations: z.array(z.object({
        name: z.string(),
        address: z.string().optional().default(""),
        city: z.string().optional(),
        country: z.string().optional(),
      })).describe("Array of named locations to geocode"),
    }),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  TOOL 5 — places_search  (unchanged, for commercial single-city)         ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// ═══════════════════════════════════════════════════════════════════════════════

export const placesSearchTool = tool(
  async ({ query, city, count = 20 }): Promise<string> => {
    console.log("[placesSearchTool]", { query, city, count });

    const bufferedCount = count * 2;
    const pins = await searchViaGooglePlaces(query, city, bufferedCount);

    if (pins.length > 0) {
      const existing = retrievePins();
      const merged = deduplicatePins([...(existing?.pins ?? []), ...pins]);
      storePins(merged, "LANDMARK");
    }

    return JSON.stringify({
      total: pins.length,
      city,
      message: `Found ${pins.length} results for "${query}" in "${city}".`,
    });
  },
  {
    name: "places_search",
    description:
      "Search Google Places for commercial locations in a SPECIFIC city. " +
      "Use for commercial_brand and commercial_category types. " +
      "DO NOT use for niche_scattered or official_list — use backbone_fetch + smart_geocode. " +
      "Always pass a single city name, never a broad region.",
    schema: z.object({
      query: z.string().describe("What to search for"),
      city: z.string().describe("A specific city name"),
      count: z.number().optional().default(20).describe("How many pins to return"),
    }),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  TOOL 6 — brand_country_search                                           ┃
// ┃  (Renamed from country_city_search — for brand searches across a country)┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// ═══════════════════════════════════════════════════════════════════════════════

export const brandCountrySearchTool = tool(
  async ({ query, country, count = 20 }): Promise<string> => {
    console.log("[brandCountrySearchTool]", { query, country, count });

    const cities = await discoverCitiesForCountry(country, Math.min(20, Math.ceil(count / 3)));
    if (cities.length === 0) {
      return JSON.stringify({ total: 0, country, message: `No cities found for "${country}".` });
    }

    const perCity = Math.ceil((count / cities.length) * 2);
    const limit = pLimit(5);
    const allPins: Pin[] = [];
    const seenIds = new Set<string>();

    const cityResults = await Promise.all(
      cities.map((city) =>
        limit(async () => {
          try {
            return await searchViaGooglePlaces(query, city, perCity);
          } catch {
            return [] as Pin[];
          }
        })
      )
    );

    for (const cityPins of cityResults) {
      for (const pin of cityPins) {
        if (!seenIds.has(pin.id)) { seenIds.add(pin.id); allPins.push(pin); }
      }
    }

    const capped = deduplicatePins(allPins).slice(0, count);

    if (capped.length > 0) {
      const existing = retrievePins();
      const merged = deduplicatePins([...(existing?.pins ?? []), ...capped]);
      storePins(merged, "LANDMARK");
    }

    return JSON.stringify({
      total: capped.length,
      country,
      citiesSearched: cities,
      message: `Found ${capped.length} results for "${query}" across ${cities.length} cities in "${country}".`,
    });
  },
  {
    name: "brand_country_search",
    description:
      "Search for a commercial brand/chain across an ENTIRE COUNTRY by auto-discovering major cities " +
      "and searching each via Google Places in parallel. " +
      "Use when classify_query returned commercial_brand AND the user specified a country. " +
      "DO NOT use for niche queries — use backbone_fetch + regional_search instead.",
    schema: z.object({
      query: z.string().describe("Brand or chain name to search"),
      country: z.string().describe("Country name"),
      count: z.number().optional().default(20).describe("Total pins to return"),
    }),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  TOOL 7 — subcategory_fanout                                             ┃
// ┃  NEW — For "all restaurants in X": fans out by cuisine type + nearby     ┃
// ┃  towns to get much broader coverage than a single "restaurants" search.  ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// ═══════════════════════════════════════════════════════════════════════════════

export const subcategoryFanoutTool = tool(
  async ({ query, area, subcategories, count = 50 }): Promise<string> => {
    console.log("[subcategoryFanoutTool]", { query, area, subcatCount: subcategories.length, count });

    const allPins: Pin[] = [];
    const seenIds = new Set<string>();
    const limit = pLimit(5);

    // Phase 1: Search each subcategory in the main area
    const perSubcat = Math.ceil((count / subcategories.length) * 1.5);

    const subcatResults = await Promise.all(
      subcategories.map((sub) =>
        limit(async () => {
          try {
            const searchTerm = sub === query ? query : `${sub} ${query}`;
            return await searchViaGooglePlaces(searchTerm, area, perSubcat);
          } catch {
            return [] as Pin[];
          }
        })
      )
    );

    for (const pins of subcatResults) {
      for (const pin of pins) {
        if (!seenIds.has(pin.id)) { seenIds.add(pin.id); allPins.push(pin); }
      }
    }

    console.log(`[subcategoryFanoutTool] Phase 1 (subcategories): ${allPins.length} pins`);

    // Phase 2: If still short, expand to nearby towns
    if (allPins.length < count) {
      const llm = new ChatOpenAI({ model: "gpt-5.4-mini", temperature: 0 });
      const nearbyRes = await llm.invoke([{
        role: "user",
        content:
          `List 5-8 towns/cities near "${area}" within 50km driving distance. ` +
          `Return ONLY: {"towns":["Town1","Town2"]}. No markdown.`,
      }]);

      let nearbyTowns: string[] = [];
      try {
        const text = typeof nearbyRes.content === "string" ? nearbyRes.content : "";
        const parsed = parseLooseJson<{ towns: string[] }>(text);
        nearbyTowns = parsed?.towns ?? [];
      } catch { /* skip nearby expansion */ }

      if (nearbyTowns.length > 0) {
        const perTown = Math.ceil((count - allPins.length) / nearbyTowns.length) * 2;
        const townResults = await Promise.all(
          nearbyTowns.map((town) =>
            limit(async () => {
              try {
                return await searchViaGooglePlaces(query, town, perTown);
              } catch {
                return [] as Pin[];
              }
            })
          )
        );

        for (const pins of townResults) {
          for (const pin of pins) {
            if (!seenIds.has(pin.id)) { seenIds.add(pin.id); allPins.push(pin); }
          }
        }
        console.log(`[subcategoryFanoutTool] Phase 2 (nearby towns): ${allPins.length} pins total`);
      }
    }

    const capped = deduplicatePins(allPins).slice(0, count);

    if (capped.length > 0) {
      const existing = retrievePins();
      const merged = deduplicatePins([...(existing?.pins ?? []), ...capped]);
      storePins(merged, "LANDMARK");
    }

    return JSON.stringify({
      total: capped.length,
      area,
      message: `Found ${capped.length} ${query} in ${area} area (searched ${subcategories.length} subcategories).`,
    });
  },
  {
    name: "subcategory_fanout",
    description:
      "Fan out a generic category search (restaurants, hospitals, etc.) by subcategory AND nearby towns. " +
      "Use when classify_query returned commercial_category. " +
      "Example: 'restaurants in Geneseo' → searches pizza, sushi, mexican, italian, cafe, etc. " +
      "in Geneseo + nearby towns for much broader coverage. " +
      "Pass the subcategories array from classify_query's response.",
    schema: z.object({
      query: z.string().describe("Category to search (e.g. 'restaurants')"),
      area: z.string().describe("Primary area to search"),
      subcategories: z.array(z.string()).describe("Subcategory terms from classify_query"),
      count: z.number().optional().default(50).describe("Total pins to return"),
    }),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  TOOL 8 — event_search  (unchanged)                                      ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// ═══════════════════════════════════════════════════════════════════════════════

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

      const raw = stringifyToolResponseContent(response.content);

      const parsed = parseLooseJson<RawEventResult[]>(raw) ?? [];
      const limiter = pLimit(5);
      const pinResults = await Promise.all(
        parsed
          .filter((e) => isFutureDate(e.startDate ?? "") && isFutureDate(e.endDate ?? ""))
          .map((e, i) => limiter(() => mapEventToPin(e, i, apiKey, city)))
      );
      const pins = pinResults.filter((p): p is Pin => p !== null);

      if (pins.length > 0) {
        const existing = retrievePins();
        const merged = deduplicatePins([...(existing?.pins ?? []), ...pins]);
        storePins(merged, "EVENT");
      }

      return JSON.stringify({ total: pins.length, city, message: `Found ${pins.length} upcoming ${query} events in ${city}.` });
    } catch {
      return JSON.stringify({ total: 0, city, message: `No events found for "${query}" in "${city}".` });
    }
  },
  {
    name: "event_search",
    description: "Search for upcoming future events in a specific city. Use when classify_query returned type=event.",
    schema: z.object({
      query: z.string(),
      city: z.string(),
      count: z.number().optional().default(5),
    }),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  TOOL 9 — city_discovery  (unchanged, for chain/category worldwide)      ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// ═══════════════════════════════════════════════════════════════════════════════

export const cityDiscoveryTool = tool(
  async ({ region, limit = 20 }): Promise<string> => {
    const cities = await discoverCitiesForCountry(region, limit);
    return JSON.stringify({ cities });
  },
  {
    name: "city_discovery",
    description:
      "Get major cities for a broad region (country, continent, 'worldwide'). " +
      "Use for commercial_brand or commercial_category when area is broad and no detectedCountry. " +
      "Call before places_search to get city names. " +
      "NEVER use for niche_scattered — use backbone_fetch + regional_search instead.",
    schema: z.object({
      region: z.string().describe("Country, continent, or 'worldwide'"),
      limit: z.number().optional().default(20),
    }),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  TOOL 10 — drop_pins  (unchanged)                                        ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
// ═══════════════════════════════════════════════════════════════════════════════

export const dropPinsTool = tool(
  async (): Promise<string> => {
    const stored = retrievePins();
    const count = stored?.pins.length ?? 0;
    if (!stored || count === 0) {
      return JSON.stringify({ saved: 0, status: "error", message: "No pins found to save." });
    }
    clearPins();
    return JSON.stringify({ saved: count, status: "ok" });
  },
  {
    name: "drop_pins",
    description: "Persist confirmed pins into the database. Call ONLY after explicit user confirmation.",
    schema: z.object({}),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const ALL_TOOLS = [
  classifyQueryTool,       // 1. Always first
  backboneFetchTool,       // 2. For official_list + niche_scattered
  regionalSearchTool,      // 3. Gap-fill for niche
  smartGeocodeTool,        // 4. Batch geocode named locations
  placesSearchTool,        // 5. Commercial single-city
  brandCountrySearchTool,  // 6. Commercial brand across country
  subcategoryFanoutTool,   // 7. Commercial category fan-out
  eventSearchTool,         // 8. Events
  cityDiscoveryTool,       // 9. Discover cities for broad area
  // dropPinsTool,            // 10. Persist pins
] as const;

export { searchViaGooglePlaces as searchViaGooglePlacesExported };

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT — completely rewritten for 5-type classification
// ═══════════════════════════════════════════════════════════════════════════════

export const AGENT_SYSTEM_PROMPT = `You are a location-based pin-drop agent.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL — "pin/pins" IS NEVER A SEARCH QUERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The words "pin", "pins", "drop pin", "drop pins" refer to the ACTION of dropping
a map marker — they are NEVER the thing to search for.

If the user only said "drop N pins in [area]" without specifying WHAT:
  → Respond IMMEDIATELY with a "question" asking what they want to find.
  → DO NOT call any search tools.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY FIRST STEP — classify_query
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALWAYS call classify_query FIRST — before any other tool.
This returns the query TYPE which determines your entire strategy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE 5-TYPE DECISION TREE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After classify_query returns, follow the EXACT path for the type:

── TYPE: official_list ─────────────────────────────────────────────────
  Example: "US national parks", "UNESCO World Heritage Sites", "state capitals"
  
  STEP 1: backbone_fetch(backboneSearchQuery, query)
    → Extracts 20-60+ locations from Wikipedia/official source
  STEP 2: smart_geocode(locations)
    → Batch geocodes all locations in parallel
  STEP 3: Done. Official lists are usually complete from backbone.
  
  TOOLS USED: classify_query → backbone_fetch → smart_geocode
  TOOLS FORBIDDEN: places_search, brand_country_search, subcategory_fanout

── TYPE: niche_scattered ───────────────────────────────────────────────

  STEP 1: backbone_fetch(backboneSearchQuery, query)
    → May return 20-200+ locations
  STEP 2: smart_geocode( ← pass the ENTIRE locations array from step 1 )
    → Do NOT skip, filter, or cherry-pick. Send every single location.
    → The tool handles batching internally.
  STEP 3: ONLY if backbone returned fewer than 20 locations, gap-fill:
    → regional_search per country → smart_geocode(new locations)
  STEP 4: Done. Return results.

  ⚠️ If backbone_fetch returned 50+ locations, SKIP regional_search entirely.
  The backbone already has comprehensive coverage.

── TYPE: commercial_brand ──────────────────────────────────────────────
  Example: "KFC", "Starbucks", "Hilton", "McDonald's"

  IF area is missing → ask the user where (see MISSING AREA RULE)
  IF area is a specific city:
    → places_search(query, city, count)
  IF area is a country:
    → brand_country_search(query, country, count)
  IF area is "worldwide":
    → city_discovery("worldwide") → places_search(query, city, 10) per city

── TYPE: commercial_category ───────────────────────────────────────────
  Example: "restaurants", "hospitals", "pharmacies", "hotels"

  IF area is missing → ask the user where (see MISSING AREA RULE)
  IF area is a specific city or small region:
    → subcategory_fanout(query, area, subcategories, count)
  IF area is a country:
    → brand_country_search(query, country, count)
  IF area is "worldwide":
    → city_discovery("worldwide") → places_search(query, city, 10) per city

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MISSING AREA RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When area is NOT specified, decide based on query type:

FOR official_list / niche_scattered:
  → Search worldwide immediately. Do NOT ask.

FOR commercial_brand / commercial_category:
  → Try searching WITHOUT area first: places_search(query, "", count)
  → Google Places can find results without an area constraint.
  → If results come back → return them.
  → If 0 results → THEN ask the user where.

FOR event:
  → Ask the user where. Events need a city.

If the user ever says "anywhere", "worldwide", "everywhere", "globally":
  → Treat as worldwide.
  → For commercial_brand → city_discovery("worldwide") → places_search per city
  → For commercial_category → city_discovery("worldwide") → places_search per city
  → For official_list / niche_scattered → backbone_fetch with no area
  → For event → city_discovery("worldwide") → event_search per city

NEVER ask for location more than once.


── TYPE: event ─────────────────────────────────────────────────────────
  Example: "concerts", "music festivals", "tech conferences"
  
  STEP 1: event_search per relevant city
  
  TOOLS USED: classify_query → event_search (+ city_discovery if area is broad)
  TOOLS FORBIDDEN: backbone_fetch, places_search, smart_geocode

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COORDINATE ACCURACY — NEVER VIOLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE: LLM finds addresses. Google provides coordinates. NEVER use LLM-generated lat/lng.

- official_list / niche_scattered → backbone_fetch returns addresses → smart_geocode converts via Google
- commercial_brand / commercial_category → Google Places returns coordinates directly
- event → event_search geocodes venue addresses via Google
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEVER TRUNCATE BACKBONE RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When backbone_fetch returns N locations, pass ALL N to smart_geocode in ONE call.
Do NOT send only the first 20, chunk into batches, or filter "important" ones.
smart_geocode handles batching internally. Just pass the full array.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BACKBONE-FIRST RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After backbone_fetch returns:
  IF locations.length >= 80 → smart_geocode(ALL locations) → DONE.No regional_search.
  IF locations.length >= 50 → smart_geocode(ALL locations) → regional_search for max 10 countries → DONE.
  IF locations.length < 30  → smart_geocode(ALL locations) → regional_search for all countries → DONE.

The backbone is the primary source.regional_search is ONLY for gap - filling small results.
Never skip backbone results in favor of regional_search.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE SHAPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. QUESTION (missing WHAT):
{"type":"question","message":"What would you like to find?","fields":[{"id":"query","label":"What are you looking for?","inputType":"text","placeholder":"e.g. hospitals, KFC, restaurants..."}]}

2. RESULTS (found pins, awaiting confirmation):
{"type":"results","message":"Found N locations","searchType":"LANDMARK"|"EVENT","pinCount":N,"confirmPrompt":"Drop these N pins?"}

3. CONFIRM:
{"type":"confirm","message":"Ready to drop N pins","summary":{"what":"...","where":"...","count":N,"type":"LANDMARK"|"EVENT"}}

4. SUCCESS (after drop_pins):
{"type":"success","message":"Successfully dropped N pins!","count":N}

5. INFO (error or nothing found):
{"type":"info","message":"..."}

RULE: Never include raw pin arrays in responses. Pins are stored internally via the pin store.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ERROR HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Tool failure → {"type":"info","message":"Search failed, please try again."}
- 0 results → {"type":"info","message":"No locations found for X in Y."}
- backbone_fetch returns 0 → Still try regional_search before giving up
- All strategies exhausted with 0 results → Report honestly
`;