import { Easing } from 'react-native-reanimated';

export const motion = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  spring: {
    damping: 18,
    stiffness: 180,
    mass: 0.8,
  },
} as const;
