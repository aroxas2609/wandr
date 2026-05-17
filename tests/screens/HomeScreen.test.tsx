import HomeScreen from '@/app/(tabs)/index';
import { useAuthStore } from '@/stores/authStore';
import { renderWithProviders } from '../utils/renderWithProviders';

jest.mock('@/features/trips/hooks/useTrips', () => ({
  useTrips: () => ({
    data: [],
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  }),
}));

jest.mock('@/features/weather/hooks/useTripWeather', () => ({
  useTripWeather: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/features/recommendations/hooks/useRecommendations', () => ({
  useRecommendations: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: '1', email: 'user@example.com', fullName: 'Alex Morgan', createdAt: '' },
      isAuthenticated: true,
      isHydrated: true,
    });
  });

  it('renders greeting', () => {
    const { getByText } = renderWithProviders(<HomeScreen />);
    expect(getByText(/Hello, Alex/)).toBeTruthy();
  });
});
