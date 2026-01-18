# Travel Atlas - Complete Deployment Checklist

## 📋 Pre-Deployment

### 1. Database Setup
- [ ] Copy SQL from [supabase/seed.sql](/Users/alixbinard/travel-atlas/supabase/seed.sql)
- [ ] Login to [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Navigate to SQL Editor
- [ ] Paste and execute the SQL
- [ ] Verify tables created in Table Editor:
  - [ ] `itineraries`
  - [ ] `activities`
  - [ ] `accommodations`
  - [ ] `atlas_files`
  - [ ] `ai_conversations`
- [ ] Verify RLS policies are enabled

### 2. Environment Variables

Gather these values from your Supabase project:

```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_API_URL=https://your-backend.onrender.com
```

**Where to find them:**
- Supabase Dashboard → Settings → API
- Copy "Project URL" and "anon public" key

## 🚀 Cloudflare Deployment

### Method 1: Cloudflare Dashboard (Easiest)

1. **Go to Cloudflare Pages**
   - [ ] Visit https://dash.cloudflare.com/
   - [ ] Click **Pages**
   - [ ] Click **Create a project**

2. **Connect Repository**
   - [ ] Select **Connect to Git**
   - [ ] Authorize Cloudflare with GitHub
   - [ ] Choose repository: `alixbsim-collab/travelAtlas`
   - [ ] Click **Begin setup**

3. **Configure Build**
   ```
   Project name: travel-atlas
   Production branch: main
   Framework preset: Create React App
   Build command: cd frontend && npm install && npm run build
   Build output directory: frontend/build
   Root directory: (leave empty)
   ```

4. **Add Environment Variables**
   Click **Environment variables (advanced)**

   Add these three variables:
   ```
   REACT_APP_SUPABASE_URL = [your value]
   REACT_APP_SUPABASE_ANON_KEY = [your value]
   REACT_APP_API_URL = [your backend URL]
   ```

5. **Deploy**
   - [ ] Click **Save and Deploy**
   - [ ] Wait for build (~2-3 minutes)
   - [ ] Note your deployment URL: `https://travel-atlas.pages.dev`

### Method 2: Command Line Deployment

```bash
# From project root
cd /Users/alixbinard/travel-atlas

# Run deployment script
./deploy-cloudflare.sh

# Or manually:
wrangler pages deploy frontend/build --project-name=travel-atlas
```

**Note:** You'll still need to add environment variables via Cloudflare Dashboard.

## 🔧 Backend Configuration

### Update CORS for Cloudflare URL

1. **Edit backend/src/server.js**

   Find the CORS configuration and update:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:3000',
       'https://travel-atlas.pages.dev',  // Add this
       'https://your-custom-domain.com'   // If you have one
     ],
     credentials: true
   }));
   ```

2. **Redeploy Backend to Render**
   - Push changes to GitHub
   - Render will auto-deploy
   - Or manually deploy in Render dashboard

## ✅ Testing After Deployment

### Basic Functionality
- [ ] Site loads at https://travel-atlas.pages.dev
- [ ] No console errors in browser DevTools
- [ ] Navigation works (Home, Designer, Atlas, Profile)
- [ ] Images and styles load correctly

### Travel Designer Features
- [ ] Can access `/designer` dashboard
- [ ] "Start Planning" button works
- [ ] Can fill out itinerary creation form:
  - [ ] Destination input
  - [ ] Trip length selector
  - [ ] Date picker works
  - [ ] Travel pace selection
  - [ ] Budget selection
  - [ ] Traveler profile selection (1-4)
- [ ] "Generate My Itinerary" redirects to planner
- [ ] Planner page loads with split screen
- [ ] AI Assistant panel appears
- [ ] Drag-and-drop planner appears
- [ ] Can drag activities (if AI generates them)
- [ ] Can save itinerary
- [ ] Can navigate back to dashboard

### Database Integration
- [ ] User can register/login (if auth enabled)
- [ ] Itineraries save to database
- [ ] Saved itineraries appear on dashboard
- [ ] Can edit existing itinerary
- [ ] Can delete itinerary
- [ ] Can duplicate itinerary

### API Integration
- [ ] Backend API responds (check Network tab)
- [ ] No CORS errors
- [ ] AI endpoints are called (even if using mock data)

## 🐛 Troubleshooting

### Build Fails
**Error:** `npm install` fails
- Check `package.json` is in `frontend/` directory
- Verify Node version is >= 18

**Error:** Build command not found
- Ensure build command: `cd frontend && npm install && npm run build`
- Verify build output: `frontend/build`

### Blank Page After Deployment
1. Check browser console for errors
2. Verify environment variables are set
3. Check if build output directory is correct
4. Look at Cloudflare build logs

### API Not Working
1. Verify `REACT_APP_API_URL` in Cloudflare dashboard
2. Check backend is running on Render
3. Verify CORS includes Cloudflare URL
4. Check browser Network tab for API calls

### Database Errors
1. Verify SQL migration ran successfully
2. Check Supabase connection in browser console
3. Verify RLS policies allow access
4. Check user is authenticated for protected actions

## 📊 Monitoring

### Cloudflare Analytics
- [ ] Enable Web Analytics in Cloudflare Pages settings
- [ ] Monitor page views and performance
- [ ] Check error rates

### Deployment Logs
- Access at: Pages → Your Project → Deployments
- View build logs and function logs

## 🌐 Custom Domain (Optional)

1. **In Cloudflare Pages**
   - Go to project settings
   - Click **Custom domains**
   - Add your domain

2. **DNS Configuration**
   - Add CNAME record pointing to `travel-atlas.pages.dev`
   - Or follow Cloudflare's specific instructions

3. **SSL Certificate**
   - Automatically provisioned by Cloudflare
   - Usually takes 1-5 minutes

## 🔄 Continuous Deployment

Once connected to GitHub:

- ✅ **Auto-deploy on push to main**
- ✅ **Preview deployments for PRs**
- ✅ **Instant rollbacks** from dashboard
- ✅ **Branch deployments** for testing

### Workflow
```
Git Push → GitHub → Cloudflare Pages → Auto Deploy → Live Site
```

## 📈 Performance

Cloudflare Pages provides:
- Global CDN (180+ data centers)
- Automatic caching
- HTTP/3 and QUIC
- Brotli compression
- Unlimited bandwidth (Free tier)

Expected performance:
- **Time to First Byte**: < 100ms
- **Lighthouse Score**: 90+ (Performance)

## 💰 Costs

**Current Setup:**
- Cloudflare Pages: **$0/month** (Free tier - unlimited)
- Render Backend: **$0/month** (Free tier available)
- Supabase: **$0/month** (Free tier)

**Total: $0/month** for development and small-scale production

## 🎯 Post-Deployment Tasks

### Immediate
- [ ] Test all features
- [ ] Fix any deployment-specific bugs
- [ ] Update README with live URL
- [ ] Share with stakeholders

### Short-term (This Week)
- [ ] Integrate real AI (OpenAI or Anthropic)
- [ ] Add sample Atlas Files content
- [ ] Set up error monitoring (Sentry)
- [ ] Enable authentication

### Long-term
- [ ] Set up custom domain
- [ ] Add analytics
- [ ] Implement PDF export
- [ ] Add map integration
- [ ] Set up automated testing

## 📞 Support Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Supabase Docs**: https://supabase.com/docs
- **React Deployment**: https://create-react-app.dev/docs/deployment/

---

## ✨ Quick Deploy Commands

```bash
# 1. Run SQL in Supabase Dashboard (manual step)

# 2. Deploy to Cloudflare
cd /Users/alixbinard/travel-atlas
./deploy-cloudflare.sh

# 3. Set environment variables in Cloudflare Dashboard (manual step)

# 4. Test your site
open https://travel-atlas.pages.dev/designer
```

---

**Last Updated:** 2026-01-18
**Status:** ✅ Ready for Deployment
