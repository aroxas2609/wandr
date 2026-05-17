import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme';

interface AvatarStackProps {
  names: string[];
  max?: number;
}

export function AvatarStack({ names, max = 3 }: AvatarStackProps) {
  const visible = names.slice(0, max);
  const overflow = names.length - max;

  return (
    <View style={styles.container}>
      {visible.map((name, i) => (
        <View
          key={name}
          style={[styles.avatar, { marginLeft: i > 0 ? -10 : 0, zIndex: max - i }]}
        >
          <Text style={styles.initials}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      ))}
      {overflow > 0 && (
        <View style={[styles.avatar, styles.overflow, { marginLeft: -10 }]}>
          <Text style={styles.initials}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflow: {
    backgroundColor: colors.gold,
  },
  initials: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
