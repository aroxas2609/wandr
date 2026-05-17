import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from './FormInput';
import { PremiumButton } from './PremiumButton';
import { MapPinPickerModal } from './MapPinPickerModal';
import type { MapPin } from '@/lib/mapPinPicker';
import {
  searchPlaces,
  formatPlaceLabel,
  resolvePlaceForSave,
  type PlaceSearchResult,
} from '@/services/geocoding/geocodingService';
import { isGoogleMapsConfigured } from '@/lib/mapsConfig';
import { geocodeQueryFromDestination } from '@/features/weather/utils/parseDestination';
import { colors, typography, spacing, radius } from '@/theme';

interface LocationPickerFieldProps {
  locationName: string;
  lat?: number;
  lng?: number;
  onLocationNameChange: (value: string) => void;
  onCoordinatesChange: (coords: { lat: number; lng: number } | undefined) => void;
  tripDestination?: string;
  error?: string;
}

const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export function LocationPickerField({
  locationName,
  lat,
  lng,
  onLocationNameChange,
  onCoordinatesChange,
  tripDestination,
  error,
}: LocationPickerFieldProps) {
  const [suggestions, setSuggestions] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_REGION);
  /** Local pin state so the card updates immediately (RHF watch can lag one frame). */
  const [localPin, setLocalPin] = useState<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
      setLocalPin({ lat, lng });
    } else if (lat === undefined && lng === undefined) {
      setLocalPin(null);
    }
  }, [lat, lng]);

  const hasPin = localPin !== null;
  const searchPlaceholder = tripDestination
    ? `Search near ${tripDestination}`
    : 'Search for a place…';

  useEffect(() => {
    if (localPin) {
      setMapCenter({
        latitude: localPin.lat,
        longitude: localPin.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      return;
    }
    if (!tripDestination?.trim()) return;

    let cancelled = false;
    void searchPlaces(geocodeQueryFromDestination(tripDestination), 1).then((results) => {
      if (cancelled || !results[0]) return;
      setMapCenter({
        latitude: results[0].latitude,
        longitude: results[0].longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [tripDestination, localPin]);

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setSearchError('');
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      const results = await searchPlaces(query);
      setSuggestions(results);
      if (results.length === 0) {
        setSearchError('No places found — try a different name or pick on the map.');
      }
    } catch {
      setSearchError('Could not search places. Check your connection.');
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleNameChange = (text: string) => {
    onLocationNameChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(text), 400);
  };

  const selectPlace = (place: PlaceSearchResult) => {
    void (async () => {
      setSearching(true);
      try {
        const resolved = await resolvePlaceForSave(place);
        const coords = { lat: resolved.latitude, lng: resolved.longitude };
        setLocalPin(coords);
        onLocationNameChange(formatPlaceLabel(resolved));
        onCoordinatesChange(coords);
        setSuggestions([]);
        setSearchError('');
        setMapCenter({
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch {
        setSearchError('Could not load place details. Try again or pick on the map.');
      } finally {
        setSearching(false);
      }
    })();
  };

  const clearPin = () => {
    setLocalPin(null);
    onCoordinatesChange(undefined);
  };

  const handleMapConfirm = (pin: MapPin, placeName: string | null) => {
    const latNum = Number(pin.latitude);
    const lngNum = Number(pin.longitude);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return;

    const coords = { lat: latNum, lng: lngNum };
    setLocalPin(coords);
    onCoordinatesChange(coords);

    const label =
      placeName?.trim() || locationName.trim() || 'Pinned location';
    onLocationNameChange(label);

    setMapCenter({
      latitude: latNum,
      longitude: lngNum,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
    setMapVisible(false);
  };

  const mapInitialPin: MapPin | null = localPin
    ? { latitude: localPin.lat, longitude: localPin.lng }
    : null;

  return (
    <View style={styles.container}>
      {!isGoogleMapsConfigured() ? (
        <Text style={styles.mapsHint}>
          Tip: set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env for English Google Maps search and tiles.
        </Text>
      ) : null}

      <FormInput
        label="Location"
        value={locationName}
        onChangeText={handleNameChange}
        placeholder={tripDestination ? `e.g. museum near ${tripDestination}` : 'Louvre Museum, Paris'}
        error={error}
      />

      {searching ? (
        <ActivityIndicator size="small" color={colors.gold} style={styles.spinner} />
      ) : null}

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((place) => (
            <Pressable
              key={place.id}
              style={styles.suggestionRow}
              onPress={() => selectPlace(place)}
            >
              <Ionicons name="location-outline" size={18} color={colors.gold} />
              <Text style={styles.suggestionTitle}>{formatPlaceLabel(place)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {searchError && suggestions.length === 0 ? (
        <Text style={styles.searchError}>{searchError}</Text>
      ) : null}

      {hasPin ? (
        <View style={styles.pinCard}>
          <View style={styles.pinCardBody}>
            <View style={styles.pinIconWrap}>
              <Ionicons name="location" size={18} color={colors.gold} />
            </View>
            <View style={styles.pinCardText}>
              <Text style={styles.pinCardTitle} numberOfLines={1}>
                {locationName.trim() || 'Pinned location'}
              </Text>
              <Text style={styles.pinCardSub}>On Map Explorer</Text>
            </View>
          </View>
          <Pressable
            onPress={clearPin}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remove map pin"
            style={styles.removeBtn}
          >
            <Ionicons name="close-circle" size={22} color={colors.muted} />
          </Pressable>
        </View>
      ) : (
        <Text style={styles.helper}>
          Search for a place or pick on the map to show it in Map Explorer.
        </Text>
      )}

      <PremiumButton
        label={hasPin ? 'Adjust on map' : 'Pick on map'}
        variant="outline"
        onPress={() => setMapVisible(true)}
        style={styles.mapBtn}
      />

      <MapPinPickerModal
        visible={mapVisible}
        initialPin={mapInitialPin}
        initialRegion={mapCenter}
        initialSearchQuery={locationName}
        searchPlaceholder={searchPlaceholder}
        onClose={() => setMapVisible(false)}
        onConfirm={handleMapConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  spinner: { marginTop: -8, marginBottom: spacing.sm },
  suggestions: {
    marginTop: -8,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  suggestionTitle: { ...typography.body, color: colors.primary, flex: 1 },
  searchError: { ...typography.caption, color: colors.muted, marginTop: -8, marginBottom: spacing.sm },
  pinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    marginBottom: spacing.md,
  },
  pinCardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pinIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCardText: { flex: 1 },
  pinCardTitle: { ...typography.label, color: colors.primary },
  pinCardSub: { ...typography.caption, color: colors.muted, marginTop: 2 },
  removeBtn: { marginLeft: spacing.sm },
  helper: { ...typography.caption, color: colors.muted, marginBottom: spacing.md },
  mapBtn: { marginBottom: spacing.sm },
  mapsHint: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
});
