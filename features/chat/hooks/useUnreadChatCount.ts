import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTripMessages } from './useTripChat';
import {
  countUnreadChatMessages,
  getChatLastReadAt,
  setChatLastReadAt,
  readAtFromMessages,
} from '../lib/chatReadState';
import { useAuthStore } from '@/stores/authStore';
import type { TripMessage } from '@/types';

export const chatReadKeys = {
  lastRead: (tripId: string, userId: string) =>
    ['chat-last-read', tripId, userId] as const,
};

export function useUnreadChatCount(tripId: string): number {
  const userId = useAuthStore((s) => s.user?.id) ?? '';
  const { data: messages = [] } = useTripMessages(tripId);
  const { data: lastReadAt = null } = useQuery({
    queryKey: chatReadKeys.lastRead(tripId, userId),
    queryFn: () => getChatLastReadAt(tripId, userId),
    enabled: !!tripId && !!userId,
  });

  return countUnreadChatMessages(messages, userId, lastReadAt);
}

export function markTripChatAsRead(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId: string,
  userId: string,
  messages: TripMessage[]
): void {
  if (!tripId || !userId) return;
  const readAt = readAtFromMessages(messages);
  setChatLastReadAt(tripId, userId, readAt);
  queryClient.setQueryData(chatReadKeys.lastRead(tripId, userId), readAt);
}
