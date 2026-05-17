import {
  dedupeRecommendationDestinations,
} from '@/features/recommendations/services/recommendationsService';
import type { Trip } from '@/types';

describe('recommendations', () => {
  it('dedupes destinations and caps count', () => {
    const trips = [
      { destination: 'Tokyo, Japan' },
      { destination: 'tokyo, japan' },
      { destination: 'Queenstown, New Zealand' },
      { destination: 'Paris' },
    ] as Trip[];

    const destinations = dedupeRecommendationDestinations(trips);
    expect(destinations).toHaveLength(2);
    expect(destinations[0]).toBe('Tokyo, Japan');
    expect(destinations[1]).toBe('Queenstown, New Zealand');
  });
});
