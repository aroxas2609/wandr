export interface TripMessage {
  id: string;
  tripId: string;
  userId: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorAvatarUrl?: string;
}
