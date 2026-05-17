import {
  getCountdownParts,
  formatCountdownDisplay,
  getCountdownShortLabel,
} from '@/utils/countdown';

describe('countdown utils', () => {
  it('returns upcoming countdown', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const start = future.toISOString().split('T')[0];
    const endDate = new Date(future);
    endDate.setDate(endDate.getDate() + 7);
    const end = endDate.toISOString().split('T')[0];

    const parts = getCountdownParts(start, end);
    expect(parts.isPast).toBe(false);
    expect(parts.days).toBeGreaterThan(0);
    expect(parts.label).toContain('departure');
  });

  it('formats countdown display', () => {
    const parts = getCountdownParts('2099-06-15', '2099-06-22');
    expect(formatCountdownDisplay(parts)).toBeTruthy();
  });

  it('returns short label for upcoming trip', () => {
    const parts = getCountdownParts('2099-06-15', '2099-06-22');
    expect(getCountdownShortLabel(parts)).toBe('days to go');
  });

  it('detects past trips', () => {
    const parts = getCountdownParts('2020-01-01', '2020-01-10');
    expect(parts.isPast).toBe(true);
  });
});
