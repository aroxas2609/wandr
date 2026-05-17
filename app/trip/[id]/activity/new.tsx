import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components';
import { ActivityForm } from '@/features/itinerary/ui/ActivityForm';
import { useCreateActivity } from '@/features/itinerary/hooks/useItinerary';
import { useTrip } from '@/features/trips/hooks/useTrips';
import type { ActivityFormData } from '@/features/itinerary/schemas/activitySchema';
import type { TimeSlot } from '@/types';
import { resolveSearchParam } from '@/lib/routeParams';
import { getErrorMessage } from '@/lib/errors';
import { colors, spacing, typography } from '@/theme';

export default function NewActivityScreen() {
  const { id, dayId: dayIdParam, slot } = useLocalSearchParams<{
    id: string;
    dayId: string;
    slot?: string;
  }>();
  const { data: trip } = useTrip(id);
  const dayId = resolveSearchParam(dayIdParam) ?? '';
  const [formError, setFormError] = useState('');
  const createActivity = useCreateActivity(dayId);

  const onSubmit = async (data: ActivityFormData) => {
    setFormError('');
    if (!dayId) {
      setFormError('Missing day. Go back to the day planner and try again.');
      return;
    }
    try {
      await createActivity.mutateAsync(data);
      router.back();
    } catch (e) {
      const message = getErrorMessage(e, 'Could not add activity.');
      setFormError(message);
      if (__DEV__) console.warn('[Wandr] create activity failed:', e);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Add Activity" showBack />
      <View style={styles.form}>
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        <ActivityForm
          defaultValues={{ timeSlot: (resolveSearchParam(slot) as TimeSlot) ?? 'morning' }}
          tripDestination={trip?.destination}
          onSubmit={onSubmit}
          loading={createActivity.isPending}
          submitLabel="Add Activity"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { flex: 1, paddingHorizontal: spacing.xl },
  formError: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
});
