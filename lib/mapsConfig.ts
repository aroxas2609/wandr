import Constants from 'expo-constants';

/** Read Google Maps API key from env (Metro) or app.config extra (Expo manifest). */
export function getGoogleMapsApiKey(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
  if (fromEnv.length >= 20) return fromEnv;

  const extra = Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined;
  const fromExtra = extra?.googleMapsApiKey?.trim() ?? '';
  if (fromExtra.length >= 20) return fromExtra;

  return fromEnv || fromExtra;
}

/** @deprecated Use getGoogleMapsApiKey() — kept for gradual migration */
export const googleMapsApiKey = getGoogleMapsApiKey();

export function isGoogleMapsConfigured(): boolean {
  return getGoogleMapsApiKey().length >= 20;
}

export function regionDeltaToZoom(latitudeDelta: number): number {
  const zoom = Math.round(Math.log2(360 / Math.max(latitudeDelta, 0.01)));
  return Math.min(18, Math.max(4, zoom));
}
