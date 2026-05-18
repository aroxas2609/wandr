import { resolveMemberDisplayName } from '@/lib/memberDisplayName';

describe('resolveMemberDisplayName', () => {
  it('returns full name when set', () => {
    expect(resolveMemberDisplayName({ fullName: 'Anthony Roxas' })).toBe('Anthony Roxas');
  });

  it('formats email when name is missing or Traveler', () => {
    expect(
      resolveMemberDisplayName({
        fullName: 'Traveler',
        email: 'a.roxas@bigpond.com',
      })
    ).toBe('A Roxas');
  });

  it('falls back to Traveler when nothing else is available', () => {
    expect(resolveMemberDisplayName({ fullName: 'Traveler' })).toBe('Traveler');
  });
});
