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
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader, MemberAvatar } from '@/components';
import { useTrip } from '@/features/trips/hooks/useTrips';
import { useTripMembers } from '@/features/trips/hooks/useTrips';
import {
  useTripMessages,
  useSendTripMessage,
  useUpdateTripMessage,
  useDeleteTripMessage,
} from '@/features/chat/hooks/useTripChat';
import { markTripChatAsRead } from '@/features/chat/hooks/useUnreadChatCount';
import { notifyTripMembersOfChatMessage } from '@/features/chat/services/notifyChatMessage';
import { usePullToRefreshFeedback } from '@/hooks/usePullToRefreshFeedback';
import { useAuthStore } from '@/stores/authStore';
import { resolveMemberAvatar } from '@/lib/memberAvatar';
import { confirmAction } from '@/lib/confirm';
import { getErrorMessage } from '@/lib/errors';
import { showAppMessage } from '@/stores/appMessageStore';
import { colors, typography, spacing, radius } from '@/theme';
import type { TripMessage } from '@/types';
import { format } from 'date-fns';

function isEdited(message: TripMessage): boolean {
  return !!message.updatedAt && message.updatedAt > message.createdAt;
}

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
  const updateMessage = useUpdateTripMessage(id);
  const deleteMessage = useDeleteTripMessage(id);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuMessage, setMenuMessage] = useState<TripMessage | null>(null);
  const listRef = useRef<FlatList<TripMessage>>(null);

  const isEditing = editingId !== null;
  const isComposerBusy =
    sendMessage.isPending || updateMessage.isPending || deleteMessage.isPending;

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

  const cancelEdit = () => {
    setEditingId(null);
    setDraft('');
  };

  const startEdit = (message: TripMessage) => {
    setEditingId(message.id);
    setDraft(message.body);
  };

  const showMessageMenu = (message: TripMessage) => {
    if (message.userId !== user?.id) return;
    setMenuMessage(message);
  };

  const closeMessageMenu = () => setMenuMessage(null);

  const handleMenuEdit = () => {
    if (!menuMessage) return;
    startEdit(menuMessage);
    closeMessageMenu();
  };

  const handleMenuDelete = () => {
    if (!menuMessage) return;
    const target = menuMessage;
    closeMessageMenu();
    confirmDeleteMessage(target);
  };

  const confirmDeleteMessage = (message: TripMessage) => {
    confirmAction('Delete message?', 'This cannot be undone.', {
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        if (!user?.id) return;
        try {
          await deleteMessage.mutateAsync({
            messageId: message.id,
            userId: user.id,
          });
          if (editingId === message.id) cancelEdit();
        } catch (e) {
          showAppMessage('Delete failed', getErrorMessage(e));
        }
      },
    });
  };

  const saveEdit = async (messageId: string, body: string) => {
    if (!user?.id) return;
    try {
      await updateMessage.mutateAsync({ messageId, userId: user.id, body });
      cancelEdit();
    } catch (e) {
      showAppMessage('Update failed', getErrorMessage(e));
    }
  };

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

  const handleComposerSubmit = async () => {
    if (!user?.id || !draft.trim() || !trip) return;
    const body = draft.trim();

    if (isEditing && editingId) {
      await saveEdit(editingId, body);
      return;
    }

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
    const edited = isEdited(item);

    const bubble = (
      <Pressable
        style={[styles.bubble, isSelf ? styles.bubbleSelf : styles.bubbleOther]}
        onLongPress={isSelf ? () => showMessageMenu(item) : undefined}
        delayLongPress={400}
        accessibilityRole={isSelf ? 'button' : 'text'}
        accessibilityLabel={
          isSelf
            ? `Your message: ${item.body}. Tap ⋯ or long press to edit or delete.`
            : `${item.authorName}: ${item.body}`
        }
      >
        {isSelf ? (
          <Pressable
            style={styles.messageMenuBtn}
            onPress={() => showMessageMenu(item)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Message options"
          >
            <View style={styles.messageMenuIcon}>
              <Ionicons
                name="ellipsis-horizontal"
                size={14}
                color={colors.background}
              />
            </View>
          </Pressable>
        ) : null}
        {!isSelf ? <Text style={styles.author}>{item.authorName}</Text> : null}
        <Text style={[styles.body, isSelf && styles.bodySelf, isSelf && styles.bodyWithMenu]}>
          {item.body}
        </Text>
        <Text style={[styles.time, isSelf && styles.timeSelf]}>
          {format(new Date(item.createdAt), 'h:mm a')}
          {edited ? ' · edited' : ''}
        </Text>
      </Pressable>
    );

    return (
      <View style={[styles.row, isSelf && styles.rowSelf]}>
        {!isSelf ? (
          <MemberAvatar
            name={item.authorName}
            avatarUrl={member ? resolveMemberAvatar(member, user) : item.authorAvatarUrl}
            size={32}
          />
        ) : null}
        {bubble}
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
        contentContainerStyle={[styles.list, { paddingBottom: spacing.md }]}
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
        {isEditing ? (
          <View style={styles.editBar}>
            <Text style={styles.editBarText}>Editing message</Text>
            <Pressable
              onPress={cancelEdit}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cancel edit"
            >
              <Ionicons name="close-circle" size={22} color={colors.muted} />
            </Pressable>
          </View>
        ) : null}
        <View style={styles.composerRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={isEditing ? 'Edit your message…' : 'Message the group…'}
            placeholderTextColor={colors.muted}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!draft.trim() || isComposerBusy) && styles.sendDisabled,
            ]}
            onPress={() => void handleComposerSubmit()}
            disabled={!draft.trim() || isComposerBusy}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Save edit' : 'Send message'}
          >
            <Ionicons
              name={isEditing ? 'checkmark' : 'send'}
              size={20}
              color={colors.background}
            />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={menuMessage !== null}
        transparent
        animationType="fade"
        onRequestClose={closeMessageMenu}
      >
        <Pressable style={styles.menuBackdrop} onPress={closeMessageMenu}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle}>Your message</Text>
            <Pressable style={styles.menuAction} onPress={handleMenuEdit}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={styles.menuActionText}>Edit</Text>
            </Pressable>
            <Pressable style={[styles.menuAction, styles.menuActionDanger]} onPress={handleMenuDelete}>
              <Ionicons name="trash-outline" size={20} color="#E57373" />
              <Text style={[styles.menuActionText, styles.menuActionDangerText]}>Delete</Text>
            </Pressable>
            <Pressable style={styles.menuCancel} onPress={closeMessageMenu}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    position: 'relative',
  },
  messageMenuBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  messageMenuIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(13, 13, 15, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  bodyWithMenu: { paddingRight: spacing.lg },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  menuSheet: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  menuTitle: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  menuAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  menuActionDanger: {},
  menuActionText: { ...typography.body, color: colors.primary },
  menuActionDangerText: { color: '#E57373' },
  menuCancel: {
    marginTop: spacing.xs,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  menuCancelText: { ...typography.body, color: colors.muted },
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    backgroundColor: colors.background,
  },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  editBarText: {
    ...typography.caption,
    color: colors.gold,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
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
