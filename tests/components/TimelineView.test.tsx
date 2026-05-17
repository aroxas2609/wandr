import { TimelineView } from '@/components/TimelineView';
import { renderWithProviders } from '../utils/renderWithProviders';
import { mockActivities } from '../fixtures/mockData';

describe('TimelineView', () => {
  it('renders activity sections', () => {
    const { getByText, getAllByText } = renderWithProviders(
      <TimelineView
        activities={mockActivities.filter((a) => a.dayId === 'day-paris-1')}
        onActivityPress={() => {}}
        onAddActivity={() => {}}
      />
    );
    expect(getByText('Morning')).toBeTruthy();
    expect(getAllByText('Evening').length).toBeGreaterThan(0);
  });
});
