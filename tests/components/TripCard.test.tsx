import { TripCard } from '@/components/TripCard';
import { renderWithProviders } from '../utils/renderWithProviders';
import { mockTrips } from '../fixtures/mockData';
import { TestIds } from '@/constants/testIds';

describe('TripCard', () => {
  it('renders trip info', () => {
    const trip = mockTrips[0];
    const { getByText, getByTestId } = renderWithProviders(
      <TripCard trip={trip} />
    );
    expect(getByTestId(TestIds.tripCard)).toBeTruthy();
    expect(getByText(trip.title)).toBeTruthy();
    expect(getByText(trip.destination)).toBeTruthy();
  });
});
