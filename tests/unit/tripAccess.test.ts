import { resolveTripAccess } from '@/lib/tripAccess';
import type { TripMember } from '@/types';

const members: TripMember[] = [
  {
    tripId: 't1',
    userId: 'editor-1',
    role: 'editor',
    fullName: 'Ed',
  },
  {
    tripId: 't1',
    userId: 'viewer-1',
    role: 'viewer',
    fullName: 'Vi',
  },
];

describe('resolveTripAccess', () => {
  it('grants owner full access', () => {
    const access = resolveTripAccess('owner-1', 'owner-1', members);
    expect(access.role).toBe('owner');
    expect(access.canEdit).toBe(true);
    expect(access.canInvite).toBe(true);
    expect(access.canManageMembers).toBe(true);
    expect(access.isViewer).toBe(false);
  });

  it('grants editor invite and edit but not member management', () => {
    const access = resolveTripAccess('owner-1', 'editor-1', members);
    expect(access.role).toBe('editor');
    expect(access.canEdit).toBe(true);
    expect(access.canInvite).toBe(true);
    expect(access.canManageMembers).toBe(false);
  });

  it('restricts viewer to read-only', () => {
    const access = resolveTripAccess('owner-1', 'viewer-1', members);
    expect(access.role).toBe('viewer');
    expect(access.canEdit).toBe(false);
    expect(access.canInvite).toBe(false);
    expect(access.isViewer).toBe(true);
  });
});
