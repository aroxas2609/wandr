import { fireEvent, waitFor } from '@testing-library/react-native';
import PackingScreen from '@/app/trip/[id]/packing';
import { confirmDelete } from '@/lib/confirm';
import { renderWithProviders } from '../utils/renderWithProviders';

const mockDelete = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'trip-1' }),
}));

jest.mock('@/lib/confirm', () => ({
  confirmDelete: jest.fn(
    (_title: string, _message: string, onConfirm: () => void | Promise<void>) =>
      () => void onConfirm()
  ),
}));

jest.mock('@/features/trips/hooks/useTrips', () => ({
  useTrip: () => ({
    data: { title: "Dad's Birthday", destination: 'Tokyo' },
  }),
}));

jest.mock('@/hooks/useTripAccess', () => ({
  useTripAccess: () => ({
    canEdit: true,
    isViewer: false,
    isOwner: true,
    canManageMembers: true,
    role: 'owner',
    isLoading: false,
  }),
}));

jest.mock('@/features/packing/hooks/usePacking', () => ({
  usePackingItems: () => ({
    data: [
      {
        id: 'a1111111-1111-4111-8111-111111111111',
        tripId: 'trip-1',
        name: 'Passport',
        category: 'Essentials',
        packed: false,
        sortOrder: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b2222222-2222-4222-8222-222222222222',
        tripId: 'trip-1',
        name: 'test',
        category: 'Custom',
        packed: true,
        sortOrder: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  }),
  useTogglePacking: () => ({ mutate: jest.fn() }),
  useCreatePackingItem: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useSuggestPacking: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useDeletePackingItem: () => ({ mutateAsync: mockDelete, isPending: false }),
}));

describe('PackingScreen', () => {
  beforeEach(() => {
    mockDelete.mockClear();
  });

  it('renders progress and packing items', () => {
    const { getByText } = renderWithProviders(<PackingScreen />);
    expect(getByText('Packing List')).toBeTruthy();
    expect(getByText("Dad's Birthday")).toBeTruthy();
    expect(getByText('1 of 2 packed (50%)')).toBeTruthy();
    expect(getByText('Passport')).toBeTruthy();
    expect(getByText('test')).toBeTruthy();
    expect(getByText('Essentials')).toBeTruthy();
    expect(getByText('Custom')).toBeTruthy();
  });

  it('shows remove controls only in edit mode and deletes on ×', async () => {
    const { getByText, getByLabelText, queryByLabelText } = renderWithProviders(
      <PackingScreen />
    );

    expect(queryByLabelText('Remove Passport')).toBeNull();

    fireEvent.press(getByText('Edit'));
    expect(getByText('Done')).toBeTruthy();
    expect(getByText('Tap × to remove an item')).toBeTruthy();
    expect(getByLabelText('Remove Passport')).toBeTruthy();

    fireEvent.press(getByLabelText('Remove Passport'));

    await waitFor(() => {
      expect(confirmDelete).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith('a1111111-1111-4111-8111-111111111111');
    });
  });

  it('does not show per-row remove icons before edit', () => {
    const { queryAllByLabelText } = renderWithProviders(<PackingScreen />);
    expect(queryAllByLabelText(/Remove /)).toHaveLength(0);
  });
});
