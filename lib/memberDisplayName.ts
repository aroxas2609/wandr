/** Prefer a real name; fall back to a readable label from email instead of "Traveler". */
export function resolveMemberDisplayName(opts: {
  fullName?: string | null;
  email?: string | null;
}): string {
  const name = opts.fullName?.trim();
  if (name && name !== 'Traveler') return name;

  const email = opts.email?.trim().toLowerCase();
  if (email) {
    const local = email.split('@')[0] ?? '';
    const cleaned = local.replace(/[._+-]+/g, ' ').trim();
    if (cleaned) {
      return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }

  return name || 'Traveler';
}
