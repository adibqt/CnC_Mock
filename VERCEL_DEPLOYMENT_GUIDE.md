# 🚀 Complete Vercel Deployment Guide for Click & Care

## 📋 Overview
This guide will help you deploy both your **frontend** and **FastAPI backend** on Vercel with **Vercel Postgres** database.

---

## 🎯 PART 1: Vercel Postgres Database Setup

### Step 1: Create Vercel Account & Project
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (`adibqt/CnC_Web`)
4. **DO NOT deploy yet!** We need to set up the database first.

### Step 2: Create Vercel Postgres Database
1. In your Vercel dashboard, go to the **Storage** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Choose a database name: `click-and-care-db`
5. Select region: Choose closest to your users (e.g., `us-east-1`)
6. Click **"Create"**

### Step 2b: Create Vercel Blob Storage (For File Uploads)
1. Still in **Storage** tab, click **"Create Database"** again
2. Select **"Blob"**
3. Choose a name: `click-and-care-blob`
4. Click **"Create"**
5. Go to Blob settings and copy the **Read-Write Token**

### Step 3: Get Database Connection String
1. After database is created, click on your database
2. Go to **".env.local"** tab
3. Copy the **`POSTGRES_URL`** connection string
4. It will look like: `postgres://default:xxxxx@xxx.postgres.vercel.com:5432/verceldb`

### Step 4: Run Migrations Locally to Populate Database
Before deploying, populate your Vercel Postgres database:

```powershell
# Set the Vercel Postgres URL temporarily
$env:DATABASE_URL="YOUR_VERCEL_POSTGRES_URL_HERE"

# Navigate to backend
cd backend

# Run migrations
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"

# Seed admin account
python migrations/migrate_admin.py

# Optional: Run other migrations if needed
python migrations/migrate_profile.py
python migrations/migrate_doctor_profile.py
python migrations/migrate_schedule.py
python migrations/migrate_appointments.py
python migrations/migrate_prescriptions.py
python migrations/migrate_pharmacy.py
python migrations/migrate_clinic.py
python migrations/migrate_lab_tests.py
python migrations/migrate_quotation_request_pharmacies.py
python migrations/migrate_ai_consultations.py

# Go back to root
cd ..
```

---

## 🔧 PART 2: Configure Vercel Environment Variables

### In your Vercel Project Settings:
1. Go to **Settings** → **Environment Variables**
2. Add the following variables (for **all environments**: Production, Preview, Development):

#### Required Variables:
```env
# Database (auto-configured from Vercel Postgres)
DATABASE_URL=<your-vercel-postgres-url>
POSTGRES_URL=<your-vercel-postgres-url>
POSTGRES_PRISMA_URL=<from-vercel-db-settings>
POSTGRES_URL_NON_POOLING=<from-vercel-db-settings>

# Vercel Blob Storage (for file uploads) - IMPORTANT!
BLOB_READ_WRITE_TOKEN=<from-vercel-blob-settings>

# JWT Security - GENERATE A NEW ONE!
SECRET_KEY=<generate-with-command-below>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Gemini AI (from your .env)
GEMINI_API_KEY=AIzaSyCSI0zzWVudVX_M4VndgDlrqWfwQ7UBDH8

# LiveKit (from your .env)
LIVEKIT_API_KEY=APITXEUZdYAbCFS
LIVEKIT_API_SECRET=o9CAch1m1g7aEDzNFzcNitJbWMxeEvRUTtbUlOOnwWX
LIVEKIT_URL=wss://cncmock-klusg79b.livekit.cloud

# CORS - Update with your Vercel domain after deployment
CORS_ORIGINS=["https://your-app.vercel.app","http://localhost:5173"]

# Environment
ENVIRONMENT=production

# Frontend API URL (will be auto-set by Vercel)
VITE_API_URL=https://your-app.vercel.app/api
```

#### Generate a secure SECRET_KEY:
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📦 PART 3: Update Your Code for Vercel

All necessary files have been created! Here's what was added:

### ✅ Files Created:
1. **`vercel.json`** - Vercel deployment configuration
2. **`api/index.py`** - Serverless function entry point
3. **`requirements.txt`** (root) - Points to backend requirements
4. **`.vercelignore`** - Files to exclude from deployment

### ✅ Files Updated:
1. **`package.json`** - Added `vercel-build` script
2. **`backend/config.py`** - Added Vercel environment detection
3. **`vite.config.js`** - Auto-configure API URL for Vercel

---

## 🚀 PART 4: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)
1. Go to your Vercel project
2. Click **"Deploy"**
3. Wait for build to complete (5-10 minutes)
4. Your app will be live at: `https://your-app.vercel.app`

### Option B: Deploy via Vercel CLI
```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts and confirm deployment
```

---

## ⚙️ PART 5: Post-Deployment Configuration

### Step 1: Update CORS Origins
After deployment, update your environment variable:
```env
CORS_ORIGINS=["https://your-actual-domain.vercel.app","https://www.your-actual-domain.vercel.app"]
```

### Step 2: Update Frontend API URL
In Vercel **Environment Variables**, update:
```env
VITE_API_URL=https://your-actual-domain.vercel.app/api
```

### Step 3: Test Your API
Visit: `https://your-app.vercel.app/api/health`

You should see:
```json
{
  "status": "healthy",
  "service": "Click & Care Backend",
  "version": "1.0.0"
}
```

### Step 4: Test Database Connection
Visit: `https://your-app.vercel.app/api/docs`
Try the `/api/public/doctors/all` endpoint

---

## 🔍 PART 6: Verify Everything Works

### Checklist:
- ✅ Frontend loads: `https://your-app.vercel.app`
- ✅ API responds: `https://your-app.vercel.app/api/health`
- ✅ Database connected: Try login with admin credentials
- ✅ Admin login works: `admin` / `admin123`
- ✅ Doctor registration works
- ✅ Patient registration works
- ✅ Appointments can be created
- ✅ LiveKit video calls work

---

## 🐛 Troubleshooting

### Issue: "Internal Server Error" on API calls
**Solution:** Check Vercel Function Logs:
1. Go to your Vercel project → **Deployments**
2. Click on latest deployment → **Functions** tab
3. Check error logs

### Issue: Database connection fails
**Solution:** 
1. Verify `DATABASE_URL` in environment variables
2. Make sure it starts with `postgres://` (not `postgresql://`)
3. Vercel Postgres uses connection pooling - use `POSTGRES_PRISMA_URL` for migrations

### Issue: CORS errors
**Solution:** Update `CORS_ORIGINS` to include your Vercel domain:
```env
CORS_ORIGINS=["https://your-app.vercel.app","https://www.your-app.vercel.app"]
```

### Issue: 404 on routes
**Solution:** Vercel should handle SPA routing automatically. If not, the `vercel.json` routes configuration will handle it.

### Issue: File uploads not working
**Solution:** Vercel serverless functions have limited storage. Consider using:
- **Vercel Blob Storage** for file uploads
- Or AWS S3 / Cloudinary for production

---

## 📊 Important Notes

### Vercel Limitations:
1. **Function Timeout**: 
   - Free: 10 seconds
   - Pro: 60 seconds
   - Long operations might timeout

2. **Function Size**: 
   - Max 50MB (we configured 15MB)
   
3. **File Storage**: 
   - Serverless functions have no persistent storage
   - Need external storage for uploads (Vercel Blob, S3, etc.)

4. **Cold Starts**: 
   - First request after inactivity may be slow
   - Subsequent requests are fast

### Recommended Upgrades:
For production, consider:
1. **Vercel Pro** ($20/month) - Better limits
2. **Vercel Blob Storage** - For file uploads
3. **Custom Domain** - Professional appearance

---

## 🎉 You're Done!

Your Click & Care app should now be:
- ✅ Fully deployed on Vercel
- ✅ Using Vercel Postgres database
- ✅ Frontend and Backend integrated
- ✅ Ready for production use!

### Next Steps:
1. **Change admin password** immediately!
2. **Set up custom domain** (optional)
3. **Configure Vercel Blob** for file uploads (optional)
4. **Monitor with Vercel Analytics** (optional)

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel Function Logs
2. Check Browser Console for frontend errors
3. Review this guide again
4. Check Vercel documentation: https://vercel.com/docs

Good luck! 🚀
