import { z } from 'zod';

export const documentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  type: z.enum([
    'boarding_pass',
    'ticket',
    'passport',
    'insurance',
    'reservation',
    'other',
  ]),
  expiryDate: z.string().optional(),
  fileUrl: z.string().optional(),
});

export type DocumentFormData = z.infer<typeof documentSchema>;
