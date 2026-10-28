/*
# Create shared_resources table (single-tenant, no auth)

1. Purpose
Campus Compass has a "Classmate Sharing" board where students post academic
resources (links, notes, etc.) for others to see. This is intentionally a
public, shared board — no sign-in is required to use the app — so rows are
visible and writable to anyone using the anon-key frontend.

2. New Tables
- `shared_resources`
  - `id` (uuid, primary key, default gen_random_uuid())
  - `title` (text, not null) — name of the resource
  - `subject` (text, not null) — academic subject / category
  - `link` (text, not null) — URL to the resource
  - `description` (text, default '') — short description
  - `author` (text, not null) — poster name (user-entered, no auth)
  - `created_at` (timestamptz, default now()) — creation time

3. Security
- Enable RLS on `shared_resources`.
- Grant SELECT, INSERT, DELETE to `anon` + `authenticated` so the anon-key
  frontend can read and post resources. (No UPDATE needed — resources are
  added/removed, not edited.)
- Policies use `USING (true)` / `WITH CHECK (true)` because the board is
  intentionally public and shared across all users (single-tenant, no auth).
  This is documented here as intentional, not as a fallback.

4. Notes
- No `user_id` column and no foreign keys to `auth.users`: the app has no
  sign-in screen, so there is no authenticated owner to scope to.
- Author is a free-text field the poster fills in.
*/

CREATE TABLE IF NOT EXISTS shared_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  link text NOT NULL,
  description text NOT NULL DEFAULT '',
  author text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON shared_resources TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_resources" ON shared_resources;
CREATE POLICY "anon_select_resources" ON shared_resources FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_resources" ON shared_resources;
CREATE POLICY "anon_insert_resources" ON shared_resources FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_resources" ON shared_resources;
CREATE POLICY "anon_delete_resources" ON shared_resources FOR DELETE
  TO anon, authenticated USING (true);
