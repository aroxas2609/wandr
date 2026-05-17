import { fetchTrips } from '@/features/trips/services/tripService';
import { fetchTripDays } from '@/features/trips/services/tripService';
import { fetchActivitiesForTrip } from '@/features/itinerary/services/itineraryService';
import { fetchExpenses } from '@/features/budget/services/expenseService';
import { fetchPackingItems } from '@/features/packing/services/packingService';
import { fetchDocuments } from '@/features/wallet/services/documentService';

export async function buildTripsExport(userId: string) {
  const trips = await fetchTrips();
  const owned = trips.filter((t) => t.ownerId === userId);

  const payload = await Promise.all(
    owned.map(async (trip) => {
      const days = await fetchTripDays(trip.id);
      const activities = await fetchActivitiesForTrip(days);
      const expenses = await fetchExpenses(trip.id);
      const packing = await fetchPackingItems(trip.id);
      const documents = await fetchDocuments(trip.id);
      return { trip, days, activities, expenses, packing, documents };
    })
  );

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    trips: payload,
  };
}
