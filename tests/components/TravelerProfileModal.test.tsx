import { fireEvent, waitFor } from '@testing-library/react-native';
import { TravelerProfileModal } from '@/components/TravelerProfileModal';
import { fetchUserProfile } from '@/services/auth/userService';
import { renderWithProviders } from '../utils/renderWithProviders';

jest.mock('@/services/auth/userService', () => ({
  fetchUserProfile: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

const fetchUserProfileMock = fetchUserProfile as jest.MockedFunction<typeof fetchUserProfile>;

const activeMember = {
  userId: 'user-1',
  fullName: 'Anthony Roxas',
  email: 'anthony@example.com',
  role: 'editor' as const,
  status: 'active' as const,
};

const pendingMember = {
  userId: 'pending-1',
  fullName: 'friend@email.com',
  email: 'friend@email.com',
  role: 'viewer' as const,
  status: 'pending' as const,
};

describe('TravelerProfileModal', () => {
  beforeEach(() => {
    fetchUserProfileMock.mockReset();
  });

  it('shows email and role for active member', async () => {
    fetchUserProfileMock.mockResolvedValue(null);
    const { getByText } = renderWithProviders(
      <TravelerProfileModal
        visible
        onClose={jest.fn()}
        member={activeMember}
        displayName="Anthony Roxas"
        avatarUrl="https://example.com/a.jpg"
      />
    );
    expect(getByText('Anthony Roxas')).toBeTruthy();
    expect(getByText('anthony@example.com')).toBeTruthy();
    expect(getByText('Editor')).toBeTruthy();
    await waitFor(() => expect(fetchUserProfileMock).toHaveBeenCalledWith('user-1'));
  });

  it('shows pending invite without fetching profile', () => {
    const { getAllByText, getByText } = renderWithProviders(
      <TravelerProfileModal
        visible
        onClose={jest.fn()}
        member={pendingMember}
        displayName="friend@email.com"
      />
    );
    expect(getAllByText('friend@email.com').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Pending invite')).toBeTruthy();
    expect(fetchUserProfileMock).not.toHaveBeenCalled();
  });

  it('calls onClose when Close is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(
      <TravelerProfileModal
        visible
        onClose={onClose}
        member={activeMember}
        displayName="Anthony Roxas"
      />
    );
    fireEvent.press(getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
