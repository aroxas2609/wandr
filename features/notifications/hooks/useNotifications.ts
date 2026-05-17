import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markNotificationRead } from '../services/notificationService';

export const notificationKeys = {
  user: (userId: string) => ['notifications', userId] as const,
};

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: notificationKeys.user(userId),
    queryFn: () => fetchNotifications(userId),
    enabled: !!userId,
  });
}

export function useMarkNotificationRead(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.user(userId) });
    },
  });
}
