import { QueryClient } from '@tanstack/react-query';
import { invalidateTripQueries } from '@/lib/realtimeInvalidation';
import { expenseKeys } from '@/features/budget/hooks/useExpenses';
import { itineraryKeys } from '@/features/itinerary/hooks/useItinerary';
import { packingKeys } from '@/features/packing/hooks/usePacking';
import { tripKeys } from '@/features/trips/hooks/useTrips';

describe('invalidateTripQueries', () => {
  it('invalidates all trip-scoped query keys', () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    invalidateTripQueries(queryClient, 'trip-1', ['day-a', 'day-b']);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tripKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tripKeys.detail('trip-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tripKeys.days('trip-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tripKeys.members('trip-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: itineraryKeys.trip('trip-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expenseKeys.trip('trip-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: packingKeys.trip('trip-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: itineraryKeys.day('day-a') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: itineraryKeys.day('day-b') });

    invalidateSpy.mockRestore();
  });
});
