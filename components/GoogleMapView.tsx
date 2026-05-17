/** Native trip screens use react-native-maps; web uses GoogleMapView.web.tsx */
export { OpenStreetMapView as GoogleMapView } from './OpenStreetMapView';
export type { MapMarker } from './OpenStreetMapView';
export { regionDeltaToZoom } from '@/lib/mapsConfig';
