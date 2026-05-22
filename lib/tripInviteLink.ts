import * as Linking from 'expo-linking';

const appWebUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '');

/** Deep link / web path for joining a trip with an invite code. */
export function buildTripJoinUrl(token: string): string {
  const code = token.trim().toUpperCase();
  if (appWebUrl) {
    return `${appWebUrl}/trip/join?token=${encodeURIComponent(code)}`;
  }
  return Linking.createURL('/trip/join', {
    queryParams: { token: code },
  });
}

/** Web URL for trip chat deep link in push/share. */
export function buildTripChatUrl(tripId: string): string {
  if (appWebUrl) {
    return `${appWebUrl}/trip/${tripId}/chat`;
  }
  return Linking.createURL(`/trip/${tripId}/chat`);
}
