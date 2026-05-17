import {
  sanitizeTimeInput,
  normalizeTimeString,
  isValidTimeString,
  dateToTimeString,
  timeStringToDate,
} from '@/lib/timeInput';

describe('timeInput', () => {
  it('masks digits into HH:mm while typing', () => {
    expect(sanitizeTimeInput('09')).toBe('09');
    expect(sanitizeTimeInput('0930')).toBe('09:30');
    expect(sanitizeTimeInput('09:30abc')).toBe('09:30');
    expect(sanitizeTimeInput('2530')).toBe('25:30');
  });

  it('validates HH:mm', () => {
    expect(isValidTimeString('09:00')).toBe(true);
    expect(isValidTimeString('23:59')).toBe(true);
    expect(isValidTimeString('12:00:00')).toBe(true);
    expect(isValidTimeString('24:00')).toBe(false);
    expect(isValidTimeString('9:00')).toBe(true);
    expect(isValidTimeString('')).toBe(true);
  });

  it('normalizes Postgres TIME strings', () => {
    expect(normalizeTimeString('12:00:00')).toBe('12:00');
    expect(normalizeTimeString('09:30:00+00')).toBe('09:30');
  });

  it('normalizes partial input on blur', () => {
    expect(normalizeTimeString('9:5')).toBe('09:05');
    expect(normalizeTimeString('930')).toBe('09:30');
    expect(normalizeTimeString('')).toBe('');
  });

  it('round-trips with Date', () => {
    const d = timeStringToDate('14:45');
    expect(dateToTimeString(d)).toBe('14:45');
  });
});
