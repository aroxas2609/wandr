export type NotificationType =
  | 'member_joined'
  | 'chat_message'
  | 'trip_update';

export interface NotificationData {
  tripId?: string;
  path?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  tripId?: string;
  title: string;
  body?: string;
  type?: NotificationType;
  data?: NotificationData;
  read: boolean;
  createdAt: string;
}
