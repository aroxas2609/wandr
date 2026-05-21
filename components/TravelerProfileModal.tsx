import { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MemberAvatar } from './MemberAvatar';
import { PremiumButton } from './PremiumButton';
import { fetchUserProfile } from '@/services/auth/userService';
import type { TripMember } from '@/types';
import { colors, typography, spacing, radius } from '@/theme';

const LARGE_AVATAR = 120;

export type TravelerProfileMember = Pick<
  TripMember,
  'userId' | 'fullName' | 'email' | 'avatarUrl' | 'role' | 'status'
>;

interface TravelerProfileModalProps {
  visible: boolean;
  onClose: () => void;
  member: TravelerProfileMember | null;
  displayName: string;
  avatarUrl?: string | null;
  isSelf?: boolean;
  tripTitle?: string;
}

function formatRole(role: TripMember['role']): string {
  if (role === 'owner') return 'Owner';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function TravelerProfileModal({
  visible,
  onClose,
  member,
  displayName,
  avatarUrl: avatarUrlProp,
  isSelf = false,
  tripTitle,
}: TravelerProfileModalProps) {
  const [resolvedName, setResolvedName] = useState(displayName);
  const [resolvedAvatar, setResolvedAvatar] = useState<string | null | undefined>(
    avatarUrlProp
  );
  const [photoExpanded, setPhotoExpanded] = useState(false);

  const isPending = member?.status === 'pending';
  const email = member?.email?.trim() || undefined;
  const roleLabel = member
    ? isPending
      ? 'Pending invite'
      : formatRole(member.role)
    : '';

  useEffect(() => {
    setResolvedName(displayName);
    setResolvedAvatar(avatarUrlProp);
  }, [member?.userId, displayName, avatarUrlProp]);

  useEffect(() => {
    if (!visible || !member || isPending) return;
    let cancelled = false;
    void (async () => {
      const profile = await fetchUserProfile(member.userId);
      if (cancelled || !profile) return;
      setResolvedName(
        profile.fullName && profile.fullName !== 'Traveler'
          ? profile.fullName
          : displayName
      );
      if (profile.avatarUrl) setResolvedAvatar(profile.avatarUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, member?.userId, isPending, displayName, avatarUrlProp]);

  useEffect(() => {
    if (!visible) setPhotoExpanded(false);
  }, [visible]);

  if (!member) return null;

  const canExpandPhoto = !isPending && !!resolvedAvatar;

  const handleEditProfile = () => {
    onClose();
    router.push('/profile/edit');
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            {tripTitle ? (
              <Text style={styles.tripContext} numberOfLines={1}>
                {tripTitle}
              </Text>
            ) : null}

            <Pressable
              onPress={() => canExpandPhoto && setPhotoExpanded(true)}
              disabled={!canExpandPhoto}
              accessibilityRole={canExpandPhoto ? 'button' : 'image'}
              accessibilityLabel={
                canExpandPhoto ? `${resolvedName} profile photo, tap to enlarge` : `${resolvedName} avatar`
              }
            >
              <MemberAvatar
                name={resolvedName}
                avatarUrl={resolvedAvatar}
                size={LARGE_AVATAR}
              />
            </Pressable>

            <Text style={styles.name}>{resolvedName}</Text>
            {email ? <Text style={styles.email}>{email}</Text> : null}
            <Text style={styles.role}>{roleLabel}</Text>

            {isSelf ? (
              <PremiumButton
                label="Edit profile"
                onPress={handleEditProfile}
                style={styles.editButton}
              />
            ) : null}

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close profile"
            >
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={photoExpanded}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoExpanded(false)}
      >
        <Pressable
          style={styles.fullscreenBackdrop}
          onPress={() => setPhotoExpanded(false)}
          accessibilityRole="button"
          accessibilityLabel="Close enlarged photo"
        >
          {resolvedAvatar ? (
            <Image
              source={{ uri: resolvedAvatar }}
              style={styles.fullscreenImage}
              contentFit="contain"
              accessibilityLabel={`${resolvedName} profile photo`}
            />
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  tripContext: {
    ...typography.caption,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  name: {
    ...typography.h3,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  email: {
    ...typography.body,
    color: colors.secondary,
    textAlign: 'center',
  },
  role: {
    ...typography.caption,
    color: colors.gold,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  editButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  closeButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  closeLabel: {
    ...typography.label,
    color: colors.muted,
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
});
