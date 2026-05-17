import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme';

export function TabletLandscapeBlock() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing['2xl'], paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <Text style={styles.brand}>Wandr</Text>
      <Text style={styles.title}>Rotate your iPad</Text>
      <Text style={styles.body}>
        Wandr on the web is designed for iPad in portrait mode. Turn your device upright to
        continue.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    ...typography.h1,
    color: colors.gold,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.secondary,
    textAlign: 'center',
    maxWidth: 420,
  },
});
