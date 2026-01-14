-- Travel Atlas Database Schema
-- This file will be used to populate your database with initial data

-- Create favorite_places table
CREATE TABLE IF NOT EXISTS favorite_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add RLS (Row Level Security) policies
ALTER TABLE favorite_places ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read favorite places
CREATE POLICY "Enable read access for all users" ON favorite_places
  FOR SELECT USING (true);

-- Allow anyone to insert favorite places
CREATE POLICY "Enable insert access for all users" ON favorite_places
  FOR INSERT WITH CHECK (true);
