import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrips } from '@/features/trips/hooks/useTrips';
import {
  ScreenHeader,
  TripCard,
  EmptyState,
  FloatingActionButton,
  TripCardSkeleton,
  TagChip,
} from '@/components';
import { TestIds } from '@/constants/testIds';
import { colors, spacing } from '@/theme';
import { getTabScreenPaddingBottom } from '@/constants/layout';
import { getTripStatus } from '@/utils/dates';
import { useResponsive } from '@/hooks/useResponsive';
import type { Trip } from '@/types';

type Filter = 'all' | 'upcoming' | 'past' | 'archived';

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { isCompact, horizontalPadding } = useResponsive();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: trips = [], isLoading, refetch, isRefetching } = useTrips();
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'archived') {
      return trips.filter((t) => t.status === 'archived');
    }
    const active = trips.filter((t) => t.status !== 'archived');
    if (filter === 'all') return active;
    return active.filter((t) => {
      const status = getTripStatus(t.startDate, t.endDate);
      return filter === 'upcoming' ? status !== 'past' : status === 'past';
    });
  }, [trips, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Trips" subtitle={`${trips.length} journeys`} large />
      {isCompact ? (
        <View style={[styles.filtersRow, { paddingHorizontal: horizontalPadding }]}>
          {(['all', 'upcoming', 'past', 'archived'] as Filter[]).map((f) => (
            <View key={f} style={styles.filterItem}>
              <TagChip
                label={f.charAt(0).toUpperCase() + f.slice(1)}
                selected={filter === f}
                onPress={() => setFilter(f)}
                compact
                fullWidth
              />
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={[
            styles.filtersContent,
            { paddingHorizontal: horizontalPadding, gap: 8 },
          ]}
        >
          {(['all', 'upcoming', 'past', 'archived'] as Filter[]).map((f) => (
            <TagChip
              key={f}
              label={f.charAt(0).toUpperCase() + f.slice(1)}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: getTabScreenPaddingBottom(insets.bottom),
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.gold}
          />
        }
      >
        {isLoading ? (
          [0, 1, 2].map((i) => <TripCardSkeleton key={i} />)
        ) : filtered.length === 0 && trips.length > 0 ? (
          <EmptyState
            title="No trips in this view"
            description={`You have ${trips.length} trip${trips.length === 1 ? '' : 's'}. Switch to All to see them.`}
            actionLabel="Show all trips"
            onAction={() => setFilter('all')}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No trips yet"
            description="Start planning your next adventure and it will appear here. Pull down to refresh if you expected a trip to appear."
            actionLabel="Create Trip"
            onAction={() => router.push('/trip/new')}
          />
        ) : (
          filtered.map((trip: Trip, i) => (
            <TripCard key={trip.id} trip={trip} index={i} />
          ))
        )}
      </ScrollView>
      <FloatingActionButton
        onPress={() => router.push('/trip/new')}
        testID={TestIds.createTripButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'visible',
  },
  filters: { flexGrow: 0, marginBottom: spacing.md },
  filtersRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
    alignItems: 'stretch',
  },
  filterItem: {
    flex: 1,
  },
  filtersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  list: {},
});
