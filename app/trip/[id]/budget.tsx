import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ScreenHeader,
  GlassCard,
  BudgetProgressBar,
  FormInput,
  DatePickerField,
  PremiumButton,
  TagChip,
  FloatingActionButton,
  DeleteIconButton,
} from '@/components';
import { useTrip } from '@/features/trips/hooks/useTrips';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/features/budget/hooks/useExpenses';
import { expenseSchema, type ExpenseFormData } from '@/features/budget/schemas/expenseSchema';
import { useAuthStore } from '@/stores/authStore';
import { EXPENSE_CATEGORIES } from '@/constants/expenseCategories';
import { calculateTotalExpenses, groupExpensesByCategory } from '@/utils/budget';
import { dateToIso, formatTripDate } from '@/utils/dates';
import { TestIds } from '@/constants/testIds';
import { sanitizeDecimalInput } from '@/lib/decimalInput';
import { getErrorMessage } from '@/lib/errors';
import { confirmDelete } from '@/lib/confirm';
import { colors, typography, spacing } from '@/theme';

export default function BudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: trip } = useTrip(id);
  const { data: expenses = [] } = useExpenses(id);
  const createExpense = useCreateExpense(id);
  const deleteExpense = useDeleteExpense(id);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as never,
    defaultValues: {
      title: '',
      amount: '',
      currency: 'USD',
      category: 'Food',
      date: dateToIso(new Date()),
      notes: '',
    },
  });

  const spent = calculateTotalExpenses(expenses);
  const byCategory = groupExpensesByCategory(expenses);
  const target = trip?.budgetTarget ?? 0;

  const onSubmit = async (data: ExpenseFormData) => {
    setFormError('');
    if (!user) {
      setFormError('Sign in to add expenses.');
      return;
    }
    try {
      await createExpense.mutateAsync({ form: data, userId: user.id });
      reset();
      setShowForm(false);
    } catch (e) {
      setFormError(getErrorMessage(e, 'Could not add expense.'));
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Budget"
        showBack
        backHref={`/trip/${id}`}
        subtitle={trip?.title}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {target > 0 && <BudgetProgressBar spent={spent} target={target} />}
        {!target && (
          <GlassCard style={styles.card}>
            <Text style={styles.hint}>Set a budget target on the trip to track progress.</Text>
          </GlassCard>
        )}

        {showForm && (
          <GlassCard style={styles.card}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput label="Title" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.title?.message} />
              )}
            />
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Amount"
                  value={value ?? ''}
                  onChangeText={(t) => onChange(sanitizeDecimalInput(t))}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  error={errors.amount?.message}
                />
              )}
            />
            <Text style={styles.sectionLabel}>Category</Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <View style={styles.chips}>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <TagChip
                      key={cat}
                      label={cat}
                      selected={value === cat}
                      onPress={() => onChange(cat)}
                    />
                  ))}
                </View>
              )}
            />
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, value } }) => (
                <DatePickerField
                  label="Date"
                  value={value}
                  onChange={onChange}
                  error={errors.date?.message}
                  testID="expense-date-picker"
                />
              )}
            />
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <PremiumButton
              label="Add Expense"
              onPress={handleSubmit(onSubmit, () =>
                setFormError('Check the form — title and amount are required.')
              )}
              loading={createExpense.isPending}
              testID={TestIds.addExpenseButton}
            />
          </GlassCard>
        )}

        {Object.entries(byCategory).map(([category, total]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.categoryTitle}>
              {category} · ${total.toLocaleString()}
            </Text>
            {expenses
              .filter((e) => e.category === category)
              .map((expense) => (
                <GlassCard key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseRow}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseTitle}>{expense.title}</Text>
                      <Text style={styles.expenseMeta}>
                        {formatTripDate(expense.date)} · ${expense.amount.toLocaleString()}
                      </Text>
                    </View>
                    <DeleteIconButton
                      onPress={confirmDelete('Delete expense?', expense.title, () =>
                        deleteExpense.mutate(expense.id)
                      )}
                      accessibilityLabel={`Delete ${expense.title}`}
                    />
                  </View>
                </GlassCard>
              ))}
          </View>
        ))}

        {expenses.length === 0 && !showForm && (
          <Text style={styles.empty}>No expenses yet. Tap + to add one.</Text>
        )}
      </ScrollView>
      {!showForm && (
        <FloatingActionButton onPress={() => setShowForm(true)} testID={TestIds.addExpenseButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 120 },
  card: { marginBottom: spacing.lg },
  formError: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
  hint: { ...typography.body },
  sectionLabel: { ...typography.label, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  section: { marginBottom: spacing.lg },
  categoryTitle: { ...typography.h3, marginBottom: spacing.sm },
  expenseCard: { marginBottom: spacing.sm },
  expenseRow: { flexDirection: 'row', alignItems: 'center' },
  expenseInfo: { flex: 1 },
  expenseTitle: { ...typography.label, color: colors.primary },
  expenseMeta: { ...typography.caption, marginTop: 2 },
  empty: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
});
