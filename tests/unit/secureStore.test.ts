import * as SecureStore from 'expo-secure-store';
import { saveSession, getSession, clearSession } from '@/lib/secureStore';

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(),
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('secureStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses SecureStore when available', async () => {
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('token-123');

    await saveSession('token-123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('wandr_session', 'token-123');

    const token = await getSession();
    expect(token).toBe('token-123');
  });

  it('falls back to MMKV when SecureStore is unavailable', async () => {
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    await saveSession('mock-token');
    const token = await getSession();
    expect(token).toBe('mock-token');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();

    await clearSession();
    expect(await getSession()).toBeNull();
  });
});
