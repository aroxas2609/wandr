import { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PremiumButton } from './PremiumButton';
import { MapPlaceSearchBar } from './MapPlaceSearchBar';
import { GoogleMapView, regionDeltaToZoom } from './GoogleMapView.web';
import {
  resolveMapPinLocationName,
  type PlaceSearchResult,
} from '@/services/geocoding/geocodingService';
import {
  applyMapPress,
  applySearchSelection,
  createMapPinNameState,
  type MapPin,
} from '@/lib/mapPinPicker';
import { colors, typography, spacing } from '@/theme';

export type { MapPin };

interface MapPinPickerModalProps {
  visible: boolean;
  initialPin?: MapPin | null;
  initialRegion: MapPin & { latitudeDelta: number; longitudeDelta: number };
  initialSearchQuery?: string;
  searchPlaceholder?: string;
  onClose: () => void;
  onConfirm?: (pin: MapPin, placeName: string | null) => void;
}

export function MapPinPickerModal({
  visible,
  initialPin,
  initialRegion,
  initialSearchQuery = '',
  searchPlaceholder,
  onClose,
  onConfirm,
}: MapPinPickerModalProps) {
  const [pin, setPin] = useState<MapPin | null>(initialPin ?? null);
  const [nameState, setNameState] = useState(createMapPinNameState);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [mapCenter, setMapCenter] = useState(initialRegion);
  const [resolving, setResolving] = useState(false);

  const zoom = useMemo(
    () => regionDeltaToZoom(mapCenter.latitudeDelta ?? initialRegion.latitudeDelta),
    [mapCenter.latitudeDelta, initialRegion.latitudeDelta]
  );

  const center = useMemo(
    () => ({
      latitude: mapCenter.latitude,
      longitude: mapCenter.longitude,
    }),
    [mapCenter.latitude, mapCenter.longitude]
  );

  const markers = useMemo(
    () => (pin ? [{ latitude: pin.latitude, longitude: pin.longitude, title: 'Selected' }] : []),
    [pin]
  );

  const displayName =
    nameState.selectedName ??
    nameState.searchAnchor?.name ??
    (searchQuery.trim() || null);

  useEffect(() => {
    if (!visible) return;
    setPin(initialPin ?? null);
    setNameState(createMapPinNameState());
    setSearchQuery(initialSearchQuery);
    setMapCenter(initialRegion);
  }, [visible, initialPin, initialRegion, initialSearchQuery]);

  const handleSearchSelect = (place: PlaceSearchResult) => {
    const lat = Number(place.latitude);
    const lng = Number(place.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const next = { latitude: lat, longitude: lng };
    setPin(next);
    setNameState(applySearchSelection(createMapPinNameState(), place));
    setMapCenter({
      ...next,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    });
  };

  const handleMapPress = (coord: MapPin) => {
    setPin(coord);
    setNameState((prev) => applyMapPress(prev, coord));
  };

  const handleConfirm = async () => {
    if (!pin || !onConfirm) return;
    setResolving(true);
    try {
      const name = await resolveMapPinLocationName({
        pin,
        selectedName: nameState.selectedName,
        searchQuery,
        searchAnchor: nameState.searchAnchor,
      });
      onConfirm(pin, name);
      onClose();
    } catch {
      onConfirm(pin, nameState.selectedName ?? (searchQuery.trim() || null));
      onClose();
    } finally {
      setResolving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pick on map</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.secondary} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <MapPlaceSearchBar
            initialQuery={initialSearchQuery}
            placeholder={searchPlaceholder ?? 'Search for a place…'}
            onSelectPlace={handleSearchSelect}
            onQueryChange={setSearchQuery}
          />
        </View>

        <Text style={styles.hint}>Search above or click the map to drop a pin</Text>

        {visible ? (
          <GoogleMapView
            active={visible}
            center={center}
            zoom={zoom}
            markers={markers}
            onMapPress={handleMapPress}
            style={styles.map}
          />
        ) : null}

        {displayName ? (
          <Text style={styles.selectedName} numberOfLines={2}>
            {displayName}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <PremiumButton
            label={pin ? 'Use this location' : 'Search or click the map'}
            onPress={() => void handleConfirm()}
            disabled={!pin}
            loading={resolving}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h3 },
  searchWrap: { paddingHorizontal: spacing.md, zIndex: 10 },
  hint: {
    ...typography.caption,
    color: colors.muted,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  map: {
    flex: 1,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    minHeight: 320,
  },
  selectedName: {
    ...typography.caption,
    color: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
});
