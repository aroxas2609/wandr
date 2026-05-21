import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography } from '@/theme';
import { MemberAvatar } from './MemberAvatar';

export type AvatarStackMember = {
  key: string;
  name: string;
  avatarUrl?: string | null;
};

interface AvatarStackProps {
  /** Preferred: members with optional profile photos */
  members?: AvatarStackMember[];
  /** Legacy: initials only (no photos) */
  names?: string[];
  max?: number;
  size?: number;
  onMemberPress?: (member: AvatarStackMember) => void;
}

export function AvatarStack({ members, names, max = 3, size = 32, onMemberPress }: AvatarStackProps) {
  const items: AvatarStackMember[] =
    members ??
    (names ?? []).map((name, i) => ({
      key: `${name}-${i}`,
      name,
    }));

  const visible = items.slice(0, max);
  const overflow = items.length - max;

  return (
    <View style={styles.container}>
      {visible.map((member, i) => {
        const avatar = (
          <MemberAvatar name={member.name} avatarUrl={member.avatarUrl} size={size} />
        );
        const wrapStyle = [
          styles.wrap,
          { marginLeft: i > 0 ? -10 : 0, zIndex: max - i, width: size, height: size },
        ];
        return onMemberPress ? (
          <Pressable
            key={member.key}
            style={wrapStyle}
            onPress={() => onMemberPress(member)}
            accessibilityRole="button"
            accessibilityLabel={`${member.name} profile`}
            accessibilityHint="View profile"
          >
            {avatar}
          </Pressable>
        ) : (
          <View key={member.key} style={wrapStyle}>
            {avatar}
          </View>
        );
      })}
      {overflow > 0 && (
        <View
          style={[
            styles.wrap,
            styles.overflow,
            { marginLeft: -10, zIndex: 0, width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: Math.max(10, size * 0.34) }]}>
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  wrap: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  overflow: {
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    ...typography.caption,
    color: colors.background,
    fontFamily: 'Inter_600SemiBold',
  },
});
