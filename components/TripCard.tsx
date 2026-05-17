import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { Trip } from '@/types';
import { formatDateRange } from '@/utils/dates';
import { getCountdownParts } from '@/utils/countdown';
import { colors, typography, radius, shadows } from '@/theme';
import { TestIds } from '@/constants/testIds';
import { AvatarStack } from './AvatarStack';
import { Pill } from './Pill';
import type { CountdownParts } from '@/utils/countdown';

function getStatusLabel(countdown: CountdownParts): string {
  if (countdown.isPast) return 'Completed';
  if (countdown.isActive) return 'In progress';
  return `${countdown.days}d`;
}

interface TripCardProps {
  trip: Trip;
  memberNames?: string[];
  index?: number;
}

export function TripCard({ trip, memberNames = [], index = 0 }: TripCardProps) {
  const countdown = getCountdownParts(trip.startDate, trip.endDate);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/trip/${trip.id}`);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Pressable
        onPress={handlePress}
        testID={TestIds.tripCard}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <Image source={{ uri: trip.coverUrl }} style={styles.image} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(13,13,15,0.95)']}
          style={styles.gradient}
        />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Pill
              label={getStatusLabel(countdown)}
              size="sm"
              variant="goldFilled"
            />
            {memberNames.length > 0 && <AvatarStack names={memberNames} />}
          </View>
          <Text style={styles.title}>{trip.title}</Text>
          <Text style={styles.destination}>{trip.destination}</Text>
          <Text style={styles.dates}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 220,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 16,
    ...shadows.soft,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  image: { ...StyleSheet.absoluteFillObject },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    top: '30%',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    ...typography.h2,
    fontSize: 22,
  },
  destination: {
    ...typography.body,
    color: colors.secondary,
    marginTop: 2,
  },
  dates: {
    ...typography.caption,
    marginTop: 6,
  },
});
