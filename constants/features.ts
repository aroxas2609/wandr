export const features = {
  wallet: true,
  budget: true,
  packing: true,
  map: true,
  sharedTrips: true,
  chat: true,
  notifications: true,
  pushNotifications: true,
  weather: true,
} as const;

export function isFeatureEnabled(key: keyof typeof features): boolean {
  return features[key];
}
