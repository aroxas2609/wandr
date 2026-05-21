import { resolveMemberAvatar } from '@/lib/memberAvatar';

describe('resolveMemberAvatar', () => {
  it('prefers current user profile photo over stale member row', () => {
    expect(
      resolveMemberAvatar(
        { userId: 'u1', avatarUrl: 'https://old.example/a.jpg', status: 'active' },
        { id: 'u1', avatarUrl: 'https://new.example/a.jpg' }
      )
    ).toBe('https://new.example/a.jpg');
  });

  it('falls back to member row when auth cache has no avatar', () => {
    expect(
      resolveMemberAvatar(
        { userId: 'u1', avatarUrl: 'https://db.example/a.jpg', status: 'active' },
        { id: 'u1', avatarUrl: undefined }
      )
    ).toBe('https://db.example/a.jpg');
  });

  it('returns owner avatar from member row for other viewers', () => {
    expect(
      resolveMemberAvatar(
        { userId: 'owner', avatarUrl: 'https://db.example/owner.jpg', status: 'active' },
        { id: 'other', avatarUrl: 'https://db.example/other.jpg' }
      )
    ).toBe('https://db.example/owner.jpg');
  });
});
