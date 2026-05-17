import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripSchema, type TripFormData } from '../schemas/tripSchema';
import { FormInput, PremiumButton, TagChip, DatePickerField } from '@/components';
import { pickImageFromLibrary } from '@/lib/pickDocumentImage';
import { getErrorMessage } from '@/lib/errors';
import { sanitizeDecimalInput } from '@/lib/decimalInput';
import { isoToDate } from '@/utils/dates';
import { TRAVEL_STYLES, type TravelStyle } from '@/constants/travelStyles';
import { colors, typography, spacing } from '@/theme';

interface TripFormProps {
  defaultValues?: Partial<TripFormData>;
  onSubmit: (data: TripFormData) => void;
  loading?: boolean;
  submitLabel?: string;
}

export function TripForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = 'Save Trip',
}: TripFormProps) {
  const [coverError, setCoverError] = useState('');
  const [pickingCover, setPickingCover] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema) as never,
    defaultValues: {
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      travelStyles: [] as TripFormData['travelStyles'],
      budgetTarget: '',
      coverUrl: '',
      ...defaultValues,
    },
  });

  const selectedStyles = watch('travelStyles') ?? [];
  const startDate = watch('startDate');
  const coverUrl = watch('coverUrl');

  const pickCover = async () => {
    setCoverError('');
    setPickingCover(true);
    try {
      const image = await pickImageFromLibrary();
      if (image) {
        setValue('coverUrl', image.uri, { shouldDirty: true, shouldValidate: true });
      }
    } catch (e) {
      setCoverError(getErrorMessage(e, 'Could not open photo library.'));
    } finally {
      setPickingCover(false);
    }
  };

  const toggleStyle = (style: TravelStyle) => {
    const current = selectedStyles;
    if (current.includes(style)) {
      setValue('travelStyles', current.filter((s) => s !== style));
    } else {
      setValue('travelStyles', [...current, style]);
    }
  };

  return (
    <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput label="Trip Name" value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Paris Honeymoon" error={errors.title?.message} />
        )}
      />
      <Pressable
        onPress={() => void pickCover()}
        style={styles.coverPicker}
        disabled={pickingCover}
        accessibilityRole="button"
        accessibilityLabel="Change cover photo"
      >
        {pickingCover ? (
          <ActivityIndicator color={colors.gold} />
        ) : coverUrl ? (
          <Image
            key={coverUrl}
            source={{ uri: coverUrl }}
            style={styles.coverImage}
            contentFit="cover"
            cachePolicy="none"
          />
        ) : (
          <Text style={styles.coverPlaceholder}>Tap to add cover photo</Text>
        )}
      </Pressable>
      {coverError ? <Text style={styles.coverError}>{coverError}</Text> : null}
      {coverUrl ? (
        <Text style={styles.coverHint}>New photo uploads when you save.</Text>
      ) : null}
      <Controller
        control={control}
        name="destination"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput label="Destination" value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Paris, France" error={errors.destination?.message} />
        )}
      />
      <Controller
        control={control}
        name="startDate"
        render={({ field: { onChange, value } }) => (
          <DatePickerField
            label="Start Date"
            value={value}
            onChange={onChange}
            error={errors.startDate?.message}
            testID="start-date-picker"
          />
        )}
      />
      <Controller
        control={control}
        name="endDate"
        render={({ field: { onChange, value } }) => (
          <DatePickerField
            label="End Date"
            value={value}
            onChange={onChange}
            error={errors.endDate?.message}
            minimumDate={startDate ? isoToDate(startDate) : undefined}
            testID="end-date-picker"
          />
        )}
      />
      <Controller
        control={control}
        name="budgetTarget"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Budget Target (optional)"
            value={value ?? ''}
            onChangeText={(t) => onChange(sanitizeDecimalInput(t))}
            onBlur={onBlur}
            keyboardType="decimal-pad"
            placeholder="5000"
          />
        )}
      />
      <Text style={styles.sectionLabel}>Travel Style</Text>
      <View style={styles.chips}>
        {TRAVEL_STYLES.map((style) => (
          <TagChip
            key={style}
            label={style}
            selected={selectedStyles.includes(style)}
            onPress={() => toggleStyle(style)}
          />
        ))}
      </View>
      <PremiumButton label={submitLabel} onPress={handleSubmit(onSubmit)} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  coverPicker: {
    height: 140,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { ...typography.caption },
  coverHint: { ...typography.caption, color: colors.secondary, marginBottom: spacing.lg },
  coverError: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
  sectionLabel: { ...typography.label, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xl },
});
