import {
  formatPlaceLabel,
  distanceMeters,
  resolveMapPinLocationName,
} from '@/services/geocoding/geocodingService';
import { applyMapPress, applySearchSelection, createMapPinNameState } from '@/lib/mapPinPicker';

describe('geocoding', () => {
  it('formats place labels with POI label', () => {
    expect(
      formatPlaceLabel({
        id: '1',
        name: 'Tokyo Disneyland',
        label: 'Tokyo Disneyland, Urayasu, Japan',
        latitude: 35.63,
        longitude: 139.88,
      })
    ).toBe('Tokyo Disneyland, Urayasu, Japan');
  });

  it('computes distance in meters', () => {
    const a = { latitude: 35.63, longitude: 139.88 };
    const b = { latitude: 35.631, longitude: 139.881 };
    expect(distanceMeters(a, b)).toBeLessThan(200);
  });

  it('keeps search name when pin nudged nearby', async () => {
    const anchor = { latitude: 35.63, longitude: 139.88, name: 'Tokyo Disneyland' };
    const pin = { latitude: 35.6305, longitude: 139.8805 };
    const name = await resolveMapPinLocationName({
      pin,
      searchQuery: 'tokyo disney',
      searchAnchor: anchor,
    });
    expect(name).toBe('Tokyo Disneyland');
  });

  it('preserves selected name after small map press', () => {
    let state = applySearchSelection(createMapPinNameState(), {
      id: '1',
      name: 'Tokyo Disneyland',
      label: 'Tokyo Disneyland, Japan',
      latitude: 35.63,
      longitude: 139.88,
    });
    state = applyMapPress(state, { latitude: 35.6302, longitude: 139.8802 });
    expect(state.selectedName).toBe('Tokyo Disneyland, Japan');
  });
});
