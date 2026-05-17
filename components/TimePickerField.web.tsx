import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeTimeString, formatTimeDisplay, isValidTimeString } from '@/lib/timeInput';
import { colors, typography, radius } from '@/theme';

interface TimePickerFieldProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  onBlur?: () => void;
  error?: string;
  testID?: string;
}

export function TimePickerField({
  label,
  value,
  onChange,
  onBlur,
  error,
  testID,
}: TimePickerFieldProps) {
  const normalizedValue = value ? normalizeTimeString(value) : '';
  const display12 = normalizedValue ? formatTimeDisplay(normalizedValue) : '';
  const showFormatHint = value.length > 0 && !isValidTimeString(value);
  const inputValue = isValidTimeString(value) ? normalizedValue : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, (error || showFormatHint) && styles.fieldError]} testID={testID}>
        <Text
          pointerEvents="none"
          style={[styles.value, !display12 && styles.placeholder]}
        >
          {display12 || 'Select time'}
        </Text>
        <Ionicons name="time-outline" size={22} color={colors.gold} pointerEvents="none" />
        <input
          type="time"
          value={inputValue}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          onBlur={onBlur}
          aria-label={`${label} picker`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
          }}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { ...typography.label, marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    position: 'relative',
  },
  fieldError: { borderColor: colors.danger },
  value: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.primary,
  },
  placeholder: { color: colors.muted },
  error: { ...typography.caption, color: colors.danger, marginTop: 4 },
});
