import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader, EmptyState } from '@/components';
import { GoogleMapView, regionDeltaToZoom } from '@/components/GoogleMapView.web';
import { useTrip, useTripDays } from '@/features/trips/hooks/useTrips';
import { useTripActivities } from '@/features/itinerary/hooks/useItinerary';
import { colors, spacing } from '@/theme';

export default function MapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: days = [] } = useTripDays(id);
  const { data: activities = [] } = useTripActivities(days, id);

  const pinned = activities.filter(
    (a) => typeof a.lat === 'number' && typeof a.lng === 'number'
  );

  const initialRegion = pinned[0]
    ? {
        latitude: pinned[0].lat!,
        longitude: pinned[0].lng!,
        latitudeDelta: 0.15,
      }
    : {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.5,
      };

  const markers = pinned.map((a) => ({
    latitude: a.lat!,
    longitude: a.lng!,
    title: a.title,
  }));

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Map Explorer"
        showBack
        backHref={`/trip/${id}`}
        subtitle={trip?.title}
      />
      {pinned.length === 0 ? (
        <EmptyState
          title="No map pins yet"
          description="Search for a place or pick on the map when adding an activity."
        />
      ) : (
        <GoogleMapView
          active
          center={{
            latitude: initialRegion.latitude,
            longitude: initialRegion.longitude,
          }}
          zoom={regionDeltaToZoom(initialRegion.latitudeDelta)}
          markers={markers}
          style={styles.map}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1, minHeight: 400 },
});
