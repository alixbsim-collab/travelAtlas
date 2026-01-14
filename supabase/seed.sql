-- Example seed data for Travel Atlas
-- This file will be used to populate your database with initial data

-- Create destinations table example
CREATE TABLE IF NOT EXISTS destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert sample destinations
INSERT INTO destinations (name, country, description, latitude, longitude) VALUES
  ('Paris', 'France', 'The City of Light', 48.8566, 2.3522),
  ('Tokyo', 'Japan', 'Modern metropolis with ancient temples', 35.6762, 139.6503),
  ('New York', 'USA', 'The Big Apple', 40.7128, -74.0060);

-- Add RLS (Row Level Security) policies
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON destinations
  FOR SELECT USING (true);
