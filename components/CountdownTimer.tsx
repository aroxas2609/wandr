import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  getCountdownParts,
  formatCountdownDisplay,
  getCountdownShortLabel,
} from '@/utils/countdown';
import { colors, typography } from '@/theme';

interface CountdownTimerProps {
  startDate: string;
  endDate: string;
  compact?: boolean;
}

export function CountdownTimer({ startDate, endDate, compact }: CountdownTimerProps) {
  const parts = getCountdownParts(startDate, endDate);

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, compact && styles.containerCompact]}
    >
      <Text style={[styles.number, compact && styles.numberCompact]}>
        {formatCountdownDisplay(parts)}
      </Text>
      {compact ? (
        <Text style={styles.shortLabel}>{getCountdownShortLabel(parts)}</Text>
      ) : (
        <Text style={styles.label}>{parts.label}</Text>
      )}
      {parts.isActive && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>Active Trip</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  containerCompact: { alignItems: 'flex-start' },
  number: {
    ...typography.display,
    fontSize: 56,
    color: colors.gold,
  },
  numberCompact: {
    fontSize: 32,
  },
  label: {
    ...typography.caption,
    color: colors.secondary,
    marginTop: 4,
  },
  shortLabel: {
    ...typography.overline,
    color: colors.gold,
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 1.2,
  },
  activeBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(129, 178, 154, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    ...typography.overline,
    color: colors.sage,
    fontSize: 10,
  },
});
