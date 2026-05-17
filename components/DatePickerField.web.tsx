import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '@/theme';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  testID?: string;
}

export function DatePickerField({
  label,
  value,
  onChange,
  error,
  minimumDate,
  maximumDate,
  testID,
}: DatePickerFieldProps) {
  const min = minimumDate ? minimumDate.toISOString().split('T')[0] : undefined;
  const max = maximumDate ? maximumDate.toISOString().split('T')[0] : undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, error && styles.fieldError]} testID={testID}>
        <input
          type="date"
          value={value || ''}
          min={min}
          max={max}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          aria-label={label}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: colors.primary,
            fontSize: 16,
            fontFamily: 'Inter, system-ui, sans-serif',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <Ionicons name="calendar-outline" size={20} color={colors.gold} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    ...typography.label,
    marginBottom: 8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  hint: {
    ...typography.caption,
    marginTop: 4,
    color: colors.muted,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 4,
  },
});
