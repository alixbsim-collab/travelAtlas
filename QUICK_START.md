# Travel Atlas - Quick Start Guide ⚡

## 🎯 Deploy in 5 Minutes

### Step 1: Database (2 minutes)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Copy entire content from `supabase/seed.sql`
4. Paste and click **RUN**
5. ✅ Done - Tables created!

### Step 2: Cloudflare Deploy (3 minutes)

**Option A: Dashboard (Recommended)**

1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Click **Create a project** → **Connect to Git**
3. Select your repo: `alixbsim-collab/travelAtlas`
4. Configure:
   ```
   Build command: cd frontend && npm install && npm run build
   Build output: frontend/build
   ```
5. Add environment variables:
   ```
   REACT_APP_SUPABASE_URL = [from Supabase Settings → API]
   REACT_APP_SUPABASE_ANON_KEY = [from Supabase Settings → API]
   REACT_APP_API_URL = [your Render backend URL]
   ```
6. Click **Save and Deploy**

**Option B: Command Line**

```bash
cd /Users/alixbinard/travel-atlas
./deploy-cloudflare.sh
```

Then add environment variables in Cloudflare Dashboard.

### Step 3: Test

Visit: `https://travel-atlas.pages.dev/designer`

---

## 🧪 Full SQL for Copy-Paste

```sql
-- Create itineraries table
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

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlas_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own itineraries" ON itineraries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own itineraries" ON itineraries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own itineraries" ON itineraries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own itineraries" ON itineraries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view activities of their itineraries" ON activities FOR SELECT USING (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = activities.itinerary_id AND itineraries.user_id = auth.uid()));
CREATE POLICY "Users can insert activities to their itineraries" ON activities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = activities.itinerary_id AND itineraries.user_id = auth.uid()));
CREATE POLICY "Users can update activities of their itineraries" ON activities FOR UPDATE USING (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = activities.itinerary_id AND itineraries.user_id = auth.uid()));
CREATE POLICY "Users can delete activities of their itineraries" ON activities FOR DELETE USING (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = activities.itinerary_id AND itineraries.user_id = auth.uid()));

CREATE POLICY "Users can manage accommodations of their itineraries" ON accommodations FOR ALL USING (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = accommodations.itinerary_id AND itineraries.user_id = auth.uid()));
CREATE POLICY "Everyone can view published atlas files" ON atlas_files FOR SELECT USING (true);
CREATE POLICY "Users can manage conversations for their itineraries" ON ai_conversations FOR ALL USING (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = ai_conversations.itinerary_id AND itineraries.user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX idx_activities_itinerary_id ON activities(itinerary_id);
CREATE INDEX idx_activities_day_number ON activities(day_number);
CREATE INDEX idx_accommodations_itinerary_id ON accommodations(itinerary_id);
CREATE INDEX idx_atlas_files_destination ON atlas_files(destination);
CREATE INDEX idx_ai_conversations_itinerary_id ON ai_conversations(itinerary_id);
```

---

## 📁 What You Built

### Pages
1. **Dashboard** (`/designer`) - Saved itineraries & Atlas Files
2. **Create Form** (`/designer/create`) - Trip preferences
3. **Planner** (`/designer/planner/:id`) - AI Assistant + Drag-Drop

### Features
- ✅ 11 traveler profiles (Beach Bum, Nature Lover, etc.)
- ✅ 5 travel pace options (Relaxed → Packed)
- ✅ 4 budget levels ($ → $$$$)
- ✅ AI itinerary generation (mock ready for real AI)
- ✅ Drag-and-drop activity planning
- ✅ Day-by-day timeline view
- ✅ Save, edit, duplicate, delete itineraries

---

## 🔧 Local Development

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm start

# Visit: http://localhost:3000/designer
```

---

## 🎨 Brand Colors

```css
Primary: #2563EB (blue)
Secondary: #DB2777 (pink)
Accent: #F59E0B (amber)
```

---

## 📦 Dependencies Installed

Frontend:
- `@dnd-kit/*` - Drag and drop
- `react-datepicker` - Date selection
- `lucide-react` - Icons

---

## 🚀 Next Steps After Deploy

1. ✅ Test the live site
2. 🔄 Integrate real AI (OpenAI/Claude)
3. 📝 Add sample Atlas Files
4. 🌍 Set up custom domain
5. 📊 Add analytics

---

## 💡 Pro Tips

**Auto-deploy on git push:**
- Connected to GitHub = automatic deployments
- Push to main → auto-deploy to production
- Create PR → get preview URL

**Environment variables:**
- Set in Cloudflare dashboard
- Separate for production/preview
- Never commit to git

**Debugging:**
- Check browser DevTools Console
- View Cloudflare build logs
- Check Supabase logs for database issues

---

## 📞 Need Help?

- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Supabase Docs: https://supabase.com/docs
- Full setup guide: See `TRAVEL_DESIGNER_SETUP.md`
- Deployment details: See `CLOUDFLARE_DEPLOYMENT.md`

---

**Your site:** `https://travel-atlas.pages.dev` 🎉
