import { getSupabaseClient } from '@/services/supabase/client';

function parseAuthParams(url: string): URLSearchParams {
  const hash = url.includes('#') ? url.split('#')[1] : '';
  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';
  return new URLSearchParams(hash || query);
}

export async function createSessionFromUrl(url: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const params = parseAuthParams(url);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  const code = params.get('code');

  if (access_token && refresh_token) {
    const { data, error } = await client.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
    return data;
  }

  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data;
  }

  throw new Error('Invalid confirmation link');
}
