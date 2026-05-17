import { render, screen } from '@testing-library/react-native';
import { BudgetProgressBar } from '@/components/BudgetProgressBar';

describe('BudgetProgressBar', () => {
  it('shows spent and remaining', () => {
    render(<BudgetProgressBar spent={2000} target={8500} />);
    expect(screen.getByText(/\$2,000/)).toBeTruthy();
    expect(screen.getByText(/remaining/i)).toBeTruthy();
  });

  it('shows over budget state', () => {
    render(<BudgetProgressBar spent={9000} target={8500} />);
    expect(screen.getByText(/Over budget/i)).toBeTruthy();
  });
});
