import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Share, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  ScreenHeader,
  GlassCard,
  FormInput,
  PremiumButton,
  AvatarStack,
  DeleteIconButton,
} from '@/components';
import { useTrip, useTripMembers } from '@/features/trips/hooks/useTrips';
import { inviteMemberByEmail, removeMember } from '@/features/collaboration/services/memberService';
import { useAuthStore } from '@/stores/authStore';
import { confirmAction } from '@/lib/confirm';
import { getErrorMessage } from '@/lib/errors';
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

  const isOwner = trip?.ownerId === user?.id;
  const memberNames = members.map((m) => m.fullName);
  const inviteToken =
    feedback && feedback.status !== 'error' ? feedback.token : null;

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const { inviteToken: token, addedToTrip } = await inviteMemberByEmail(
        id,
        email.trim(),
        'editor',
        user?.id
      );
      await refetch();
      const invited = email.trim();
      setEmail('');

      const nextFeedback: InviteFeedback = addedToTrip
        ? { status: 'existing', email: invited, token }
        : { status: 'pending', email: invited, token };
      setFeedback(nextFeedback);

      if (Platform.OS !== 'web') {
        Alert.alert(
          addedToTrip ? 'Added to trip' : 'Invite sent',
          addedToTrip
            ? `${invited} has a Wandr account and can open this trip now.`
            : `${invited} is not on Wandr yet. Share the invite code with them.`
        );
      }
    } catch (e) {
      const message = getErrorMessage(e, undefined, 'trip-invite');
      if (__DEV__) console.warn('[Wandr] invite failed:', e);
      setFeedback({ status: 'error', message });
      if (Platform.OS !== 'web') {
        Alert.alert('Invite failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const shareInvite = async () => {
    if (!inviteToken || !trip) return;
    await Share.share({
      message: `Join my trip "${trip.title}" on Wandr. Code: ${inviteToken}`,
    });
  };

  const handleRemoveMember = (member: (typeof members)[number]) => {
    const title = member.status === 'pending' ? 'Remove invite?' : 'Remove member?';
    confirmAction(title, member.fullName, {
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
          if (Platform.OS !== 'web') {
            Alert.alert('Remove failed', message);
          }
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
              <View>
                <Text style={styles.memberName}>{m.fullName}</Text>
                <Text style={styles.role}>
                  {m.status === 'pending' ? 'Pending invite' : m.role}
                  {m.status === 'pending' && m.inviteToken ? ` · ${m.inviteToken}` : ''}
                </Text>
              </View>
              {isOwner && m.role !== 'owner' && (
                <DeleteIconButton
                  onPress={() => handleRemoveMember(m)}
                  accessibilityLabel={
                    m.status === 'pending'
                      ? `Remove invite for ${m.fullName}`
                      : `Remove ${m.fullName}`
                  }
                />
              )}
            </View>
          ))}
        </GlassCard>

        {isOwner && (
          <GlassCard style={styles.card}>
            <Text style={styles.sectionTitle}>Invite by email</Text>
            <FormInput
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setFeedback(null);
              }}
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

            {inviteToken && (
              <View style={styles.inviteBox}>
                <Text style={styles.inviteCode}>Code: {inviteToken}</Text>
                <Pressable onPress={shareInvite}>
                  <Text style={styles.link}>Share code</Text>
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
  },
  memberName: { ...typography.label, color: colors.primary },
  role: { ...typography.caption, textTransform: 'capitalize' },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
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
  inviteBox: { marginTop: spacing.md, gap: spacing.sm },
  inviteCode: { ...typography.label, color: colors.gold },
  link: { ...typography.caption, color: colors.gold },
});
