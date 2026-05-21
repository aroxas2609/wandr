import { getCurrencySymbol } from '@/constants/currencies';

export interface Expense {
  amount: number;
  category: string;
  currency?: string;
}

export function formatMoney(amount: number, currency = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (symbol.length <= 2 && symbol !== currency) {
    return `${symbol}${formatted}`;
  }
  return `${currency} ${formatted}`;
}

export function calculateTotalExpenses(expenses: Expense[], currency = 'USD'): number {
  return expenses
    .filter((e) => (e.currency ?? 'USD') === currency)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function totalsByCurrency(expenses: Expense[]): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, e) => {
    const code = e.currency ?? 'USD';
    acc[code] = (acc[code] ?? 0) + e.amount;
    return acc;
  }, {});
}

export function formatTotalsLine(totals: Record<string, number>): string {
  return Object.entries(totals)
    .map(([code, amount]) => formatMoney(amount, code))
    .join(' · ');
}

export function hasSingleCurrency(expenses: Expense[]): boolean {
  const codes = new Set(expenses.map((e) => e.currency ?? 'USD'));
  return codes.size <= 1;
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
