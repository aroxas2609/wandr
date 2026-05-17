import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { PremiumButton } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { colors, typography, spacing } from '@/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Plan Effortlessly',
    description:
      'Craft beautiful day-by-day itineraries with an intuitive timeline that makes every moment count.',
    emoji: '✦',
  },
  {
    id: '2',
    title: 'Travel Together',
    description:
      'Collaborate with partners, family, and friends. Everyone stays in sync on the journey ahead.',
    emoji: '◈',
  },
  {
    id: '3',
    title: 'Travel in Style',
    description:
      'From countdown timers to curated recommendations — experience travel planning reimagined.',
    emoji: '◇',
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) {
      Haptics.selectionAsync();
      setIndex(newIndex);
    }
  };

  const finish = () => {
    setOnboardingComplete(true);
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.elevated, colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <PremiumButton
          label={index === SLIDES.length - 1 ? 'Start Planning' : 'Continue'}
          onPress={() => {
            if (index < SLIDES.length - 1) {
              setIndex(index + 1);
            } else {
              finish();
            }
          }}
        />
        {index < SLIDES.length - 1 && (
          <PremiumButton label="Skip" variant="ghost" onPress={finish} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    flex: 1,
    paddingHorizontal: spacing['3xl'],
    paddingTop: 120,
    alignItems: 'center',
  },
  emoji: { fontSize: 48, marginBottom: spacing['2xl'], color: colors.gold },
  title: {
    ...typography.display,
    fontSize: 36,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 26,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing['2xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.glassBorder,
  },
  dotActive: {
    backgroundColor: colors.gold,
    width: 24,
  },
  footer: {
    paddingHorizontal: spacing['3xl'],
    gap: 8,
  },
});
