import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components';
import { TripForm } from '@/features/trips/ui/TripForm';
import { useCreateTrip } from '@/features/trips/hooks/useTrips';
import { useAuthStore } from '@/stores/authStore';
import type { TripFormData } from '@/features/trips/schemas/tripSchema';
import { colors, spacing } from '@/theme';

function formatError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: string }).message);
  }
  return 'Could not create trip';
}

export default function CreateTripScreen() {
  const createTrip = useCreateTrip();
  const userId = useAuthStore((s) => s.user?.id);

  const onSubmit = async (data: TripFormData) => {
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in again to create a trip.');
      router.replace('/(auth)/login');
      return;
    }

    try {
      const trip = await createTrip.mutateAsync({ form: data });
      router.replace(`/trip/${trip.id}`);
    } catch (e) {
      Alert.alert('Create trip failed', formatError(e));
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="New Trip" subtitle="Plan something extraordinary" showBack />
      <View style={styles.form}>
        <TripForm
          onSubmit={onSubmit}
          loading={createTrip.isPending}
          submitLabel="Create Trip"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { flex: 1, paddingHorizontal: spacing.xl },
});
