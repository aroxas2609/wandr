import { Slot, useLocalSearchParams } from 'expo-router';
import { useTripDays } from '@/features/trips/hooks/useTrips';
import { useTripRealtime } from '@/hooks/useTripRealtime';
import { resolveSearchParam } from '@/lib/routeParams';

export default function TripIdLayout() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const tripId = resolveSearchParam(idParam) ?? '';
  const { data: days = [] } = useTripDays(tripId);

  useTripRealtime(
    tripId,
    days.map((d) => d.id)
  );

  return <Slot />;
}
