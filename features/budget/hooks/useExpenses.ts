import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchExpenses, createExpense, deleteExpense } from '../services/expenseService';
import type { ExpenseFormData } from '../schemas/expenseSchema';

export const expenseKeys = {
  trip: (tripId: string) => ['expenses', tripId] as const,
};

export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: expenseKeys.trip(tripId),
    queryFn: () => fetchExpenses(tripId),
    enabled: !!tripId,
  });
}

export function useCreateExpense(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ form, userId }: { form: ExpenseFormData; userId: string }) =>
      createExpense(tripId, userId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.trip(tripId) });
    },
  });
}

export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.trip(tripId) });
    },
  });
}
