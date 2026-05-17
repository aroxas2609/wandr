import { EmptyState } from '@/components/EmptyState';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('EmptyState', () => {
  it('renders title and description', () => {
    const { getByText } = renderWithProviders(
      <EmptyState title="No trips" description="Create your first trip" />
    );
    expect(getByText('No trips')).toBeTruthy();
    expect(getByText('Create your first trip')).toBeTruthy();
  });
});
