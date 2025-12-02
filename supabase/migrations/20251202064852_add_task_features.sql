/*
  # Add Task Features Migration

  1. Changes to Tasks Table
    - Add `due_date` (timestamp with time zone, nullable)
    - Add `start_date` (timestamp with time zone, nullable)
    - Add `priority` (text, default 'Medium', check constraint for Low/Medium/High/Urgent)
    - Add `tags` (text array, nullable)
    
  2. New Tables
    - `task_comments`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `user_id` (uuid, foreign key to auth.users)
      - `user_email` (text, for display)
      - `comment_text` (text)
      - `created_at` (timestamp with time zone)
      
  3. Security
    - Enable RLS on `task_comments` table
    - Add policies for authenticated users to read/write their own comments
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN due_date timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN start_date timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE tasks ADD COLUMN priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'tags'
  ) THEN
    ALTER TABLE tasks ADD COLUMN tags text[];
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  user_email text NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'task_comments' AND policyname = 'Users can view comments on their tasks'
  ) THEN
    CREATE POLICY "Users can view comments on their tasks"
      ON task_comments
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM tasks
          WHERE tasks.id = task_comments.task_id
          AND tasks.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'task_comments' AND policyname = 'Users can add comments to their tasks'
  ) THEN
    CREATE POLICY "Users can add comments to their tasks"
      ON task_comments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM tasks
          WHERE tasks.id = task_comments.task_id
          AND tasks.user_id = auth.uid()
        )
        AND auth.uid() = user_id
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'task_comments' AND policyname = 'Users can update their own comments'
  ) THEN
    CREATE POLICY "Users can update their own comments"
      ON task_comments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'task_comments' AND policyname = 'Users can delete their own comments'
  ) THEN
    CREATE POLICY "Users can delete their own comments"
      ON task_comments
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
