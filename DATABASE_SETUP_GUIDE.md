# 🗄️ Complete Database Setup Guide

## 📋 What This Sets Up

The `complete-setup.sql` script creates:

✅ **User Authentication** (via Supabase Auth)
✅ **User Profiles** - Extended user info beyond auth
✅ **Itineraries** - User's trip plans
✅ **Activities** - Daily activities in trips
✅ **Accommodations** - Hotels, hostels, etc.
✅ **Atlas Files** - Curated travel content
✅ **AI Conversations** - Chat history with AI
✅ **Storage Buckets** - For avatars & images
✅ **RLS Policies** - Secure row-level access control
✅ **Indexes** - For fast queries
✅ **Sample Data** - 5 example Atlas Files

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Go to Supabase

1. Visit https://supabase.com/dashboard
2. Select your Travel Atlas project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Complete Setup Script

1. Click **New Query** (+ icon)
2. Copy the **ENTIRE** content from:
   - File: `/Users/alixbinard/travel-atlas/supabase/complete-setup.sql`
3. Paste into the SQL Editor
4. Click **RUN** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Setup

After running, you should see:
```
✅ Travel Atlas database setup complete!
📊 Tables created: user_profiles, itineraries, activities, accommodations, atlas_files, ai_conversations
🔐 RLS policies enabled for all tables
🚀 Sample Atlas Files data inserted
📦 Storage buckets created for avatars and images
🎉 Ready to use!
```

### Step 4: Check Tables

1. Click **Table Editor** in left sidebar
2. You should see these tables:
   - `user_profiles`
   - `itineraries`
   - `activities`
   - `accommodations`
   - `atlas_files`
   - `ai_conversations`

---

## 📊 Database Schema

### Tables Overview

```
auth.users (Supabase built-in)
    ↓
user_profiles (extends auth.users)
    ↓
itineraries (user's trips)
    ├─→ activities (daily activities)
    ├─→ accommodations (hotels, etc.)
    └─→ ai_conversations (chat history)

atlas_files (curated content - separate)
```

### Table Details

#### **user_profiles**
Extended user information beyond Supabase auth:
- Username, full name, avatar
- Preferred currency, country
- Bio, favorite destinations
- Travel style preferences
- **Auto-created** when user signs up

#### **itineraries**
User's trip plans:
- Destination, trip length, dates
- Travel pace (relaxed → packed)
- Budget level ($ → $$$$)
- Traveler profiles (array)
- Published/favorite flags
- Thumbnail, notes

#### **activities**
Daily activities in trips:
- Day number, position (for sorting)
- Title, description, location
- Category (food, culture, nature, etc.)
- Duration, estimated costs
- Booking URL, lat/long coordinates
- Completion status

#### **accommodations**
Where users stay:
- Name, type (hotel, hostel, airbnb, etc.)
- Location, price per night
- Check-in/out dates
- Booking reference, contact info
- Rating, coordinates

#### **atlas_files**
Curated travel content:
- Pre-made itineraries
- Travel guides
- Inspiration articles
- Can be premium (paid)
- View counts, likes
- Published status

#### **ai_conversations**
Chat history with AI assistant:
- Linked to specific itinerary
- Messages stored as JSONB
- Conversation context preserved

---

## 🔐 Security (Row Level Security)

### What is RLS?

**Row Level Security** ensures users can only access their own data.

### Policies Applied

✅ **user_profiles**: Users see only their own profile
✅ **itineraries**: Users see their own trips + published ones
✅ **activities**: Users manage activities in their trips
✅ **accommodations**: Users manage their own accommodations
✅ **atlas_files**: Everyone sees published, authors manage their own
✅ **ai_conversations**: Users access only their own chats

### Why This Matters

- ✅ User A can't see User B's private trips
- ✅ Published itineraries are visible to everyone
- ✅ Database is secure even if frontend has bugs
- ✅ No need for backend permission checks

---

## 🎯 Sample Data Included

The script adds **5 example Atlas Files**:

1. **10 Days in Japan** - Cultural immersion
2. **Bali Wellness Retreat** - 7 days of bliss
3. **European Backpacking** - 14-day budget adventure
4. **New Zealand Nature** - 12-day expedition
5. **Mediterranean Family Vacation** - 10 days

These appear in the Atlas Files section for inspiration!

---

## 📦 Storage Buckets

Two storage buckets are created:

### **avatars**
- User profile pictures
- Users upload to their own folder: `avatars/{user_id}/`
- Publicly accessible

### **itinerary-images**
- Trip photos, thumbnails
- Users can upload when authenticated
- Publicly accessible

**Upload from frontend:**
```javascript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${user.id}/avatar.jpg`, file)
```

---

## 🔄 Automatic Features

### 1. Auto-Create User Profile

When a user signs up via Supabase Auth:
```
User signs up → Trigger fires → Profile created automatically
```

### 2. Auto-Update Timestamps

All tables have `updated_at` that auto-updates:
```
Record updated → Trigger fires → updated_at = now()
```

---

## ✅ Testing Your Setup

### Test 1: Create a Test User

1. In Supabase, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Email: `test@travelatlas.com`
4. Password: `test123456`
5. Click **Create user**

### Test 2: Check Auto-Created Profile

1. Go to **Table Editor** → `user_profiles`
2. You should see a new row for the test user
3. This was auto-created by the trigger!

### Test 3: View Sample Atlas Files

1. Go to **Table Editor** → `atlas_files`
2. You should see 5 rows (sample data)
3. These appear in the app's Atlas Files section

### Test 4: Test RLS

Try querying from SQL Editor:
```sql
-- This will only show YOUR data (if logged in)
SELECT * FROM itineraries;

-- This shows ALL published atlas files
SELECT * FROM atlas_files WHERE published_at IS NOT NULL;
```

---

## 🐛 Troubleshooting

### "Relation already exists" Error

**Means:** Tables already exist

**Fix:**
1. The script has `DROP TABLE IF EXISTS` at the top
2. It will drop and recreate tables
3. ⚠️ This **deletes all data** in those tables
4. Make sure this is what you want!

**Alternative (safer):**
Comment out the DROP statements if you want to keep data:
```sql
-- DROP TABLE IF EXISTS ai_conversations CASCADE;
-- DROP TABLE IF EXISTS atlas_files CASCADE;
-- etc.
```

### "Permission denied" Error

**Means:** Your Supabase user doesn't have permission

**Fix:**
1. Make sure you're the project owner
2. Try running as `postgres` user (should be default)

### RLS Prevents Access

**Means:** RLS is working correctly!

**Fix:**
- Use Supabase client in your app (handles auth automatically)
- RLS uses `auth.uid()` to identify current user
- Anonymous queries see only public data

### No Sample Data

**Check:**
1. Look at `atlas_files` table
2. Run just the INSERT statements manually
3. Make sure `published_at` is not NULL

---

## 🔄 Updating the Schema Later

If you need to add columns or tables:

### Option 1: Migrations (Recommended)

Use Supabase migrations:
```sql
-- Create a new migration
ALTER TABLE itineraries ADD COLUMN tags TEXT[];
```

### Option 2: Manual Updates

Add columns via Table Editor or SQL Editor

### Option 3: Re-run Script

⚠️ **Destroys all data!**
Only for development/testing.

---

## 📖 Next Steps

After database setup:

1. ✅ **Test authentication** - Sign up a user in your app
2. ✅ **Create an itinerary** - Test the full flow
3. ✅ **Check RLS** - Verify data is private
4. ✅ **Upload an avatar** - Test storage buckets
5. ✅ **View Atlas Files** - Should show sample data

---

## 🎯 Quick Commands

### View All Tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Count Records
```sql
SELECT
  'itineraries' as table, COUNT(*) as count FROM itineraries
UNION ALL
SELECT 'activities', COUNT(*) FROM activities
UNION ALL
SELECT 'atlas_files', COUNT(*) FROM atlas_files;
```

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

---

## ✨ You're All Set!

Your database is now fully configured with:
- ✅ Authentication ready
- ✅ All tables created
- ✅ Security policies active
- ✅ Sample data loaded
- ✅ Storage configured

**Ready to test?** Go to https://travel-atlas.pages.dev and start planning!
