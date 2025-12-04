/*
  # Create meetings table for calendar functionality

  1. New Tables
    - `meetings`
      - `id` (uuid, primary key) - Unique identifier for each meeting
      - `user_id` (uuid, foreign key) - References auth.users
      - `title` (text) - Meeting title
      - `description` (text) - Meeting description
      - `date` (date) - Meeting date
      - `time` (text) - Meeting time
      - `created_at` (timestamptz) - Timestamp of creation

  2. Security
    - Enable RLS on `meetings` table
    - Add policy for authenticated users to read their own meetings
    - Add policy for authenticated users to insert their own meetings
    - Add policy for authenticated users to update their own meetings
    - Add policy for authenticated users to delete their own meetings
*/

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  date date NOT NULL,
  time text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
  ON meetings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings"
  ON meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings"
  ON meetings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings"
  ON meetings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);