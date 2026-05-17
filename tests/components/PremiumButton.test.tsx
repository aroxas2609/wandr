import { fireEvent } from '@testing-library/react-native';
import { PremiumButton } from '@/components/PremiumButton';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('PremiumButton', () => {
  it('renders label', () => {
    const { getByText } = renderWithProviders(
      <PremiumButton label="Sign In" onPress={() => {}} />
    );
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <PremiumButton label="Tap Me" onPress={onPress} testID="tap-button" />
    );
    fireEvent.press(getByText('Tap Me'));
    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <PremiumButton label="Disabled" onPress={onPress} disabled />
    );
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
