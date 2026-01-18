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

-- ============================================
-- TRAVEL DESIGNER TOOL SCHEMA
-- ============================================

-- Itineraries table
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  trip_length INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  travel_pace TEXT CHECK (travel_pace IN ('relaxed', 'moderate', 'balanced', 'active', 'packed')),
  budget TEXT CHECK (budget IN ('low', 'medium', 'high', 'luxury')),
  traveler_profiles TEXT[] NOT NULL,
  thumbnail_url TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT CHECK (category IN ('food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other')),
  duration_minutes INTEGER,
  estimated_cost_min DECIMAL(10, 2),
  estimated_cost_max DECIMAL(10, 2),
  booking_url TEXT,
  booking_required BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  custom_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Accommodations table
CREATE TABLE IF NOT EXISTS accommodations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('hotel', 'hostel', 'airbnb', 'guesthouse', 'resort', 'camping', 'other')),
  location TEXT NOT NULL,
  price_per_night DECIMAL(10, 2),
  check_in_date DATE,
  check_out_date DATE,
  booking_url TEXT,
  notes TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Atlas Files (curated itineraries) table
CREATE TABLE IF NOT EXISTS atlas_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  trip_length INTEGER NOT NULL,
  category TEXT,
  thumbnail_url TEXT,
  content JSONB,
  traveler_profiles TEXT[],
  is_premium BOOLEAN DEFAULT FALSE,
  author TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- AI Conversations table (for storing chat history with AI assistant)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on new tables
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlas_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for itineraries
CREATE POLICY "Users can view their own itineraries" ON itineraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own itineraries" ON itineraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries" ON itineraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries" ON itineraries
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for activities
CREATE POLICY "Users can view activities of their itineraries" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = activities.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activities to their itineraries" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = activities.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update activities of their itineraries" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = activities.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities of their itineraries" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = activities.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- RLS Policies for accommodations
CREATE POLICY "Users can manage accommodations of their itineraries" ON accommodations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = accommodations.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- RLS Policies for atlas_files
CREATE POLICY "Everyone can view published atlas files" ON atlas_files
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert atlas files" ON atlas_files
  FOR INSERT WITH CHECK (true);

-- RLS Policies for ai_conversations
CREATE POLICY "Users can manage conversations for their itineraries" ON ai_conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = ai_conversations.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_itinerary_id ON activities(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_activities_day_number ON activities(day_number);
CREATE INDEX IF NOT EXISTS idx_accommodations_itinerary_id ON accommodations(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_atlas_files_destination ON atlas_files(destination);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_itinerary_id ON ai_conversations(itinerary_id);
