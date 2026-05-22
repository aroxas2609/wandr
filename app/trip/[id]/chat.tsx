import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader, MemberAvatar } from '@/components';
import { useTrip } from '@/features/trips/hooks/useTrips';
import { useTripMembers } from '@/features/trips/hooks/useTrips';
import { useTripMessages, useSendTripMessage } from '@/features/chat/hooks/useTripChat';
import { markTripChatAsRead } from '@/features/chat/hooks/useUnreadChatCount';
import { notifyTripMembersOfChatMessage } from '@/features/chat/services/notifyChatMessage';
import { usePullToRefreshFeedback } from '@/hooks/usePullToRefreshFeedback';
import { useAuthStore } from '@/stores/authStore';
import { resolveMemberAvatar } from '@/lib/memberAvatar';
import { getErrorMessage } from '@/lib/errors';
import { showAppMessage } from '@/stores/appMessageStore';
import { colors, typography, spacing, radius } from '@/theme';
import type { TripMessage } from '@/types';
import { format } from 'date-fns';

export default function TripChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: trip } = useTrip(id);
  const { data: members = [] } = useTripMembers(id);
  const {
    data: messages = [],
    refetch,
    isRefetching,
  } = useTripMessages(id);
  const sendMessage = useSendTripMessage(id);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<TripMessage>>(null);

  useFocusEffect(
    useCallback(() => {
      if (id && user?.id) {
        markTripChatAsRead(queryClient, id, user.id, messages);
      }
    }, [id, user?.id, messages, queryClient])
  );

  const {
    setRefreshing,
    setRefreshHint,
    markSuccess,
    statusText: refreshStatusText,
    isBusy: isRefreshBusy,
  } = usePullToRefreshFeedback(isRefetching);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshHint(null);
    try {
      await refetch();
      markSuccess();
    } catch (e) {
      showAppMessage('Refresh failed', getErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  };

  const handleSend = async () => {
    if (!user?.id || !draft.trim() || !trip) return;
    const body = draft.trim();
    setDraft('');
    try {
      await sendMessage.mutateAsync({ userId: user.id, body });
      const senderName =
        user.fullName && user.fullName !== 'Traveler' ? user.fullName : 'Someone';
      void notifyTripMembersOfChatMessage({
        tripId: id,
        tripTitle: trip.title,
        senderId: user.id,
        senderName,
        members,
        preview: body,
      });
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    } catch (e) {
      setDraft(body);
      showAppMessage('Message failed', getErrorMessage(e));
    }
  };

  const renderItem = ({ item }: { item: TripMessage }) => {
    const isSelf = item.userId === user?.id;
    const member = members.find((m) => m.userId === item.userId);
    return (
      <View style={[styles.row, isSelf && styles.rowSelf]}>
        {!isSelf ? (
          <MemberAvatar
            name={item.authorName}
            avatarUrl={member ? resolveMemberAvatar(member, user) : item.authorAvatarUrl}
            size={32}
          />
        ) : null}
        <View style={[styles.bubble, isSelf ? styles.bubbleSelf : styles.bubbleOther]}>
          {!isSelf ? <Text style={styles.author}>{item.authorName}</Text> : null}
          <Text style={[styles.body, isSelf && styles.bodySelf]}>{item.body}</Text>
          <Text style={[styles.time, isSelf && styles.timeSelf]}>
            {format(new Date(item.createdAt), 'h:mm a')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <ScreenHeader
        title="Trip chat"
        showBack
        backHref={`/trip/${id}`}
        subtitle={trip?.title}
      />
      {refreshStatusText ? (
        <Text style={styles.refreshStatus} accessibilityLiveRegion="polite">
          {refreshStatusText}
        </Text>
      ) : null}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: spacing.md },
        ]}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshBusy}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Say hello to your travel group.</Text>
        }
      />
      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message the group…"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.sendBtn, (!draft.trim() || sendMessage.isPending) && styles.sendDisabled]}
          onPress={() => void handleSend()}
          disabled={!draft.trim() || sendMessage.isPending}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Ionicons name="send" size={20} color={colors.background} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  refreshStatus: {
    ...typography.caption,
    color: colors.gold,
    textAlign: 'right',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    flexGrow: 1,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.md,
    maxWidth: '88%',
  },
  rowSelf: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  bubble: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.sm,
    flexShrink: 1,
  },
  bubbleSelf: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  bubbleOther: {},
  author: {
    ...typography.caption,
    color: colors.gold,
    marginBottom: 2,
  },
  body: { ...typography.body, color: colors.primary },
  bodySelf: { color: colors.background },
  time: { ...typography.caption, color: colors.muted, marginTop: 4, fontSize: 11 },
  timeSelf: { color: 'rgba(13, 13, 15, 0.65)' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.primary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
});
