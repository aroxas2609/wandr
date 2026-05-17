import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { useState } from 'react';
import type { Activity } from '@/types';
import { formatTime } from '@/utils/dates';
import { TIME_SLOT_LABELS } from '@/utils/itinerary';
import { colors, typography, radius } from '@/theme';
import { TestIds } from '@/constants/testIds';
import { GlassCard } from './GlassCard';

interface ActivityCardProps {
  activity: Activity;
  onPress?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showReorder?: boolean;
}

export function ActivityCard({
  activity,
  onPress,
  onMoveUp,
  onMoveDown,
  showReorder = false,
}: ActivityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const height = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: withTiming(expanded ? 200 : 0, { duration: 300 }),
    opacity: withTiming(expanded ? 1 : 0, { duration: 200 }),
  }));

  useDerivedValue(() => {
    height.value = expanded ? 1 : 0;
  });

  return (
    <Pressable onPress={onPress} testID={TestIds.activityCard}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>
              {TIME_SLOT_LABELS[activity.timeSlot]}
            </Text>
          </View>
          {activity.startTime && (
            <Text style={styles.time}>{formatTime(activity.startTime)}</Text>
          )}
        </View>
        <Text style={styles.title}>{activity.title}</Text>
        {activity.locationName && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text style={styles.location}>{activity.locationName}</Text>
          </View>
        )}
        {(activity.notes || activity.bookingUrl) && (
          <Pressable onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandHint}>
              {expanded ? 'Show less' : 'Show details'}
            </Text>
          </Pressable>
        )}
        <Animated.View style={[styles.details, animatedStyle]}>
          {activity.notes && <Text style={styles.notes}>{activity.notes}</Text>}
          {activity.bookingUrl && (
            <Text style={styles.booking} numberOfLines={1}>
              {activity.bookingUrl}
            </Text>
          )}
        </Animated.View>
        {showReorder && (
          <View style={styles.reorderRow}>
            <Pressable onPress={onMoveUp} hitSlop={8}>
              <Ionicons name="chevron-up" size={20} color={colors.muted} />
            </Pressable>
            <Pressable onPress={onMoveDown} hitSlop={8}>
              <Ionicons name="chevron-down" size={20} color={colors.muted} />
            </Pressable>
          </View>
        )}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeBadge: {
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeBadgeText: {
    ...typography.overline,
    color: colors.gold,
    fontSize: 9,
  },
  time: {
    ...typography.caption,
    color: colors.secondary,
  },
  title: {
    ...typography.h3,
    fontSize: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  location: {
    ...typography.caption,
    color: colors.muted,
  },
  expandHint: {
    ...typography.caption,
    color: colors.gold,
    marginTop: 8,
  },
  details: { overflow: 'hidden' },
  notes: {
    ...typography.body,
    fontSize: 14,
    marginTop: 8,
  },
  booking: {
    ...typography.caption,
    color: colors.sage,
    marginTop: 4,
  },
  reorderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
});
