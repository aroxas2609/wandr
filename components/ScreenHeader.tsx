import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { Platform } from 'react-native';
import { navigateBack } from '@/lib/navigation';
import { colors, typography, spacing } from '@/theme';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  /** Used when there is no history stack (common on web refresh / deep links) */
  backHref?: Href;
  rightAction?: React.ReactNode;
  large?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  rightAction,
  large = false,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={() => navigateBack(backHref)}
            style={styles.backButton}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            {...(Platform.OS === 'web' ? { role: 'button' as const } : {})}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        {rightAction ?? <View style={styles.backPlaceholder} />}
      </View>
      {title && (
        <Text style={large ? styles.largeTitle : styles.title}>{title}</Text>
      )}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  backPlaceholder: { width: 40 },
  largeTitle: {
    ...typography.display,
    fontSize: 36,
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },
});
