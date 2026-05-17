import {
  getPackingProgress,
  groupPackingByCategory,
  getSmartRecommendations,
} from '@/utils/packing';

describe('packing utils', () => {
  const items = [
    { id: '1', name: 'Passport', category: 'Documents', packed: true },
    { id: '2', name: 'Jacket', category: 'Clothing', packed: false },
    { id: '3', name: 'Charger', category: 'Electronics', packed: true },
  ];

  it('calculates packing progress', () => {
    const progress = getPackingProgress(items);
    expect(progress.packed).toBe(2);
    expect(progress.total).toBe(3);
    expect(progress.percentage).toBe(67);
  });

  it('groups by category', () => {
    const grouped = groupPackingByCategory(items);
    expect(grouped.Documents).toHaveLength(1);
    expect(grouped.Clothing).toHaveLength(1);
  });

  it('returns smart recommendations for cold destinations', () => {
    const recs = getSmartRecommendations('Iceland');
    expect(recs).toContain('Warm jacket');
  });
});
