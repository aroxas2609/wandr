import { useWindowDimensions } from 'react-native';

/** iPhone SE, narrow phones, and mobile web previews */
const COMPACT_WIDTH = 400;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isCompact = width < COMPACT_WIDTH;

  return {
    width,
    height,
    isCompact,
    horizontalPadding: isCompact ? 16 : 24,
    fabInset: isCompact ? 16 : 20,
    chip: {
      height: isCompact ? 32 : 36,
      paddingHorizontal: isCompact ? 12 : 16,
      fontSize: isCompact ? 12 : 13,
    },
  };
}
