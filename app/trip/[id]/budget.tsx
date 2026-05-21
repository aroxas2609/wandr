import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
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
import {
  computeBalances,
  computeSettleUpPayments,
  type ExpenseSplitInput,
} from '@/utils/splitBalances';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/features/budget/hooks/useExpenses';
import { expenseSchema, type ExpenseFormData } from '@/features/budget/schemas/expenseSchema';
import { useAuthStore } from '@/stores/authStore';
import { EXPENSE_CATEGORIES } from '@/constants/expenseCategories';
import {
  calculateTotalExpenses,
  totalsByCurrency,
  formatMoney,
  formatTotalsLine,
  hasSingleCurrency,
} from '@/utils/budget';
import { DEFAULT_TRIP_CURRENCY, TRIP_CURRENCIES } from '@/constants/currencies';
import { dateToIso, formatTripDate } from '@/utils/dates';
import { TestIds } from '@/constants/testIds';
import { sanitizeDecimalInput } from '@/lib/decimalInput';
import { getErrorMessage } from '@/lib/errors';
import { confirmDelete } from '@/lib/confirm';
import { colors, typography, spacing } from '@/theme';
import type { Expense, TripMember } from '@/types';

function shortLabel(m: TripMember, currentUserId?: string): string {
  const full =
    currentUserId === m.userId
      ? 'You'
      : resolveMemberDisplayName({ fullName: m.fullName, email: m.email });
  const first = full.split(/\s+/)[0];
  return first.length > 12 ? `${first.slice(0, 11)}…` : first;
}

function categorySpendLabel(expenses: Expense[], category: string): string {
  const inCategory = expenses.filter((e) => e.category === category);
  const totals = totalsByCurrency(inCategory);
  return formatTotalsLine(totals);
}

export default function BudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: trip } = useTrip(id);
  const { data: members = [] } = useTripMembers(id);
  const { data: expenses = [] } = useExpenses(id);
  const activeMembers = members.filter(
    (m) => m.status !== 'pending' && !m.userId.startsWith('pending-')
  );
  const canSplit = activeMembers.length > 1;
  const { canEdit, isViewer } = useTripAccess(id);
  const createExpense = useCreateExpense(id);
  const deleteExpense = useDeleteExpense(id);
  const [showForm, setShowForm] = useState(false);
  const [splitExpanded, setSplitExpanded] = useState(false);
  const [formError, setFormError] = useState('');

  const defaultParticipantIds = activeMembers.map((m) => m.userId);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<ExpenseFormData>({
      resolver: zodResolver(expenseSchema) as never,
      defaultValues: {
        title: '',
        amount: '',
        currency: DEFAULT_TRIP_CURRENCY,
        category: 'Food',
        date: dateToIso(new Date()),
        notes: '',
        paidByUserId: user?.id,
        splitWithUserIds: defaultParticipantIds,
      },
    });

  const paidByUserId = watch('paidByUserId');
  const splitWithUserIds = watch('splitWithUserIds') ?? [];
  const formCurrency = watch('currency') ?? DEFAULT_TRIP_CURRENCY;

  useEffect(() => {
    if (!showForm || !user) return;
    reset({
      title: '',
      amount: '',
      currency: DEFAULT_TRIP_CURRENCY,
      category: 'Food',
      date: dateToIso(new Date()),
      notes: '',
      paidByUserId: user.id,
      splitWithUserIds: defaultParticipantIds.length > 0 ? defaultParticipantIds : [user.id],
    });
    setSplitExpanded(false);
    setFormError('');
  }, [showForm, user?.id, defaultParticipantIds.join(',')]);

  const currencyTotals = totalsByCurrency(expenses);
  const singleCurrency = hasSingleCurrency(expenses);
  const primaryCurrency = Object.keys(currencyTotals)[0] ?? DEFAULT_TRIP_CURRENCY;

  const splitMembers = activeMembers.map((m) => ({
    userId: m.userId,
    fullName: resolveMemberDisplayName({ fullName: m.fullName, email: m.email }),
  }));

  const settleUpByCurrency = useMemo(() => {
    if (!canSplit || expenses.length === 0) return [];

    return Object.keys(currencyTotals)
      .map((currency) => {
        const inputs: ExpenseSplitInput[] = expenses
          .filter((e) => (e.currency ?? DEFAULT_TRIP_CURRENCY) === currency)
          .map((e) => ({
            paidByUserId: e.paidByUserId,
            amount: e.amount,
            participantIds: e.splits?.map((s) => s.userId) ?? [e.paidByUserId],
          }));
        const balances = computeBalances(inputs, splitMembers);
        const payments = computeSettleUpPayments(balances);
        return { currency, payments };
      })
      .filter((group) => group.payments.length > 0);
  }, [canSplit, expenses, currencyTotals, splitMembers]);

  const hasUnsettledBalances = canSplit && expenses.length > 0 && settleUpByCurrency.length > 0;

  const memberLabel = (userId: string) => {
    const m = activeMembers.find((x) => x.userId === userId);
    return m
      ? resolveMemberDisplayName({ fullName: m.fullName, email: m.email })
      : 'Someone';
  };
  const spent = calculateTotalExpenses(expenses, primaryCurrency);
  const target = trip?.budgetTarget ?? 0;

  const splitCount = splitWithUserIds.length;
  const amountPreview = parseFloat(watch('amount') || '');
  const perPersonSplit =
    splitExpanded &&
    splitCount > 0 &&
    Number.isFinite(amountPreview) &&
    amountPreview > 0
      ? formatMoney(amountPreview / splitCount, formCurrency)
      : null;

  const onSubmit = async (data: ExpenseFormData) => {
    setFormError('');
    if (!user) {
      setFormError('Sign in to add expenses.');
      return;
    }
    const participants =
      canSplit && splitExpanded && data.splitWithUserIds && data.splitWithUserIds.length > 0
        ? data.splitWithUserIds
        : [data.paidByUserId ?? user.id];

    try {
      await createExpense.mutateAsync({
        form: { ...data, splitWithUserIds: participants, paidByUserId: data.paidByUserId ?? user.id },
        userId: user.id,
      });
      setShowForm(false);
    } catch (e) {
      setFormError(getErrorMessage(e, 'Could not add expense.'));
    }
  };

  const expenseSplitCaption = (expense: Expense): string | null => {
    if (!canSplit || !expense.splits || expense.splits.length <= 1) return null;
    const payer = activeMembers.find((m) => m.userId === expense.paidByUserId);
    const payerName = payer
      ? shortLabel(payer, user?.id)
      : 'Someone';
    if (expense.splits.length === activeMembers.length) {
      return `Paid by ${payerName} · split equally`;
    }
    return `Paid by ${payerName} · split ${expense.splits.length} ways`;
  };

  const categories = useMemo(() => {
    const set = new Set(expenses.map((e) => e.category));
    return Array.from(set);
  }, [expenses]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Budget"
        showBack
        backHref={`/trip/${id}`}
        subtitle={trip?.title}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isViewer ? <ViewOnlyBanner /> : null}

        <GlassCard style={styles.summaryCard}>
          {target > 0 && singleCurrency ? (
            <BudgetProgressBar spent={spent} target={target} currency={primaryCurrency} />
          ) : expenses.length > 0 ? (
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>Total spent</Text>
              <Text style={styles.summaryAmount}>{formatTotalsLine(currencyTotals)}</Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              {target > 0
                ? 'Add expenses in one currency to track against your budget target.'
                : 'Add expenses to track spending on this trip.'}
            </Text>
          )}
          {target > 0 && !singleCurrency && expenses.length > 0 ? (
            <Text style={styles.summaryNote}>
              Budget target is in {primaryCurrency}. Totals above are per currency.
            </Text>
          ) : null}
          {hasUnsettledBalances ? (
            <View style={styles.settleSection}>
              <Text style={styles.settleTitle}>Who pays who</Text>
              <Text style={styles.settleHint}>
                Suggested payments from shared expenses (equal splits).
                {!singleCurrency ? ' Calculated separately per currency.' : ''}
              </Text>
              {settleUpByCurrency.map((group) => (
                <View key={group.currency} style={styles.settleCurrencyGroup}>
                  {!singleCurrency ? (
                    <Text style={styles.settleCurrencyLabel}>In {group.currency}</Text>
                  ) : null}
                  {group.payments.map((p) => (
                    <View
                      key={`${group.currency}-${p.fromUserId}-${p.toUserId}-${p.amount}`}
                      style={styles.paymentRow}
                    >
                      <Text style={styles.paymentText}>
                        <Text style={styles.paymentFrom}>{memberLabel(p.fromUserId)}</Text>
                        <Text style={styles.paymentArrow}> → </Text>
                        <Text style={styles.paymentTo}>{memberLabel(p.toUserId)}</Text>
                      </Text>
                      <Text style={styles.paymentAmount}>
                        {formatMoney(p.amount, group.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : canSplit && expenses.length > 0 ? (
            <Text style={styles.settleHint}>Everyone is settled up.</Text>
          ) : null}
        </GlassCard>

        {showForm && canEdit ? (
          <GlassCard style={styles.formCard}>
            <Text style={styles.formTitle}>New expense</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Title"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.title?.message}
                />
              )}
            />
            <View style={styles.amountRow}>
              <View style={styles.amountField}>
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
              </View>
              <View style={styles.currencyField}>
                <Text style={styles.fieldLabel}>Currency</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.currencyScroll}
                >
                  {TRIP_CURRENCIES.map((c) => (
                    <TagChip
                      key={c.code}
                      label={c.code}
                      compact
                      selected={formCurrency === c.code}
                      onPress={() => setValue('currency', c.code)}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Category</Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <View style={styles.chips}>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <TagChip
                      key={cat}
                      label={cat}
                      compact
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

            {canSplit ? (
              <View style={styles.splitSection}>
                <Pressable
                  style={styles.splitHeader}
                  onPress={() => setSplitExpanded((v) => !v)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: splitExpanded }}
                >
                  <Text style={styles.splitHeaderText}>Split with travelers</Text>
                  <Text style={styles.splitHeaderMeta}>
                    {splitExpanded
                      ? `${splitCount} ${splitCount === 1 ? 'person' : 'people'}`
                      : 'Just me'}
                  </Text>
                </Pressable>
                {splitExpanded ? (
                  <View style={styles.splitBody}>
                    <Text style={styles.fieldLabel}>Paid by</Text>
                    <View style={styles.chips}>
                      {activeMembers.map((m) => (
                        <TagChip
                          key={m.userId}
                          label={shortLabel(m, user?.id)}
                          compact
                          selected={paidByUserId === m.userId}
                          onPress={() => setValue('paidByUserId', m.userId)}
                        />
                      ))}
                    </View>
                    <Text style={styles.fieldLabel}>Split equally with</Text>
                    <View style={styles.chips}>
                      {activeMembers.map((m) => {
                        const selected = splitWithUserIds.includes(m.userId);
                        return (
                          <TagChip
                            key={m.userId}
                            label={shortLabel(m, user?.id)}
                            compact
                            selected={selected}
                            onPress={() => {
                              const next = selected
                                ? splitWithUserIds.filter((uid) => uid !== m.userId)
                                : [...splitWithUserIds, m.userId];
                              setValue(
                                'splitWithUserIds',
                                next.length > 0 ? next : [m.userId]
                              );
                            }}
                          />
                        );
                      })}
                    </View>
                    {perPersonSplit ? (
                      <Text style={styles.splitPreview}>
                        {perPersonSplit} each ({splitCount} people)
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <View style={styles.formActions}>
              <View style={styles.formActionCell}>
                <PremiumButton
                  label="Cancel"
                  variant="outline"
                  fullWidth
                  onPress={() => setShowForm(false)}
                />
              </View>
              <View style={styles.formActionCell}>
                <PremiumButton
                  label="Save"
                  fullWidth
                  onPress={handleSubmit(onSubmit, () =>
                    setFormError('Check the form — title and amount are required.')
                  )}
                  loading={createExpense.isPending}
                  testID={TestIds.addExpenseButton}
                />
              </View>
            </View>
          </GlassCard>
        ) : null}

        {categories.map((category) => (
          <View key={category} style={styles.listSection}>
            <Text style={styles.categoryTitle}>
              {category}
              <Text style={styles.categoryMeta}> · {categorySpendLabel(expenses, category)}</Text>
            </Text>
            {expenses
              .filter((e) => e.category === category)
              .map((expense) => {
                const splitLine = expenseSplitCaption(expense);
                return (
                  <GlassCard key={expense.id} style={styles.expenseCard}>
                    <View style={styles.expenseRow}>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseTitle}>{expense.title}</Text>
                        <Text style={styles.expenseMeta}>
                          {formatTripDate(expense.date)} ·{' '}
                          {formatMoney(expense.amount, expense.currency)}
                        </Text>
                        {splitLine ? (
                          <Text style={styles.expenseSplit}>{splitLine}</Text>
                        ) : null}
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
                );
              })}
          </View>
        ))}

        {expenses.length === 0 && !showForm ? (
          <Text style={styles.empty}>No expenses yet. Tap + to add one.</Text>
        ) : null}
      </ScrollView>
      {!showForm && canEdit ? (
        <FloatingActionButton onPress={() => setShowForm(true)} testID={TestIds.addExpenseButton} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 120 },
  summaryCard: { marginBottom: spacing.lg },
  summaryBlock: { gap: 4 },
  summaryLabel: { ...typography.overline },
  summaryAmount: { ...typography.h3, color: colors.gold },
  summaryNote: { ...typography.caption, marginTop: spacing.md },
  hint: { ...typography.body },
  settleSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  settleTitle: { ...typography.label, marginBottom: spacing.xs },
  settleHint: { ...typography.caption, marginBottom: spacing.md },
  settleCurrencyGroup: { marginTop: spacing.sm },
  settleCurrencyLabel: { ...typography.overline, marginBottom: spacing.xs, marginTop: spacing.sm },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  paymentText: { flex: 1, ...typography.body, color: colors.primary },
  paymentFrom: { fontFamily: 'Inter_600SemiBold' },
  paymentArrow: { color: colors.muted },
  paymentTo: { fontFamily: 'Inter_600SemiBold' },
  paymentAmount: { ...typography.label, color: colors.gold },
  formCard: { marginBottom: spacing.lg },
  formTitle: { ...typography.h3, marginBottom: spacing.md },
  formError: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
  fieldLabel: { ...typography.label, marginBottom: spacing.sm },
  amountRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  amountField: { flex: 1 },
  currencyField: { width: 132 },
  currencyScroll: { gap: spacing.xs, paddingBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  splitSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: spacing.md,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitHeaderText: { ...typography.label, color: colors.primary },
  splitHeaderMeta: { ...typography.caption, color: colors.gold },
  splitBody: { marginTop: spacing.md },
  splitPreview: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  formActionCell: { flex: 1, minWidth: 0 },
  listSection: { marginBottom: spacing.lg },
  categoryTitle: { ...typography.h3, marginBottom: spacing.sm },
  categoryMeta: { ...typography.caption, color: colors.muted },
  expenseCard: { marginBottom: spacing.sm },
  expenseRow: { flexDirection: 'row', alignItems: 'flex-start' },
  expenseInfo: { flex: 1 },
  expenseTitle: { ...typography.label, color: colors.primary },
  expenseMeta: { ...typography.caption, marginTop: 2 },
  expenseSplit: { ...typography.caption, color: colors.muted, marginTop: 4 },
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
