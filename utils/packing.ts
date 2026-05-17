export interface PackingItem {
  id: string;
  name: string;
  category: string;
  packed: boolean;
}

export function getPackingProgress(items: PackingItem[]): {
  packed: number;
  total: number;
  percentage: number;
} {
  const total = items.length;
  const packed = items.filter((i) => i.packed).length;
  const percentage = total === 0 ? 0 : Math.round((packed / total) * 100);
  return { packed, total, percentage };
}

export function groupPackingByCategory(
  items: PackingItem[]
): Record<string, PackingItem[]> {
  return items.reduce<Record<string, PackingItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

export function getSmartRecommendations(destination: string): string[] {
  const base = ['Passport', 'Phone charger', 'Travel adapter', 'Comfortable shoes'];
  const cold = ['Warm jacket', 'Layers', 'Gloves'];
  const warm = ['Sunscreen', 'Sunglasses', 'Light clothing'];

  if (/iceland|norway|alaska/i.test(destination)) return [...base, ...cold];
  if (/tokyo|paris|italy/i.test(destination)) return [...base, ...warm.slice(0, 2)];
  return base;
}
