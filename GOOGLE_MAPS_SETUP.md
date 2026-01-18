# 🗺️ Google Maps Integration Setup

## What's Been Added

- ✅ **Interactive Map View** - Toggle between list and map views in the planner
- ✅ **Activity Markers** - Each activity appears on the map with custom pins
- ✅ **Category Visual Indicators** - Pins show category emojis and colors
- ✅ **Day Numbers** - Small badges show which day each activity is on
- ✅ **Info Windows** - Click markers to see activity details
- ✅ **Auto-Centering** - Map automatically centers on all activities

---

## 🔑 Get Your Google Maps API Key (Free Tier)

Google Maps offers **$200 free credit per month**, which is plenty for a small app.

### Step 1: Go to Google Cloud Console

1. Visit https://console.cloud.google.com/
2. Sign in with your Google account
3. Accept the Terms of Service if prompted

### Step 2: Create a New Project

1. Click the project dropdown at the top (says "Select a project")
2. Click **New Project**
3. Name it: `Travel Atlas`
4. Click **Create**
5. Wait for the project to be created (~10 seconds)
6. Select your new project from the dropdown

### Step 3: Enable Google Maps APIs

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Maps JavaScript API** (required for the map)
   - **Places API** (optional - for location autocomplete later)
   - **Geocoding API** (optional - for converting addresses to coordinates)

For each API:
- Click on it
- Click **Enable**
- Wait for it to enable

### Step 4: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **API key**
4. Your API key will be created (starts with `AIza...`)
5. **Copy the API key** and save it somewhere safe

### Step 5: Restrict API Key (Important for Security!)

1. Click **Edit API key** (or the pencil icon next to your key)
2. Under **API restrictions**:
   - Select **Restrict key**
   - Check:
     - ✅ Maps JavaScript API
     - ✅ Places API (if you enabled it)
     - ✅ Geocoding API (if you enabled it)
3. Under **Website restrictions** (optional but recommended):
   - Select **HTTP referrers (web sites)**
   - Add your domains:
     ```
     https://travel-atlas.pages.dev/*
     https://*.travel-atlas.pages.dev/*
     http://localhost:3000/*
     ```
4. Click **Save**

---

## 🚀 Add API Key to Your App

### For Cloudflare Pages Deployment

1. Go to https://dash.cloudflare.com/
2. Select your **Workers & Pages**
3. Click on **travel-atlas** project
4. Go to **Settings** tab
5. Scroll to **Environment variables**
6. Click **Add variable**
7. Add:
   ```
   Variable name: REACT_APP_GOOGLE_MAPS_API_KEY
   Value: AIza...your-actual-key-here
   ```
8. Click **Save**
9. **Redeploy your site** (go to Deployments tab → click Retry deployment)

### For Local Development

1. Open `/Users/alixbinard/travel-atlas/frontend/.env`
2. Add this line:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=AIza...your-actual-key-here
   ```
3. Save the file
4. Restart your development server

---

## 🎯 How to Use the Map View

### In the Planner

1. Create or open an itinerary
2. Go to the planner page
3. **Look for the List/Map toggle** in the top right (next to Save/Share/Export)
4. Click **Map** to switch to map view

### What You'll See

- **📍 Markers** for each activity with a location
- **🔢 Day badges** showing which day each activity is on
- **🎨 Color-coded pins** by category (food, culture, nature, etc.)
- **💬 Click markers** to see activity details in an info window
- **🗺️ Zoom and pan** to explore the area

### Activities Without Locations

Activities without latitude/longitude coordinates won't appear on the map. You'll see a message:
> "No locations yet - Add locations to your activities to see them here!"

---

## 💰 Google Maps Pricing (Don't Worry!)

### Free Tier

- **$200 free credit** every month
- Enough for **28,500 map loads** per month
- Reset monthly - unused credit doesn't roll over

### Estimated Costs

For a small app:
- **100 users/day** viewing maps
- **~300 map loads/month**
- **Cost: $0** (well within free tier)

### Setting Budget Alerts

Recommended to avoid surprises:

1. Go to **Billing** in Google Cloud Console
2. Click **Budgets & alerts**
3. Click **Create Budget**
4. Set:
   - Amount: $10
   - Alert at: 50%, 90%, 100%
5. Click **Finish**

You'll get email alerts if you exceed your free tier.

---

## 🐛 Troubleshooting

### "This page can't load Google Maps correctly"

**Cause:** API key not set or invalid

**Fix:**
1. Check that `REACT_APP_GOOGLE_MAPS_API_KEY` is in your environment variables
2. Verify the API key starts with `AIza`
3. Make sure Maps JavaScript API is enabled in Google Cloud Console
4. Rebuild and redeploy your app

### "API key is invalid" or "API key expired"

**Cause:** API key restrictions blocking the request

**Fix:**
1. Go to Google Cloud Console → Credentials
2. Edit your API key
3. Check **Website restrictions** - make sure your domain is allowed
4. Save and wait a few minutes for changes to propagate

### Map shows but no markers appear

**Cause:** Activities don't have latitude/longitude coordinates

**Fix:**
1. Edit activities to add locations
2. Use the geocoding API to convert addresses to coordinates (future feature)
3. Or manually add coordinates when creating activities

### "Maps JavaScript API is not enabled"

**Cause:** You created the API key but didn't enable the API

**Fix:**
1. Go to APIs & Services → Library
2. Search for "Maps JavaScript API"
3. Click **Enable**
4. Wait 1-2 minutes and try again

---

## ✨ What's Next?

Future map enhancements you could add:

1. **🔍 Location Autocomplete** - Use Places API to search for locations
2. **📍 Click to Add** - Click on the map to add new activities
3. **🗺️ Directions** - Show routes between activities
4. **📊 Heatmap** - Visualize activity density
5. **🎨 Custom Markers** - Upload your own marker images
6. **🌍 Street View** - View locations in Street View

---

## 🎉 You're All Set!

Your Travel Atlas now has a **beautiful interactive map view**!

**Live Demo:** https://e30ec933.travel-atlas.pages.dev

**What users can do:**
- ✅ Toggle between list and map views
- ✅ See all activities on an interactive map
- ✅ Click markers to view activity details
- ✅ Visual category indicators with emojis
- ✅ Day numbers on each marker
- ✅ Zoom and pan to explore

**Cost:** Free (within Google's $200/month credit)

---

**Questions?** Check the [Google Maps Platform Documentation](https://developers.google.com/maps/documentation/javascript)
