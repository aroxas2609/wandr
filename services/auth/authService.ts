import { getSupabaseClient, requireSupabaseClient } from '@/services/supabase/client';
import { getAuthRedirectUrl } from '@/lib/authRedirect';
import {
  persistSupabaseSession,
  clearSupabaseSession,
} from '@/services/auth/sessionPersistence';
import { upsertUserProfile } from '@/services/auth/userService';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/lib/queryClient';
import { tripKeys } from '@/features/trips/hooks/useTrips';
import { clearUserTripCache } from '@/lib/userDataCache';
import type { User } from '@/types';
import type { AuthError } from '@supabase/supabase-js';

export class EmailConfirmationRequiredError extends Error {
  constructor() {
    super('Account created. Check your email for a confirmation link, then sign in.');
    this.name = 'EmailConfirmationRequiredError';
  }
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  fullName: string;
}

/** Maps Supabase Auth errors to clearer copy for the UI */
export function formatAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('rate limit') || lower.includes('email rate limit')) {
    return (
      'Too many confirmation emails were sent for this address. Wait about an hour and try again, ' +
      'or sign in if you already confirmed. For testing, you can disable “Confirm email” in Supabase ' +
      '(Authentication → Providers → Email).'
    );
  }
  if (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('user already registered')
  ) {
    return 'This email already has an account. Use Sign in instead.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Wrong email or password. If you just signed up, confirm your email first.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email using the link Supabase sent, then sign in.';
  }
  if (lower.includes('password') && lower.includes('weak')) {
    return 'Choose a stronger password (at least 8 characters).';
  }

  return message;
}

function toError(error: AuthError | Error | { message?: string }): Error {
  if (error instanceof Error) {
    return new Error(formatAuthErrorMessage(error.message));
  }
  const message = error.message ?? 'Request failed';
  return new Error(formatAuthErrorMessage(message));
}

export async function signIn(credentials: AuthCredentials): Promise<User> {
  const client = requireSupabaseClient();

  const { data, error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (error) throw toError(error);
  if (!data.user) throw new Error('No user returned');
  if (!data.session) throw new Error('No session returned');

  await persistSupabaseSession(data.session);
  const user: User = {
    id: data.user.id,
    email: data.user.email ?? '',
    fullName: data.user.user_metadata?.full_name ?? 'Traveler',
    avatarUrl: data.user.user_metadata?.avatar_url,
    createdAt: data.user.created_at,
  };
  await upsertUserProfile(user);
  useAuthStore.getState().setSessionReady(true);
  await queryClient.invalidateQueries({ queryKey: tripKeys.all });
  return user;
}

export async function signUp(data: RegisterData): Promise<User> {
  const client = requireSupabaseClient();

  const { data: authData, error } = await client.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.fullName },
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
  if (error) throw toError(error);
  if (!authData.user) throw new Error('No user returned');

  const user: User = {
    id: authData.user.id,
    email: authData.user.email ?? data.email,
    fullName: data.fullName,
    createdAt: authData.user.created_at,
  };

  if (!authData.session) {
    throw new EmailConfirmationRequiredError();
  }

  await persistSupabaseSession(authData.session);
  try {
    await upsertUserProfile(user);
  } catch (profileErr) {
    if (__DEV__) {
      console.warn('[Wandr] Profile upsert failed (trigger may have created row):', profileErr);
    }
  }
  useAuthStore.getState().setSessionReady(true);
  await queryClient.invalidateQueries({ queryKey: tripKeys.all });
  return user;
}

export async function resetPassword(email: string): Promise<void> {
  const client = requireSupabaseClient();

  const { error } = await client.auth.resetPasswordForEmail(email);
  if (error) throw toError(error);
}

export async function signOutUser(): Promise<void> {
  await clearSupabaseSession();
  useAuthStore.getState().setSessionReady(false);
  clearUserTripCache();
  queryClient.removeQueries({ queryKey: tripKeys.all });
}
