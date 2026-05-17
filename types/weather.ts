export interface TripWeatherSnapshot {
  tripId: string;
  city: string;
  destination: string;
  tempC: number;
  temp: string;
  condition: string;
  humidity?: number;
  fetchedAt: string;
}
