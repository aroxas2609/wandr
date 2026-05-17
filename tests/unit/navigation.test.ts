import { inferBackHref } from '@/lib/navigation';

describe('navigation', () => {
  it('infers parent trip route from subpages', () => {
    expect(inferBackHref('/trip/abc-123/budget')).toBe('/trip/abc-123');
    expect(inferBackHref('/trip/abc-123/day/xyz')).toBe('/trip/abc-123');
  });

  it('infers trips list from trip detail', () => {
    expect(inferBackHref('/trip/abc-123')).toBe('/(tabs)/trips');
  });

  it('infers auth welcome from login', () => {
    expect(inferBackHref('/login')).toBe('/(auth)/welcome');
  });
});
