import { notifyUser } from '@/features/notifications/services/createNotification';
import type { TripMember } from '@/types';

export async function notifyTripMembersOfChatMessage(params: {
  tripId: string;
  tripTitle: string;
  senderId: string;
  senderName: string;
  members: TripMember[];
  preview: string;
}): Promise<void> {
  const { tripId, tripTitle, senderId, senderName, members, preview } = params;
  const body =
    preview.length > 120 ? `${preview.slice(0, 117)}…` : preview;

  await Promise.all(
    members
      .filter((m) => m.status !== 'pending' && m.userId !== senderId && !m.userId.startsWith('pending-'))
      .map((m) =>
        notifyUser({
          userId: m.userId,
          tripId,
          title: `${senderName} in ${tripTitle}`,
          body,
          type: 'chat_message',
          data: { tripId, path: 'chat' },
        }).catch(() => undefined)
      )
  );
}
