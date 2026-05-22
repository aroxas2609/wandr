import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, typography, spacing, radius } from '@/theme';
import { isFeatureEnabled } from '@/constants/features';
import { useUnreadChatCount } from '@/features/chat/hooks/useUnreadChatCount';

interface TripToolsGridProps {
  tripId: string;
}

type Tool = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  feature: Parameters<typeof isFeatureEnabled>[0];
};

const TOOLS: Tool[] = [
  {
    key: 'budget',
    label: 'Budget',
    icon: 'wallet-outline',
    route: 'budget',
    feature: 'budget',
  },
  {
    key: 'packing',
    label: 'Packing',
    icon: 'bag-outline',
    route: 'packing',
    feature: 'packing',
  },
  {
    key: 'wallet',
    label: 'Wallet',
    icon: 'document-text-outline',
    route: 'wallet',
    feature: 'wallet',
  },
  {
    key: 'map',
    label: 'Map',
    icon: 'map-outline',
    route: 'map',
    feature: 'map',
  },
  {
    key: 'members',
    label: 'Share',
    icon: 'people-outline',
    route: 'members',
    feature: 'sharedTrips',
  },
  {
    key: 'chat',
    label: 'Chat',
    icon: 'chatbubbles-outline',
    route: 'chat',
    feature: 'chat',
  },
];

export function TripToolsGrid({ tripId }: TripToolsGridProps) {
  const unreadChat = useUnreadChatCount(tripId);
  const visible = TOOLS.filter((t) => isFeatureEnabled(t.feature));
  if (visible.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Tools</Text>
      <View style={styles.grid}>
        {visible.map((tool) => {
          const badge =
            tool.key === 'chat' && unreadChat > 0
              ? unreadChat > 99
                ? '99+'
                : String(unreadChat)
              : null;
          return (
            <Pressable
              key={tool.key}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => router.push(`/trip/${tripId}/${tool.route}`)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={tool.icon} size={22} color={colors.gold} />
                {badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.label}>{tool.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  title: { ...typography.h3, marginBottom: spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '30%',
    minWidth: 96,
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  iconWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: colors.background,
  },
  label: { ...typography.caption, color: colors.primary },
});
