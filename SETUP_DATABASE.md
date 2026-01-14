# Database Setup Instructions

Before testing the app, you need to create the database table in Supabase.

## Quick Setup (2 minutes)

1. Go to your Supabase dashboard: https://gfjtvnpuyzfuevniolbd.supabase.co

2. Click on **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy and paste this SQL:

```sql
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
```

5. Click **Run** (or press Cmd/Ctrl + Enter)

6. You should see "Success. No rows returned"

## Verify Setup

1. Go to **Table Editor** in the left sidebar
2. You should see the `favorite_places` table
3. Click on it to see the columns: `id`, `place_name`, `created_at`

That's it! Your database is ready.

## Test the App

Now you can test the app locally or wait for deployment to see it live on Cloudflare Pages.
