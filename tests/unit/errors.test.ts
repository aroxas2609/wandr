import {
  getErrorMessage,
  isPermissionDenied,
  permissionDeniedError,
  PERMISSION_DENIED_CODE,
} from '@/lib/errors';

describe('getErrorMessage', () => {
  it('maps RLS errors to trip-save copy', () => {
    expect(
      getErrorMessage(
        { code: '42501', message: 'new row violates row-level security policy for table "trips"' },
        undefined,
        'trip-save'
      )
    ).toBe(
      'Only the trip owner or an editor can change trip details (name, destination, dates, budget, and cover photo).'
    );
  });

  it('maps PGRST116 to trip-delete copy', () => {
    expect(
      getErrorMessage(
        { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
        undefined,
        'trip-delete'
      )
    ).toBe('Only the trip owner can delete this trip.');
  });

  it('maps permissionDeniedError to context message', () => {
    const err = permissionDeniedError('trip-invite');
    expect((err as Error & { code: string }).code).toBe(PERMISSION_DENIED_CODE);
    expect(getErrorMessage(err, undefined, 'trip-invite')).toBe(
      'Only the trip owner or an editor can invite people to this trip.'
    );
  });

  it('uses context fallback when message is unknown', () => {
    expect(getErrorMessage({}, undefined, 'trip-save')).toBe(
      'Could not save trip changes. Check your connection and try again.'
    );
  });

  it('returns session message for auth errors', () => {
    expect(getErrorMessage({ code: 'PGRST301', message: 'JWT expired' })).toBe(
      'Your session expired. Sign in again and retry.'
    );
  });

  it('detects permission denied via isPermissionDenied', () => {
    expect(isPermissionDenied({ code: 'PGRST116' })).toBe(true);
    expect(isPermissionDenied(permissionDeniedError())).toBe(true);
    expect(isPermissionDenied({ message: 'network request failed' })).toBe(false);
  });
});
