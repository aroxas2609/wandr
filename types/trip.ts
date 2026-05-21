import type { TravelStyle } from '@/constants/travelStyles';

export type TripStatus = 'upcoming' | 'active' | 'past' | 'draft' | 'archived';

export interface Trip {
  id: string;
  ownerId: string;
  title: string;
  destination: string;
  coverUrl?: string;
  startDate: string;
  endDate: string;
  budgetTarget?: number;
  travelStyles: TravelStyle[];
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TripMember {
  tripId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  fullName: string;
  avatarUrl?: string;
  /** Set when invite is sent but the person has not joined yet */
  status?: 'active' | 'pending';
  email?: string;
  inviteToken?: string;
}
