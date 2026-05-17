/** Extract a message from Supabase / PostgREST errors (not always `instanceof Error`). */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null) {
    const o = err as { message?: string; details?: string; hint?: string };
    if (o.message) {
      return [o.message, o.details, o.hint].filter(Boolean).join(' — ');
    }
  }
  if (typeof err === 'string') return err;
  return fallback;
}
