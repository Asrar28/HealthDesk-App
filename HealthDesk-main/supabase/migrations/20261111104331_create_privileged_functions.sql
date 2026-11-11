/*
# HealthDesk — Privileged Functions

## Overview
Creates SECURITY DEFINER functions for privileged operations that cannot be done
through direct client API calls due to column-level privilege restrictions.

## Functions

1. set_user_role(p_user_id, p_role) — Admin-only role assignment
2. admin_insert_facility(p_data jsonb) — Admin-only facility creation
3. admin_update_facility(p_facility_id, p_data jsonb) — Admin-only facility update
4. admin_delete_facility(p_facility_id) — Admin-only facility deletion
5. admin_verify_facility(p_facility_id, p_status) — Admin-only verification status update
6. submit_article_for_review(p_article_id) — Editor submits draft
7. review_article(p_article_id, p_action, p_notes) — Reviewer approves/rejects
8. publish_article(p_article_id) — Admin/reviewer publishes approved article
9. archive_article(p_article_id) — Admin/reviewer archives article

## Security
- All functions are SECURITY DEFINER with SET search_path = public
- All functions check the caller's role via auth.uid() before acting
- EXECUTE revoked from PUBLIC and anon; granted to authenticated only
*/

-- Helper: check if caller is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper: check if caller is reviewer or admin
CREATE OR REPLACE FUNCTION is_reviewer_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('reviewer', 'admin')
  );
$$;

-- ==================== ROLE MANAGEMENT ====================
CREATE OR REPLACE FUNCTION set_user_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_role NOT IN ('member', 'editor', 'reviewer', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  UPDATE profiles SET role = p_role WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_user_role(uuid, text) TO authenticated;

-- ==================== FACILITY MANAGEMENT ====================
-- Grant service_role full access for edge functions, and grant authenticated via functions
GRANT INSERT, UPDATE, DELETE ON facilities TO service_role;

CREATE OR REPLACE FUNCTION admin_insert_facility(p_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO facilities (
    name, category, address, locality, city, district, state, pincode,
    phone, website, lat, lng, services, opening_hours, emergency_info,
    verification_status, source
  ) VALUES (
    p_data->>'name',
    p_data->>'category',
    p_data->>'address',
    p_data->>'locality',
    p_data->>'city',
    p_data->>'district',
    p_data->>'state',
    p_data->>'pincode',
    p_data->>'phone',
    p_data->>'website',
    (p_data->>'lat')::double precision,
    (p_data->>'lng')::double precision,
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_data->'services')), ARRAY[]::text[]),
    p_data->'opening_hours',
    p_data->>'emergency_info',
    COALESCE(p_data->>'verification_status', 'pending'),
    p_data->>'source'
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_insert_facility(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_insert_facility(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION admin_update_facility(p_facility_id uuid, p_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE facilities SET
    name = COALESCE(p_data->>'name', name),
    category = COALESCE(p_data->>'category', category),
    address = COALESCE(p_data->>'address', address),
    locality = COALESCE(p_data->>'locality', locality),
    city = COALESCE(p_data->>'city', city),
    district = COALESCE(p_data->>'district', district),
    state = COALESCE(p_data->>'state', state),
    pincode = COALESCE(p_data->>'pincode', pincode),
    phone = COALESCE(p_data->>'phone', phone),
    website = COALESCE(p_data->>'website', website),
    lat = CASE WHEN p_data ? 'lat' THEN (p_data->>'lat')::double precision ELSE lat END,
    lng = CASE WHEN p_data ? 'lng' THEN (p_data->>'lng')::double precision ELSE lng END,
    services = CASE WHEN p_data ? 'services' THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'services')) ELSE services END,
    opening_hours = COALESCE(p_data->'opening_hours', opening_hours),
    emergency_info = COALESCE(p_data->>'emergency_info', emergency_info),
    updated_at = now()
  WHERE id = p_facility_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_update_facility(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_update_facility(uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION admin_delete_facility(p_facility_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM facilities WHERE id = p_facility_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_delete_facility(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_delete_facility(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION admin_verify_facility(p_facility_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_status NOT IN ('pending', 'verified', 'unverified') THEN
    RAISE EXCEPTION 'Invalid verification status';
  END IF;
  UPDATE facilities SET
    verification_status = p_status,
    last_verified = now(),
    updated_at = now()
  WHERE id = p_facility_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_verify_facility(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_verify_facility(uuid, text) TO authenticated;

-- ==================== ARTICLE WORKFLOW ====================
-- Grant service_role full access for edge functions
GRANT UPDATE, DELETE ON articles TO service_role;

-- Editor submits draft for review (draft -> submitted)
CREATE OR REPLACE FUNCTION submit_article_for_review(p_article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM articles a
    JOIN profiles p ON p.id = auth.uid()
    WHERE a.id = p_article_id
    AND a.author_id = auth.uid()
    AND p.role IN ('editor', 'reviewer', 'admin')
    AND a.review_status IN ('draft', 'rejected')
  ) THEN
    RAISE EXCEPTION 'Not authorized or invalid state';
  END IF;
  UPDATE articles SET
    review_status = 'submitted',
    updated_at = now()
  WHERE id = p_article_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_article_for_review(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION submit_article_for_review(uuid) TO authenticated;

-- Reviewer approves or rejects (submitted -> approved/rejected)
CREATE OR REPLACE FUNCTION review_article(p_article_id uuid, p_action text, p_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_reviewer_role text;
BEGIN
  SELECT role INTO v_reviewer_role FROM profiles WHERE id = auth.uid();
  IF v_reviewer_role NOT IN ('reviewer', 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;
  IF p_action = 'approve' THEN
    UPDATE articles SET
      review_status = 'approved',
      reviewer_role = v_reviewer_role,
      review_date = now(),
      updated_at = now()
    WHERE id = p_article_id AND review_status = 'submitted';
  ELSE
    UPDATE articles SET
      review_status = 'rejected',
      reviewer_role = v_reviewer_role,
      review_date = now(),
      updated_at = now()
    WHERE id = p_article_id AND review_status = 'submitted';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION review_article(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION review_article(uuid, text, text) TO authenticated;

-- Admin/reviewer publishes approved article (approved -> published)
CREATE OR REPLACE FUNCTION publish_article(p_article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_reviewer_or_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE articles SET
    review_status = 'published',
    version = version + 1,
    updated_at = now()
  WHERE id = p_article_id AND review_status = 'approved';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Article not found or not in approved state';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION publish_article(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION publish_article(uuid) TO authenticated;

-- Admin/reviewer archives article (published -> archived)
CREATE OR REPLACE FUNCTION archive_article(p_article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_reviewer_or_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE articles SET
    review_status = 'archived',
    updated_at = now()
  WHERE id = p_article_id AND review_status = 'published';
END;
$$;

REVOKE EXECUTE ON FUNCTION archive_article(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION archive_article(uuid) TO authenticated;
