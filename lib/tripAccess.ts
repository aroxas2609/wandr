import type { TripMember } from '@/types';

export type TripAccessRole = 'owner' | 'editor' | 'viewer' | null;

export interface TripAccess {
  role: TripAccessRole;
  isOwner: boolean;
  canEdit: boolean;
  /** Send invites and share join links (owner + editor). */
  canInvite: boolean;
  /** Remove travelers and pending invites (owner only). */
  canManageMembers: boolean;
  isViewer: boolean;
}

export function resolveTripAccess(
  tripOwnerId: string | undefined,
  userId: string | undefined,
  members: TripMember[]
): TripAccess {
  if (!tripOwnerId || !userId) {
    return {
      role: null,
      isOwner: false,
      canEdit: false,
      canInvite: false,
      canManageMembers: false,
      isViewer: false,
    };
  }

  if (tripOwnerId === userId) {
    return {
      role: 'owner',
      isOwner: true,
      canEdit: true,
      canInvite: true,
      canManageMembers: true,
      isViewer: false,
    };
  }

  const membership = members.find((m) => m.userId === userId && m.status !== 'pending');
  const role = membership?.role ?? null;

  if (role === 'editor') {
    return {
      role: 'editor',
      isOwner: false,
      canEdit: true,
      canInvite: true,
      canManageMembers: false,
      isViewer: false,
    };
  }

  if (role === 'viewer') {
    return {
      role: 'viewer',
      isOwner: false,
      canEdit: false,
      canInvite: false,
      canManageMembers: false,
      isViewer: true,
    };
  }

  return {
    role: null,
    isOwner: false,
    canEdit: false,
    canInvite: false,
    canManageMembers: false,
    isViewer: false,
  };
}
