# Deployment Rules for Travel Atlas

## 🚨 STRICT DEPLOYMENT PROTOCOL

When you say **"deploy"**, the following MUST happen:

### 1. Automatic Git Operations
- Stage all changes: `git add .`
- Create commit with descriptive message
- Push to GitHub: `git push origin main`

### 2. Automatic Deployments (via GitHub)
Once pushed to GitHub, these happen automatically:

- **Cloudflare Pages** (Frontend)
  - Monitors: `main` branch
  - Builds: `frontend/` directory
  - Deploys: Automatically on push
  - URL: Will be provided after initial setup

- **Render** (Backend)
  - Monitors: `main` branch via `render.yaml`
  - Builds: `backend/` directory
  - Deploys: Automatically on push
  - URL: Will be provided after initial setup

### 3. Deployment Workflow

```
Code Changes → git push → GitHub → Cloudflare + Render → Live Sites
```

## 📝 Deployment Commands

### Using the Deploy Script (Recommended)
```bash
./deploy.sh
```

### Manual Deployment
```bash
git add .
git commit -m "Your message"
git push origin main
```

## ⚙️ Initial Setup Required

Before auto-deployment works, you must:

1. ✅ Connect Cloudflare Pages to GitHub (one-time)
2. ✅ Connect Render to GitHub (one-time)
3. ✅ Configure environment variables (one-time)

After setup, every push to `main` triggers automatic deployments.

## 🔗 Links

- **GitHub**: https://github.com/alixbsim-collab/travelAtlas
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Render Dashboard**: https://dashboard.render.com/
- **Supabase Dashboard**: https://gfjtvnpuyzfuevniolbd.supabase.co

## 📊 Monitoring Deployments

After pushing:
1. Check Cloudflare Pages build logs
2. Check Render deployment logs
3. Test live sites once deployed

## 🎯 Deployment Status

- Frontend URL: _[Will be set after Cloudflare setup]_
- Backend URL: _[Will be set after Render setup]_
- Database: ✅ Configured (Supabase)
