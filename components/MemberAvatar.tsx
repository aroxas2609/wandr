import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography } from '@/theme';

interface MemberAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  onPress?: () => void;
}

export function MemberAvatar({ name, avatarUrl, size = 40, onPress }: MemberAvatarProps) {
  const radius = size / 2;
  const initial = (name.trim().charAt(0) || '?').toUpperCase();

  const content = avatarUrl ? (
    <Image
      source={{ uri: avatarUrl }}
      style={[styles.image, { width: size, height: size, borderRadius: radius }]}
      contentFit="cover"
      accessibilityLabel={`${name} avatar`}
    />
  ) : (
    <View
      style={[styles.placeholder, { width: size, height: size, borderRadius: radius }]}
      accessibilityLabel={`${name} avatar`}
    >
      <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.38) }]}>{initial}</Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name} profile`}
      accessibilityHint="View profile"
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 2,
    borderColor: colors.card,
    backgroundColor: colors.elevated,
  },
  placeholder: {
    backgroundColor: colors.elevated,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.caption,
    color: colors.gold,
    fontFamily: 'Inter_600SemiBold',
  },
});
