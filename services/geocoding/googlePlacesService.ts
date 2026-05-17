import { Platform } from 'react-native';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import type { PlaceSearchResult } from './geocodingService';
import { getGoogleMapsApiKey, isGoogleMapsConfigured } from '@/lib/mapsConfig';

const useGoogleJsOnWeb = Platform.OS === 'web';

let optionsConfigured = false;

function ensureGoogleOptions(): void {
  if (optionsConfigured) return;
  setOptions({ key: getGoogleMapsApiKey(), language: 'en' });
  optionsConfigured = true;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = (await response.json()) as T & { status?: string; error_message?: string };
  if (!response.ok) {
    throw new Error(data.error_message ?? `Google API failed (${response.status})`);
  }
  return data;
}

function mapPrediction(p: {
  place_id: string;
  description: string;
  structured_formatting?: { main_text: string; secondary_text?: string };
}): PlaceSearchResult {
  return {
    id: p.place_id,
    googlePlaceId: p.place_id,
    name: p.structured_formatting?.main_text ?? p.description,
    label: p.description,
    latitude: 0,
    longitude: 0,
  };
}

/** Autocomplete predictions (English). Coordinates loaded when user selects a result. */
export async function searchPlacesGoogle(
  query: string,
  count = 8
): Promise<PlaceSearchResult[]> {
  if (!isGoogleMapsConfigured()) return [];

  if (useGoogleJsOnWeb) {
    ensureGoogleOptions();
    const places = await importLibrary('places');
    const service = new places.AutocompleteService();

    return new Promise((resolve, reject) => {
      service.getPlacePredictions(
        { input: query, language: 'en' },
        (predictions, status) => {
          if (status === places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
            return;
          }
          if (status !== places.PlacesServiceStatus.OK) {
            reject(new Error(status));
            return;
          }
          resolve((predictions ?? []).slice(0, count).map(mapPrediction));
        }
      );
    });
  }

  const params = new URLSearchParams({
    input: query,
    key: getGoogleMapsApiKey(),
    language: 'en',
  });

  const data = await fetchJson<{
    status: string;
    predictions?: Array<{
      place_id: string;
      description: string;
      structured_formatting?: { main_text: string; secondary_text?: string };
    }>;
  }>(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`);

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(data.status);
  }

  return (data.predictions ?? []).slice(0, count).map(mapPrediction);
}

export async function fetchGooglePlaceDetails(placeId: string): Promise<PlaceSearchResult> {
  if (!isGoogleMapsConfigured()) {
    throw new Error('Google Maps API key is not configured');
  }

  if (useGoogleJsOnWeb) {
    ensureGoogleOptions();
    const places = await importLibrary('places');
    const host = document.createElement('div');
    const service = new places.PlacesService(host);

    return new Promise((resolve, reject) => {
      service.getDetails(
        {
          placeId,
          fields: ['geometry', 'name', 'formatted_address'],
          language: 'en',
        },
        (place, status) => {
          if (status !== places.PlacesServiceStatus.OK || !place?.geometry?.location) {
            reject(new Error(status));
            return;
          }
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const name = place.name ?? place.formatted_address ?? 'Selected place';
          resolve({
            id: placeId,
            googlePlaceId: placeId,
            name,
            label: place.formatted_address ?? name,
            latitude: lat,
            longitude: lng,
          });
        }
      );
    });
  }

  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'geometry,name,formatted_address',
    key: getGoogleMapsApiKey(),
    language: 'en',
  });

  const data = await fetchJson<{
    status: string;
    result?: {
      name?: string;
      formatted_address?: string;
      geometry?: { location?: { lat: number; lng: number } };
    };
  }>(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);

  if (data.status !== 'OK' || !data.result?.geometry?.location) {
    throw new Error(data.status ?? 'Place details not found');
  }

  const { lat, lng } = data.result.geometry.location;
  const name = data.result.name ?? data.result.formatted_address ?? 'Selected place';

  return {
    id: placeId,
    googlePlaceId: placeId,
    name,
    label: data.result.formatted_address ?? name,
    latitude: lat,
    longitude: lng,
  };
}

/** Resolve autocomplete row or partial place into coordinates + label. */
export async function resolvePlaceForSave(place: PlaceSearchResult): Promise<PlaceSearchResult> {
  const hasCoords =
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude) &&
    (place.latitude !== 0 || place.longitude !== 0);

  if (hasCoords) return place;

  const placeId = place.googlePlaceId ?? place.id;
  if (placeId && placeId.length > 8) {
    return fetchGooglePlaceDetails(placeId);
  }

  return place;
}

export interface GoogleTextSearchResult {
  placeId: string;
  name: string;
  address?: string;
}

async function textSearchPlacesNewApi(
  textQuery: string,
  count: number
): Promise<GoogleTextSearchResult[]> {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getGoogleMapsApiKey(),
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery, languageCode: 'en' }),
  });

  const data = (await response.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
    }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Places search failed (${response.status})`);
  }

  return (data.places ?? []).slice(0, count).map((p) => ({
    placeId: p.id ?? '',
    name: p.displayName?.text ?? 'Place',
    address: p.formattedAddress,
  }));
}

/** Text Search — e.g. "things to do in Tokyo" (used for home recommendations). */
export async function textSearchPlacesGoogle(
  query: string,
  count = 3
): Promise<GoogleTextSearchResult[]> {
  if (!isGoogleMapsConfigured()) return [];

  try {
    const fromNew = await textSearchPlacesNewApi(query, count);
    if (fromNew.length > 0) return fromNew;
  } catch (err) {
    if (__DEV__) {
      console.warn('[Wandr] Places API (New) text search failed, trying legacy:', err);
    }
  }

  if (useGoogleJsOnWeb) {
    ensureGoogleOptions();
    const places = await importLibrary('places');
    const host = document.createElement('div');
    const service = new places.PlacesService(host);

    return new Promise((resolve, reject) => {
      service.textSearch({ query, language: 'en' }, (results, status) => {
        if (status === places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
          return;
        }
        if (status !== places.PlacesServiceStatus.OK) {
          reject(new Error(status));
          return;
        }
        resolve(
          (results ?? []).slice(0, count).map((r) => ({
            placeId: r.place_id ?? '',
            name: r.name ?? 'Place',
            address: r.formatted_address,
          }))
        );
      });
    });
  }

  const params = new URLSearchParams({
    query,
    key: getGoogleMapsApiKey(),
    language: 'en',
  });

  const data = await fetchJson<{
    status: string;
    results?: Array<{
      place_id?: string;
      name?: string;
      formatted_address?: string;
    }>;
  }>(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`);

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(data.status);
  }

  return (data.results ?? []).slice(0, count).map((r) => ({
    placeId: r.place_id ?? '',
    name: r.name ?? 'Place',
    address: r.formatted_address,
  }));
}

export async function reverseGeocodeGoogle(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (!isGoogleMapsConfigured()) return null;

  if (useGoogleJsOnWeb) {
    ensureGoogleOptions();
    const { Geocoder } = await importLibrary('geocoding');
    const geocoder = new Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode(
        { location: { lat: latitude, lng: longitude }, language: 'en' },
        (results, status) => {
          if (status === 'OK' && results?.[0]?.formatted_address) {
            resolve(results[0].formatted_address);
            return;
          }
          resolve(null);
        }
      );
    });
  }

  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
    key: getGoogleMapsApiKey(),
    language: 'en',
  });

  const data = await fetchJson<{
    status: string;
    results?: Array<{ formatted_address?: string }>;
  }>(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

  if (data.status !== 'OK' || !data.results?.[0]?.formatted_address) {
    return null;
  }

  return data.results[0].formatted_address;
}
