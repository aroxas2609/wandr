export interface Expense {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
}
