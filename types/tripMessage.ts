export interface TripMessage {
  id: string;
  tripId: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  authorName: string;
  authorAvatarUrl?: string;
}
