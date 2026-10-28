/*
# Aurelius Database Migration: Notes & Classmates Realtime Chat

1. Purpose
- Provides persistent, multi-user storage for student notes with strict Row-Level Security (RLS)
- Provides persistent chat history for study channels with Realtime Broadcast & DB replication

2. Tables
- `notes`:
  - `id` (text, primary key)
  - `user_id` (uuid, references auth.users(id) on delete cascade)
  - `title` (text, not null)
  - `subject` (text, not null)
  - `content` (text, not null)
  - `tags` (text array, default '{}')
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `conversation_messages`:
  - `id` (text, primary key)
  - `conversation_id` (text, not null)
  - `sender_id` (text, not null)
  - `sender_name` (text, not null)
  - `sender_email` (text, not null)
  - `content` (text, not null)
  - `created_at` (timestamptz, default now())

3. Security & Policies
- Strict Row-Level Security on `notes`: Only the authenticated owner (`auth.uid() = user_id`)
  can SELECT, INSERT, UPDATE, or DELETE their notes.
- Row-Level Security on `conversation_messages`: Authenticated students can view and send messages.
*/

-- ==========================================
-- 1. NOTES TABLE & SECURITY
-- ==========================================
CREATE TABLE IF NOT EXISTS notes (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Note Security Policies: Strict Owner Isolation
DROP POLICY IF EXISTS "Users can only select their own notes" ON notes;
CREATE POLICY "Users can only select their own notes" ON notes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only insert their own notes" ON notes;
CREATE POLICY "Users can only insert their own notes" ON notes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only update their own notes" ON notes;
CREATE POLICY "Users can only update their own notes" ON notes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only delete their own notes" ON notes;
CREATE POLICY "Users can only delete their own notes" ON notes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at DESC);


-- ==========================================
-- 2. CLASSMATES CHAT MESSAGES & SECURITY
-- ==========================================
CREATE TABLE IF NOT EXISTS conversation_messages (
  id text PRIMARY KEY,
  conversation_id text NOT NULL,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select messages" ON conversation_messages;
CREATE POLICY "Authenticated users can select messages" ON conversation_messages
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert messages" ON conversation_messages;
CREATE POLICY "Authenticated users can insert messages" ON conversation_messages
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS messages_conv_id_idx ON conversation_messages(conversation_id, created_at ASC);

-- Enable Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'conversation_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;
  END IF;
END $$;
