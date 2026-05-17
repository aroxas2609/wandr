import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    !supabaseUrl.includes('your-project')
  );
}

let cachedClient: SupabaseClient | null = null;

function getRealtimeTransport(): typeof WebSocket | undefined {
  if (typeof globalThis.WebSocket !== 'undefined') {
    return globalThis.WebSocket;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('ws') as typeof WebSocket;
  } catch {
    return undefined;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (cachedClient) return cachedClient;

  const isBrowser = typeof window !== 'undefined';
  const transport = getRealtimeTransport();

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: false,
    },
    ...(transport
      ? {
          realtime: {
            transport,
          },
        }
      : {}),
  });

  return cachedClient;
}

export function requireSupabaseClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env'
    );
  }
  return client;
}
