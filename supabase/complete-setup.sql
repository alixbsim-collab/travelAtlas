-- ============================================
-- TRAVEL ATLAS - COMPLETE DATABASE SETUP
-- ============================================
-- This script sets up everything needed for the app:
-- - User authentication (handled by Supabase Auth automatically)
-- - All tables with proper relationships
-- - Row Level Security (RLS) policies
-- - Indexes for performance
-- - Sample data for testing
-- ============================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS atlas_files CASCADE;
DROP TABLE IF EXISTS accommodations CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS itineraries CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS favorite_places CASCADE;

-- ============================================
-- USER PROFILES TABLE
-- ============================================
-- Extends Supabase auth.users with additional profile info

CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  bio TEXT,
  country TEXT,
  favorite_destinations TEXT[],
  travel_style TEXT[], -- Array of traveler profile IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ITINERARIES TABLE
-- ============================================

CREATE TABLE itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  trip_length INTEGER NOT NULL CHECK (trip_length > 0 AND trip_length <= 365),
  start_date DATE,
  end_date DATE,
  travel_pace TEXT CHECK (travel_pace IN ('relaxed', 'moderate', 'balanced', 'active', 'packed')) DEFAULT 'balanced',
  budget TEXT CHECK (budget IN ('low', 'medium', 'high', 'luxury')) DEFAULT 'medium',
  traveler_profiles TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for itineraries
CREATE POLICY "Users can view their own itineraries" ON itineraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view published itineraries" ON itineraries
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Users can insert their own itineraries" ON itineraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries" ON itineraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries" ON itineraries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================

CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  position INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT CHECK (category IN ('food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other')) DEFAULT 'other',
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  estimated_cost_min DECIMAL(10, 2) CHECK (estimated_cost_min >= 0),
  estimated_cost_max DECIMAL(10, 2) CHECK (estimated_cost_max >= estimated_cost_min),
  booking_url TEXT,
  booking_required BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  custom_notes TEXT,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night', 'all-day')),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Users can view activities of their itineraries" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = activities.itinerary_id
      AND (itineraries.user_id = auth.uid() OR itineraries.is_published = TRUE)
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

-- ============================================
-- ACCOMMODATIONS TABLE
-- ============================================

CREATE TABLE accommodations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('hotel', 'hostel', 'airbnb', 'guesthouse', 'resort', 'camping', 'other')) DEFAULT 'hotel',
  location TEXT NOT NULL,
  price_per_night DECIMAL(10, 2) CHECK (price_per_night >= 0),
  check_in_date DATE,
  check_out_date DATE,
  booking_url TEXT,
  booking_reference TEXT,
  contact_info TEXT,
  notes TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accommodations
CREATE POLICY "Users can manage accommodations of their itineraries" ON accommodations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = accommodations.itinerary_id
      AND (itineraries.user_id = auth.uid() OR itineraries.is_published = TRUE)
    )
  );

-- ============================================
-- ATLAS FILES (CURATED CONTENT) TABLE
-- ============================================

CREATE TABLE atlas_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  trip_length INTEGER NOT NULL CHECK (trip_length > 0),
  category TEXT,
  thumbnail_url TEXT,
  cover_image_url TEXT,
  content JSONB, -- Can store rich content, markdown, etc.
  traveler_profiles TEXT[],
  is_premium BOOLEAN DEFAULT FALSE,
  author TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE atlas_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for atlas_files
CREATE POLICY "Everyone can view published atlas files" ON atlas_files
  FOR SELECT USING (published_at IS NOT NULL);

CREATE POLICY "Authors can view their own drafts" ON atlas_files
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert atlas files" ON atlas_files
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own atlas files" ON atlas_files
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own atlas files" ON atlas_files
  FOR DELETE USING (auth.uid() = author_id);

-- ============================================
-- AI CONVERSATIONS TABLE
-- ============================================

CREATE TABLE ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can manage conversations for their itineraries" ON ai_conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = ai_conversations.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User profiles
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- Itineraries
CREATE INDEX idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX idx_itineraries_destination ON itineraries(destination);
CREATE INDEX idx_itineraries_is_published ON itineraries(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_itineraries_created_at ON itineraries(created_at DESC);

-- Activities
CREATE INDEX idx_activities_itinerary_id ON activities(itinerary_id);
CREATE INDEX idx_activities_day_number ON activities(day_number);
CREATE INDEX idx_activities_category ON activities(category);
CREATE INDEX idx_activities_position ON activities(itinerary_id, day_number, position);

-- Accommodations
CREATE INDEX idx_accommodations_itinerary_id ON accommodations(itinerary_id);
CREATE INDEX idx_accommodations_dates ON accommodations(check_in_date, check_out_date);

-- Atlas Files
CREATE INDEX idx_atlas_files_destination ON atlas_files(destination);
CREATE INDEX idx_atlas_files_published ON atlas_files(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_atlas_files_author ON atlas_files(author_id);

-- AI Conversations
CREATE INDEX idx_ai_conversations_itinerary_id ON ai_conversations(itinerary_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accommodations_updated_at BEFORE UPDATE ON accommodations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atlas_files_updated_at BEFORE UPDATE ON atlas_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Sample Atlas Files (curated content)
INSERT INTO atlas_files (title, description, destination, trip_length, category, thumbnail_url, traveler_profiles, published_at, author) VALUES
(
  '10 Days in Japan: Cultural Immersion',
  'Experience the perfect blend of ancient traditions and modern innovation across Tokyo, Kyoto, and Osaka.',
  'Japan',
  10,
  'Cultural',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
  ARRAY['cultural-explorer', 'nature-lover'],
  NOW(),
  'Travel Atlas Team'
),
(
  'Bali Wellness Retreat: 7 Days of Bliss',
  'Rejuvenate your mind, body, and soul with yoga, meditation, and spa treatments in paradise.',
  'Bali, Indonesia',
  7,
  'Wellness',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
  ARRAY['wellness', 'beach-bum'],
  NOW(),
  'Travel Atlas Team'
),
(
  'European Backpacking Adventure: 14 Days',
  'Budget-friendly route through Paris, Amsterdam, Berlin, and Prague for the adventurous traveler.',
  'Europe',
  14,
  'Adventure',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a',
  ARRAY['backpacker', 'cultural-explorer'],
  NOW(),
  'Travel Atlas Team'
),
(
  'New Zealand Nature Expedition: 12 Days',
  'Explore breathtaking landscapes from Milford Sound to Tongariro National Park.',
  'New Zealand',
  12,
  'Nature',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
  ARRAY['nature-lover', 'active-globetrotter'],
  NOW(),
  'Travel Atlas Team'
),
(
  'Mediterranean Family Vacation: 10 Days',
  'Kid-friendly itinerary through coastal Spain and southern France with beaches and culture.',
  'Spain & France',
  10,
  'Family',
  'https://images.unsplash.com/photo-1530521954074-e64f6810b32d',
  ARRAY['family-traveler', 'beach-bum'],
  NOW(),
  'Travel Atlas Team'
);

-- ============================================
-- STORAGE BUCKETS (FOR USER UPLOADS)
-- ============================================

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for itinerary images
INSERT INTO storage.buckets (id, name, public)
VALUES ('itinerary-images', 'itinerary-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for itinerary images
CREATE POLICY "Itinerary images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'itinerary-images');

CREATE POLICY "Users can upload itinerary images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'itinerary-images'
    AND auth.uid() IS NOT NULL
  );

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Travel Atlas database setup complete!';
  RAISE NOTICE '📊 Tables created: user_profiles, itineraries, activities, accommodations, atlas_files, ai_conversations';
  RAISE NOTICE '🔐 RLS policies enabled for all tables';
  RAISE NOTICE '🚀 Sample Atlas Files data inserted';
  RAISE NOTICE '📦 Storage buckets created for avatars and images';
  RAISE NOTICE '🎉 Ready to use!';
END $$;
