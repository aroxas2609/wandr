import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme';

function getSiteUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

interface DesktopWebBlockProps {
  onDevBypass?: () => void;
}

export function DesktopWebBlock({ onDevBypass }: DesktopWebBlockProps) {
  const insets = useSafeAreaInsets();
  const siteUrl = getSiteUrl();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing['2xl'], paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <Text style={styles.brand}>Wandr</Text>
      <Text style={styles.title}>Built for mobile</Text>
      <Text style={styles.body}>
        Open this link on your iPhone, or on your iPad in portrait mode. Add it to your home
        screen for an app-like experience.
      </Text>

      {siteUrl ? (
        <View style={styles.urlBox}>
          <Text style={styles.urlLabel}>Open on mobile</Text>
          <Text style={styles.url} selectable>
            {siteUrl}
          </Text>
        </View>
      ) : null}

      {__DEV__ ? (
        <Text style={styles.hint}>Dev: use a phone UA or the bypass below to test on desktop.</Text>
      ) : null}

      {__DEV__ && onDevBypass ? (
        <Pressable onPress={onDevBypass} style={styles.devBypass}>
          <Text style={styles.devBypassText}>Continue on desktop (development only)</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    ...typography.h1,
    color: colors.gold,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.secondary,
    textAlign: 'center',
    maxWidth: 420,
    marginBottom: spacing['2xl'],
  },
  urlBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  urlLabel: {
    ...typography.overline,
    color: colors.sage,
    marginBottom: spacing.sm,
  },
  url: {
    ...typography.body,
    color: colors.gold,
  },
  hint: {
    ...typography.caption,
    color: colors.secondary,
    textAlign: 'center',
    maxWidth: 360,
    opacity: 0.7,
  },
  devBypass: {
    marginTop: spacing['2xl'],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  devBypassText: {
    ...typography.caption,
    color: colors.gold,
    textDecorationLine: 'underline',
  },
});
