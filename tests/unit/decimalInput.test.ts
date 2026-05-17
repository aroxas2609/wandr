import { sanitizeDecimalInput, parseDecimalInput } from '@/lib/decimalInput';

describe('decimalInput', () => {
  it('sanitizes invalid characters', () => {
    expect(sanitizeDecimalInput('12a3')).toBe('123');
    expect(sanitizeDecimalInput('12.3.4')).toBe('12.34');
  });

  it('preserves leading zeros while typing', () => {
    expect(sanitizeDecimalInput('000')).toBe('000');
    expect(sanitizeDecimalInput('5000')).toBe('5000');
  });

  it('parses on submit', () => {
    expect(parseDecimalInput('5000')).toBe(5000);
    expect(parseDecimalInput('')).toBeUndefined();
  });
});
