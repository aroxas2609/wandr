import { useMemo } from 'react';
import { useTrip, useTripMembers } from '@/features/trips/hooks/useTrips';
import { useAuthStore } from '@/stores/authStore';
import { resolveTripAccess, type TripAccess } from '@/lib/tripAccess';

export function useTripAccess(tripId: string): TripAccess & { isLoading: boolean } {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { data: members = [], isLoading: membersLoading } = useTripMembers(tripId);

  const access = useMemo(
    () => resolveTripAccess(trip?.ownerId, userId, members),
    [trip?.ownerId, userId, members]
  );

  return {
    ...access,
    isLoading: tripLoading || membersLoading,
  };
}
