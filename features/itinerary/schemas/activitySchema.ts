import { z } from 'zod';
import { TIME_HH_MM_REGEX, parseDbTimeToForm } from '@/lib/timeInput';

const optionalTime = z.preprocess((val) => {
  const normalized = parseDbTimeToForm(val);
  return normalized === '' ? undefined : normalized;
}, z.string().regex(TIME_HH_MM_REGEX, 'Pick a valid time').optional());

const optionalNumber = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const n = typeof val === 'number' ? val : Number(val);
  if (Number.isNaN(n)) return undefined;
  return n;
}, z.number().optional());

export const activitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  timeSlot: z.enum(['morning', 'afternoon', 'evening']),
  startTime: optionalTime,
  endTime: optionalTime,
  locationName: z.string().max(200).optional(),
  lat: optionalNumber,
  lng: optionalNumber,
  notes: z.string().max(500).optional(),
  bookingUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type ActivityFormData = z.infer<typeof activitySchema>;
