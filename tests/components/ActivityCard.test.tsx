import { ActivityCard } from '@/components/ActivityCard';
import { renderWithProviders } from '../utils/renderWithProviders';
import { mockActivities } from '../fixtures/mockData';
import { TestIds } from '@/constants/testIds';

describe('ActivityCard', () => {
  it('renders activity title', () => {
    const activity = mockActivities[0];
    const { getByText, getByTestId } = renderWithProviders(
      <ActivityCard activity={activity} />
    );
    expect(getByTestId(TestIds.activityCard)).toBeTruthy();
    expect(getByText(activity.title)).toBeTruthy();
  });
});
