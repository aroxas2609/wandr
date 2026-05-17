import { View, Text, StyleSheet, Dimensions, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Href } from 'expo-router';
import { navigateBack } from '@/lib/navigation';
import { colors, typography, spacing } from '@/theme';
import { CountdownTimer } from './CountdownTimer';

const { height } = Dimensions.get('window');

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  showBack?: boolean;
  backHref?: Href;
  children?: React.ReactNode;
}

export function HeroSection({
  title,
  subtitle,
  imageUrl,
  startDate,
  endDate,
  showBack = false,
  backHref,
  children,
}: HeroSectionProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(13,13,15,0.6)', colors.background]}
        style={styles.gradient}
      />
      {showBack ? (
        <Pressable
          onPress={() => navigateBack(backHref)}
          style={[styles.backButton, { top: insets.top + spacing.sm, left: spacing.xl }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          {...(Platform.OS === 'web' ? { role: 'button' as const } : {})}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
      ) : null}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {startDate && endDate && (
          <View style={styles.countdown}>
            <CountdownTimer startDate={startDate} endDate={endDate} compact />
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: height * 0.38,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  image: { ...StyleSheet.absoluteFillObject },
  gradient: { ...StyleSheet.absoluteFillObject },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 32,
  },
  title: {
    ...typography.display,
    fontSize: 32,
  },
  subtitle: {
    ...typography.body,
    marginTop: 4,
    marginBottom: 12,
  },
  countdown: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
