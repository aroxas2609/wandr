import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader, DeleteIconButton } from '@/components';
import { confirmDelete } from '@/lib/confirm';
import { ActivityForm } from '@/features/itinerary/ui/ActivityForm';
import {
  useActivity,
  useUpdateActivity,
  useDeleteActivity,
} from '@/features/itinerary/hooks/useItinerary';
import { useTrip } from '@/features/trips/hooks/useTrips';
import type { ActivityFormData } from '@/features/itinerary/schemas/activitySchema';
import { parseDbTimeToForm } from '@/lib/timeInput';
import { colors, spacing } from '@/theme';

export default function ActivityDetailScreen() {
  const { id, activityId, dayId } = useLocalSearchParams<{
    id: string;
    activityId: string;
    dayId: string;
  }>();
  const { data: trip } = useTrip(id);
  const { data: activity, isLoading } = useActivity(activityId);
  const updateActivity = useUpdateActivity(activityId, dayId);
  const deleteActivity = useDeleteActivity(dayId);

  const onSubmit = async (data: ActivityFormData) => {
    await updateActivity.mutateAsync(data);
    router.back();
  };

  if (isLoading || !activity) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Activity" showBack />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Activity" showBack />
      <View style={styles.form}>
        <ActivityForm
          defaultValues={{
            title: activity.title,
            timeSlot: activity.timeSlot,
            startTime: parseDbTimeToForm(activity.startTime),
            endTime: parseDbTimeToForm(activity.endTime),
            locationName: activity.locationName ?? '',
            lat: activity.lat,
            lng: activity.lng,
            notes: activity.notes ?? '',
            bookingUrl: activity.bookingUrl ?? '',
          }}
          tripDestination={trip?.destination}
          onSubmit={onSubmit}
          loading={updateActivity.isPending}
          submitLabel="Save Changes"
        />
        <DeleteIconButton
          size="md"
          onPress={confirmDelete('Delete activity?', 'Remove this from your itinerary?', async () => {
            await deleteActivity.mutateAsync(activityId);
            router.back();
          })}
          accessibilityLabel="Delete activity"
          style={styles.deleteButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { flex: 1, paddingHorizontal: spacing.xl },
  deleteButton: { alignSelf: 'center', marginTop: spacing.lg, marginBottom: spacing['3xl'] },
});
