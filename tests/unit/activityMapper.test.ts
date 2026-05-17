import { mapActivityToDb } from '@/lib/supabaseMappers';

describe('mapActivityToDb', () => {
  it('converts empty optional strings to null for Postgres', () => {
    const row = mapActivityToDb({
      id: '00000000-0000-4000-8000-000000000001',
      dayId: '00000000-0000-4000-8000-000000000002',
      title: 'Louvre',
      timeSlot: 'morning',
      startTime: '',
      endTime: '',
      locationName: '',
      notes: '',
      bookingUrl: '',
      sortOrder: 0,
    });

    expect(row.start_time).toBeNull();
    expect(row.end_time).toBeNull();
    expect(row.location_name).toBeNull();
    expect(row.notes).toBeNull();
    expect(row.booking_url).toBeNull();
  });

  it('drops NaN coordinates', () => {
    const row = mapActivityToDb({
      id: '1',
      dayId: '2',
      title: 'Test',
      timeSlot: 'evening',
      lat: Number.NaN,
      lng: Number.NaN,
    });

    expect(row.lat).toBeNull();
    expect(row.lng).toBeNull();
  });
});
