import {
  groupActivitiesBySlot,
  getNextActivities,
  estimateTravelTime,
  reorderActivities,
} from '@/utils/itinerary';
import type { Activity } from '@/types';

const mockActivities: Activity[] = [
  { id: '1', dayId: 'd1', title: 'A', timeSlot: 'morning', sortOrder: 0 },
  { id: '2', dayId: 'd1', title: 'B', timeSlot: 'evening', sortOrder: 1 },
  { id: '3', dayId: 'd1', title: 'C', timeSlot: 'morning', sortOrder: 2 },
];

describe('itinerary utils', () => {
  it('groups activities by slot', () => {
    const grouped = groupActivitiesBySlot(mockActivities);
    expect(grouped.morning).toHaveLength(2);
    expect(grouped.evening).toHaveLength(1);
    expect(grouped.afternoon).toHaveLength(0);
  });

  it('gets next activities', () => {
    const next = getNextActivities(mockActivities, 2);
    expect(next).toHaveLength(2);
    expect(next[0].title).toBe('A');
  });

  it('estimates travel time', () => {
    expect(estimateTravelTime(3)).toBe(40);
    expect(estimateTravelTime(1)).toBe(0);
  });

  it('reorders activities', () => {
    const reordered = reorderActivities(mockActivities, '1', 'down');
    expect(reordered[0].title).toBe('B');
    expect(reordered[1].title).toBe('A');
  });
});
