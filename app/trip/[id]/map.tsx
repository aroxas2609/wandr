import { View, Text, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader, GlassCard, EmptyState } from '@/components';
import { useTrip, useTripDays } from '@/features/trips/hooks/useTrips';
import { useTripActivities } from '@/features/itinerary/hooks/useItinerary';
import { colors, typography, spacing } from '@/theme';

let MapView: React.ComponentType<{
  style: object;
  initialRegion: object;
  provider?: string;
  children?: React.ReactNode;
}> | null = null;
let Marker: React.ComponentType<{
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
}> | null = null;

let mapProvider: string | undefined;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  mapProvider = maps.PROVIDER_GOOGLE;
}

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
        longitudeDelta: 0.15,
      }
    : {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

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
      ) : Platform.OS === 'web' || !MapView ? (
        <View style={styles.list}>
          {pinned.map((a) => (
            <GlassCard key={a.id} style={styles.card}>
              <Text style={styles.pinTitle}>{a.title}</Text>
              <Text style={styles.pinMeta}>
                {a.locationName ?? 'Location'} · {a.lat?.toFixed(4)}, {a.lng?.toFixed(4)}
              </Text>
            </GlassCard>
          ))}
          <Text style={styles.webNote}>Full map view available on iOS and Android.</Text>
        </View>
      ) : MapView && Marker ? (
        <MapView style={styles.map} provider={mapProvider} initialRegion={initialRegion}>
          {pinned.map((a) => (
            <Marker
              key={a.id}
              coordinate={{ latitude: a.lat!, longitude: a.lng! }}
              title={a.title}
              description={a.locationName}
            />
          ))}
        </MapView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  list: { padding: spacing.xl, flex: 1 },
  card: { marginBottom: spacing.sm },
  pinTitle: { ...typography.label, color: colors.primary },
  pinMeta: { ...typography.caption, marginTop: 4 },
  webNote: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg },
});
