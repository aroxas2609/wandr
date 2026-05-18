import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/theme';

const TAB_BAR_BASE = 56;
const TAB_BAR_PADDING_TOP = 8;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset =
    Platform.OS === 'web' ? Math.max(insets.bottom, 0) : Platform.OS === 'ios' ? 0 : 0;
  const tabBarHeight =
    Platform.OS === 'ios'
      ? 88
      : TAB_BAR_BASE + TAB_BAR_PADDING_TOP + bottomInset;

  const useBlurTabBar = Platform.OS === 'ios' || Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          ...styles.tabBar,
          height: tabBarHeight,
          paddingTop: TAB_BAR_PADDING_TOP,
          paddingBottom:
            Platform.OS === 'web' ? Math.max(bottomInset, spacing.sm) : undefined,
          backgroundColor: useBlurTabBar ? 'transparent' : colors.elevated,
        },
        tabBarBackground: () =>
          useBlurTabBar ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : undefined,
        tabBarLabelStyle: styles.tabLabel,
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.selectionAsync();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopColor: colors.glassBorder,
    borderTopWidth: 1,
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});
