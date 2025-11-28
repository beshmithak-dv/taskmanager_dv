/*
  # Create Complete Task Management Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `created_at` (timestamp)
    - `client_categories`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `category` (text: 'tasks', 'gtm', 'recurring')
      - `created_at` (timestamp)
    - `tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `client_id` (uuid, references clients)
      - `category` (text: 'tasks', 'gtm', 'recurring')
      - `name` (text)
      - `description` (text)
      - `assignee` (text)
      - `status` (text: 'Pending', 'In-Progress', 'Completed')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own clients and tasks
    - Policies ensure data isolation per user

  3. Automation
    - Trigger automatically creates 3 categories when a client is created
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create client_categories table
CREATE TABLE IF NOT EXISTS client_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('tasks', 'gtm', 'recurring')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, category)
);

ALTER TABLE client_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories of their clients"
  ON client_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_categories.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create categories for their clients"
  ON client_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'tasks' CHECK (category IN ('tasks', 'gtm', 'recurring')),
  name text NOT NULL,
  description text DEFAULT '',
  assignee text DEFAULT '',
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In-Progress', 'Completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically create categories when a client is created
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_categories (client_id, category)
  VALUES 
    (NEW.id, 'tasks'),
    (NEW.id, 'gtm'),
    (NEW.id, 'recurring');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS create_categories_on_client_insert ON clients;
CREATE TRIGGER create_categories_on_client_insert
AFTER INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION create_default_categories();