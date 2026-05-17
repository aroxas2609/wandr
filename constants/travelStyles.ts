export const TRAVEL_STYLES = [
  'Luxury',
  'Adventure',
  'Culture',
  'Foodie',
  'Relaxation',
  'Family',
  'Romantic',
  'Solo',
] as const;

export type TravelStyle = (typeof TRAVEL_STYLES)[number];
