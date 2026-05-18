import { Alert, Platform } from 'react-native';
import { create } from 'zustand';

interface AppMessageState {
  visible: boolean;
  title: string;
  message: string;
  show: (title: string, message: string) => void;
  hide: () => void;
}

export const useAppMessageStore = create<AppMessageState>((set) => ({
  visible: false,
  title: '',
  message: '',
  show: (title, message) => set({ visible: true, title, message }),
  hide: () => set({ visible: false, title: '', message: '' }),
}));

/** In-app alert on web; native Alert elsewhere. */
export function showAppMessage(title: string, message: string): void {
  if (Platform.OS === 'web') {
    useAppMessageStore.getState().show(title, message);
    return;
  }
  Alert.alert(title, message);
}
