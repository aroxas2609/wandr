import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteTripMessage,
  fetchTripMessages,
  sendTripMessage,
  updateTripMessage,
} from '../services/chatService';

export const chatKeys = {
  trip: (tripId: string) => ['trip-chat', tripId] as const,
};

export function useTripMessages(tripId: string) {
  return useQuery({
    queryKey: chatKeys.trip(tripId),
    queryFn: () => fetchTripMessages(tripId),
    enabled: !!tripId,
  });
}

export function useSendTripMessage(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: string }) =>
      sendTripMessage(tripId, userId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.trip(tripId) });
    },
  });
}

export function useUpdateTripMessage(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      userId,
      body,
    }: {
      messageId: string;
      userId: string;
      body: string;
    }) => updateTripMessage(messageId, userId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.trip(tripId) });
    },
  });
}

export function useDeleteTripMessage(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, userId }: { messageId: string; userId: string }) =>
      deleteTripMessage(messageId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.trip(tripId) });
    },
  });
}
