import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  HeroSection,
  GlassCard,
  PremiumButton,
  ActivityCard,
  AvatarStack,
  TripToolsGrid,
  DeleteIconButton,
} from '@/components';
import { isFeatureEnabled } from '@/constants/features';
import { calculateTotalExpenses } from '@/utils/budget';
import { useExpenses } from '@/features/budget/hooks/useExpenses';
import {
  useTrip,
  useTripDays,
  useTripMembers,
  useDeleteTrip,
  tripKeys,
} from '@/features/trips/hooks/useTrips';
import { ensureTripDays } from '@/features/trips/services/tripService';
import { useQueryClient } from '@tanstack/react-query';
import { useTripActivities } from '@/features/itinerary/hooks/useItinerary';
import { getNextActivities } from '@/utils/itinerary';
import { formatDateRange, formatTripDate } from '@/utils/dates';
import { confirmAction } from '@/lib/confirm';
import { getErrorMessage } from '@/lib/errors';
import { navigateBack } from '@/lib/navigation';
import { showAppMessage } from '@/stores/appMessageStore';
import { colors, typography, spacing } from '@/theme';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: trip, isLoading } = useTrip(id);
  const { data: days = [], isLoading: daysLoading } = useTripDays(id);
  const queryClient = useQueryClient();
  const { data: members = [] } = useTripMembers(id);
  const { data: activities = [] } = useTripActivities(days, id);
  const { data: expenses = [] } = useExpenses(id);
  const deleteTrip = useDeleteTrip();
  const [deleting, setDeleting] = useState(false);
  const [openingPlanner, setOpeningPlanner] = useState(false);
  const spent = calculateTotalExpenses(expenses);

  if (isLoading || !trip) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Pressable
          onPress={() => navigateBack('/(tabs)/trips')}
          style={[styles.backButton, { top: insets.top + spacing.sm, left: spacing.xl }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const previewActivities = getNextActivities(activities, 3);
  const memberNames = members.map((m) => m.fullName);

  const handleDelete = () => {
    confirmAction('Delete Trip', 'This cannot be undone.', {
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await deleteTrip.mutateAsync(id);
          router.replace('/(tabs)/trips');
        } catch (e) {
          const message = getErrorMessage(e, undefined, 'trip-delete');
          showAppMessage('Cannot delete trip', message);
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const handleOpenDayPlanner = async () => {
    if (!trip) return;
    setOpeningPlanner(true);
    try {
      let tripDays = days;
      if (tripDays.length === 0) {
        tripDays = await ensureTripDays(trip);
        await queryClient.invalidateQueries({ queryKey: tripKeys.days(id) });
      }
      const day = tripDays[0];
      if (!day) {
        showAppMessage(
          'Day planner',
          'No days found for this trip. Check start and end dates.'
        );
        return;
      }
      router.push(`/trip/${id}/day/${day.id}`);
    } catch (e) {
      const message = getErrorMessage(e, 'Could not open day planner.');
      showAppMessage('Day planner', message);
    } finally {
      setOpeningPlanner(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <HeroSection
          title={trip.title}
          subtitle={trip.destination}
          imageUrl={trip.coverUrl}
          startDate={trip.startDate}
          endDate={trip.endDate}
          showBack
          backHref="/(tabs)/trips"
        />
        <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.actions}>
            <Pressable onPress={() => router.push(`/trip/${id}/edit`)} style={styles.iconButton}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </Pressable>
            <DeleteIconButton
              size="sm"
              onPress={handleDelete}
              disabled={deleting}
              accessibilityLabel="Delete trip"
              style={[styles.iconButton, deleting && styles.iconButtonDisabled]}
            />
          </View>

          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>DATES</Text>
            <Text style={styles.summaryValue}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
            {trip.budgetTarget != null && trip.budgetTarget > 0 && (
              <Pressable
                style={styles.summarySpaced}
                onPress={() =>
                  isFeatureEnabled('budget') && router.push(`/trip/${id}/budget`)
                }
                disabled={!isFeatureEnabled('budget')}
              >
                <Text style={styles.summaryLabel}>BUDGET</Text>
                <Text style={styles.summaryValue}>
                  ${spent.toLocaleString()} of ${trip.budgetTarget.toLocaleString()}
                  {isFeatureEnabled('budget') ? ' ›' : ''}
                </Text>
              </Pressable>
            )}
            {memberNames.length > 0 && (
              <View style={styles.membersRow}>
                <Text style={styles.summaryLabel}>TRAVELERS</Text>
                <AvatarStack names={memberNames} />
              </View>
            )}
          </GlassCard>

          <TripToolsGrid tripId={id} />

          {previewActivities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Up Next</Text>
              {previewActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onPress={() =>
                    router.push(`/trip/${id}/activity/${activity.id}?dayId=${activity.dayId}`)
                  }
                />
              ))}
            </View>
          )}

          <PremiumButton
            label="Open Day Planner"
            onPress={() => void handleOpenDayPlanner()}
            loading={openingPlanner || daysLoading}
            disabled={openingPlanner}
          />
          {days.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
              {days.map((day) => (
                <Pressable
                  key={day.id}
                  style={styles.dayChip}
                  onPress={() => router.push(`/trip/${id}/day/${day.id}`)}
                >
                  <Text style={styles.dayChipText}>Day {day.dayNumber}</Text>
                  <Text style={styles.dayChipDate}>{formatTripDate(day.date)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  backButton: {
    position: 'absolute',
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { ...typography.body },
  content: { paddingHorizontal: spacing.xl, marginTop: -24 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: { opacity: 0.5 },
  summaryCard: { marginBottom: spacing.xl },
  summaryLabel: { ...typography.overline, marginBottom: 4 },
  summaryValue: { ...typography.h3, fontSize: 16 },
  summarySpaced: { marginTop: spacing.lg },
  membersRow: { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  dayScroll: { marginTop: spacing.lg },
  dayChip: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minWidth: 100,
  },
  dayChipText: { ...typography.label, color: colors.gold },
  dayChipDate: { ...typography.caption, marginTop: 4 },
});
