-- Allow invited users to join a trip via invite code (run after trip_invites.sql + invite_lookup.sql)
-- Client-side INSERT into trip_members is blocked by RLS ("Owners manage members").

CREATE OR REPLACE FUNCTION public.join_trip_by_invite(invite_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id UUID;
  v_role TEXT;
  v_invite_id UUID;
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT ti.trip_id, ti.role, ti.id
  INTO v_trip_id, v_role, v_invite_id
  FROM trip_invites ti
  WHERE UPPER(ti.invite_token) = UPPER(TRIM(invite_code))
  LIMIT 1;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code' USING ERRCODE = '22023';
  END IF;

  INSERT INTO trip_members (trip_id, user_id, role)
  VALUES (v_trip_id, v_uid, COALESCE(NULLIF(v_role, ''), 'viewer'))
  ON CONFLICT (trip_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;

  DELETE FROM trip_invites WHERE id = v_invite_id;

  RETURN v_trip_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_trip_by_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_trip_by_invite(TEXT) TO authenticated;
