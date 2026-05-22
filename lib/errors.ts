/** Supabase / app error code when RLS or ownership blocks an action. */
export const PERMISSION_DENIED_CODE = 'permission_denied';

export type ErrorContext =
  | 'trip-save'
  | 'trip-delete'
  | 'trip-invite'
  | 'trip-members'
  | 'trip-viewer-readonly'
  | 'trip-editor-required'
  | 'generic';

const PERMISSION_MESSAGES: Record<ErrorContext, string> = {
  'trip-save':
    'Only the trip owner can change trip details (name, destination, dates, budget, and cover photo).',
  'trip-delete': 'Only the trip owner can delete this trip.',
  'trip-invite': 'Only the trip owner or an editor can invite people to this trip.',
  'trip-members': 'Only the trip owner can remove travelers from this trip.',
  'trip-viewer-readonly': 'You have view-only access on this trip.',
  'trip-editor-required': 'Only editors and the trip owner can make changes.',
  generic: 'You do not have permission to do that.',
};

const CONTEXT_FALLBACKS: Record<ErrorContext, string> = {
  'trip-save': 'Could not save trip changes. Check your connection and try again.',
  'trip-delete': 'Could not delete this trip. Check your connection and try again.',
  'trip-invite': 'Could not send the invite. Check your connection and try again.',
  'trip-members': 'Could not update travelers. Check your connection and try again.',
  'trip-viewer-readonly': 'This action is not available for viewers.',
  'trip-editor-required': 'You need editor access to do that.',
  generic: 'Something went wrong. Please try again.',
};

type ErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
};

function asErrorLike(err: unknown): ErrorLike | null {
  if (typeof err === 'object' && err !== null) {
    return err as ErrorLike;
  }
  return null;
}

function combinedMessage(o: ErrorLike): string {
  return [o.message, o.details, o.hint].filter(Boolean).join(' — ');
}

/** True when PostgREST / Postgres blocked the action (RLS, no matching row, etc.). */
export function isPermissionDenied(err: unknown): boolean {
  const o = asErrorLike(err);
  const code = o?.code ?? (err instanceof Error ? (err as Error & { code?: string }).code : undefined);
  const msg = (o?.message ?? (err instanceof Error ? err.message : '')).toLowerCase();

  if (code === PERMISSION_DENIED_CODE) return true;
  if (code === '42501') return true;
  if (code === 'PGRST116') return true;
  if (o?.status === 403) return true;

  return (
    msg.includes('row-level security') ||
    msg.includes('permission denied') ||
    msg.includes('violates row-level security') ||
    msg.includes('not authorized') ||
    msg.includes('insufficient privilege')
  );
}

/** Error to throw when an owner-only action affected zero rows (e.g. delete blocked by RLS). */
export function permissionDeniedError(context: ErrorContext = 'generic'): Error {
  const err = new Error(PERMISSION_MESSAGES[context]);
  (err as Error & { code: string }).code = PERMISSION_DENIED_CODE;
  return err;
}

function authMessage(o: ErrorLike): string | null {
  const code = o.code ?? '';
  const msg = (o.message ?? '').toLowerCase();
  if (
    code === 'PGRST301' ||
    msg.includes('jwt') ||
    msg.includes('not authenticated') ||
    msg.includes('invalid claim')
  ) {
    return 'Your session expired. Sign in again and retry.';
  }
  return null;
}

function networkMessage(o: ErrorLike): string | null {
  const msg = (o.message ?? '').toLowerCase();
  if (
    msg.includes('failed to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('network error')
  ) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return null;
}

/** Extract a user-facing message from Supabase / PostgREST errors (not always `instanceof Error`). */
export function getErrorMessage(
  err: unknown,
  fallback?: string,
  context: ErrorContext = 'generic'
): string {
  const resolvedFallback = fallback ?? CONTEXT_FALLBACKS[context];

  if (isPermissionDenied(err)) {
    return PERMISSION_MESSAGES[context];
  }

  const o = asErrorLike(err);
  if (o) {
    const auth = authMessage(o);
    if (auth) return auth;

    const network = networkMessage(o);
    if (network) return network;

    const combined = combinedMessage(o);
    if (combined) return combined;
  }

  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return resolvedFallback;
}
