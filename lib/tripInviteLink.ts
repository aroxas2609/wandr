import * as Linking from 'expo-linking';

/** Deep link / web path for joining a trip with an invite code. */
export function buildTripJoinUrl(token: string): string {
  return Linking.createURL('/trip/join', {
    queryParams: { token: token.trim().toUpperCase() },
  });
}
