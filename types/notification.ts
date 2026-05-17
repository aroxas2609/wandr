export interface AppNotification {
  id: string;
  userId: string;
  tripId?: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
}
