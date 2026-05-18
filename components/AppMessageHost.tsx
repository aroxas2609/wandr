import { Modal, View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useAppMessageStore } from '@/stores/appMessageStore';
import { colors, typography, spacing, radius } from '@/theme';

export function AppMessageHost() {
  const visible = useAppMessageStore((s) => s.visible);
  const title = useAppMessageStore((s) => s.title);
  const message = useAppMessageStore((s) => s.message);
  const hide = useAppMessageStore((s) => s.hide);

  if (Platform.OS !== 'web') return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide}>
      <Pressable style={styles.backdrop} onPress={hide}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.button} onPress={hide}>
            <Text style={styles.buttonLabel}>OK</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.secondary,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonLabel: {
    ...typography.label,
    color: colors.background,
    fontFamily: 'Inter_600SemiBold',
  },
});
