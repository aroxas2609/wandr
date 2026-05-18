import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import { isAndroidWeb, isIosWeb, isPwaStandalone } from '@/lib/pwaInstall';
import { colors, typography, spacing, radius } from '@/theme';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AddToHomeScreenBanner() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [canNativeInstall, setCanNativeInstall] = useState(false);
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isPwaStandalone()) return;
    if (getJson<boolean>(StorageKeys.pwaInstallBannerDismissed)) return;

    const showBanner = () => setVisible(true);
    const timer = setTimeout(showBanner, 1200);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      installPromptRef.current = event as BeforeInstallPromptEvent;
      setCanNativeInstall(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setShowIosSteps(false);
    setJson(StorageKeys.pwaInstallBannerDismissed, true);
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = installPromptRef.current;
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      installPromptRef.current = null;
      dismiss();
      return;
    }
    if (isIosWeb()) {
      setShowIosSteps(true);
      return;
    }
    dismiss();
  }, [dismiss]);

  if (Platform.OS !== 'web' || !visible) return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 72 }]}>
      <View style={styles.banner}>
        <Pressable onPress={dismiss} style={styles.close} hitSlop={12} accessibilityLabel="Dismiss">
          <Ionicons name="close" size={20} color={colors.secondary} />
        </Pressable>
        <Text style={styles.title}>Install Wandr</Text>
        {showIosSteps ? (
          <Text style={styles.body}>
            Tap the Share button in Safari, then choose Add to Home Screen for a full-screen app
            experience.
          </Text>
        ) : (
          <Text style={styles.body}>
            {isAndroidWeb() && canNativeInstall
              ? 'Add Wandr to your home screen for quick access without the browser bar.'
              : isIosWeb()
                ? 'Install Wandr on your home screen for an app-like experience without Safari’s address bar.'
                : 'Add Wandr to your home screen for the best mobile experience.'}
          </Text>
        )}
        <View style={styles.actions}>
          <Pressable onPress={dismiss} style={styles.secondaryButton}>
            <Text style={styles.secondaryLabel}>Not now</Text>
          </Pressable>
          <Pressable onPress={() => void handleInstall()} style={styles.primaryButton}>
            <Text style={styles.primaryLabel}>
              {showIosSteps ? 'Got it' : canNativeInstall ? 'Install' : 'How to install'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  close: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  title: {
    ...typography.h3,
    fontSize: 17,
    paddingRight: spacing['2xl'],
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.caption,
    color: colors.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  secondaryLabel: {
    ...typography.caption,
    color: colors.secondary,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.gold,
  },
  primaryLabel: {
    ...typography.caption,
    color: colors.background,
    fontFamily: 'Inter_600SemiBold',
  },
});
