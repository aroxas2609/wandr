import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { formatDisplayDate, isoToDate, dateToIso } from '@/utils/dates';
import { colors, typography, radius } from '@/theme';
import { PremiumButton } from './PremiumButton';

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
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState(() => isoToDate(value));

  const displayValue = value ? formatDisplayDate(value) : '';

  const openPicker = () => {
    Haptics.selectionAsync();
    setDraft(isoToDate(value));
    setShowPicker(true);
  };

  const applyDate = (date: Date) => {
    onChange(dateToIso(date));
    setShowPicker(false);
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (selected) {
      if (Platform.OS === 'android') {
        applyDate(selected);
      } else {
        setDraft(selected);
      }
    }
  };

  const picker = (
    <DateTimePicker
      value={draft}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
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
        style={[styles.field, error && styles.fieldError]}
      >
        <Text style={[styles.value, !displayValue && styles.placeholder]}>
          {displayValue || 'Select date'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.gold} />
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
            <PremiumButton
              label="Done"
              onPress={() => applyDate(draft)}
              style={styles.doneButton}
            />
          </View>
        </Modal>
      )}
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
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  value: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.primary,
  },
  placeholder: {
    color: colors.muted,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
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
  sheetTitle: {
    ...typography.h3,
    fontSize: 16,
  },
  doneButton: {
    marginHorizontal: 20,
    marginTop: 8,
  },
});
