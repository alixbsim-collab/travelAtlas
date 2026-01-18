# 🔧 Render Manual Configuration Guide

## Problem: Render is ignoring render.yaml

The logs show Render is using **Yarn** and auto-detection instead of following the `render.yaml` configuration.

## Solution: Manual Configuration in Render Dashboard

Follow these steps to configure the backend service correctly:

---

## Step 1: Delete Current Service (Optional)

If the current service keeps failing:

1. Go to https://dashboard.render.com/
2. Click on your **travel-atlas-api** service
3. Click **Settings** (at the top)
4. Scroll to bottom → Click **Delete Web Service**
5. Confirm deletion

---

## Step 2: Create New Web Service

### A. Start Creation

1. Go to https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. Click **"Build and deploy from a Git repository"**
4. Find your repository: `alixbsim-collab/travelAtlas`
5. Click **Connect**

### B. Configure Service Settings

Fill in these **exact** values:

```
Name: travel-atlas-api

Region: Oregon (US West)

Branch: main

Root Directory: backend
  ⚠️ IMPORTANT: Type "backend" here - this is the key!

Runtime: Node

Build Command: npm ci

Start Command: node src/server.js

Plan: Free
```

### C. Advanced Settings

Click **Advanced** to expand:

**Auto-Deploy:**
- ✅ Yes (enable auto-deploy on git push)

**Health Check Path:**
- `/health`

### D. Environment Variables

Click **Add Environment Variable** for each:

```
Key: NODE_ENV
Value: production
```

```
Key: PORT
Value: 10000
```

```
Key: SUPABASE_URL
Value: [paste your Supabase URL]
```

```
Key: SUPABASE_ANON_KEY
Value: [paste your Supabase anon key]
```

**Where to get Supabase values:**
- Supabase Dashboard → Settings → API
- Project URL = `SUPABASE_URL`
- anon public key = `SUPABASE_ANON_KEY`

---

## Step 3: Create Service

1. Click **Create Web Service** at the bottom
2. Wait for deployment (~2-3 minutes)

You should see:

```
==> Using Node.js version 22.16.0
==> Running build command 'npm ci'...
✅ Dependencies installed

==> Running 'node src/server.js'
✅ Server is running on port 10000
```

---

## Step 4: Verify Deployment

### A. Check Service URL

After deployment completes:
1. Your service URL will show at the top (e.g., `https://travel-atlas-api.onrender.com`)
2. Copy this URL

### B. Test Health Endpoint

Visit: `https://your-backend-url.onrender.com/health`

You should see:
```json
{
  "status": "ok",
  "message": "Travel Atlas API is running"
}
```

---

## Step 5: Update Cloudflare

Now that backend is live, update the frontend:

1. Go to https://dash.cloudflare.com/
2. Pages → **travel-atlas** → **Settings**
3. Environment variables
4. Find `REACT_APP_API_URL`
5. Update value to your Render URL: `https://travel-atlas-api.onrender.com`
6. Click **Save**

Then redeploy frontend:

```bash
cd /Users/alixbinard/travel-atlas
npx wrangler pages deploy frontend/build --project-name=travel-atlas --commit-dirty=true
```

---

## Why This Happens

Render's auto-detection looks at the **root** directory by default, not `render.yaml`.

The **Root Directory** setting is crucial:
- ❌ Without it: Render sees root, finds yarn.lock from frontend, uses Yarn
- ✅ With "backend": Render sees backend/, finds package-lock.json, uses npm

---

## Alternative: Use Render Blueprint

If you want to use `render.yaml` (Blueprint):

1. **Delete** existing service
2. Go to https://dashboard.render.com/
3. Click **New +** → **Blueprint**
4. Connect repository: `alixbsim-collab/travelAtlas`
5. Render will detect `render.yaml`
6. Click **Apply**
7. Add environment variables in the service settings
8. Deploy

⚠️ **However**, Blueprint may still have the same issue. Manual configuration is more reliable.

---

## Quick Checklist

- [ ] Delete old service (if needed)
- [ ] Create new Web Service
- [ ] Set **Root Directory** to `backend`
- [ ] Set **Build Command** to `npm ci`
- [ ] Set **Start Command** to `node src/server.js`
- [ ] Add all 4 environment variables
- [ ] Click Create Web Service
- [ ] Wait for deployment
- [ ] Test health endpoint
- [ ] Copy backend URL
- [ ] Update `REACT_APP_API_URL` in Cloudflare
- [ ] Redeploy frontend

---

## Expected Result

✅ Backend deploys successfully
✅ Health check returns 200 OK
✅ Logs show: "Server is running on port 10000"
✅ Auto-deploys on git push

---

## Need Help?

If you're still seeing Yarn in the logs after following these steps, take a screenshot of:
1. Your service **Settings** page
2. The **Logs** during deployment

And I can help troubleshoot further!
