import { computeEqualSplits, computeBalances, computeSettleUpPayments } from '@/utils/splitBalances';

describe('splitBalances', () => {
  it('splits equally with remainder to early participants', () => {
    const splits = computeEqualSplits(100, ['a', 'b', 'c']);
    expect(splits).toHaveLength(3);
    const total = splits.reduce((s, x) => s + x.amount, 0);
    expect(total).toBeCloseTo(100, 2);
  });

  it('computes net balances', () => {
    const balances = computeBalances(
      [{ paidByUserId: 'a', amount: 100, participantIds: ['a', 'b'] }],
      [
        { userId: 'a', fullName: 'A' },
        { userId: 'b', fullName: 'B' },
      ]
    );
    expect(balances.a).toBeCloseTo(50, 2);
    expect(balances.b).toBeCloseTo(-50, 2);
  });

  it('suggests who pays whom', () => {
    const payments = computeSettleUpPayments({ a: 50, b: -50 });
    expect(payments).toHaveLength(1);
    expect(payments[0]).toEqual({ fromUserId: 'b', toUserId: 'a', amount: 50 });
  });

  it('handles three-way settlement', () => {
    const payments = computeSettleUpPayments({ a: 30, b: -10, c: -20 });
    const total = payments.reduce((s, p) => s + p.amount, 0);
    expect(total).toBeCloseTo(30, 2);
  });
});
