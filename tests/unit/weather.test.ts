import {
  weatherCodeToCondition,
} from '@/features/weather/utils/weatherCodes';
import {
  countryCodeFromDestination,
  displayCityFromDestination,
  geocodeQueryFromDestination,
} from '@/features/weather/utils/parseDestination';
import { dedupeWeatherTrips } from '@/features/weather/services/weatherService';
import type { Trip } from '@/types';

describe('weather utils', () => {
  it('maps WMO codes to labels', () => {
    expect(weatherCodeToCondition(0)).toBe('Clear');
    expect(weatherCodeToCondition(2)).toBe('Partly cloudy');
    expect(weatherCodeToCondition(95)).toBe('Thunderstorm');
  });

  it('parses destination for geocoding', () => {
    expect(geocodeQueryFromDestination('Tokyo, Japan')).toBe('Tokyo');
    expect(displayCityFromDestination('Paris')).toBe('Paris');
    expect(countryCodeFromDestination('Queenstown, New Zealand')).toBe('NZ');
    expect(countryCodeFromDestination('Tokyo, Japan')).toBe('JP');
    expect(countryCodeFromDestination('Paris')).toBeUndefined();
  });

  it('dedupes trips by destination', () => {
    const trips = [
      { id: '1', destination: 'Tokyo, Japan' },
      { id: '2', destination: 'tokyo, japan' },
      { id: '3', destination: 'Paris' },
    ] as Trip[];

    const inputs = dedupeWeatherTrips(trips);
    expect(inputs).toHaveLength(2);
    expect(inputs[0].tripId).toBe('1');
    expect(inputs[1].destination).toBe('Paris');
  });
});
