import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { calculateBudgetProgress } from '@/utils/budget';

interface BudgetProgressBarProps {
  spent: number;
  target: number;
}

export function BudgetProgressBar({ spent, target }: BudgetProgressBarProps) {
  const { percentage, remaining, isOver } = calculateBudgetProgress(spent, target);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Spent</Text>
        <Text style={[styles.amount, isOver && styles.over]}>
          ${spent.toLocaleString()} / ${target.toLocaleString()}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${percentage}%` },
            isOver && styles.fillOver,
          ]}
        />
      </View>
      <Text style={styles.caption}>
        {isOver
          ? `Over budget by $${(spent - target).toLocaleString()}`
          : `$${remaining.toLocaleString()} remaining`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: { ...typography.caption },
  amount: { ...typography.label, color: colors.gold },
  over: { color: colors.danger },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.elevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
  fillOver: { backgroundColor: colors.danger },
  caption: { ...typography.caption, marginTop: spacing.sm },
});
