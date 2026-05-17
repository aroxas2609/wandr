import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Trip } from '@/types';
import {
  dedupeWeatherTrips,
  fetchWeatherForTrips,
} from '../services/weatherService';

export const weatherKeys = {
  trips: (destinationsKey: string) => ['weather', 'trips', destinationsKey] as const,
};

export function useTripWeather(trips: Trip[]) {
  const inputs = useMemo(() => dedupeWeatherTrips(trips), [trips]);
  const destinationsKey = inputs.map((i) => i.destination).join('|');

  return useQuery({
    queryKey: weatherKeys.trips(destinationsKey),
    queryFn: () => fetchWeatherForTrips(inputs),
    enabled: inputs.length > 0,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}
