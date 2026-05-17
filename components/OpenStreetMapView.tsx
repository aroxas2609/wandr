import { View, type ViewStyle } from 'react-native';

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
  active?: boolean;
}

export function regionDeltaToZoom(latitudeDelta: number): number {
  const zoom = Math.round(Math.log2(360 / Math.max(latitudeDelta, 0.01)));
  return Math.min(18, Math.max(4, zoom));
}

/** Native builds use react-native-maps; this stub is unused on iOS/Android. */
export function OpenStreetMapView(_props: OpenStreetMapViewProps) {
  return <View />;
}
