import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { usePullToRefreshFeedback } from '@/hooks/usePullToRefreshFeedback';
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
  ViewOnlyBanner,
} from '@/components';
import { useTripAccess } from '@/hooks/useTripAccess';
import { isFeatureEnabled } from '@/constants/features';
import { DEFAULT_TRIP_CURRENCY } from '@/constants/currencies';
import {
  calculateTotalExpenses,
  totalsByCurrency,
  formatTotalsLine,
  hasSingleCurrency,
  formatMoney,
} from '@/utils/budget';
import { useExpenses } from '@/features/budget/hooks/useExpenses';
import {
  useTrip,
  useTripDays,
  useTripMembers,
  useDeleteTrip,
  useArchiveTrip,
  tripKeys,
} from '@/features/trips/hooks/useTrips';
import { ensureTripDays } from '@/features/trips/services/tripService';
import { useQueryClient } from '@tanstack/react-query';
import { useTripActivities } from '@/features/itinerary/hooks/useItinerary';
import { getNextActivities } from '@/utils/itinerary';
import { formatDateRange, formatTripDate } from '@/utils/dates';
import { confirmAction } from '@/lib/confirm';
import { getErrorMessage } from '@/lib/errors';
import { resolveMemberDisplayName } from '@/lib/memberDisplayName';
import { resolveMemberAvatar } from '@/lib/memberAvatar';
import { navigateBack } from '@/lib/navigation';
import { showAppMessage } from '@/stores/appMessageStore';
import { useAuthStore } from '@/stores/authStore';
import { colors, typography, spacing } from '@/theme';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: trip, isLoading, refetch: refetchTrip, isRefetching: tripRefetching } = useTrip(id);
  const {
    data: days = [],
    isLoading: daysLoading,
    refetch: refetchDays,
    isRefetching: daysRefetching,
  } = useTripDays(id);
  const queryClient = useQueryClient();
  const { data: members = [], refetch: refetchMembers, isRefetching: membersRefetching } =
    useTripMembers(id);
  const {
    data: activities = [],
    refetch: refetchActivities,
    isRefetching: activitiesRefetching,
  } = useTripActivities(days, id);
  const { data: expenses = [], refetch: refetchExpenses, isRefetching: expensesRefetching } =
    useExpenses(id);
  const isQueryRefetching =
    tripRefetching ||
    daysRefetching ||
    membersRefetching ||
    activitiesRefetching ||
    expensesRefetching;
  const {
    refreshing,
    setRefreshing,
    setRefreshHint,
    markSuccess,
    statusText: refreshStatusText,
    isBusy: isRefreshBusy,
  } = usePullToRefreshFeedback(isQueryRefetching);
  const deleteTrip = useDeleteTrip();
  const archiveTrip = useArchiveTrip();
  const { isOwner, canEdit, isViewer } = useTripAccess(id);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [openingPlanner, setOpeningPlanner] = useState(false);
  const user = useAuthStore((s) => s.user);
  const currencyTotals = totalsByCurrency(expenses);
  const singleCurrency = hasSingleCurrency(expenses);
  const primaryCurrency = Object.keys(currencyTotals)[0] ?? DEFAULT_TRIP_CURRENCY;
  const spent = singleCurrency
    ? calculateTotalExpenses(expenses, primaryCurrency)
    : 0;
  const spentLabel =
    expenses.length === 0
      ? ''
      : singleCurrency
        ? formatMoney(spent, primaryCurrency)
        : formatTotalsLine(currencyTotals);

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
  const travelerAvatars = members.map((m) => ({
    key: m.userId,
    name: resolveMemberDisplayName({ fullName: m.fullName, email: m.email }),
    avatarUrl: resolveMemberAvatar(m, user),
  }));

  const handleArchive = () => {
    confirmAction('Archive Trip', 'Hide this trip from your main list. You can find it under Archived.', {
      confirmLabel: 'Archive',
      onConfirm: async () => {
        setArchiving(true);
        try {
          await archiveTrip.mutateAsync(id);
          router.replace('/(tabs)/trips');
        } catch (e) {
          showAppMessage('Cannot archive trip', getErrorMessage(e, undefined, 'trip-save'));
        } finally {
          setArchiving(false);
        }
      },
    });
  };

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

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshHint(null);
    try {
      await Promise.all([
        refetchTrip(),
        refetchDays(),
        refetchMembers(),
        refetchExpenses(),
        days.length > 0 ? refetchActivities() : Promise.resolve(),
      ]);
      markSuccess();
    } catch (e) {
      showAppMessage('Refresh failed', getErrorMessage(e, 'Could not refresh trip.'));
    } finally {
      setRefreshing(false);
    }
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshBusy}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
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
          {refreshStatusText ? (
            <Text style={styles.refreshStatus} accessibilityLiveRegion="polite">
              {refreshStatusText}
            </Text>
          ) : null}
          {isViewer ? <ViewOnlyBanner /> : null}
          {canEdit || isOwner ? (
            <View style={styles.actions}>
              {isOwner && trip.status !== 'archived' ? (
                <Pressable
                  onPress={handleArchive}
                  style={styles.iconButton}
                  disabled={archiving}
                  accessibilityLabel="Archive trip"
                >
                  <Ionicons name="archive-outline" size={22} color={colors.primary} />
                </Pressable>
              ) : null}
              {canEdit ? (
                <Pressable onPress={() => router.push(`/trip/${id}/edit`)} style={styles.iconButton}>
                  <Ionicons name="create-outline" size={22} color={colors.primary} />
                </Pressable>
              ) : null}
              {isOwner ? (
                <DeleteIconButton
                  size="sm"
                  onPress={handleDelete}
                  disabled={deleting}
                  accessibilityLabel="Delete trip"
                  style={[styles.iconButton, deleting && styles.iconButtonDisabled]}
                />
              ) : null}
            </View>
          ) : null}

          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>DATES</Text>
            <Text style={styles.summaryValue}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
            {(trip.budgetTarget != null && trip.budgetTarget > 0) || expenses.length > 0 ? (
              <Pressable
                style={styles.summarySpaced}
                onPress={() =>
                  isFeatureEnabled('budget') && router.push(`/trip/${id}/budget`)
                }
                disabled={!isFeatureEnabled('budget')}
              >
                <Text style={styles.summaryLabel}>BUDGET</Text>
                <Text style={styles.summaryValue}>
                  {trip.budgetTarget != null && trip.budgetTarget > 0 && singleCurrency
                    ? `${spentLabel} of ${formatMoney(trip.budgetTarget, primaryCurrency)}`
                    : spentLabel || 'Track spending'}
                  {isFeatureEnabled('budget') ? ' ›' : ''}
                </Text>
              </Pressable>
            ) : null}
            {travelerAvatars.length > 0 && (
              <Pressable
                style={styles.membersRow}
                onPress={() => router.push(`/trip/${id}/members`)}
                accessibilityRole="button"
                accessibilityLabel="Travelers"
                accessibilityHint="Opens travelers and invites"
              >
                <Text style={styles.summaryLabel}>TRAVELERS</Text>
                <View style={styles.membersRowEnd}>
                  <AvatarStack members={travelerAvatars} />
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </View>
              </Pressable>
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
  refreshStatus: {
    ...typography.caption,
    color: colors.gold,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
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
  membersRowEnd: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
