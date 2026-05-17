-- Lets trip owners look up a Wandr user by email when sending invites.
-- Without this, RLS blocks reading other rows in public.users.
-- Run this entire file in Supabase SQL Editor (after schema.sql + policies.sql).
--
-- If you see: column reference "id" is ambiguous — re-run this file (old PL/pgSQL version).
-- If you see: SELECT is not allowed in a non-volatile function — re-run (must not be STABLE; it writes).

DROP FUNCTION IF EXISTS public.find_user_by_email(TEXT);

CREATE OR REPLACE FUNCTION public.find_user_by_email(lookup_email TEXT)
RETURNS TABLE (user_id UUID, full_name TEXT, email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH auth_match AS (
    SELECT
      au.id AS auth_id,
      au.email AS auth_email,
      COALESCE(au.raw_user_meta_data->>'full_name', 'Traveler') AS auth_full_name
    FROM auth.users AS au
    WHERE lower(trim(au.email)) = lower(trim(lookup_email))
    LIMIT 1
  ),
  upserted AS (
    INSERT INTO public.users AS pu (id, email, full_name)
    SELECT auth_id, auth_email, auth_full_name
    FROM auth_match
    ON CONFLICT ON CONSTRAINT users_pkey DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = COALESCE(pu.full_name, EXCLUDED.full_name)
    RETURNING pu.id, pu.full_name, pu.email
  )
  SELECT upserted.id AS user_id, upserted.full_name, upserted.email
  FROM upserted;
$$;

REVOKE ALL ON FUNCTION public.find_user_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO authenticated;
