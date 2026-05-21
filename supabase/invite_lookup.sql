-- Resolve invite code to trip (run after trip_invites.sql)

CREATE OR REPLACE FUNCTION public.lookup_trip_invite(invite_code TEXT)
RETURNS TABLE (trip_id UUID, role TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT ti.trip_id, ti.role
  FROM trip_invites ti
  WHERE UPPER(ti.invite_token) = UPPER(TRIM(invite_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_trip_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_trip_invite(TEXT) TO authenticated;
