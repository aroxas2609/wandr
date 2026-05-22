import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import type { TripMessage } from '@/types';

type ChatLastReadMap = Record<string, string>;

function mapKey(userId: string, tripId: string): string {
  return `${userId}:${tripId}`;
}

function readMap(): ChatLastReadMap {
  return getJson<ChatLastReadMap>(StorageKeys.chatLastRead) ?? {};
}

export function getChatLastReadAt(tripId: string, userId: string): string | null {
  return readMap()[mapKey(userId, tripId)] ?? null;
}

export function setChatLastReadAt(
  tripId: string,
  userId: string,
  readAt: string
): void {
  const map = readMap();
  map[mapKey(userId, tripId)] = readAt;
  setJson(StorageKeys.chatLastRead, map);
}

/** Messages from others after last read (or all from others if never opened chat). */
export function countUnreadChatMessages(
  messages: TripMessage[],
  userId: string,
  lastReadAt: string | null
): number {
  if (!userId) return 0;
  return messages.filter(
    (m) => m.userId !== userId && (!lastReadAt || m.createdAt > lastReadAt)
  ).length;
}

/** Mark chat read through the latest message timestamp (or now if empty). */
export function readAtFromMessages(messages: TripMessage[]): string {
  if (messages.length === 0) return new Date().toISOString();
  return messages.reduce((latest, m) =>
    m.createdAt > latest ? m.createdAt : latest
  , messages[0].createdAt);
}
