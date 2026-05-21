/** Avatar URL for a traveler row (prefers live profile for the signed-in user). */
export function resolveMemberAvatar(
  member: { userId: string; avatarUrl?: string | null; status?: string },
  currentUser?: { id: string; avatarUrl?: string | null } | null
): string | undefined {
  if (member.status === 'pending') return undefined;
  if (currentUser?.id === member.userId) {
    return currentUser.avatarUrl ?? member.avatarUrl ?? undefined;
  }
  return member.avatarUrl ?? undefined;
}
