/** 24-hour time stored as HH:mm (matches Postgres TIME and activity fields). */
export const TIME_HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Mask typing to HH:mm — digits only, colon inserted after hours. */
export function sanitizeTimeInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function isValidTimeString(value: string): boolean {
  if (!value.trim()) return true;
  if (TIME_HH_MM_REGEX.test(value)) return true;
  const normalized = normalizeTimeString(value);
  return normalized !== '' && TIME_HH_MM_REGEX.test(normalized);
}

/** Normalize Postgres TIME / form input to HH:mm for storage and validation. */
export function parseDbTimeToForm(value: unknown): string {
  if (value == null || value === '') return '';
  return normalizeTimeString(String(value));
}

/** Pad partial input on blur (e.g. "9:5" → "09:05"). Returns "" when empty. */
export function normalizeTimeString(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (TIME_HH_MM_REGEX.test(trimmed)) return trimmed;

  // Postgres TIME: 12:00:00, 12:00:00.123, optional +00 offset
  const withoutZone = trimmed.split(/[Z+]/)[0]?.trim() ?? trimmed;
  const withoutFraction = withoutZone.split('.')[0]?.trim() ?? withoutZone;
  const dbMatch = withoutFraction.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (dbMatch) {
    const hours = parseInt(dbMatch[1], 10);
    const minutes = parseInt(dbMatch[2], 10);
    if (hours > 23 || minutes > 59) return trimmed;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  if (trimmed.includes(':')) {
    const [hPart, mPart = ''] = trimmed.split(':');
    const hours = parseInt(hPart.replace(/\D/g, '') || '0', 10);
    const minutes = parseInt(mPart.replace(/\D/g, '') || '0', 10);
    if (hours > 23 || minutes > 59) return trimmed;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) return '';

  let hours: number;
  let minutes: number;
  if (digits.length <= 2) {
    hours = parseInt(digits, 10);
    minutes = 0;
  } else if (digits.length === 3) {
    hours = parseInt(digits[0], 10);
    minutes = parseInt(digits.slice(1), 10);
  } else {
    hours = parseInt(digits.slice(0, 2), 10);
    minutes = parseInt(digits.slice(2, 4), 10);
  }

  if (hours > 23 || minutes > 59) return trimmed;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function timeStringToDate(time: string): Date {
  const base = normalizeTimeString(time);
  const safe = TIME_HH_MM_REGEX.test(base) ? base : '09:00';
  const [h, m] = safe.split(':').map((p) => parseInt(p, 10));
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function dateToTimeString(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeDisplay(time: string): string {
  if (!time || !TIME_HH_MM_REGEX.test(time)) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
