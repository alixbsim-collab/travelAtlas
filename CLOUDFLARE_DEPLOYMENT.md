# Cloudflare Pages Deployment Guide

## Step 1: Execute Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the entire content from `/Users/alixbinard/travel-atlas/supabase/seed.sql`
4. Paste and **Run** the SQL
5. Verify all tables were created in **Table Editor**

## Step 2: Deploy to Cloudflare Pages

### Option A: Deploy via Cloudflare Dashboard (Recommended)

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/
   - Navigate to **Pages**

2. **Create a New Project**
   - Click **Create a project**
   - Select **Connect to Git**
   - Choose your GitHub repository: `alixbsim-collab/travelAtlas`
   - Click **Begin setup**

3. **Configure Build Settings**
   ```
   Project name: travel-atlas
   Production branch: main (or master)
   Build command: cd frontend && npm install && npm run build
   Build output directory: frontend/build
   ```

4. **Set Environment Variables**
   Click **Add variable** for each:
   ```
   REACT_APP_SUPABASE_URL = your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY = your_supabase_anon_key
   REACT_APP_API_URL = your_render_backend_url
   ```

5. **Deploy**
   - Click **Save and Deploy**
   - Wait for build to complete (~2-3 minutes)
   - Your site will be live at: `https://travel-atlas.pages.dev`

### Option B: Deploy via Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy from project root
cd /Users/alixbinard/travel-atlas
wrangler pages deploy frontend/build --project-name=travel-atlas
```

## Step 3: Update Backend URL

After Cloudflare deployment, update your backend CORS settings:

**File**: `backend/src/server.js`

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://travel-atlas.pages.dev',
    'https://your-custom-domain.com'  // if you have one
  ],
  credentials: true
}));
```

Redeploy backend to Render after this change.

## Step 4: Custom Domain (Optional)

1. In Cloudflare Pages project settings
2. Go to **Custom domains**
3. Click **Set up a custom domain**
4. Add your domain (e.g., `app.travelatlas.com`)
5. Follow DNS configuration instructions

## Step 5: Environment-Specific Builds

### For Production vs Development

Update `frontend/.env.production`:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=https://your-backend.onrender.com
```

## Verification Checklist

After deployment, test these features:

- [ ] Homepage loads correctly
- [ ] Can navigate to `/designer`
- [ ] Can create a new itinerary
- [ ] Form submissions work
- [ ] AI assistant loads (may show mock data)
- [ ] Drag-and-drop functionality works
- [ ] Can save itinerary
- [ ] Authentication works (if enabled)
- [ ] All routes are accessible

## Troubleshooting

### Build Fails
- Check Node version (should be >= 18)
- Verify all dependencies are in `package.json`
- Check build logs in Cloudflare dashboard

### Runtime Errors
- Open browser DevTools Console
- Check for CORS errors
- Verify environment variables are set
- Check Supabase connection

### API Not Working
- Verify `REACT_APP_API_URL` is correct
- Ensure backend is running on Render
- Check backend CORS settings include Cloudflare URL

### Database Errors
- Verify SQL migration ran successfully
- Check RLS policies are enabled
- Ensure user is authenticated for protected routes

## Automatic Deployments

Once connected to GitHub:

1. **Every push to main branch** triggers automatic deployment
2. **Pull request previews** are created automatically
3. **Rollback** is available from Cloudflare dashboard

## Performance Optimization

Cloudflare Pages provides:
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Unlimited bandwidth
- ✅ Branch previews
- ✅ Instant rollbacks

## Monitoring

Access deployment logs:
1. Cloudflare Dashboard → Pages
2. Select your project
3. Click on any deployment
4. View **Build logs** and **Functions logs**

## Cost

- **Cloudflare Pages**: Free tier (unlimited requests)
- **Render Backend**: Free tier available
- **Supabase**: Free tier (500MB database, 50k monthly active users)

Total: **$0/month** for small projects

## Next Steps

1. ✅ Deploy database schema
2. ✅ Deploy frontend to Cloudflare
3. ⏳ Integrate real AI (OpenAI/Anthropic)
4. ⏳ Set up custom domain
5. ⏳ Enable analytics
6. ⏳ Set up monitoring

---

**Your Cloudflare URL will be**: `https://travel-atlas.pages.dev`
**Or custom**: `https://your-domain.com`
