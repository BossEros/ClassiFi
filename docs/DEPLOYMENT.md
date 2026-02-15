# 🚀 Deployment Guide

This guide covers deploying ClassiFi to **Vercel** (frontend) and **Render** (backend).

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Vercel (CDN)      │────▶│   Render (API)      │────▶│  Supabase (DB/Auth) │
│   React Frontend    │     │   Fastify Backend   │     │  PostgreSQL + Auth  │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## 📦 Prerequisites

- GitHub account (repo connected)
- Supabase project (already configured)
- Vercel account (free tier)
- Render account (free tier)

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import the `ClassiFi` repository
4. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Configure Environment Variables

In Vercel dashboard → Project Settings → Environment Variables:

| Variable                 | Value                                                                      | Environment         |
| ------------------------ | -------------------------------------------------------------------------- | ------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL                                                  | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key                                                     | Production, Preview |
| `VITE_API_BASE_URL`      | Your Render backend URL (e.g., `https://classifi-api.onrender.com/api/v1`) | Production          |

### Step 3: Deploy

Click **"Deploy"** - Vercel will automatically deploy on every push to `main`.

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## 🔧 Backend Deployment (Render)

### Option A: Blueprint (Recommended)

1. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. Click **"New Blueprint Instance"**
3. Connect the `ClassiFi` repository
4. Render will detect `render.yaml` and configure automatically
5. Fill in the environment variables when prompted

### Option B: Manual Setup

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New" → "Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `classifi-api`
   - **Root Directory**: `backend-ts`
   - **Runtime**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 2: Configure Environment Variables

In Render dashboard → Environment:

| Variable                    | Value                                                 |
| --------------------------- | ----------------------------------------------------- |
| `NODE_ENV`                  | `production`                                          |
| `PORT`                      | `10000`                                               |
| `ENVIRONMENT`               | `production`                                          |
| `SUPABASE_URL`              | Your Supabase project URL                             |
| `SUPABASE_ANON_KEY`         | Your Supabase anon key                                |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key                        |
| `DATABASE_URL`              | Your Supabase connection string                       |
| `FRONTEND_URL`              | Your Vercel URL (e.g., `https://classifi.vercel.app`) |
| `ALLOWED_ORIGINS`           | Comma-separated allowed origins                       |
| `API_PREFIX`                | `/api`                                                |

### Step 3: Deploy

Click **"Create Web Service"** - Render will auto-deploy on every push to `main`.

---

## 🔄 Continuous Deployment Flow

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Push to main │────▶│    CI runs    │────▶│ Auto-deploy   │
│   (GitHub)    │     │  (type check  │     │ (Vercel/      │
│               │     │   + tests)    │     │  Render)      │
└───────────────┘     └───────────────┘     └───────────────┘
```

Both platforms auto-deploy when:

- New commits are pushed to `main`
- Pull requests are merged

### Optional: Trigger Deploys from GitHub Actions CI

If you want deploy visibility directly in CI, configure deploy hooks as GitHub repository secrets and let `.github/workflows/ci.yml` trigger them after tests pass on `main`.

Configure one or both:

- `RENDER_DEPLOY_HOOK_URL` - Render deploy hook URL
- `VERCEL_DEPLOY_HOOK_URL` - Vercel deploy hook URL

Notes:

- Missing secrets are skipped automatically.
- If Vercel already auto-deploys via Git integration, leave `VERCEL_DEPLOY_HOOK_URL` unset to avoid duplicate deploys.

---

## ⚠️ Important Notes

### Free Tier Limitations

| Platform   | Limitation                                             |
| ---------- | ------------------------------------------------------ |
| **Vercel** | 100GB bandwidth/month, non-commercial use              |
| **Render** | Spins down after 15 min inactivity (30-60s cold start) |

### CORS Configuration

Make sure `ALLOWED_ORIGINS` in your backend includes your Vercel URL:

```
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

### Health Check

Render will ping `/health` to verify the service is running. This endpoint is already configured in the backend.

---

## 🧪 Testing Deployment

After deployment:

1. **Frontend**: Visit your Vercel URL
2. **Backend**: Visit `https://your-api.onrender.com/health`
3. **Full Stack**: Try logging in and using the app

---

## 🔍 Troubleshooting

### Build Fails on Vercel

- Check that all `VITE_` environment variables are set
- Verify `frontend/` is set as the root directory

### Build Fails on Render

- Check Render logs for specific errors
- Ensure all environment variables are configured
- Verify Node.js version compatibility (20.x recommended)

### CORS Errors

- Update `ALLOWED_ORIGINS` to include your frontend URL
- Ensure there are no trailing slashes in URLs

### Cold Start Issues (Render Free Tier)

- First request after inactivity takes 30-60 seconds
- Consider upgrading to paid tier for production use
