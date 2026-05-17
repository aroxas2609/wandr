import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { GlassCard } from '@/components';
import type { PlaceRecommendation } from '@/types/recommendation';
import { colors, typography, spacing } from '@/theme';

interface RecommendationsRowProps {
  items: PlaceRecommendation[];
  isLoading: boolean;
  isError: boolean;
  hasTrips: boolean;
}

export function RecommendationsRow({
  items,
  isLoading,
  isError,
  hasTrips,
}: RecommendationsRowProps) {
  if (!hasTrips) return null;

  if (isLoading && items.length === 0) {
    return (
      <View>
        {[0, 1].map((i) => (
          <GlassCard key={i} style={styles.recCard}>
            <ActivityIndicator color={colors.gold} style={styles.loader} />
          </GlassCard>
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <GlassCard style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          {isError
            ? 'Could not load recommendations. Enable Places API (New) for your Google key, then pull to refresh.'
            : 'No suggestions found for your destinations yet. Pull to refresh.'}
        </Text>
      </GlassCard>
    );
  }

  return (
    <>
      {items.map((rec, i) => (
        <Animated.View key={rec.id} entering={FadeInRight.delay(i * 100)}>
          <GlassCard style={styles.recCard}>
            <Text style={styles.recTag}>{rec.tag}</Text>
            <Text style={styles.recTitle}>{rec.title}</Text>
            {rec.subtitle ? (
              <Text style={styles.recSubtitle} numberOfLines={2}>
                {rec.subtitle}
              </Text>
            ) : null}
          </GlassCard>
        </Animated.View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  recCard: { marginBottom: 12 },
  recTag: { ...typography.overline, color: colors.sage, marginBottom: 4 },
  recTitle: { ...typography.h3, fontSize: 16 },
  recSubtitle: { ...typography.caption, color: colors.secondary, marginTop: 4 },
  emptyCard: { paddingVertical: spacing.lg },
  emptyText: { ...typography.caption, color: colors.secondary },
  loader: { marginVertical: spacing.lg },
});
