import { getJson, setJson } from '@/lib/mmkv';
import { isGoogleMapsConfigured } from '@/lib/mapsConfig';
import { textSearchPlacesGoogle } from '@/services/geocoding/googlePlacesService';
import { searchPlaces } from '@/services/geocoding/geocodingService';
import type { PlaceSearchResult } from '@/services/geocoding/geocodingService';
import {
  displayCityFromDestination,
} from '@/features/weather/utils/parseDestination';
import type { Trip } from '@/types';
import type { PlaceRecommendation } from '@/types/recommendation';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RECS_PER_DESTINATION = 2;
const MAX_DESTINATIONS = 2;
const MAX_TOTAL = 4;

interface RecommendationCacheEntry {
  fetchedAt: string;
  items: PlaceRecommendation[];
}

function cacheKey(destination: string): string {
  return `recommendations:${destination.trim().toLowerCase()}`;
}

function getCached(destination: string): PlaceRecommendation[] | null {
  const entry = getJson<RecommendationCacheEntry>(cacheKey(destination));
  if (!entry?.items?.length) return null;

  const age = Date.now() - new Date(entry.fetchedAt).getTime();
  if (age > CACHE_TTL_MS) return null;

  return entry.items;
}

function setCached(destination: string, items: PlaceRecommendation[]): void {
  setJson(cacheKey(destination), {
    fetchedAt: new Date().toISOString(),
    items,
  } satisfies RecommendationCacheEntry);
}

function mapPlaceResults(
  places: PlaceSearchResult[],
  city: string,
  destination: string
): PlaceRecommendation[] {
  return places
    .filter((p) => p.name)
    .map((p) => ({
      id: p.googlePlaceId ?? p.id,
      googlePlaceId: p.googlePlaceId ?? p.id,
      title: p.name,
      tag: city,
      destination,
      subtitle: p.label,
    }));
}

export function dedupeRecommendationDestinations(trips: Trip[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const trip of trips) {
    const dest = trip.destination.trim();
    if (!dest) continue;
    const key = dest.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(dest);
    if (result.length >= MAX_DESTINATIONS) break;
  }

  return result;
}

async function searchWithFallback(
  destination: string,
  city: string
): Promise<PlaceRecommendation[]> {
  const textQueries = [
    `tourist attractions in ${city}`,
    `things to do in ${destination}`,
    `landmarks in ${city}`,
  ];

  for (const query of textQueries) {
    try {
      const places = await textSearchPlacesGoogle(query, RECS_PER_DESTINATION);
      const items = places
        .filter((p) => p.placeId && p.name)
        .map((p) => ({
          id: p.placeId,
          googlePlaceId: p.placeId,
          title: p.name,
          tag: city,
          destination,
          subtitle: p.address,
        }));
      if (items.length > 0) return items;
    } catch (err) {
      if (__DEV__) console.warn('[Wandr] Text search failed for', query, err);
    }
  }

  for (const query of textQueries) {
    try {
      const places = await searchPlaces(query, RECS_PER_DESTINATION);
      const items = mapPlaceResults(places, city, destination);
      if (items.length > 0) return items;
    } catch (err) {
      if (__DEV__) console.warn('[Wandr] Place search fallback failed for', query, err);
    }
  }

  return [];
}

export async function fetchRecommendationsForDestination(
  destination: string
): Promise<PlaceRecommendation[]> {
  const cached = getCached(destination);
  if (cached) return cached;

  const city = displayCityFromDestination(destination);
  const items = await searchWithFallback(destination, city);

  if (items.length > 0) {
    setCached(destination, items);
  }

  return items;
}

export async function fetchRecommendationsForTrips(
  trips: Trip[]
): Promise<PlaceRecommendation[]> {
  if (!isGoogleMapsConfigured()) return [];

  const destinations = dedupeRecommendationDestinations(trips);
  if (destinations.length === 0) return [];

  const results = await Promise.allSettled(
    destinations.map((d) => fetchRecommendationsForDestination(d))
  );

  const combined: PlaceRecommendation[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      combined.push(...result.value);
    } else if (__DEV__) {
      console.warn('[Wandr] Recommendations fetch failed:', result.reason);
    }
  }

  return combined.slice(0, MAX_TOTAL);
}
