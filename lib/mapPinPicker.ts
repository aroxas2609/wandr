import type { PlaceSearchResult } from '@/services/geocoding/geocodingService';

export interface MapPin {
  latitude: number;
  longitude: number;
}
import { distanceMeters, formatPlaceLabel } from '@/services/geocoding/geocodingService';

export interface MapPinNameState {
  selectedName: string | null;
  searchAnchor: { latitude: number; longitude: number; name: string } | null;
}

export function createMapPinNameState(): MapPinNameState {
  return { selectedName: null, searchAnchor: null };
}

export function applySearchSelection(
  state: MapPinNameState,
  place: PlaceSearchResult
): MapPinNameState {
  const name = formatPlaceLabel(place);
  return {
    selectedName: name,
    searchAnchor: {
      latitude: place.latitude,
      longitude: place.longitude,
      name,
    },
  };
}

export function applyMapPress(
  state: MapPinNameState,
  coord: MapPin
): MapPinNameState {
  if (!state.searchAnchor) {
    return { ...state, selectedName: null };
  }
  if (distanceMeters(coord, state.searchAnchor) > 800) {
    return { ...state, selectedName: null };
  }
  return state;
}
