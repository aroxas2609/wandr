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
