import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { OpenStreetMapView } from './OpenStreetMapView';
import { getGoogleMapsApiKey, isGoogleMapsConfigured } from '@/lib/mapsConfig';
import { colors, typography, spacing } from '@/theme';

export type { MapMarker } from './OpenStreetMapView';
export { regionDeltaToZoom } from '@/lib/mapsConfig';

interface GoogleMapViewProps {
  center: { latitude: number; longitude: number };
  zoom?: number;
  markers?: Array<{ latitude: number; longitude: number; title?: string }>;
  onMapPress?: (coord: { latitude: number; longitude: number }) => void;
  style?: ViewStyle;
  active?: boolean;
}

const containerStyle = { width: '100%', height: '100%', minHeight: 320 };

function GoogleMapLoaded({
  apiKey,
  center,
  zoom = 13,
  markers = [],
  onMapPress,
  style,
  active = true,
}: GoogleMapViewProps & { apiKey: string }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'wandr-google-maps',
    googleMapsApiKey: apiKey,
    language: 'en',
  });

  const mapCenter = useMemo(
    () => ({ lat: center.latitude, lng: center.longitude }),
    [center.latitude, center.longitude]
  );

  useEffect(() => {
    if (__DEV__ && loadError) {
      console.warn('[Wandr] Google Maps failed to load:', loadError.message);
    }
  }, [loadError]);

  if (loadError) {
    return (
      <View style={[styles.wrap, style]}>
        <Text style={styles.banner}>
          Could not load Google Maps ({loadError.message}). Check API key restrictions for
          localhost.
        </Text>
        <OpenStreetMapView
          active={active}
          center={center}
          zoom={zoom}
          markers={markers}
          onMapPress={onMapPress}
          style={styles.fallbackMap}
        />
      </View>
    );
  }

  if (!active || !isLoaded) {
    return <View style={[styles.wrap, styles.loading, style]} />;
  }

  return (
    <View style={[styles.wrap, style]}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        options={{
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        }}
        onClick={(e) => {
          const latLng = e.latLng;
          if (!latLng || !onMapPress) return;
          onMapPress({ latitude: latLng.lat(), longitude: latLng.lng() });
        }}
      >
        {markers.map((m, i) => (
          <Marker
            key={`${m.latitude}-${m.longitude}-${i}`}
            position={{ lat: m.latitude, lng: m.longitude }}
            title={m.title}
          />
        ))}
      </GoogleMap>
    </View>
  );
}

export function GoogleMapView(props: GoogleMapViewProps) {
  const apiKey = getGoogleMapsApiKey();

  useEffect(() => {
    if (__DEV__) {
      console.info(
        '[Wandr] Google Maps key:',
        apiKey.length >= 20 ? `configured (${apiKey.length} chars)` : 'missing — using OpenStreetMap'
      );
    }
  }, [apiKey]);

  if (!isGoogleMapsConfigured()) {
    return (
      <View style={[styles.wrap, props.style]}>
        <Text style={styles.banner}>
          Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env, save, then restart Expo (npx expo start -c).
        </Text>
        <OpenStreetMapView
          active={props.active}
          center={props.center}
          zoom={props.zoom}
          markers={props.markers}
          onMapPress={props.onMapPress}
          style={styles.fallbackMap}
        />
      </View>
    );
  }

  return <GoogleMapLoaded {...props} apiKey={apiKey} />;
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.elevated,
    minHeight: 320,
    flex: 1,
  },
  loading: {
    minHeight: 320,
    backgroundColor: colors.elevated,
  },
  fallbackMap: { flex: 1, minHeight: 280 },
  banner: {
    ...typography.caption,
    color: colors.muted,
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
});
