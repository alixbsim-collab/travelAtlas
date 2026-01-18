# 🚀 Backend Setup Required

## What Was Fixed

✅ **Itinerary Generation**: Activities are now generated immediately when you click "Generate My Itinerary"
✅ **Frontend Deployed**: Latest version at https://d630bb1a.travel-atlas.pages.dev
✅ **AI Chat Integration**: Chat system connects to backend API
✅ **Fallback URL**: Frontend uses `https://travel-atlas-api.onrender.com` as default backend

## ⚠️ What's Missing: Your Render Backend

The frontend is trying to connect to your backend at:
```
https://travel-atlas-api.onrender.com
```

But you need to **deploy the backend to Render** first!

---

## 📋 Step-by-Step: Deploy Backend to Render

### Option 1: Via Render Dashboard (Recommended)

1. **Go to Render**: https://dashboard.render.com/

2. **Click "New +" → "Web Service"**

3. **Connect Your GitHub Repo**:
   - Select `alixbsim-collab/travelAtlas`
   - Click **Connect**

4. **Configure the Service**:
   ```
   Name: travel-atlas-api
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm ci
   Start Command: node src/server.js
   Instance Type: Free
   ```

5. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable"

   Add these THREE variables:
   ```
   SUPABASE_URL = https://gfjtvnpuyzfuevniolbd.supabase.co
   SUPABASE_ANON_KEY = sb_publishable_og9P7PwEQHqIpetDq_Makw_Kxh0gPHr
   OPENAI_API_KEY = sk-your-openai-key-here
   ```

6. **Click "Create Web Service"**

7. **Wait for Deployment** (~3-5 minutes)
   - Watch the logs
   - Should see: `✅ Server is running on port 10000`

### Option 2: Via render.yaml (Automatic)

The `render.yaml` file in your repo is already configured!

1. Go to https://dashboard.render.com/
2. Click **"New +" → "Blueprint"**
3. Select your `travelAtlas` repo
4. Render will detect `render.yaml` automatically
5. **Add the environment variables** (same 3 as above)
6. Click **"Apply"**

---

## 🔑 Get Your OpenAI API Key

You need an OpenAI API key for AI-generated itineraries.

### Quick Steps:

1. Go to https://platform.openai.com/api-keys
2. Sign in (or create account)
3. Click **"+ Create new secret key"**
4. Name it: `Travel Atlas Backend`
5. **Copy the key** (starts with `sk-...`)
6. Add it to Render environment variables

**Cost**: ~$0.01-0.02 per itinerary generated (Google offers $200/month free credit)

See [OPENAI_SETUP.md](OPENAI_SETUP.md) for detailed instructions.

---

## ✅ Verify Backend is Working

After deploying to Render:

### 1. Check Health Endpoint

Visit: `https://travel-atlas-api.onrender.com/health`

Should see:
```json
{
  "status": "ok",
  "message": "Travel Atlas API is running"
}
```

### 2. Test from Frontend

1. Go to https://d630bb1a.travel-atlas.pages.dev
2. **Register** or **Log in**
3. Click **"Travel Designer"** → **"Create New Itinerary"**
4. Fill out the form:
   - Destination: Tokyo, Japan
   - Trip Length: 5 days
   - Select traveler profiles
   - Click **"Generate My Itinerary"**

**What Should Happen**:
- Loading spinner shows "Generating..."
- After ~5-10 seconds, you're taken to the planner
- **Activities are already populated** in the timeline
- AI Assistant says "Welcome! I'm here to help customize your trip"

**If It Doesn't Work**:
- Check Render logs for errors
- Make sure `OPENAI_API_KEY` is set
- Verify backend URL is `https://travel-atlas-api.onrender.com`

---

## 🐛 Common Issues

### "Failed to create itinerary"

**Cause**: Backend not deployed or environment variables missing

**Fix**:
1. Check Render dashboard - is service running?
2. Verify environment variables are set
3. Check Render logs for errors

### "I'm having trouble generating your itinerary"

**Cause**: OpenAI API key not set or invalid

**Fix**:
1. Add `OPENAI_API_KEY` to Render environment variables
2. Make sure it starts with `sk-`
3. Check OpenAI account has credits

### Backend shows "OPENAI_API_KEY not set, using mock responses"

**This is OK for testing!** The backend will use mock data instead of real AI.

**To fix**: Add the OpenAI API key to Render environment variables.

---

## 📊 What Happens When It Works

### On "Generate My Itinerary":

1. Frontend creates itinerary in Supabase
2. **Immediately** calls backend API to generate activities
3. Backend uses OpenAI to create personalized itinerary
4. Activities inserted into Supabase database
5. User is redirected to planner with **activities already loaded**

### In the Planner:

- **Left**: AI Assistant chat (can ask for modifications)
- **Right**: Timeline with generated activities (can drag/drop/edit)
- **Toggle** between List and Map views
- Activities are editable, drag-and-droppable

---

## 🎯 Current Status

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ Deployed | https://d630bb1a.travel-atlas.pages.dev |
| Database | ✅ Configured | Supabase |
| Backend | ⏳ **NEEDS DEPLOYMENT** | https://travel-atlas-api.onrender.com |
| OpenAI | ⏳ **NEEDS API KEY** | - |

---

## 🔄 Next Steps

1. ✅ Deploy backend to Render (see instructions above)
2. ✅ Add OpenAI API key to Render environment variables
3. ✅ Test itinerary generation
4. ✅ Disable email confirmation in Supabase (see [DISABLE_EMAIL_CONFIRMATION.md](DISABLE_EMAIL_CONFIRMATION.md))
5. ✅ Add Google Maps API key for map view (see [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md))

---

## ✨ Once Everything is Set Up

Your Travel Atlas will:

- ✅ Generate personalized itineraries with AI
- ✅ Show activities on an interactive map
- ✅ Let users chat with AI to modify trips
- ✅ Support drag-and-drop planning
- ✅ Save itineraries to Supabase database
- ✅ Share itineraries with others

**Total Cost**:
- Render: Free tier
- Supabase: Free tier
- OpenAI: ~$0.01-0.02 per itinerary
- Google Maps: Free ($200/month credit)

---

**Need Help?** The backend code is ready in the `backend/` directory - just needs to be deployed to Render!
