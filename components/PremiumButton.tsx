import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, typography } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'ghost' | 'danger' | 'outline';

interface PremiumButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function PremiumButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  testID,
  style,
  fullWidth = true,
}: PremiumButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.background : colors.gold} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelPrimary,
            variant === 'danger' && styles.labelDanger,
            variant === 'ghost' && styles.labelGhost,
            variant === 'outline' && styles.labelOutline,
          ]}
        >
          {label}
        </Text>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        testID={testID}
        style={[animatedStyle, fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={[colors.gold, '#B8944F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, styles.primaryButton]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      testID={testID}
      style={[
        animatedStyle,
        styles.button,
        variant === 'ghost' && styles.ghostButton,
        variant === 'danger' && styles.dangerButton,
        variant === 'outline' && styles.outlineButton,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButton: {
    ...colors && {},
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  label: {
    ...typography.label,
    fontSize: 16,
  },
  labelPrimary: {
    color: colors.background,
    fontFamily: 'Inter_600SemiBold',
  },
  labelGhost: {
    color: colors.gold,
  },
  labelDanger: {
    color: colors.danger,
  },
  labelOutline: {
    color: colors.primary,
  },
});
