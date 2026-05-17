import { fireEvent } from '@testing-library/react-native';
import { Pill } from '@/components/Pill';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('Pill', () => {
  it('renders label with consistent height', () => {
    const { getByText } = renderWithProviders(
      <Pill label="Day 1" size="md" variant="goldFilled" />
    );
    expect(getByText('Day 1')).toBeTruthy();
  });

  it('calls onPress when tappable', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <Pill label="Day 2" size="compact" onPress={onPress} />
    );
    fireEvent.press(getByText('Day 2'));
    expect(onPress).toHaveBeenCalled();
  });
});
