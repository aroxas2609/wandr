import { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { activitySchema, type ActivityFormData } from '../schemas/activitySchema';
import { FormInput, PremiumButton, TagChip, TimePickerField, LocationPickerField } from '@/components';
import { TIME_SLOTS, TIME_SLOT_LABELS } from '@/utils/itinerary';
import type { TimeSlot } from '@/types';
import { spacing } from '@/theme';

interface ActivityFormProps {
  defaultValues?: Partial<ActivityFormData>;
  onSubmit: (data: ActivityFormData) => void;
  loading?: boolean;
  submitLabel?: string;
  readOnly?: boolean;
  /** Centers map search and pin picker near the trip destination. */
  tripDestination?: string;
}

export function ActivityForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = 'Save Activity',
  readOnly = false,
  tripDestination,
}: ActivityFormProps) {
  const { control, handleSubmit, watch, setValue, register, trigger, formState: { errors } } =
    useForm<ActivityFormData>({
      resolver: zodResolver(activitySchema) as never,
      defaultValues: {
        title: '',
        timeSlot: 'morning',
        startTime: '',
        endTime: '',
        locationName: '',
        lat: undefined,
        lng: undefined,
        notes: '',
        bookingUrl: '',
        ...defaultValues,
      },
    });

  useEffect(() => {
    register('locationName');
    register('lat');
    register('lng');
  }, [register]);

  const timeSlot = watch('timeSlot');
  const locationName = watch('locationName');
  const lat = watch('lat');
  const lng = watch('lng');

  return (
    <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput label="Activity Title" value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Visit the Louvre" error={errors.title?.message} editable={!readOnly} />
        )}
      />
      <View style={styles.chips}>
        {TIME_SLOTS.map((slot) => (
          <TagChip
            key={slot}
            label={TIME_SLOT_LABELS[slot]}
            selected={timeSlot === slot}
            onPress={() => setValue('timeSlot', slot as TimeSlot)}
          />
        ))}
      </View>
      <Controller
        control={control}
        name="startTime"
        render={({ field: { onChange, onBlur, value } }) => (
          <TimePickerField
            label="Start Time"
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.startTime?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="endTime"
        render={({ field: { onChange, onBlur, value } }) => (
          <TimePickerField
            label="End Time"
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.endTime?.message}
          />
        )}
      />
      <LocationPickerField
        locationName={locationName ?? ''}
        lat={lat}
        lng={lng}
        tripDestination={tripDestination}
        onLocationNameChange={(v) => {
          setValue('locationName', v, { shouldDirty: true, shouldValidate: true });
        }}
        onCoordinatesChange={(coords) => {
          const opts = { shouldDirty: true, shouldValidate: true } as const;
          if (coords) {
            setValue('lat', coords.lat, opts);
            setValue('lng', coords.lng, opts);
          } else {
            setValue('lat', undefined, opts);
            setValue('lng', undefined, opts);
          }
          void trigger(['lat', 'lng']);
        }}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput label="Notes" value={value ?? ''} onChangeText={onChange} onBlur={onBlur} placeholder="Reservation details..." multiline editable={!readOnly} />
        )}
      />
      <Controller
        control={control}
        name="bookingUrl"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput label="Booking URL" value={value ?? ''} onChangeText={onChange} onBlur={onBlur} placeholder="https://..." error={errors.bookingUrl?.message} editable={!readOnly} />
        )}
      />
      {!readOnly && submitLabel ? (
        <PremiumButton label={submitLabel} onPress={handleSubmit(onSubmit)} loading={loading} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
});
