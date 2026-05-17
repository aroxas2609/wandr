import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Share } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScreenHeader, GlassCard, PremiumButton } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { signOutUser } from '@/services/auth/authService';
import { updateNotificationPrefs } from '@/services/auth/userService';
import { buildTripsExport } from '@/services/export/exportTrips';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useMarkNotificationRead } from '@/features/notifications/hooks/useNotifications';
import { TestIds } from '@/constants/testIds';
import { colors, typography, spacing } from '@/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [notifications, setNotifications] = useState(true);
  const [tripUpdates, setTripUpdates] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { data: appNotifications = [] } = useNotifications(user?.id ?? '');
  const markRead = useMarkNotificationRead(user?.id ?? '');

  useEffect(() => {
    if (!user) return;
    void updateNotificationPrefs(user.id, {
      pushNotifications: notifications,
      tripUpdates,
    });
  }, [notifications, tripUpdates, user]);

  const handleSignOut = async () => {
    await signOutUser();
    signOut();
    router.replace('/(auth)/welcome');
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const data = await buildTripsExport(user.id);
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'Wandr Trips Export',
      });
    } catch {
      Alert.alert('Export failed', 'Could not export trip data.');
    } finally {
      setExporting(false);
    }
  };

  const unread = appNotifications.filter((n) => !n.read);

  return (
    <ScrollView
      style={[styles.container, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Profile" large />
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName?.charAt(0).toUpperCase() ?? 'W'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.fullName ?? 'Traveler'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      <GlassCard style={styles.card}>
        <SettingsRow
          icon="settings-outline"
          label="Settings"
          onPress={() => router.push('/settings')}
        />
        <SettingsRow
          icon="download-outline"
          label="Export Data"
          subtitle={exporting ? 'Exporting...' : 'JSON backup'}
          onPress={handleExport}
        />
        <SettingsRow
          icon="share-outline"
          label="Invite Friends"
          subtitle="Open a trip → Share"
          onPress={() => router.push('/(tabs)/trips')}
        />
      </GlassCard>

      {unread.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>In-app</Text>
          <GlassCard style={styles.card}>
            {unread.slice(0, 5).map((n) => (
              <Pressable
                key={n.id}
                style={styles.notifRow}
                onPress={() => markRead.mutate(n.id)}
              >
                <Text style={styles.notifTitle}>{n.title}</Text>
                {n.body && <Text style={styles.notifBody}>{n.body}</Text>}
              </Pressable>
            ))}
          </GlassCard>
        </>
      )}

      <Text style={styles.sectionLabel}>Notifications</Text>
      <GlassCard style={styles.card}>
        <ToggleRow label="Push Notifications" value={notifications} onChange={setNotifications} />
        <ToggleRow label="Trip Updates" value={tripUpdates} onChange={setTripUpdates} />
      </GlassCard>

      <View style={styles.signOutWrap}>
        <PremiumButton
          label="Sign Out"
          variant="danger"
          onPress={handleSignOut}
          testID={TestIds.signOutButton}
        />
      </View>
    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={22} color={colors.gold} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color={colors.muted} />}
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.elevated, true: colors.gold }}
        thumbColor={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  avatarSection: { alignItems: 'center', marginBottom: spacing['2xl'] },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { ...typography.h1, color: colors.gold },
  name: { ...typography.h2 },
  email: { ...typography.body, marginTop: 4 },
  card: { marginHorizontal: spacing.xl, marginBottom: spacing.lg },
  sectionLabel: {
    ...typography.overline,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { ...typography.label, color: colors.primary },
  rowSubtitle: { ...typography.caption, marginTop: 2 },
  notifRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  notifTitle: { ...typography.label, color: colors.primary },
  notifBody: { ...typography.caption, marginTop: 2 },
  signOutWrap: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: 40,
  },
});
