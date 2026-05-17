import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { PremiumButton } from '@/components';
import { colors, typography, spacing } from '@/theme';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1520', colors.background, '#0a0a0c']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(201, 169, 98, 0.08)']}
        style={styles.glow}
      />
      <View style={[styles.content, { paddingTop: insets.top + height * 0.15 }]}>
        <Animated.Text entering={FadeIn.delay(200)} style={styles.overline}>
          LUXURY TRAVEL PLANNING
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(400).springify()} style={styles.logo}>
          Wandr
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(600)} style={styles.tagline}>
          Plan extraordinary journeys with elegance and ease
        </Animated.Text>
      </View>
      <Animated.View
        entering={FadeInDown.delay(800)}
        style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}
      >
        <PremiumButton
          label="Get Started"
          onPress={() => router.push('/(auth)/onboarding')}
        />
        <PremiumButton
          label="Sign In"
          variant="ghost"
          onPress={() => router.push('/(auth)/login')}
          style={styles.signInButton}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  glow: {
    position: 'absolute',
    top: height * 0.2,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['3xl'],
  },
  overline: {
    ...typography.overline,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  logo: {
    ...typography.display,
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  tagline: {
    ...typography.body,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: spacing['3xl'],
    gap: 12,
  },
  signInButton: { marginTop: 4 },
});
