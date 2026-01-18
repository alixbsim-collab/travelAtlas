# 🔑 Set Environment Variables in Cloudflare

## Your Site is Live! 🎉

**URL:** https://travel-atlas.pages.dev (or https://62c1962b.travel-atlas.pages.dev)

## ⚠️ Important: Add Environment Variables

The site won't work until you add environment variables. Follow these steps:

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (gear icon in sidebar)
4. Click **API**
5. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long JWT token starting with `eyJ...`)

### Step 2: Add to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Pages** in the left sidebar
3. Click on **travel-atlas** project
4. Click **Settings** tab
5. Scroll down to **Environment variables**
6. Click **Add variable** and add these THREE variables:

#### Variable 1:
```
Variable name: REACT_APP_SUPABASE_URL
Value: https://xxxxx.supabase.co  (paste your Supabase Project URL)
Environment: Production
```

#### Variable 2:
```
Variable name: REACT_APP_SUPABASE_ANON_KEY
Value: eyJhbGci...  (paste your Supabase anon public key)
Environment: Production
```

#### Variable 3:
```
Variable name: REACT_APP_API_URL
Value: https://your-backend.onrender.com  (your Render backend URL)
```

**Note:** If you don't have the backend deployed yet, you can use a placeholder like `https://api.example.com` for now. The app will still work for testing the UI.

### Step 3: Redeploy

After adding environment variables, you need to trigger a new deployment:

**Option A: In Cloudflare Dashboard**
1. Go to **Deployments** tab
2. Click **Retry deployment** on the latest deployment
3. Wait ~30 seconds

**Option B: Via Command Line**
```bash
cd /Users/alixbinard/travel-atlas
npx wrangler pages deploy frontend/build --project-name=travel-atlas --commit-dirty=true
```

### Step 4: Execute Database Migration

Before using the app, run the SQL migration:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **SQL Editor** in sidebar
3. Click **New query**
4. Copy the entire content from `/Users/alixbinard/travel-atlas/supabase/seed.sql`
5. Paste and click **RUN**
6. Verify tables are created in **Table Editor**

### Step 5: Test Your Site

Visit: https://travel-atlas.pages.dev/designer

You should see:
- ✅ Dashboard loads
- ✅ "Start Planning" button works
- ✅ Can create itinerary
- ✅ No console errors

## 🔍 Troubleshooting

### Environment Variables Not Working?
- Make sure you clicked **Save** after adding each variable
- Ensure variable names are EXACTLY as shown (case-sensitive)
- Redeploy after adding variables

### Blank Page?
- Open browser DevTools (F12)
- Check Console tab for errors
- Look for CORS or API errors

### Database Errors?
- Verify SQL migration ran successfully
- Check Supabase credentials are correct
- Ensure RLS policies are enabled

## 📊 View Deployment

In Cloudflare Dashboard:
- **Deployments** tab: See all deployments
- **Analytics**: View traffic and performance
- **Settings**: Manage domain and variables

## 🌐 Custom Domain (Optional)

To use your own domain:

1. In Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `app.travelatlas.com`)
4. Follow DNS instructions
5. SSL certificate auto-provisioned

## 🎯 Quick Reference

**Your URLs:**
- Production: https://travel-atlas.pages.dev
- Current deployment: https://62c1962b.travel-atlas.pages.dev
- Dashboard: https://dash.cloudflare.com/

**Environment Variables Needed:**
1. `REACT_APP_SUPABASE_URL`
2. `REACT_APP_SUPABASE_ANON_KEY`
3. `REACT_APP_API_URL`

**Next Steps:**
1. ✅ Add environment variables (above)
2. ✅ Redeploy
3. ✅ Run SQL migration in Supabase
4. ✅ Test the site
5. 🔄 Integrate real AI (optional, see TRAVEL_DESIGNER_SETUP.md)

---

**Need help?** Check the full guides:
- [QUICK_START.md](QUICK_START.md)
- [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
