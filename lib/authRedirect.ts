import * as Linking from 'expo-linking';

/** Redirect URL for Supabase email links (confirm, reset password). */
export function getAuthRedirectUrl(): string {
  return Linking.createURL('/auth/callback');
}
