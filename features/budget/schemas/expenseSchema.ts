import { z } from 'zod';
import { DEFAULT_TRIP_CURRENCY } from '@/constants/currencies';

export const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => {
      const n = parseFloat(val);
      return Number.isFinite(n) && n > 0;
    }, 'Amount must be positive'),
  currency: z.string().min(3).max(3).default(DEFAULT_TRIP_CURRENCY),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(300).optional(),
  paidByUserId: z.string().optional(),
  splitWithUserIds: z.array(z.string()).optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
