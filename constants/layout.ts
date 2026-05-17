import { Platform } from 'react-native';

export const TAB_BAR_HEIGHT = Platform.select({
  ios: 88,
  android: 64,
  default: 64,
}) as number;

export const FAB_SIZE = 60;
export const FAB_MARGIN = 16;

export function getFabBottom(safeAreaBottom: number): number {
  return TAB_BAR_HEIGHT + Math.max(safeAreaBottom, 8) + FAB_MARGIN;
}

export function getTabScreenPaddingBottom(safeAreaBottom: number): number {
  return TAB_BAR_HEIGHT + safeAreaBottom + FAB_SIZE + FAB_MARGIN + 24;
}
