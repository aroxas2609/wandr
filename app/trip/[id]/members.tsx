import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { buildTripJoinUrl } from '@/lib/tripInviteLink';
import {
  ScreenHeader,
  GlassCard,
  FormInput,
  PremiumButton,
  AvatarStack,
  DeleteIconButton,
  TagChip,
} from '@/components';
import { useTrip, useTripMembers } from '@/features/trips/hooks/useTrips';
import { inviteMemberByEmail, removeMember } from '@/features/collaboration/services/memberService';
import { useAuthStore } from '@/stores/authStore';
import { confirmAction } from '@/lib/confirm';
import { getErrorMessage } from '@/lib/errors';
import { showAppMessage } from '@/stores/appMessageStore';
import { colors, typography, spacing } from '@/theme';

type InviteFeedback =
  | { status: 'existing'; email: string; token: string }
  | { status: 'pending'; email: string; token: string }
  | { status: 'error'; message: string };

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: trip } = useTrip(id);
  const { data: members = [], refetch } = useTripMembers(id);
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState<InviteFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');

  const isOwner = trip?.ownerId === user?.id;
  const displayName = (m: (typeof members)[number]) =>
    user?.id === m.userId && user.fullName && user.fullName !== 'Traveler'
      ? user.fullName
      : m.fullName;
  const memberNames = members.map(displayName);
  const pendingInvites = members.filter(
    (m) => m.status === 'pending' && m.inviteToken
  );
  const latestInviteToken =
    feedback && feedback.status !== 'error' ? feedback.token : null;

  const shareInviteForToken = async (token: string, inviteeEmail?: string) => {
    if (!trip) return;
    const joinUrl = buildTripJoinUrl(token);
    const who = inviteeEmail ? ` (${inviteeEmail})` : '';
    await Share.share({
      message: `Join my trip "${trip.title}" on Wandr${who}.\n\nTap to join: ${joinUrl}\n\nOr use code: ${token}`,
      url: joinUrl,
    });
  };

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const { inviteToken: token, addedToTrip } = await inviteMemberByEmail(
        id,
        email.trim(),
        inviteRole,
        user?.id
      );
      await refetch();
      const invited = email.trim();
      setEmail('');

      const nextFeedback: InviteFeedback = addedToTrip
        ? { status: 'existing', email: invited, token }
        : { status: 'pending', email: invited, token };
      setFeedback(nextFeedback);

      showAppMessage(
        addedToTrip ? 'Added to trip' : 'Invite sent',
        addedToTrip
          ? `${invited} has a Wandr account and can open this trip now.`
          : `${invited} is not on Wandr yet. Share the invite code with them.`
      );
    } catch (e) {
      const message = getErrorMessage(e, undefined, 'trip-invite');
      if (__DEV__) console.warn('[Wandr] invite failed:', e);
      setFeedback({ status: 'error', message });
      showAppMessage('Invite failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (member: (typeof members)[number]) => {
    const title = member.status === 'pending' ? 'Remove invite?' : 'Remove member?';
    confirmAction(title, displayName(member), {
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        try {
          await removeMember(id, member.userId, member.email);
          await refetch();
          if (
            member.email &&
            feedback &&
            feedback.status !== 'error' &&
            feedback.email === member.email
          ) {
            setFeedback(null);
          }
        } catch (e) {
          const message = getErrorMessage(e, undefined, 'trip-members');
          if (__DEV__) console.warn('[Wandr] remove failed:', e);
          setFeedback({ status: 'error', message });
          showAppMessage('Remove failed', message);
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Travelers"
        showBack
        backHref={`/trip/${id}`}
        subtitle={trip?.title}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.card}>
          <Text style={styles.label}>TRAVELERS</Text>
          <AvatarStack names={memberNames} />
          {members.map((m) => (
            <View key={m.userId} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{displayName(m)}</Text>
                <Text style={styles.role}>
                  {m.status === 'pending' ? 'Pending invite' : m.role}
                  {m.status === 'pending' && m.inviteToken ? ` · ${m.inviteToken}` : ''}
                </Text>
              </View>
              <View style={styles.memberActions}>
                {isOwner && m.status === 'pending' && m.inviteToken ? (
                  <Pressable
                    onPress={() => void shareInviteForToken(m.inviteToken!, m.email)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Share invite link for ${displayName(m)}`}
                  >
                    <Text style={styles.link}>Share</Text>
                  </Pressable>
                ) : null}
                {isOwner && m.role !== 'owner' ? (
                  <DeleteIconButton
                    onPress={() => handleRemoveMember(m)}
                    accessibilityLabel={
                      m.status === 'pending'
                        ? `Remove invite for ${displayName(m)}`
                        : `Remove ${displayName(m)}`
                    }
                  />
                ) : null}
              </View>
            </View>
          ))}
        </GlassCard>

        {isOwner && pendingInvites.length > 0 && (
          <GlassCard style={styles.card}>
            <Text style={styles.sectionTitle}>Share invite links</Text>
            <Text style={styles.shareHint}>
              Wandr does not email invites automatically. Copy or share each link with the
              person you invited.
            </Text>
            {pendingInvites.map((m) => {
              const token = m.inviteToken!;
              const joinUrl = buildTripJoinUrl(token);
              return (
                <View key={m.userId} style={styles.pendingShareBlock}>
                  <Text style={styles.pendingEmail}>{m.email ?? displayName(m)}</Text>
                  <Text style={styles.pendingCode}>Code: {token}</Text>
                  <Text style={styles.pendingUrl} selectable>
                    {joinUrl}
                  </Text>
                  <Pressable
                    onPress={() => void shareInviteForToken(token, m.email)}
                    accessibilityRole="button"
                    accessibilityLabel={`Share join link for ${m.email ?? displayName(m)}`}
                  >
                    <Text style={styles.shareButton}>Share link</Text>
                  </Pressable>
                </View>
              );
            })}
          </GlassCard>
        )}

        {isOwner && (
          <GlassCard style={styles.card}>
            <Text style={styles.sectionTitle}>Invite by email</Text>
            <Text style={styles.roleLabel}>Role</Text>
            <View style={styles.roleRow}>
              <TagChip
                label="Editor"
                selected={inviteRole === 'editor'}
                onPress={() => setInviteRole('editor')}
              />
              <TagChip
                label="Viewer"
                selected={inviteRole === 'viewer'}
                onPress={() => setInviteRole('viewer')}
              />
            </View>
            <FormInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="friend@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <PremiumButton label="Send invite" onPress={handleInvite} loading={loading} />

            {feedback?.status === 'existing' && (
              <View style={[styles.feedbackBox, styles.feedbackSuccess]}>
                <Text style={styles.feedbackTitle}>Added to trip</Text>
                <Text style={styles.feedbackBody}>
                  {feedback.email} already has a Wandr account and can open &quot;{trip?.title}&quot;
                  from their trips list.
                </Text>
              </View>
            )}

            {feedback?.status === 'pending' && (
              <View style={[styles.feedbackBox, styles.feedbackPending]}>
                <Text style={styles.feedbackTitle}>Invite created</Text>
                <Text style={styles.feedbackBody}>
                  {feedback.email} is not on Wandr yet. They appear below as &quot;Pending invite&quot;.
                  Share the code so they can sign up and join. Email is not sent automatically.
                </Text>
              </View>
            )}

            {feedback?.status === 'error' && (
              <View style={[styles.feedbackBox, styles.feedbackError]}>
                <Text style={styles.feedbackTitle}>Invite failed</Text>
                <Text style={styles.feedbackBody}>{feedback.message}</Text>
              </View>
            )}

            {latestInviteToken && feedback?.status === 'pending' && (
              <View style={styles.inviteBox}>
                <Text style={styles.inviteCode}>Code: {latestInviteToken}</Text>
                <Text style={styles.pendingUrl} selectable>
                  {buildTripJoinUrl(latestInviteToken)}
                </Text>
                <Pressable
                  onPress={() => void shareInviteForToken(latestInviteToken, feedback.email)}
                >
                  <Text style={styles.link}>Share link</Text>
                </Pressable>
              </View>
            )}
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  card: { marginBottom: spacing.lg },
  label: { ...typography.overline, marginBottom: spacing.md },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    gap: spacing.sm,
  },
  memberInfo: { flex: 1, minWidth: 0 },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberName: { ...typography.label, color: colors.primary },
  role: { ...typography.caption, textTransform: 'capitalize' },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  roleLabel: { ...typography.label, marginBottom: spacing.sm },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  feedbackBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(129, 178, 154, 0.12)',
    borderColor: colors.sage,
  },
  feedbackPending: {
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    borderColor: colors.gold,
  },
  feedbackError: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderColor: colors.danger,
  },
  feedbackTitle: { ...typography.label, color: colors.primary },
  feedbackBody: { ...typography.caption, color: colors.secondary },
  shareHint: { ...typography.caption, marginBottom: spacing.md },
  pendingShareBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    gap: spacing.xs,
  },
  pendingEmail: { ...typography.label, color: colors.primary },
  pendingCode: { ...typography.caption, color: colors.gold },
  pendingUrl: {
    ...typography.caption,
    color: colors.secondary,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  shareButton: { ...typography.label, color: colors.gold },
  inviteBox: { marginTop: spacing.md, gap: spacing.sm },
  inviteCode: { ...typography.label, color: colors.gold },
  link: { ...typography.caption, color: colors.gold },
});
