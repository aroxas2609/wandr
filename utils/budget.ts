export interface Expense {
  amount: number;
  category: string;
}

export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function calculateBudgetProgress(
  spent: number,
  target: number
): { percentage: number; remaining: number; isOver: boolean } {
  if (target <= 0) {
    return { percentage: 0, remaining: 0, isOver: false };
  }
  const percentage = Math.min(100, Math.round((spent / target) * 100));
  const remaining = Math.max(0, target - spent);
  return { percentage, remaining, isOver: spent > target };
}

export function groupExpensesByCategory(
  expenses: Expense[]
): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
}
