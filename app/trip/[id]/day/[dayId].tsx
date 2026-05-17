import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenHeader, TimelineView, TagChip } from '@/components';
import { useTrip, useTripDays, tripKeys } from '@/features/trips/hooks/useTrips';
import { ensureTripDays } from '@/features/trips/services/tripService';
import { getErrorMessage } from '@/lib/errors';
import {
  useDayActivities,
  useReorderActivity,
} from '@/features/itinerary/hooks/useItinerary';
import type { Activity, TimeSlot } from '@/types';
import { resolveSearchParam } from '@/lib/routeParams';
import { formatTripDate } from '@/utils/dates';
import { colors, typography, spacing } from '@/theme';

const { width: windowWidth } = Dimensions.get('window');

export default function DayPlannerScreen() {
  const { id, dayId: dayIdParam } = useLocalSearchParams<{ id: string; dayId: string }>();
  const dayId = resolveSearchParam(dayIdParam) ?? '';
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: trip } = useTrip(id);
  const { data: days = [], isLoading: daysLoading } = useTripDays(id);
  const { data: activities = [], isLoading } = useDayActivities(dayId);
  const reorder = useReorderActivity(dayId, id);
  const [daysError, setDaysError] = useState('');
  const dayTabsRef = useRef<ScrollView>(null);
  const chipLayouts = useRef<Record<string, { x: number; width: number }>>({});

  const scrollDayIntoView = useCallback((targetDayId: string, animated = true) => {
    const layout = chipLayouts.current[targetDayId];
    if (!layout || !dayTabsRef.current) return;
    const centeredX = layout.x + layout.width / 2 - windowWidth / 2;
    dayTabsRef.current.scrollTo({
      x: Math.max(0, centeredX),
      animated,
    });
  }, []);

  useEffect(() => {
    if (!trip || daysLoading) return;
    if (days.length > 0) return;

    let cancelled = false;
    void (async () => {
      try {
        const created = await ensureTripDays(trip);
        if (cancelled) return;
        await queryClient.invalidateQueries({ queryKey: tripKeys.days(id) });
        const first = created[0];
        if (first) router.replace(`/trip/${id}/day/${first.id}`);
      } catch (e) {
        if (!cancelled) {
          setDaysError(getErrorMessage(e, 'Could not load trip days.'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trip, days.length, daysLoading, id, queryClient]);

  useEffect(() => {
    if (daysLoading || days.length === 0) return;
    if (days.some((d) => d.id === dayId)) return;
    router.replace(`/trip/${id}/day/${days[0].id}`);
  }, [days, dayId, daysLoading, id]);

  useEffect(() => {
    if (!dayId || days.length < 2) return;
    const frame = requestAnimationFrame(() => scrollDayIntoView(dayId, false));
    return () => cancelAnimationFrame(frame);
  }, [dayId, days.length, scrollDayIntoView]);

  const currentDay = days.find((d) => d.id === dayId);

  const handleAddActivity = (slot: TimeSlot) => {
    router.push(`/trip/${id}/activity/new?dayId=${dayId}&slot=${slot}`);
  };

  const handleActivityPress = (activity: Activity) => {
    router.push(`/trip/${id}/activity/${activity.id}?dayId=${dayId}`);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenHeader
        title={currentDay ? `Day ${currentDay.dayNumber}` : 'Day Planner'}
        subtitle={currentDay ? formatTripDate(currentDay.date) : ''}
        showBack
        backHref={`/trip/${id}`}
      />

      {days.length > 1 && (
        <View style={styles.dayTabsOuter}>
          <ScrollView
            ref={dayTabsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabsScroll}
            contentContainerStyle={styles.dayTabsContent}
          >
            {days.map((day) => (
              <View
                key={day.id}
                onLayout={(e) => {
                  chipLayouts.current[day.id] = {
                    x: e.nativeEvent.layout.x,
                    width: e.nativeEvent.layout.width,
                  };
                  if (day.id === dayId) {
                    requestAnimationFrame(() => scrollDayIntoView(dayId, false));
                  }
                }}
              >
                <TagChip
                  label={`Day ${day.dayNumber}`}
                  selected={day.id === dayId}
                  onPress={() => {
                    if (day.id === dayId) return;
                    router.setParams({ dayId: day.id });
                  }}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {daysError ? <Text style={styles.error}>{daysError}</Text> : null}

      {daysLoading || (days.length === 0 && !daysError) ? (
        <Text style={styles.loading}>Loading days...</Text>
      ) : isLoading ? (
        <Text style={styles.loading}>Loading itinerary...</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timeline}>
          <TimelineView
            activities={activities}
            onActivityPress={handleActivityPress}
            onAddActivity={handleAddActivity}
            onMoveUp={(actId) => reorder.mutate({ id: actId, direction: 'up' })}
            onMoveDown={(actId) => reorder.mutate({ id: actId, direction: 'down' })}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dayTabsOuter: {
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    ...(Platform.OS === 'web' ? { overflow: 'visible' as const } : {}),
  },
  dayTabsScroll: {
    flexGrow: 0,
    ...(Platform.OS === 'web' ? { overflow: 'visible' as const } : {}),
  },
  dayTabsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    minHeight: 48,
    ...(Platform.OS === 'web' ? { overflow: 'visible' as const } : {}),
  },
  loading: { ...typography.body, textAlign: 'center', marginTop: 40 },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.xl },
  timeline: { paddingBottom: 40 },
});
