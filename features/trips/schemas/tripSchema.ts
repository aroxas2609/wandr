import { z } from 'zod';
import { TRAVEL_STYLES } from '@/constants/travelStyles';

export const tripSchema = z
  .object({
    title: z.string().min(1, 'Trip name is required').max(80),
    destination: z.string().min(1, 'Destination is required').max(120),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    budgetTarget: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true;
          const n = parseFloat(val);
          return Number.isFinite(n) && n >= 0;
        },
        { message: 'Budget must be zero or positive' }
      ),
    travelStyles: z.array(z.enum(TRAVEL_STYLES)),
    coverUrl: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export type TripFormData = z.infer<typeof tripSchema>;
