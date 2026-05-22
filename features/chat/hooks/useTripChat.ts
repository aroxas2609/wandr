import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTripMessages, sendTripMessage } from '../services/chatService';

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
