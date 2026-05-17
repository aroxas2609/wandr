export interface PackingItem {
  id: string;
  tripId: string;
  name: string;
  category: string;
  packed: boolean;
  sortOrder: number;
  createdAt: string;
}
