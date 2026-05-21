import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

export function ViewOnlyBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="eye-outline" size={18} color={colors.gold} />
      <Text style={styles.text}>You have view-only access on this trip</Text>
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
