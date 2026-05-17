import TripsScreen from '@/app/(tabs)/trips';
import { TestIds } from '@/constants/testIds';
import { renderWithProviders } from '../utils/renderWithProviders';

jest.mock('@/features/trips/hooks/useTrips', () => ({
  useTrips: () => ({
    data: [],
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  }),
}));

describe('TripsScreen', () => {
  it('renders empty state with create FAB', () => {
    const { getByText, getByTestId } = renderWithProviders(<TripsScreen />);
    expect(getByText('My Trips')).toBeTruthy();
    expect(getByTestId(TestIds.createTripButton)).toBeTruthy();
  });
});
