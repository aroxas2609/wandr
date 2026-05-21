import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import { generateId } from '@/lib/ids';
import { getSupabaseClient } from '@/services/supabase/client';
import { enqueue } from '@/services/sync/syncQueue';
import { computeEqualSplits } from '@/utils/splitBalances';
import type { Expense, ExpenseSplit } from '@/types';
import type { ExpenseFormData } from '../schemas/expenseSchema';

function getLocalExpenses(): Expense[] {
  return getJson<Expense[]>(StorageKeys.expenses) ?? [];
}

function saveExpenses(expenses: Expense[]): void {
  setJson(StorageKeys.expenses, expenses);
}

function mapDbExpense(row: Record<string, unknown>): Expense {
  const splitsRaw = row.expense_splits as { user_id: string; amount: number }[] | undefined;
  const splits: ExpenseSplit[] | undefined = splitsRaw?.map((s) => ({
    userId: s.user_id,
    amount: Number(s.amount),
  }));

  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    userId: row.user_id as string,
    paidByUserId: (row.paid_by_user_id as string) ?? (row.user_id as string),
    title: row.title as string,
    amount: Number(row.amount),
    currency: (row.currency as string) ?? 'USD',
    category: row.category as string,
    date: row.date as string,
    notes: row.notes as string | undefined,
    splits,
    createdAt: row.created_at as string,
  };
}

function mapExpenseToDb(expense: Expense) {
  return {
    id: expense.id,
    trip_id: expense.tripId,
    user_id: expense.userId,
    paid_by_user_id: expense.paidByUserId,
    title: expense.title,
    amount: expense.amount,
    currency: expense.currency,
    category: expense.category,
    date: expense.date,
    notes: expense.notes,
  };
}

export async function fetchExpenses(tripId: string): Promise<Expense[]> {
  const client = getSupabaseClient();
  if (!client) {
    return getLocalExpenses().filter((e) => e.tripId === tripId);
  }

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    return getLocalExpenses().filter((e) => e.tripId === tripId);
  }

  const { data, error } = await client
    .from('expenses')
    .select('*, expense_splits(user_id, amount)')
    .eq('trip_id', tripId)
    .order('date', { ascending: false });
  if (error) throw error;

  const expenses = (data ?? []).map(mapDbExpense);
  if (expenses.length > 0) {
    const all = getLocalExpenses().filter((e) => e.tripId !== tripId);
    saveExpenses([...all, ...expenses]);
  }
  return expenses;
}

export async function createExpense(
  tripId: string,
  userId: string,
  form: ExpenseFormData
): Promise<Expense> {
  const amount = parseFloat(form.amount);
  const paidByUserId = form.paidByUserId ?? userId;
  const participantIds =
    form.splitWithUserIds && form.splitWithUserIds.length > 0
      ? form.splitWithUserIds
      : [paidByUserId];
  const splitRows = computeEqualSplits(amount, participantIds);

  const expense: Expense = {
    id: generateId(),
    tripId,
    userId,
    paidByUserId,
    title: form.title,
    amount,
    currency: form.currency ?? 'USD',
    category: form.category,
    date: form.date,
    notes: form.notes,
    splits: splitRows,
    createdAt: new Date().toISOString(),
  };

  const expenses = [...getLocalExpenses(), expense];
  saveExpenses(expenses);

  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('expenses').insert(mapExpenseToDb(expense));
    if (error) throw error;

    if (splitRows.length > 0) {
      const { error: splitError } = await client.from('expense_splits').insert(
        splitRows.map((s) => ({
          expense_id: expense.id,
          user_id: s.userId,
          amount: s.amount,
        }))
      );
      if (splitError) throw splitError;
    }
  } else {
    enqueue('insert', 'expenses', expense as unknown as Record<string, unknown>);
  }

  return expense;
}

export async function deleteExpense(id: string): Promise<void> {
  saveExpenses(getLocalExpenses().filter((e) => e.id !== id));

  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('expenses').delete().eq('id', id);
    if (error) throw error;
  } else {
    enqueue('delete', 'expenses', { id });
  }
}
