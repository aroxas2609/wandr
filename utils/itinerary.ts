import type { Activity, ItineraryDay, TimeSlot } from '@/types';

export const TIME_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening'];

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export function groupActivitiesBySlot(
  activities: Activity[]
): Record<TimeSlot, Activity[]> {
  const grouped: Record<TimeSlot, Activity[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  const sorted = [...activities].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const activity of sorted) {
    grouped[activity.timeSlot].push(activity);
  }

  return grouped;
}

export function getNextActivities(
  activities: Activity[],
  limit = 3
): Activity[] {
  return [...activities]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, limit);
}

export function getDayLabel(day: ItineraryDay): string {
  return `Day ${day.dayNumber}`;
}

export function estimateTravelTime(activityCount: number): number {
  return Math.max(0, (activityCount - 1) * 20);
}

export function reorderActivities(
  activities: Activity[],
  fromId: string,
  direction: 'up' | 'down'
): Activity[] {
  const sorted = [...activities].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = sorted.findIndex((a) => a.id === fromId);
  if (index === -1) return activities;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= sorted.length) return activities;

  const updated = [...sorted];
  [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];

  return updated.map((a, i) => ({ ...a, sortOrder: i }));
}
