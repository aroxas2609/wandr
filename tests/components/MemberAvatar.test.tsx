import { fireEvent } from '@testing-library/react-native';
import { MemberAvatar } from '@/components/MemberAvatar';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('MemberAvatar', () => {
  it('calls onPress when provided', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <MemberAvatar name="Reuben" onPress={onPress} />
    );
    fireEvent.press(getByLabelText('Reuben profile'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without press handler', () => {
    const { getByLabelText } = renderWithProviders(<MemberAvatar name="Anthony" />);
    expect(getByLabelText('Anthony avatar')).toBeTruthy();
  });
});
