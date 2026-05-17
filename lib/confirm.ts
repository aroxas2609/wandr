import { Alert, Platform } from 'react-native';

/** Works on web (confirm) and native (Alert). */
export function confirmAction(
  title: string,
  message: string,
  options: {
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }
): void {
  const { confirmLabel = 'OK', destructive = false, onConfirm } = options;
  const run = () => void Promise.resolve(onConfirm());

  if (Platform.OS === 'web') {
    if (typeof globalThis !== 'undefined' && 'confirm' in globalThis) {
      const ok = globalThis.confirm(`${title}\n\n${message}`);
      if (ok) void run();
    } else {
      void run();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: run,
    },
  ]);
}

/** Wire to DeleteIconButton — shows confirm dialog then runs action. */
export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>
): () => void {
  return () =>
    confirmAction(title, message, {
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => void onConfirm(),
    });
}
