export type DocumentType =
  | 'boarding_pass'
  | 'ticket'
  | 'passport'
  | 'insurance'
  | 'reservation'
  | 'other';

export interface TravelDocument {
  id: string;
  tripId?: string;
  userId: string;
  type: DocumentType;
  title: string;
  fileUrl?: string;
  expiryDate?: string;
  createdAt: string;
}
