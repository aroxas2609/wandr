import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius } from '@/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  testID?: string;
}

export function GlassCard({
  children,
  style,
  intensity = 40,
  testID,
}: GlassCardProps) {
  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      <BlurView intensity={intensity} tint="dark" style={styles.blur}>
        <View style={styles.inner}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  blur: {
    overflow: 'hidden',
  },
  inner: {
    backgroundColor: colors.glass,
    padding: 16,
  },
});
