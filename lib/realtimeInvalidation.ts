import type { QueryClient } from '@tanstack/react-query';
import { expenseKeys } from '@/features/budget/hooks/useExpenses';
import { itineraryKeys } from '@/features/itinerary/hooks/useItinerary';
import { chatKeys } from '@/features/chat/hooks/useTripChat';
import { packingKeys } from '@/features/packing/hooks/usePacking';
import { tripKeys } from '@/features/trips/hooks/useTrips';

/** Invalidate React Query caches for a trip after a Realtime postgres change. */
export function invalidateTripQueries(
  queryClient: QueryClient,
  tripId: string,
  dayIds: string[]
): void {
  void queryClient.invalidateQueries({ queryKey: tripKeys.all });
  void queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
  void queryClient.invalidateQueries({ queryKey: tripKeys.days(tripId) });
  void queryClient.invalidateQueries({ queryKey: tripKeys.members(tripId) });
  void queryClient.invalidateQueries({ queryKey: itineraryKeys.trip(tripId) });
  void queryClient.invalidateQueries({ queryKey: expenseKeys.trip(tripId) });
  void queryClient.invalidateQueries({ queryKey: packingKeys.trip(tripId) });
  void queryClient.invalidateQueries({ queryKey: chatKeys.trip(tripId) });

  for (const dayId of dayIds) {
    void queryClient.invalidateQueries({ queryKey: itineraryKeys.day(dayId) });
  }
}
