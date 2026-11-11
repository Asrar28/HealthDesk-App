/*
# HealthDesk — Initial Schema

## Overview
Creates the full database schema for HealthDesk, a family healthcare planner app.
All user-owned tables are private to each authenticated user (owner_id == auth.uid()).
Shared tables (facilities, articles) have role-based access control.

## New Tables

1. profiles — User profile with role (member/editor/reviewer/admin). Role column not client-writable.
2. family_members — Family profiles (display name, relationship, birth year, avatar). No medical history.
3. reminders — Preventive health reminders with recurrence, lead time, snooze, completion.
4. user_settings — Notification & privacy preferences per user.
5. facilities — Healthcare facilities (shared, admin-managed via functions).
6. articles — Health Library articles with editorial workflow.
7. article_bookmarks — User bookmarks (owner-scoped).
8. notifications — In-app notifications (owner-scoped).
9. push_subscriptions — FCM device tokens (owner-scoped).

## Security
- RLS enabled on all tables.
- Owner-scoped tables: user_id/owner_id DEFAULT auth.uid(), CRUD to authenticated only.
- profiles: role column revoked from client UPDATE; changed only via set_user_role().
- facilities: SELECT to all authenticated; writes only via admin SECURITY DEFINER functions.
- articles: SELECT published or own; content columns insertable/updatable by author;
  review_status and reviewer fields only via workflow functions.
*/

-- ==================== PROFILES ====================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'editor', 'reviewer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profiles TO authenticated;
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name) ON profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ==================== FAMILY MEMBERS ====================
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  relationship text NOT NULL,
  birth_year int,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON family_members TO authenticated;

DROP POLICY IF EXISTS "family_members_select_own" ON family_members;
CREATE POLICY "family_members_select_own" ON family_members FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "family_members_insert_own" ON family_members;
CREATE POLICY "family_members_insert_own" ON family_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "family_members_update_own" ON family_members;
CREATE POLICY "family_members_update_own" ON family_members FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "family_members_delete_own" ON family_members;
CREATE POLICY "family_members_delete_own" ON family_members FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- ==================== REMINDERS ====================
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('General health checkup','Vaccination','Blood pressure screening','Blood glucose screening','Dental','Eye','Follow-up','Wellness','Nutrition','Custom')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','snoozed')),
  due_date timestamptz NOT NULL,
  lead_time text NOT NULL DEFAULT 'at_time' CHECK (lead_time IN ('at_time','15_min','1_hour','1_day','1_week')),
  recurrence text NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekly','monthly','yearly')),
  notes text,
  snoozed_until timestamptz,
  completed_at timestamptz,
  next_due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON reminders TO authenticated;

DROP POLICY IF EXISTS "reminders_select_own" ON reminders;
CREATE POLICY "reminders_select_own" ON reminders FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "reminders_insert_own" ON reminders;
CREATE POLICY "reminders_insert_own" ON reminders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "reminders_update_own" ON reminders;
CREATE POLICY "reminders_update_own" ON reminders FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "reminders_delete_own" ON reminders;
CREATE POLICY "reminders_delete_own" ON reminders FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_reminders_owner_date ON reminders(owner_id, due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_owner_status ON reminders(owner_id, status);

-- ==================== USER SETTINGS ====================
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_reminders boolean NOT NULL DEFAULT true,
  notify_overdue boolean NOT NULL DEFAULT true,
  notify_articles boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT false,
  privacy_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;

DROP POLICY IF EXISTS "user_settings_select_own" ON user_settings;
CREATE POLICY "user_settings_select_own" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_settings_insert_own" ON user_settings;
CREATE POLICY "user_settings_insert_own" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_settings_update_own" ON user_settings;
CREATE POLICY "user_settings_update_own" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ==================== FACILITIES ====================
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Government Hospital','PHC','CHC','Private Hospital','Clinic','Diagnostic Lab','Pharmacy','Blood Bank','Specialist','Emergency')),
  address text NOT NULL,
  locality text,
  city text,
  district text,
  state text,
  pincode text,
  phone text,
  website text,
  lat double precision,
  lng double precision,
  services text[] NOT NULL DEFAULT '{}',
  opening_hours jsonb,
  emergency_info text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','unverified')),
  source text,
  last_verified timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON facilities TO authenticated;

DROP POLICY IF EXISTS "facilities_select_all" ON facilities;
CREATE POLICY "facilities_select_all" ON facilities FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities(category);
CREATE INDEX IF NOT EXISTS idx_facilities_pincode ON facilities(pincode);

-- ==================== ARTICLES ====================
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  body text NOT NULL,
  category text NOT NULL CHECK (category IN ('Preventive','Diabetes','BP & Heart','Nutrition','Activity','Hygiene','Communicable Disease','Vaccination','Mental Wellbeing','Healthy Ageing','Women''s Health','Children''s Health')),
  tags text[] NOT NULL DEFAULT '{}',
  language text NOT NULL DEFAULT 'en',
  source_title text,
  source_url text,
  review_status text NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft','submitted','awaiting_review','approved','published','rejected','archived')),
  reviewer_role text,
  review_date timestamptz,
  version int NOT NULL DEFAULT 1,
  reading_time int NOT NULL DEFAULT 5,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON articles TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON articles FROM authenticated;
GRANT INSERT (title, summary, body, category, tags, language, source_title, source_url, reading_time) ON articles TO authenticated;
GRANT UPDATE (title, summary, body, category, tags, language, source_title, source_url, reading_time) ON articles TO authenticated;

DROP POLICY IF EXISTS "articles_select_published_or_own" ON articles;
CREATE POLICY "articles_select_published_or_own" ON articles FOR SELECT
  TO authenticated USING (
    review_status = 'published' OR author_id = auth.uid()
  );

DROP POLICY IF EXISTS "articles_insert_own" ON articles;
CREATE POLICY "articles_insert_own" ON articles FOR INSERT
  TO authenticated WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "articles_update_own_content" ON articles;
CREATE POLICY "articles_update_own_content" ON articles FOR UPDATE
  TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(review_status);

-- ==================== ARTICLE BOOKMARKS ====================
CREATE TABLE IF NOT EXISTS article_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

ALTER TABLE article_bookmarks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON article_bookmarks TO authenticated;

DROP POLICY IF EXISTS "bookmarks_select_own" ON article_bookmarks;
CREATE POLICY "bookmarks_select_own" ON article_bookmarks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON article_bookmarks;
CREATE POLICY "bookmarks_insert_own" ON article_bookmarks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON article_bookmarks;
CREATE POLICY "bookmarks_delete_own" ON article_bookmarks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- ==================== PUSH SUBSCRIPTIONS ====================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON push_subscriptions TO authenticated;

DROP POLICY IF EXISTS "push_select_own" ON push_subscriptions;
CREATE POLICY "push_select_own" ON push_subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_insert_own" ON push_subscriptions;
CREATE POLICY "push_insert_own" ON push_subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_delete_own" ON push_subscriptions;
CREATE POLICY "push_delete_own" ON push_subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
