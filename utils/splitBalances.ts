export interface SplitParticipant {
  userId: string;
  fullName: string;
}

export interface ExpenseSplitInput {
  paidByUserId: string;
  amount: number;
  participantIds: string[];
}

/** Equal split amounts; remainder cents go to first participant. */
export function computeEqualSplits(
  total: number,
  participantIds: string[]
): { userId: string; amount: number }[] {
  if (participantIds.length === 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / participantIds.length);
  const remainder = cents % participantIds.length;

  return participantIds.map((userId, index) => ({
    userId,
    amount: (base + (index < remainder ? 1 : 0)) / 100,
  }));
}

/** Net balance per user: positive = others owe them. */
export function computeBalances(
  expenses: ExpenseSplitInput[],
  members: SplitParticipant[]
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const m of members) {
    balances[m.userId] = 0;
  }

  for (const exp of expenses) {
    const splits = computeEqualSplits(exp.amount, exp.participantIds);
    balances[exp.paidByUserId] = (balances[exp.paidByUserId] ?? 0) + exp.amount;
    for (const s of splits) {
      balances[s.userId] = (balances[s.userId] ?? 0) - s.amount;
    }
  }

  return balances;
}

export function formatBalanceLabel(amount: number): string {
  if (Math.abs(amount) < 0.01) return 'Settled';
  if (amount > 0) return `Owed ${amount.toFixed(2)}`;
  return `Owes ${Math.abs(amount).toFixed(2)}`;
}

export interface SettleUpPayment {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

/** Minimum transfers so everyone’s net balance reaches zero. */
export function computeSettleUpPayments(
  balances: Record<string, number>
): SettleUpPayment[] {
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance < -0.01) debtors.push({ userId, amount: -balance });
    else if (balance > 0.01) creditors.push({ userId, amount: balance });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const payments: SettleUpPayment[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const pay = Math.min(debtors[d].amount, creditors[c].amount);
    if (pay >= 0.01) {
      payments.push({
        fromUserId: debtors[d].userId,
        toUserId: creditors[c].userId,
        amount: Math.round(pay * 100) / 100,
      });
    }
    debtors[d].amount -= pay;
    creditors[c].amount -= pay;
    if (debtors[d].amount < 0.01) d += 1;
    if (creditors[c].amount < 0.01) c += 1;
  }

  return payments;
}
