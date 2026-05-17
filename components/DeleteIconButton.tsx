import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme';

const SIZES = {
  sm: { box: 40, icon: 20 },
  md: { box: 48, icon: 22 },
} as const;

export type DeleteIconButtonSize = keyof typeof SIZES;

export interface DeleteIconButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  size?: DeleteIconButtonSize;
  disabled?: boolean;
  hitSlop?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function DeleteIconButton({
  onPress,
  accessibilityLabel = 'Delete',
  size = 'md',
  disabled = false,
  hitSlop = 8,
  testID,
  style,
}: DeleteIconButtonProps) {
  const dim = SIZES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        {
          width: dim.box,
          height: dim.box,
          borderRadius: size === 'sm' ? radius.full : radius.lg,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name="trash-outline" size={dim.icon} color={colors.danger} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.elevated,
  },
  pressed: {
    opacity: 0.75,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
  },
  disabled: { opacity: 0.4 },
});
