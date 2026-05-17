import {
  format,
  parse,
  parseISO,
  isValid,
  differenceInDays,
  isAfter,
  isBefore,
  isWithinInterval,
  addDays,
  eachDayOfInterval,
} from 'date-fns';

/** ISO format stored in DB / MMKV */
export const STORAGE_DATE_FORMAT = 'yyyy-MM-dd';

/** Readable single-date display, e.g. 15 Jun 2026 */
export const DISPLAY_DATE_FORMAT = 'd MMM yyyy';

/** Legacy / manual entry patterns */
const INPUT_DATE_FORMATS = ['dd/MM/yyyy', 'dd-MM-yyyy', 'd/M/yyyy', 'd-M-yyyy'] as const;

export function formatTripDate(dateStr: string): string {
  return formatDisplayDate(dateStr);
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (!isValid(date)) return dateStr;
  return format(date, DISPLAY_DATE_FORMAT);
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (!isValid(date)) return dateStr;
  return format(date, 'd MMM');
}

/** Compact range without repeating dashes, e.g. 15 – 22 Jun 2026 */
export function formatDateRange(start: string, end: string): string {
  const s = parseISO(start);
  const e = parseISO(end);
  if (!isValid(s) || !isValid(e)) return '';

  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();

  if (sameMonth) {
    return `${format(s, 'd')} – ${format(e, 'd MMM yyyy')}`;
  }
  if (sameYear) {
    return `${format(s, 'd MMM')} – ${format(e, 'd MMM yyyy')}`;
  }
  return `${format(s, DISPLAY_DATE_FORMAT)} – ${format(e, DISPLAY_DATE_FORMAT)}`;
}

/** Parse typed dates (dd/MM/yyyy or dd-MM-yyyy) to ISO */
export function parseDisplayDateToIso(display: string): string | null {
  const trimmed = display.trim();
  if (!trimmed) return null;

  for (const pattern of INPUT_DATE_FORMATS) {
    const parsed = parse(trimmed, pattern, new Date());
    if (isValid(parsed)) {
      return format(parsed, STORAGE_DATE_FORMAT);
    }
  }
  return null;
}

export function isoToDate(iso: string | undefined): Date {
  if (!iso) return new Date();
  const date = parseISO(iso);
  return isValid(date) ? date : new Date();
}

export function dateToIso(date: Date): string {
  return format(date, STORAGE_DATE_FORMAT);
}

export function getTripDuration(start: string, end: string): number {
  return differenceInDays(parseISO(end), parseISO(start)) + 1;
}

export function getDaysUntil(dateStr: string): number {
  const target = parseISO(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return differenceInDays(target, now);
}

export function getTripStatus(
  startDate: string,
  endDate: string
): 'upcoming' | 'active' | 'past' {
  const now = new Date();
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  end.setHours(23, 59, 59, 999);

  if (isBefore(now, start)) return 'upcoming';
  if (isAfter(now, end)) return 'past';
  return 'active';
}

export function isDateInTrip(
  date: string,
  startDate: string,
  endDate: string
): boolean {
  return isWithinInterval(parseISO(date), {
    start: parseISO(startDate),
    end: parseISO(endDate),
  });
}

export function generateDayDates(startDate: string, endDate: string): string[] {
  return eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map((d) => format(d, 'yyyy-MM-dd'));
}

export function formatTime(time?: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export { addDays };
