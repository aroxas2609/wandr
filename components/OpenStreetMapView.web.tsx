import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import { ensureLeafletCss } from '@/lib/leafletWeb';
import { regionDeltaToZoom } from '@/lib/mapsConfig';
import { colors } from '@/theme';

export { regionDeltaToZoom };

export interface MapMarker {
  latitude: number;
  longitude: number;
  title?: string;
}

interface OpenStreetMapViewProps {
  center: { latitude: number; longitude: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapPress?: (coord: { latitude: number; longitude: number }) => void;
  style?: ViewStyle;
  /** When false, skip init (e.g. hidden modal). Re-inits when true. */
  active?: boolean;
}

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export function OpenStreetMapView({
  center,
  zoom = 13,
  markers = [],
  onMapPress,
  style,
  active = true,
}: OpenStreetMapViewProps) {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const onMapPressRef = useRef(onMapPress);
  onMapPressRef.current = onMapPress;

  useEffect(() => {
    if (!active || !containerEl) return;

    let disposed = false;
    let map: LeafletMap | null = null;

    const scheduleInvalidate = () => {
      window.setTimeout(() => {
        if (!disposed) mapRef.current?.invalidateSize();
      }, 0);
      window.setTimeout(() => {
        if (!disposed) mapRef.current?.invalidateSize();
      }, 250);
      window.setTimeout(() => {
        if (!disposed) mapRef.current?.invalidateSize();
      }, 600);
    };

    const lat = center.latitude;
    const lng = center.longitude;
    const z = zoom;

    void (async () => {
      ensureLeafletCss();
      const L = await import('leaflet');
      if (disposed || !containerEl) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
      }

      map = L.map(containerEl, { zoomControl: true }).setView([lat, lng], z);

      L.tileLayer(TILE_URL, {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);

      map.on('click', (e) => {
        onMapPressRef.current?.({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      });

      mapRef.current = map;
      scheduleInvalidate();
    })();

    return () => {
      disposed = true;
      map?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [active, containerEl]);

  useEffect(() => {
    if (!active || !mapRef.current) return;
    mapRef.current.setView([center.latitude, center.longitude], zoom, { animate: false });
    window.setTimeout(() => mapRef.current?.invalidateSize(), 100);
  }, [active, center.latitude, center.longitude, zoom]);

  useEffect(() => {
    if (!active) return;

    void (async () => {
      const L = await import('leaflet');
      const layer = markersLayerRef.current;
      if (!layer) return;

      layer.clearLayers();
      for (const marker of markers) {
        const point = L.circleMarker([marker.latitude, marker.longitude], {
          radius: 9,
          color: colors.gold,
          fillColor: colors.gold,
          fillOpacity: 0.95,
          weight: 2,
        });
        if (marker.title) point.bindTooltip(marker.title);
        point.addTo(layer);
      }
    })();
  }, [active, markers]);

  return (
    <View style={[styles.wrap, style]}>
      <div ref={setContainerEl} className="wandr-leaflet-root" style={styles.mapDiv as object} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.elevated,
    minHeight: 320,
  },
  mapDiv: {
    width: '100%',
    height: '100%',
    minHeight: 320,
    zIndex: 0,
  } as object,
});
