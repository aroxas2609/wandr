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
  ViewOnlyBanner,
} from '@/components';
import { useTripAccess } from '@/hooks/useTripAccess';
import { useTrip, useTripMembers } from '@/features/trips/hooks/useTrips';
import { resolveMemberDisplayName } from '@/lib/memberDisplayName';
import { computeBalances, formatBalanceLabel, type ExpenseSplitInput } from '@/utils/splitBalances';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/features/budget/hooks/useExpenses';
import { expenseSchema, type ExpenseFormData } from '@/features/budget/schemas/expenseSchema';
import { useAuthStore } from '@/stores/authStore';
import { EXPENSE_CATEGORIES } from '@/constants/expenseCategories';
import {
  calculateTotalExpenses,
  groupExpensesByCategory,
  totalsByCurrency,
  formatMoney,
  formatTotalsLine,
  hasSingleCurrency,
} from '@/utils/budget';
import { TRIP_CURRENCIES } from '@/constants/currencies';
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
  const { data: members = [] } = useTripMembers(id);
  const { data: expenses = [] } = useExpenses(id);
  const activeMembers = members.filter((m) => m.status !== 'pending' && !m.userId.startsWith('pending-'));
  const { canEdit, isViewer } = useTripAccess(id);
  const createExpense = useCreateExpense(id);
  const deleteExpense = useDeleteExpense(id);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');

  const defaultParticipantIds = activeMembers.map((m) => m.userId);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as never,
    defaultValues: {
      title: '',
      amount: '',
      currency: 'USD',
      category: 'Food',
      date: dateToIso(new Date()),
      notes: '',
      paidByUserId: user?.id,
      splitWithUserIds: defaultParticipantIds,
    },
  });

  const paidByUserId = watch('paidByUserId');
  const splitWithUserIds = watch('splitWithUserIds') ?? [];

  const splitInputs: ExpenseSplitInput[] = expenses.map((e) => ({
    paidByUserId: e.paidByUserId,
    amount: e.amount,
    participantIds: e.splits?.map((s) => s.userId) ?? [e.paidByUserId],
  }));
  const balances = computeBalances(
    splitInputs,
    activeMembers.map((m) => ({
      userId: m.userId,
      fullName: resolveMemberDisplayName({ fullName: m.fullName, email: m.email }),
    }))
  );

  const currencyTotals = totalsByCurrency(expenses);
  const singleCurrency = hasSingleCurrency(expenses);
  const primaryCurrency = Object.keys(currencyTotals)[0] ?? 'USD';
  const spent = calculateTotalExpenses(expenses, primaryCurrency);
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
        {isViewer ? <ViewOnlyBanner /> : null}
        {target > 0 && singleCurrency && (
          <BudgetProgressBar spent={spent} target={target} />
        )}
        {!singleCurrency && expenses.length > 0 && (
          <GlassCard style={styles.card}>
            <Text style={styles.hint}>Spent: {formatTotalsLine(currencyTotals)}</Text>
          </GlassCard>
        )}
        {!target && (
          <GlassCard style={styles.card}>
            <Text style={styles.hint}>Set a budget target on the trip to track progress.</Text>
          </GlassCard>
        )}

        {activeMembers.length > 1 && expenses.length > 0 && (
          <GlassCard style={styles.card}>
            <Text style={styles.sectionLabel}>Settle up</Text>
            {activeMembers.map((m) => (
              <View key={m.userId} style={styles.balanceRow}>
                <Text style={styles.balanceName}>
                  {resolveMemberDisplayName({ fullName: m.fullName, email: m.email })}
                </Text>
                <Text style={styles.balanceAmount}>
                  {formatBalanceLabel(balances[m.userId] ?? 0)}
                </Text>
              </View>
            ))}
          </GlassCard>
        )}

        {showForm && canEdit && (
          <GlassCard style={styles.card}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput label="Title" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.title?.message} />
              )}
            />
            {activeMembers.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Paid by</Text>
                <View style={styles.chips}>
                  {activeMembers.map((m) => (
                    <TagChip
                      key={m.userId}
                      label={resolveMemberDisplayName({ fullName: m.fullName, email: m.email })}
                      selected={paidByUserId === m.userId}
                      onPress={() => setValue('paidByUserId', m.userId)}
                    />
                  ))}
                </View>
                <Text style={styles.sectionLabel}>Split with</Text>
                <View style={styles.chips}>
                  {activeMembers.map((m) => {
                    const selected = splitWithUserIds.includes(m.userId);
                    return (
                      <TagChip
                        key={m.userId}
                        label={resolveMemberDisplayName({ fullName: m.fullName, email: m.email })}
                        selected={selected}
                        onPress={() => {
                          const next = selected
                            ? splitWithUserIds.filter((uid) => uid !== m.userId)
                            : [...splitWithUserIds, m.userId];
                          setValue('splitWithUserIds', next.length > 0 ? next : [m.userId]);
                        }}
                      />
                    );
                  })}
                </View>
              </>
            )}
            <Text style={styles.sectionLabel}>Currency</Text>
            <Controller
              control={control}
              name="currency"
              render={({ field: { onChange, value } }) => (
                <View style={styles.chips}>
                  {TRIP_CURRENCIES.map((c) => (
                    <TagChip
                      key={c.code}
                      label={c.label}
                      selected={value === c.code}
                      onPress={() => onChange(c.code)}
                    />
                  ))}
                </View>
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
              {category} · {formatMoney(total, primaryCurrency)}
            </Text>
            {expenses
              .filter((e) => e.category === category)
              .map((expense) => (
                <GlassCard key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseRow}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseTitle}>{expense.title}</Text>
                      <Text style={styles.expenseMeta}>
                        {formatTripDate(expense.date)} · {formatMoney(expense.amount, expense.currency)}
                      </Text>
                    </View>
                    {canEdit ? (
                      <DeleteIconButton
                        onPress={confirmDelete('Delete expense?', expense.title, () =>
                          deleteExpense.mutate(expense.id)
                        )}
                        accessibilityLabel={`Delete ${expense.title}`}
                      />
                    ) : null}
                  </View>
                </GlassCard>
              ))}
          </View>
        ))}

        {expenses.length === 0 && !showForm && (
          <Text style={styles.empty}>No expenses yet. Tap + to add one.</Text>
        )}
      </ScrollView>
      {!showForm && canEdit && (
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
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  balanceName: { ...typography.label, color: colors.primary },
  balanceAmount: { ...typography.caption, color: colors.gold },
});
