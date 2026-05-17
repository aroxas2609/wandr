import { View, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components';
import { TripForm } from '@/features/trips/ui/TripForm';
import { useTrip, useUpdateTrip } from '@/features/trips/hooks/useTrips';
import type { TripFormData } from '@/features/trips/schemas/tripSchema';
import { getErrorMessage } from '@/lib/errors';
import { colors, spacing } from '@/theme';

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading } = useTrip(id);
  const updateTrip = useUpdateTrip();

  const onSubmit = async (data: TripFormData) => {
    try {
      await updateTrip.mutateAsync({ id, form: data });
      router.back();
    } catch (e) {
      const message = getErrorMessage(e, 'Could not save trip.');
      if (Platform.OS === 'web') globalThis.alert(message);
      else Alert.alert('Save failed', message);
    }
  };

  if (isLoading || !trip) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Trip" showBack backHref={`/trip/${id}`} />
      <View style={styles.form}>
        <TripForm
          defaultValues={{
            title: trip.title,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            budgetTarget: trip.budgetTarget != null ? String(trip.budgetTarget) : '',
            travelStyles: trip.travelStyles,
            coverUrl: trip.coverUrl ?? '',
          }}
          onSubmit={onSubmit}
          loading={updateTrip.isPending}
          submitLabel="Save Changes"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { flex: 1, paddingHorizontal: spacing.xl },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});
