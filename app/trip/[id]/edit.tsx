import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components';
import { TripForm } from '@/features/trips/ui/TripForm';
import { useTrip, useUpdateTrip } from '@/features/trips/hooks/useTrips';
import type { TripFormData } from '@/features/trips/schemas/tripSchema';
import { useTripAccess } from '@/hooks/useTripAccess';
import { getErrorMessage } from '@/lib/errors';
import { colors, spacing, typography } from '@/theme';
import { ViewOnlyBanner } from '@/components';

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading } = useTrip(id);
  const { canEdit } = useTripAccess(id);
  const updateTrip = useUpdateTrip();
  const [formError, setFormError] = useState('');

  const onSubmit = async (data: TripFormData) => {
    setFormError('');
    try {
      await updateTrip.mutateAsync({ id, form: data });
      router.back();
    } catch (e) {
      setFormError(getErrorMessage(e, undefined, 'trip-save'));
    }
  };

  if (isLoading || !trip) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!canEdit) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Edit Trip" showBack backHref={`/trip/${id}`} />
        <View style={styles.form}>
          <ViewOnlyBanner message="Only the trip owner or an editor can change trip details." />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Trip" showBack backHref={`/trip/${id}`} />
      <View style={styles.form}>
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
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
  formError: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});
