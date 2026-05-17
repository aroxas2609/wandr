import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import { generateId } from '@/lib/ids';
import { getSupabaseClient } from '@/services/supabase/client';
import { enqueue } from '@/services/sync/syncQueue';
import type { Expense } from '@/types';
import type { ExpenseFormData } from '../schemas/expenseSchema';

function getLocalExpenses(): Expense[] {
  return getJson<Expense[]>(StorageKeys.expenses) ?? [];
}

function saveExpenses(expenses: Expense[]): void {
  setJson(StorageKeys.expenses, expenses);
}

function mapDbExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    userId: row.user_id as string,
    title: row.title as string,
    amount: Number(row.amount),
    currency: (row.currency as string) ?? 'USD',
    category: row.category as string,
    date: row.date as string,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapExpenseToDb(expense: Expense) {
  return {
    id: expense.id,
    trip_id: expense.tripId,
    user_id: expense.userId,
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
    .select('*')
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
  const expense: Expense = {
    id: generateId(),
    tripId,
    userId,
    title: form.title,
    amount: parseFloat(form.amount),
    currency: form.currency ?? 'USD',
    category: form.category,
    date: form.date,
    notes: form.notes,
    createdAt: new Date().toISOString(),
  };

  const expenses = [...getLocalExpenses(), expense];
  saveExpenses(expenses);

  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('expenses').insert(mapExpenseToDb(expense));
    if (error) throw error;
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
