import {
  calculateTotalExpenses,
  calculateBudgetProgress,
  groupExpensesByCategory,
} from '@/utils/budget';

describe('budget utils', () => {
  const expenses = [
    { amount: 100, category: 'Food' },
    { amount: 200, category: 'Transport' },
    { amount: 50, category: 'Food' },
  ];

  it('calculates total', () => {
    expect(calculateTotalExpenses(expenses)).toBe(350);
  });

  it('calculates budget progress', () => {
    const progress = calculateBudgetProgress(350, 1000);
    expect(progress.percentage).toBe(35);
    expect(progress.remaining).toBe(650);
    expect(progress.isOver).toBe(false);
  });

  it('groups by category', () => {
    const grouped = groupExpensesByCategory(expenses);
    expect(grouped.Food).toBe(150);
    expect(grouped.Transport).toBe(200);
  });
});
