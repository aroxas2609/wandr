import type { Trip } from '@/types';
import type { TripWeatherSnapshot } from '@/types/weather';
import { weatherCodeToCondition } from '../utils/weatherCodes';
import {
  countryCodeFromDestination,
  displayCityFromDestination,
  geocodeQueryFromDestination,
} from '../utils/parseDestination';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
}

interface GeocodeResponse {
  results?: GeocodeResult[];
}

interface ForecastResponse {
  current?: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    relative_humidity_2m?: number;
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

async function geocodeDestination(destination: string): Promise<GeocodeResult | null> {
  const query = geocodeQueryFromDestination(destination);
  if (!query) return null;

  const countryCode = countryCodeFromDestination(destination);
  const params = new URLSearchParams({
    name: query,
    count: '5',
    language: 'en',
    format: 'json',
  });
  if (countryCode) {
    params.set('countryCode', countryCode);
  }

  const data = await fetchJson<GeocodeResponse>(`${GEOCODING_URL}?${params}`);
  const results = data.results ?? [];
  if (results.length === 0) return null;

  if (countryCode) {
    return results.find((r) => r.country_code === countryCode) ?? results[0];
  }

  return results[0];
}

async function fetchCurrentWeather(
  latitude: number,
  longitude: number
): Promise<ForecastResponse['current']> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code,relative_humidity_2m',
    temperature_unit: 'celsius',
    timezone: 'auto',
  });

  const data = await fetchJson<ForecastResponse>(`${FORECAST_URL}?${params}`);
  if (!data.current) throw new Error('No current weather returned');
  return data.current;
}

export async function fetchWeatherForDestination(
  tripId: string,
  destination: string
): Promise<TripWeatherSnapshot> {
  const city = displayCityFromDestination(destination);
  const place = await geocodeDestination(destination);
  if (!place) {
    throw new Error(`Could not find location for “${city}”`);
  }

  const current = await fetchCurrentWeather(place.latitude, place.longitude);
  if (!current) throw new Error('No current weather returned');

  const tempC = Math.round(current.temperature_2m);

  return {
    tripId,
    city: place.name,
    destination,
    tempC,
    temp: `${tempC}°C`,
    condition: weatherCodeToCondition(current.weather_code),
    humidity: current.relative_humidity_2m,
    fetchedAt: current.time,
  };
}

export interface WeatherTripInput {
  tripId: string;
  destination: string;
}

/** One card per unique destination; uses first trip id for that destination. */
export function dedupeWeatherTrips(trips: Trip[]): WeatherTripInput[] {
  const seen = new Set<string>();
  const result: WeatherTripInput[] = [];

  for (const trip of trips) {
    const key = trip.destination.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({ tripId: trip.id, destination: trip.destination });
  }

  return result;
}

export async function fetchWeatherForTrips(
  trips: WeatherTripInput[]
): Promise<TripWeatherSnapshot[]> {
  const results = await Promise.allSettled(
    trips.map((t) => fetchWeatherForDestination(t.tripId, t.destination))
  );

  const snapshots: TripWeatherSnapshot[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      snapshots.push(result.value);
    } else if (__DEV__) {
      console.warn('[Wandr] Weather fetch failed:', result.reason);
    }
  }
  return snapshots;
}
