import { fireEvent } from '@testing-library/react-native';
import { AvatarStack } from '@/components/AvatarStack';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('AvatarStack', () => {
  it('calls onMemberPress for tapped stack avatar', () => {
    const onMemberPress = jest.fn();
    const members = [
      { key: 'a', name: 'Anthony' },
      { key: 'b', name: 'Reuben' },
    ];
    const { getByLabelText } = renderWithProviders(
      <AvatarStack members={members} onMemberPress={onMemberPress} />
    );
    fireEvent.press(getByLabelText('Reuben profile'));
    expect(onMemberPress).toHaveBeenCalledWith(members[1]);
  });
});
