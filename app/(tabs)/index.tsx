import { ScrollView, View, Text, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useTrips } from '@/features/trips/hooks/useTrips';
import { useTripWeather } from '@/features/weather/hooks/useTripWeather';
import { TripWeatherRow } from '@/features/weather/ui/TripWeatherRow';
import { useRecommendations } from '@/features/recommendations/hooks/useRecommendations';
import { RecommendationsRow } from '@/features/recommendations/ui/RecommendationsRow';
import { isGoogleMapsConfigured } from '@/lib/mapsConfig';
import { isFeatureEnabled } from '@/constants/features';
import {
  ScreenHeader,
  TripCard,
  GlassCard,
  PremiumButton,
  TripCardSkeleton,
  HeroSection,
} from '@/components';
import { colors, typography, spacing } from '@/theme';
import { getTripStatus } from '@/utils/dates';
import { useAuthStore } from '@/stores/authStore';
import type { Trip } from '@/types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: trips = [], isLoading, refetch, isRefetching } = useTrips();
  const [refreshing, setRefreshing] = useState(false);

  const activeTrip = useMemo(
    () => trips.find((t) => getTripStatus(t.startDate, t.endDate) === 'active'),
    [trips]
  );

  const upcomingTrips = useMemo(
    () =>
      trips
        .filter((t) => getTripStatus(t.startDate, t.endDate) === 'upcoming')
        .slice(0, 5),
    [trips]
  );

  const heroTrip = activeTrip ?? upcomingTrips[0];

  const weatherTrips = useMemo(() => {
    const list: Trip[] = [];
    if (activeTrip) list.push(activeTrip);
    for (const trip of upcomingTrips) {
      if (!list.some((t) => t.id === trip.id)) list.push(trip);
    }
    return list.slice(0, 5);
  }, [activeTrip, upcomingTrips]);

  const {
    data: weather = [],
    isLoading: weatherLoading,
    isError: weatherError,
    refetch: refetchWeather,
  } = useTripWeather(weatherTrips);

  const {
    data: recommendations = [],
    isLoading: recommendationsLoading,
    isError: recommendationsError,
    refetch: refetchRecommendations,
  } = useRecommendations(weatherTrips);

  const showRecommendations =
    isGoogleMapsConfigured() && weatherTrips.length > 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      isFeatureEnabled('weather') ? refetchWeather() : Promise.resolve(),
      showRecommendations ? refetchRecommendations() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.gold}
          />
        }
      >
        <ScreenHeader
          title={`Hello, ${useAuthStore.getState().user?.fullName?.split(' ')[0] ?? 'Traveler'}`}
          subtitle="Where will you wander next?"
          large
        />

        {heroTrip ? (
          <Pressable onPress={() => router.push(`/trip/${heroTrip.id}`)}>
            <HeroSection
              title={heroTrip.title}
              subtitle={heroTrip.destination}
              imageUrl={heroTrip.coverUrl}
              startDate={heroTrip.startDate}
              endDate={heroTrip.endDate}
            />
          </Pressable>
        ) : (
          <GlassCard style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Your next adventure awaits</Text>
            <Text style={styles.welcomeBody}>
              Create your first trip and start planning something extraordinary.
            </Text>
            <PremiumButton
              label="Plan a Trip"
              onPress={() => router.push('/trip/new')}
            />
          </GlassCard>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction icon="✦" label="New Trip" onPress={() => router.push('/trip/new')} />
            <QuickAction icon="◎" label="My Trips" onPress={() => router.push('/(tabs)/trips')} />
            {heroTrip && (
              <QuickAction
                icon="◈"
                label="Itinerary"
                onPress={() => router.push(`/trip/${heroTrip.id}`)}
              />
            )}
          </View>
        </View>

        {upcomingTrips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Trips</Text>
            {isLoading
              ? [0, 1].map((i) => <TripCardSkeleton key={i} />)
              : upcomingTrips.map((trip, i) => (
                  <TripCard key={trip.id} trip={trip} index={i} />
                ))}
          </View>
        )}

        {isFeatureEnabled('weather') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weather</Text>
            <TripWeatherRow
              items={weather}
              isLoading={weatherLoading}
              isError={weatherError}
              hasTrips={weatherTrips.length > 0}
            />
          </View>
        )}

        {showRecommendations && (
          <View style={[styles.section, { marginBottom: 32 }]}>
            <Text style={styles.sectionTitle}>Recommended</Text>
            <RecommendationsRow
              items={recommendations}
              isLoading={recommendationsLoading}
              isError={recommendationsError}
              hasTrips={weatherTrips.length > 0}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.quickAction}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  welcomeCard: { marginHorizontal: spacing.xl, marginBottom: spacing.xl },
  welcomeTitle: { ...typography.h2, marginBottom: spacing.sm },
  welcomeBody: { ...typography.body, marginBottom: spacing.xl },
  section: { paddingHorizontal: spacing.xl, marginBottom: spacing['2xl'] },
  sectionTitle: { ...typography.h3, marginBottom: spacing.lg },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  quickIcon: { fontSize: 24, color: colors.gold, marginBottom: 8 },
  quickLabel: { ...typography.caption, color: colors.secondary },
});
