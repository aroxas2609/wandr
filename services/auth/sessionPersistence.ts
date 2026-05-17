import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/services/supabase/client';
import { saveSession, getSession, clearSession } from '@/lib/secureStore';

export async function persistSupabaseSession(session: Session): Promise<void> {
  await saveSession(
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
  );

  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw error;
}

export async function hasSupabaseSession(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { data } = await client.auth.getSession();
  return !!data.session;
}

export async function restoreSupabaseSession(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const raw = await getSession();
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (parsed.access_token && parsed.refresh_token) {
      const { error } = await client.auth.setSession({
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
      });
      if (error && __DEV__) {
        console.warn('[Wandr] Session restore failed:', error.message);
      }
    }
  } catch {
    // Legacy token-only storage — user must sign in again
  }
}

export async function clearSupabaseSession(): Promise<void> {
  await clearSession();
  const client = getSupabaseClient();
  if (client) await client.auth.signOut();
}
