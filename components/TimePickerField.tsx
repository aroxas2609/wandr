import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  normalizeTimeString,
  timeStringToDate,
  dateToTimeString,
  formatTimeDisplay,
  isValidTimeString,
} from '@/lib/timeInput';
import { colors, typography, radius } from '@/theme';
import { PremiumButton } from './PremiumButton';

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
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState(() => timeStringToDate(value));

  const normalizedValue = value ? normalizeTimeString(value) : '';
  const display12 = normalizedValue ? formatTimeDisplay(normalizedValue) : '';
  const showFormatHint = value.length > 0 && !isValidTimeString(value);

  const openPicker = () => {
    Haptics.selectionAsync();
    setDraft(timeStringToDate(value));
    setShowPicker(true);
  };

  const applyTime = (date: Date) => {
    onChange(dateToTimeString(date));
    setShowPicker(false);
    onBlur?.();
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (selected) {
      if (Platform.OS === 'android') {
        applyTime(selected);
      } else {
        setDraft(selected);
      }
    }
  };

  const picker = (
    <DateTimePicker
      value={draft}
      mode="time"
      is24Hour={false}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={handleChange}
      themeVariant="dark"
      accentColor={colors.gold}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openPicker}
        testID={testID}
        style={[styles.field, (error || showFormatHint) && styles.fieldError]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={[styles.value, !display12 && styles.placeholder]}>
          {display12 || 'Select time'}
        </Text>
        <Ionicons name="time-outline" size={22} color={colors.gold} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {Platform.OS === 'android' && showPicker ? picker : null}

      {(Platform.OS === 'ios' || Platform.OS === 'web') && (
        <Modal visible={showPicker} transparent animationType="slide">
          <Pressable style={styles.overlay} onPress={() => setShowPicker(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={() => setShowPicker(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.secondary} />
              </Pressable>
            </View>
            {picker}
            <PremiumButton label="Done" onPress={() => applyTime(draft)} style={styles.doneButton} />
          </View>
        </Modal>
      )}
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
  },
  fieldError: { borderColor: colors.danger },
  value: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.primary,
  },
  placeholder: { color: colors.muted },
  error: { ...typography.caption, color: colors.danger, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingBottom: 32,
    paddingTop: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetTitle: { ...typography.h3, fontSize: 16 },
  doneButton: { marginHorizontal: 20, marginTop: 8 },
});
