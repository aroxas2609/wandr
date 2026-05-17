import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import { colors } from '@/theme';

export type PillSize = 'sm' | 'compact' | 'md';
export type PillVariant = 'default' | 'gold' | 'goldFilled';

const SIZES = {
  sm: { height: 24, paddingH: 8, fontSize: 10 },
  compact: { height: 32, paddingH: 12, fontSize: 12 },
  md: { height: 36, paddingH: 16, fontSize: 13 },
} as const;

interface PillProps {
  label: string;
  size?: PillSize;
  variant?: PillVariant;
  onPress?: () => void;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Pill({
  label,
  size = 'md',
  variant = 'default',
  onPress,
  style,
  fullWidth,
}: PillProps) {
  const metrics = SIZES[size];
  const borderRadius = metrics.height / 2;
  const innerHeight = metrics.height - 2;

  const shell = (
    <View
      style={[
        styles.shell,
        {
          height: metrics.height,
          borderRadius,
          paddingHorizontal: metrics.paddingH,
        },
        variant === 'gold' && styles.gold,
        variant === 'goldFilled' && styles.goldFilled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <View style={[styles.labelBox, { height: innerHeight }]}>
        <Text
          style={[
            styles.text,
            {
              fontSize: metrics.fontSize,
              lineHeight: metrics.fontSize + (Platform.OS === 'web' ? 2 : 4),
            },
            variant !== 'default' && styles.textGold,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          fullWidth && styles.fullWidth,
          pressed && styles.pressed,
        ]}
      >
        {shell}
      </Pressable>
    );
  }

  return shell;
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    overflow: 'visible',
    ...(Platform.OS === 'web'
      ? ({ boxSizing: 'border-box' } as ViewStyle)
      : {}),
  },
  labelBox: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  gold: {
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    borderColor: colors.gold,
  },
  goldFilled: {
    backgroundColor: 'rgba(201, 169, 98, 0.28)',
    borderColor: 'rgba(201, 169, 98, 0.5)',
  },
  text: {
    fontFamily: 'Inter_500Medium',
    color: colors.secondary,
    textAlign: 'center',
    margin: 0,
    padding: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  textGold: {
    color: colors.gold,
  },
  pressable: {
    alignSelf: 'flex-start',
    overflow: 'visible',
  },
  pressed: {
    opacity: 0.85,
  },
});
