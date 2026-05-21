import { computeEqualSplits, computeBalances } from '@/utils/splitBalances';

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
});
