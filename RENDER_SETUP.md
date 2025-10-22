# Render Backend Deployment Guide

## Overview
Your backend will run on Render with full LiveKit video conferencing support.

## Step 1: Create Render Account
1. Go to https://render.com/
2. Sign up with your GitHub account (recommended)
3. Verify your email

## Step 2: Create New Web Service
1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository: `adibqt/CnC_Web`
4. Authorize Render to access your repository

## Step 3: Configure Web Service

### Basic Settings
- **Name**: `cnc-backend` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Oregon)
- **Branch**: `main`
- **Root Directory**: `backend` ⚠️ **IMPORTANT**
- **Runtime**: `Python 3`
- **Build Command**: `pip install --no-cache-dir -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Instance Type
- **Free** (select Free tier for testing)
  - 512 MB RAM
  - Shared CPU
  - Spins down after 15 minutes of inactivity
  - Takes ~30 seconds to spin back up

## Step 4: Configure Environment Variables

Click "Advanced" and add these environment variables:

### Required Variables

```bash
# Database
DATABASE_URL=your_neon_database_url

# Security
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS - Add your Vercel frontend URL
CORS_ORIGINS=["https://your-vercel-app.vercel.app","http://localhost:5173"]

# Environment
ENVIRONMENT=production
PYTHON_VERSION=3.12.0

# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-cloud-url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### How to Get LiveKit Credentials

1. Go to https://cloud.livekit.io/
2. Sign up for a free account
3. Create a new project
4. Go to Settings → Keys
5. Copy:
   - WebSocket URL (LIVEKIT_URL) - starts with `wss://`
   - API Key (LIVEKIT_API_KEY)
   - API Secret (LIVEKIT_API_SECRET)

## Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies from `requirements.txt`
   - Start your FastAPI application
3. Wait for deployment to complete (3-7 minutes first time)
4. Copy your Render backend URL (e.g., `https://cnc-backend.onrender.com`)

## Step 6: Update Frontend on Vercel

Update your Vercel environment variable:

1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Update `VITE_API_URL` to your Render backend URL:
   ```
   VITE_API_URL=https://cnc-backend.onrender.com/api
   ```
   ⚠️ Note the `/api` at the end!
5. Redeploy your frontend

## Step 7: Update CORS on Render

1. Go back to Render dashboard
2. Select your web service
3. Go to Environment
4. Update `CORS_ORIGINS` to include your Vercel URL:
   ```
   ["https://your-vercel-app.vercel.app","http://localhost:5173"]
   ```
5. Click "Save Changes"
6. Render will auto-redeploy

## Step 8: Test Your Deployment

1. Check backend health:
   - Visit: `https://cnc-backend.onrender.com/health`
   - Should see: `{"status":"healthy",...}`

2. Test frontend:
   - Open your Vercel URL
   - Test login functionality
   - Create/join an appointment
   - Test video call feature

## Troubleshooting

### Check Logs
1. Go to Render dashboard
2. Select your web service
3. Click "Logs" tab
4. View real-time logs

### Common Issues

**Build Failed**
- Verify `Root Directory` is set to `backend`
- Check `requirements.txt` exists in backend folder
- Ensure Python version is 3.12

**Database Connection Error**
- Verify `DATABASE_URL` is correct
- Check Neon database is running
- Ensure Neon allows connections from `0.0.0.0/0`

**CORS Error**
- Ensure `CORS_ORIGINS` includes your Vercel URL
- No trailing slashes in URLs
- Use exact URL from Vercel dashboard

**Video Call Not Working**
- Verify all 3 LiveKit variables are set correctly
- Check LiveKit project is active in dashboard
- Ensure `LIVEKIT_URL` starts with `wss://`
- Test LiveKit separately at https://meet.livekit.io/

**Service Spinning Down (Free Tier)**
- Free tier spins down after 15 min inactivity
- Takes ~30 seconds to wake up
- First request after sleep will be slow
- Upgrade to paid tier ($7/month) for always-on

**502 Bad Gateway**
- Service might be starting up (wait 30-60 seconds)
- Check logs for startup errors
- Verify all environment variables are set

## Important: Free Tier Limitations

### Render Free Tier
- ✅ **Unlimited** bandwidth
- ✅ **750 hours** per month
- ⚠️ **Spins down** after 15 minutes of inactivity
- ⚠️ Takes ~30 seconds to spin back up
- ⚠️ Multiple services share 750 hours (you only have 1 service)

### LiveKit Free Tier
- ✅ **50 GB** bandwidth per month
- ✅ **50,000** participant minutes per month
- ✅ No spin-down issues

### Recommendations
- **Development/Testing**: Free tier is perfect ✅
- **Production**: Consider upgrading to Render's $7/month Starter plan
  - Always-on (no spin-down)
  - 512 MB RAM
  - Better performance

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SECRET_KEY` | JWT signing key | Random 32+ char string |
| `CORS_ORIGINS` | Allowed frontend origins (JSON array) | `["https://app.vercel.app"]` |
| `LIVEKIT_URL` | LiveKit WebSocket URL | `wss://project.livekit.cloud` |
| `LIVEKIT_API_KEY` | LiveKit API key | From LiveKit dashboard |
| `LIVEKIT_API_SECRET` | LiveKit API secret | From LiveKit dashboard |
| `GEMINI_API_KEY` | Google Gemini AI key | From Google AI Studio |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | From Vercel settings |
| `PYTHON_VERSION` | Python runtime version | `3.12.0` |
| `ENVIRONMENT` | Environment name | `production` |

## Auto-Deploy on Git Push

Render automatically redeploys when you push to `main` branch:

```bash
git add .
git commit -m "Update backend code"
git push origin main
```

Render will detect the push and start a new deployment automatically.

## Health Monitoring

Render provides built-in health monitoring:

1. **Health Check Path**: `/health`
2. **Auto-restart**: If health check fails, Render restarts the service
3. **Status Page**: View uptime and metrics in dashboard

## Cost Summary

### Render Free Tier
- **Cost**: $0/month
- **RAM**: 512 MB
- **CPU**: Shared
- **Bandwidth**: Unlimited
- **Hours**: 750/month
- **Limitation**: Spins down after 15 min

### Render Starter Plan (Recommended for Production)
- **Cost**: $7/month
- **RAM**: 512 MB
- **CPU**: Shared
- **Bandwidth**: Unlimited
- **Always-on**: No spin-down ✅

### LiveKit Free Tier
- **Cost**: $0/month
- **Bandwidth**: 50 GB
- **Minutes**: 50,000 participant minutes
- **Perfect for**: ~830 hours of 1-on-1 calls

## Final Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│             │         │              │         │              │
│   Vercel    │────────▶│    Render    │────────▶│     Neon     │
│  (Frontend) │         │  (Backend)   │         │  (Database)  │
│             │         │              │         │              │
└─────────────┘         └──────────────┘         └──────────────┘
                               │
                               │
                               ▼
                        ┌──────────────┐
                        │              │
                        │   LiveKit    │
                        │   (Video)    │
                        │              │
                        └──────────────┘
```

## Useful Commands

### View Logs (CLI)
```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# View logs
render logs <service-name>
```

### Manual Redeploy
1. Go to Render dashboard
2. Select your web service
3. Click "Manual Deploy"
4. Select "Deploy latest commit"

## Next Steps

1. ✅ Create Render account
2. ✅ Create web service from GitHub
3. ✅ Set root directory to `backend`
4. ✅ Configure all environment variables
5. ✅ Get LiveKit credentials
6. ✅ Deploy backend
7. ✅ Update Vercel frontend URL
8. ✅ Update CORS in Render
9. ✅ Test all features

Need help? Check logs in Render dashboard or test individual features!
