import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isGoogleMapsConfigured } from '@/lib/mapsConfig';
import type { Trip } from '@/types';
import { fetchRecommendationsForTrips } from '../services/recommendationsService';

export const recommendationKeys = {
  trips: (destinationsKey: string) => ['recommendations', 'trips', destinationsKey] as const,
};

const STALE_MS = 24 * 60 * 60 * 1000;
const GC_MS = 48 * 60 * 60 * 1000;

export function useRecommendations(trips: Trip[]) {
  const destinationsKey = useMemo(
    () =>
      trips
        .map((t) => t.destination.trim().toLowerCase())
        .filter(Boolean)
        .join('|'),
    [trips]
  );

  return useQuery({
    queryKey: recommendationKeys.trips(destinationsKey),
    queryFn: () => fetchRecommendationsForTrips(trips),
    enabled: isGoogleMapsConfigured() && trips.length > 0,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    retry: 1,
  });
}
