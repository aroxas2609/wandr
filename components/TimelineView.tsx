import { View, Text, StyleSheet } from 'react-native';
import type { Activity, TimeSlot } from '@/types';
import { TIME_SLOTS, TIME_SLOT_LABELS, groupActivitiesBySlot } from '@/utils/itinerary';
import { colors, typography, spacing } from '@/theme';
import { ActivityCard } from './ActivityCard';
import { PremiumButton } from './PremiumButton';
import { TestIds } from '@/constants/testIds';

interface TimelineViewProps {
  activities: Activity[];
  onActivityPress: (activity: Activity) => void;
  onAddActivity: (slot: TimeSlot) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}

export function TimelineView({
  activities,
  onActivityPress,
  onAddActivity,
  onMoveUp,
  onMoveDown,
}: TimelineViewProps) {
  const grouped = groupActivitiesBySlot(activities);

  return (
    <View style={styles.container}>
      {TIME_SLOTS.map((slot) => (
        <View key={slot} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.line} />
            <View style={styles.dot} />
            <Text style={styles.sectionTitle}>{TIME_SLOT_LABELS[slot]}</Text>
          </View>
          <View style={styles.sectionContent}>
            {grouped[slot].map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onPress={() => onActivityPress(activity)}
                showReorder
                onMoveUp={() => onMoveUp?.(activity.id)}
                onMoveDown={() => onMoveDown?.(activity.id)}
              />
            ))}
            <PremiumButton
              label={`Add to ${TIME_SLOT_LABELS[slot]}`}
              variant="outline"
              onPress={() => onAddActivity(slot)}
              testID={TestIds.addActivityButton}
              fullWidth={false}
              style={styles.addButton}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl },
  section: { marginBottom: spacing['2xl'] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  line: {
    position: 'absolute',
    left: 5,
    top: 20,
    bottom: -40,
    width: 2,
    backgroundColor: colors.glassBorder,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
    marginRight: spacing.md,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.gold,
  },
  sectionContent: { marginLeft: spacing['2xl'] },
  addButton: { alignSelf: 'flex-start', marginTop: 4 },
});
