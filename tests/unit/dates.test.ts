import {
  formatTripDate,
  formatDisplayDate,
  formatDateRange,
  parseDisplayDateToIso,
  dateToIso,
  getTripDuration,
  getDaysUntil,
  getTripStatus,
  generateDayDates,
  formatTime,
} from '@/utils/dates';

describe('dates utils', () => {
  it('formats trip date readably', () => {
    expect(formatTripDate('2026-06-15')).toBe('15 Jun 2026');
  });

  it('formats display date', () => {
    expect(formatDisplayDate('2026-03-20')).toBe('20 Mar 2026');
  });

  it('parses typed dates to ISO', () => {
    expect(parseDisplayDateToIso('15/06/2026')).toBe('2026-06-15');
    expect(parseDisplayDateToIso('15-06-2026')).toBe('2026-06-15');
    expect(parseDisplayDateToIso('invalid')).toBeNull();
  });

  it('formats date range compactly when same month', () => {
    expect(formatDateRange('2026-06-15', '2026-06-22')).toBe(
      '15 – 22 Jun 2026'
    );
  });

  it('formats date range across months', () => {
    expect(formatDateRange('2026-06-28', '2026-07-05')).toBe(
      '28 Jun – 5 Jul 2026'
    );
  });

  it('converts date to ISO', () => {
    expect(dateToIso(new Date(2026, 5, 15))).toBe('2026-06-15');
  });

  it('calculates trip duration', () => {
    expect(getTripDuration('2026-06-15', '2026-06-22')).toBe(8);
  });

  it('calculates days until', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const dateStr = future.toISOString().split('T')[0];
    expect(getDaysUntil(dateStr)).toBeGreaterThanOrEqual(9);
  });

  it('determines trip status', () => {
    expect(getTripStatus('2099-01-01', '2099-01-10')).toBe('upcoming');
    expect(getTripStatus('2020-01-01', '2020-01-10')).toBe('past');
  });

  it('generates day dates', () => {
    const days = generateDayDates('2026-06-15', '2026-06-17');
    expect(days).toHaveLength(3);
    expect(days[0]).toBe('2026-06-15');
  });

  it('formats time to 12h', () => {
    expect(formatTime('14:30')).toBe('2:30 PM');
    expect(formatTime('09:00')).toBe('9:00 AM');
  });
});
