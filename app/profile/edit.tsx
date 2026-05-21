import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ScreenHeader, GlassCard, FormInput, PremiumButton } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { updateUserProfile } from '@/services/auth/userService';
import { uploadAvatar } from '@/services/storage/uploadAvatar';
import { pickImageFromLibrary } from '@/lib/pickDocumentImage';
import { getErrorMessage } from '@/lib/errors';
import { colors, typography, spacing } from '@/theme';

export default function EditProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePickAvatar = async () => {
    const picked = await pickImageFromLibrary();
    if (!picked) return;
    setLocalPreview(picked.uri);
  };

  const handleSave = async () => {
    if (!user) return;
    setError('');
    setSaving(true);
    try {
      let nextAvatarUrl = avatarUrl;
      if (localPreview) {
        nextAvatarUrl = await uploadAvatar(user.id, localPreview);
      }
      const updated = await updateUserProfile(user.id, {
        fullName,
        avatarUrl: nextAvatarUrl,
      });
      setUser({ ...user, ...updated });
      router.back();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save profile.'));
    } finally {
      setSaving(false);
    }
  };

  const previewUri = localPreview ?? avatarUrl;
  const initial = (fullName || user?.fullName || 'T').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Profile" showBack backHref="/(tabs)/profile" />
      <View style={styles.content}>
        <Pressable
          style={styles.avatarWrap}
          onPress={() => void handlePickAvatar()}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </Pressable>

        <GlassCard>
          <FormInput
            label="Display name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            autoCapitalize="words"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PremiumButton label="Save" onPress={() => void handleSave()} loading={saving} />
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.xl },
  avatarWrap: { alignItems: 'center', gap: spacing.sm },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { ...typography.h1, color: colors.gold },
  avatarHint: { ...typography.caption },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
});
