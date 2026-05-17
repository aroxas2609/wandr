import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/theme';
import { FAB_SIZE, getFabBottom } from '@/constants/layout';
import { useResponsive } from '@/hooks/useResponsive';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const FAB_RADIUS = FAB_SIZE / 2;

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
  bottom?: number;
}

export function FloatingActionButton({
  onPress,
  icon = 'add',
  testID,
  bottom,
}: FloatingActionButtonProps) {
  const insets = useSafeAreaInsets();
  const { fabInset } = useResponsive();
  const bottomOffset = bottom ?? getFabBottom(insets.bottom);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom: bottomOffset, right: fabInset },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      {Platform.OS === 'ios' && <View style={styles.glow} />}
      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.92);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        testID={testID}
        style={styles.pressable}
        android_ripple={{
          color: 'rgba(201, 169, 98, 0.25)',
          borderless: true,
          radius: FAB_RADIUS,
        }}
      >
        <LinearGradient
          colors={[colors.gold, '#B8944F']}
          style={styles.gradient}
        >
          <Ionicons name={icon} size={28} color={colors.background} />
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: FAB_SIZE + 8,
    height: FAB_SIZE + 8,
    borderRadius: (FAB_SIZE + 8) / 2,
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  pressable: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_RADIUS,
    overflow: 'hidden',
    ...(Platform.OS === 'android' ? { elevation: 6 } : {}),
  },
  gradient: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
