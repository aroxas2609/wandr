import { tripSchema } from '@/features/trips/schemas/tripSchema';
import { activitySchema } from '@/features/itinerary/schemas/activitySchema';
import { loginSchema, registerSchema } from '@/features/auth/schemas/authSchema';

describe('validation schemas', () => {
  it('validates trip form', () => {
    const result = tripSchema.safeParse({
      title: 'Paris Trip',
      destination: 'Paris, France',
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      travelStyles: ['Romantic'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid date range', () => {
    const result = tripSchema.safeParse({
      title: 'Test',
      destination: 'Paris',
      startDate: '2026-06-22',
      endDate: '2026-06-15',
      travelStyles: [],
    });
    expect(result.success).toBe(false);
  });

  it('validates activity form', () => {
    const result = activitySchema.safeParse({
      title: 'Louvre',
      timeSlot: 'morning',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid activity times', () => {
    const result = activitySchema.safeParse({
      title: 'Louvre',
      timeSlot: 'morning',
      startTime: '25:00',
    });
    expect(result.success).toBe(false);
  });

  it('normalizes partial activity times on submit', () => {
    const result = activitySchema.safeParse({
      title: 'Louvre',
      timeSlot: 'morning',
      startTime: '930',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.startTime).toBe('09:30');
  });

  it('accepts Postgres TIME on edit', () => {
    const result = activitySchema.safeParse({
      title: 'Lunch',
      timeSlot: 'afternoon',
      startTime: '12:00:00',
      endTime: '13:30:00',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startTime).toBe('12:00');
      expect(result.data.endTime).toBe('13:30');
    }
  });

  it('validates login', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'demo123',
    });
    expect(result.success).toBe(true);
  });

  it('validates register password match', () => {
    const fail = registerSchema.safeParse({
      fullName: 'Alex',
      email: 'a@b.com',
      password: '123456',
      confirmPassword: '654321',
    });
    expect(fail.success).toBe(false);
  });
});
