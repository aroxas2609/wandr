import { isGoogleMapsConfigured } from '@/lib/mapsConfig';
import { reverseGeocodeGoogle, searchPlacesGoogle } from './googlePlacesService';

export { resolvePlaceForSave } from './googlePlacesService';

export interface PlaceSearchResult {
  id: string;
  name: string;
  /** Full display line (POI / address) — preferred for UI when set */
  label?: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
}

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

const NOMINATIM_HEADERS: HeadersInit = {
  'User-Agent': 'Wandr/1.0 (travel planner)',
  Accept: 'application/json',
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Geocoding request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

/** Distance in meters between two coordinates. */
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatPlaceLabel(place: PlaceSearchResult): string {
  if (place.label?.trim()) return place.label.trim();
  const region = place.admin1 && place.admin1 !== place.name ? place.admin1 : undefined;
  const parts = [place.name, region, place.country].filter(Boolean);
  return parts.join(', ');
}

function shortenDisplayName(displayName: string, maxParts = 3): string {
  return displayName
    .split(',')
    .slice(0, maxParts)
    .map((p) => p.trim())
    .filter(Boolean)
    .join(', ');
}

async function searchPlacesOpenMeteo(
  query: string,
  count: number
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({
    name: query,
    count: String(count),
    language: 'en',
    format: 'json',
  });

  const data = await fetchJson<{
    results?: Array<{
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      admin1?: string;
      country?: string;
      country_code?: string;
    }>;
  }>(`${GEOCODING_URL}?${params}`);

  return (data.results ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    admin1: r.admin1,
    country: r.country,
    countryCode: r.country_code,
  }));
}

/** POI / venue search (Nominatim) — better for "Tokyo Disney", museums, etc. */
async function searchPlacesNominatim(
  query: string,
  count: number
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: String(count),
    addressdetails: '1',
  });

  const data = await fetchJson<
    Array<{
      place_id: number;
      lat: string;
      lon: string;
      display_name: string;
      name?: string;
    }>
  >(`${NOMINATIM_SEARCH}?${params}`, { headers: NOMINATIM_HEADERS });

  return data.map((r) => {
    const short = shortenDisplayName(r.display_name, 2);
    return {
      id: String(r.place_id),
      name: r.name ?? short.split(',')[0] ?? r.display_name,
      label: short,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    };
  });
}

function dedupePlaces(places: PlaceSearchResult[], count: number): PlaceSearchResult[] {
  const out: PlaceSearchResult[] = [];
  for (const place of places) {
    const dup = out.some(
      (p) => distanceMeters(p, place) < 150 && p.name.toLowerCase() === place.name.toLowerCase()
    );
    if (!dup) out.push(place);
    if (out.length >= count) break;
  }
  return out;
}

/** Search places — Google Places when configured, else Nominatim + Open-Meteo. */
export async function searchPlaces(
  query: string,
  count = 6
): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  if (isGoogleMapsConfigured()) {
    try {
      const google = await searchPlacesGoogle(trimmed, count);
      if (google.length > 0) return google;
    } catch (e) {
      if (__DEV__) console.warn('[Wandr] Google Places search failed:', e);
    }
  }

  const [nomi, meteo] = await Promise.allSettled([
    searchPlacesNominatim(trimmed, count),
    searchPlacesOpenMeteo(trimmed, count),
  ]);

  const combined = [
    ...(nomi.status === 'fulfilled' ? nomi.value : []),
    ...(meteo.status === 'fulfilled' ? meteo.value : []),
  ];

  return dedupePlaces(combined, count);
}

/** Best-effort place name from coordinates (Google Geocoding, then Nominatim). */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (isGoogleMapsConfigured()) {
    try {
      const google = await reverseGeocodeGoogle(latitude, longitude);
      if (google) return google;
    } catch (e) {
      if (__DEV__) console.warn('[Wandr] Google reverse geocode failed:', e);
    }
  }

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'json',
  });

  const data = await fetchJson<{ display_name?: string }>(
    `${NOMINATIM_REVERSE}?${params}`,
    { headers: NOMINATIM_HEADERS }
  );

  if (!data.display_name) return null;
  return shortenDisplayName(data.display_name, 3);
}

/** Pick the best label when saving a map pin. */
export async function resolveMapPinLocationName(options: {
  pin: { latitude: number; longitude: number };
  selectedName?: string | null;
  searchQuery?: string;
  /** Set when user picked a search result — keeps name if pin nudged nearby */
  searchAnchor?: { latitude: number; longitude: number; name: string } | null;
}): Promise<string | null> {
  const { pin, selectedName, searchQuery, searchAnchor } = options;

  if (selectedName?.trim()) return selectedName.trim();

  if (searchAnchor?.name && distanceMeters(pin, searchAnchor) < 800) {
    return searchAnchor.name;
  }

  const q = searchQuery?.trim();
  if (q && q.length >= 2) {
    if (!searchAnchor || distanceMeters(pin, searchAnchor) < 1500) {
      return q;
    }
  }

  return reverseGeocode(pin.latitude, pin.longitude);
}
