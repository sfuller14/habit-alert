/*
  # Initial Schema for Habit Tracker App

  1. New Tables
    - `users` - Extends Supabase auth.users with additional user information
    - `habits` - Stores habit information including notification preferences
    - `habit_entries` - Stores individual habit tracking entries

  2. Security
    - Enable RLS on all tables
    - Policies to ensure users can only access their own data
*/

-- Users table to extend auth.users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habits table to store habit information
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('yes_no', 'scale', 'numeric')),
  notification_frequency TEXT NOT NULL CHECK (notification_frequency IN ('daily', 'weekly', 'monthly')),
  times_per_day INTEGER DEFAULT 1,
  notification_times TEXT[] DEFAULT ARRAY['12:00'],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habit entries table to store tracking data
CREATE TABLE IF NOT EXISTS habit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index on habit entries for faster querying
CREATE INDEX IF NOT EXISTS habit_entries_habit_id_idx ON habit_entries(habit_id);
CREATE INDEX IF NOT EXISTS habit_entries_date_idx ON habit_entries(date);

-- Create index on habits for faster user filtering
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Habits table policies
CREATE POLICY "Users can create their own habits"
  ON habits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own habits"
  ON habits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON habits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON habits
  FOR DELETE
  USING (auth.uid() = user_id);

-- Habit entries policies
CREATE POLICY "Users can create entries for their habits"
  ON habit_entries
  FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM habits WHERE id = habit_id)
  );

CREATE POLICY "Users can view entries for their habits"
  ON habit_entries
  FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM habits WHERE id = habit_id)
  );

CREATE POLICY "Users can update entries for their habits"
  ON habit_entries
  FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM habits WHERE id = habit_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM habits WHERE id = habit_id)
  );

CREATE POLICY "Users can delete entries for their habits"
  ON habit_entries
  FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM habits WHERE id = habit_id)
  );

-- Create a trigger to automatically add new auth users to our users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();