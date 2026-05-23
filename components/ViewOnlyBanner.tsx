import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

interface ViewOnlyBannerProps {
  message?: string;
}

export function ViewOnlyBanner({
  message = 'You have view-only access on this trip',
}: ViewOnlyBannerProps) {
  return (
    <View style={styles.banner}>
      <Ionicons name="eye-outline" size={18} color={colors.gold} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  text: { ...typography.caption, flex: 1 },
});
