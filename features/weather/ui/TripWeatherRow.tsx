import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { GlassCard } from '@/components';
import type { TripWeatherSnapshot } from '@/types/weather';
import { colors, typography, spacing } from '@/theme';

interface TripWeatherRowProps {
  items: TripWeatherSnapshot[];
  isLoading: boolean;
  isError: boolean;
  hasTrips: boolean;
}

export function TripWeatherRow({
  items,
  isLoading,
  isError,
  hasTrips,
}: TripWeatherRowProps) {
  if (!hasTrips) {
    return (
      <GlassCard style={styles.emptyCard}>
        <Text style={styles.emptyText}>Add an upcoming trip to see live weather.</Text>
      </GlassCard>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[0, 1].map((i) => (
          <GlassCard key={i} style={styles.weatherCard}>
            <ActivityIndicator color={colors.gold} style={styles.loader} />
          </GlassCard>
        ))}
      </ScrollView>
    );
  }

  if (items.length === 0) {
    return (
      <GlassCard style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          {isError
            ? 'Weather is unavailable right now. Pull to refresh.'
            : 'No forecast available for your destinations.'}
        </Text>
      </GlassCard>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {items.map((w, i) => (
        <Animated.View key={`${w.tripId}-${w.city}`} entering={FadeInRight.delay(i * 80)}>
          <GlassCard style={styles.weatherCard}>
            <Text style={styles.weatherCity} numberOfLines={1}>
              {w.city}
            </Text>
            <Text style={styles.weatherTemp}>{w.temp}</Text>
            <Text style={styles.weatherCondition} numberOfLines={2}>
              {w.condition}
            </Text>
          </GlassCard>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  weatherCard: { width: 140, marginRight: 12, minHeight: 100 },
  weatherCity: { ...typography.overline, color: colors.gold },
  weatherTemp: { ...typography.h2, marginVertical: 4 },
  weatherCondition: { ...typography.caption },
  emptyCard: { paddingVertical: spacing.lg },
  emptyText: { ...typography.caption, color: colors.secondary },
  loader: { marginVertical: spacing.xl },
});
