export interface ExpenseSplit {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  tripId: string;
  userId: string;
  paidByUserId: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  notes?: string;
  splits?: ExpenseSplit[];
  createdAt: string;
}
