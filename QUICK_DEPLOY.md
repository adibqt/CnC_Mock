# Quick Start for Vercel Deployment

## Before You Deploy - Checklist

### ✅ Prerequisites:
1. GitHub repository pushed
2. Vercel account created
3. Database migrations ready

---

## 🚀 5-Minute Quick Deploy

### 1️⃣ Create Vercel Postgres (2 min)
```
1. Go to vercel.com → Login
2. Storage → Create Database → Postgres
3. Name: click-and-care-db
4. Copy the POSTGRES_URL
```

### 2️⃣ Populate Database Locally (2 min)
```powershell
$env:DATABASE_URL="YOUR_VERCEL_POSTGRES_URL"
cd backend
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"
python migrations/migrate_admin.py
cd ..
```

### 3️⃣ Deploy on Vercel (1 min)
```
1. Vercel Dashboard → Add New Project
2. Import your GitHub repo
3. Click Deploy
```

### 4️⃣ Set Environment Variables (During/After Deploy)
Go to Settings → Environment Variables and add:

**Required:**
```
DATABASE_URL = <from Vercel Postgres>
BLOB_READ_WRITE_TOKEN = <from Vercel Blob Storage>
SECRET_KEY = <generate with: python -c "import secrets; print(secrets.token_urlsafe(32))">
GEMINI_API_KEY = AIzaSyCSI0zzWVudVX_M4VndgDlrqWfwQ7UBDH8
LIVEKIT_API_KEY = APITXEUZdYAbCFS
LIVEKIT_API_SECRET = o9CAch1m1g7aEDzNFzcNitJbWMxeEvRUTtbUlOOnwWX
LIVEKIT_URL = wss://cncmock-klusg79b.livekit.cloud
CORS_ORIGINS = ["https://your-app.vercel.app"]
ENVIRONMENT = production
```

**📦 Don't forget to create Vercel Blob Storage for file uploads!**

### 5️⃣ Update CORS After First Deploy
After you know your domain, update:
```
CORS_ORIGINS = ["https://your-actual-domain.vercel.app"]
```

---

## ✅ Test Your Deployment

1. **Frontend:** `https://your-app.vercel.app`
2. **API Health:** `https://your-app.vercel.app/api/health`
3. **API Docs:** `https://your-app.vercel.app/api/docs`
4. **Login:** Use `admin` / `admin123`

---

## 🐛 Common Issues

### API Returns 500 Error
→ Check Vercel Function Logs in Dashboard

### CORS Error
→ Update CORS_ORIGINS with your actual Vercel domain

### Database Connection Failed
→ Verify DATABASE_URL in environment variables

### Routes Not Working
→ Clear cache and redeploy: `vercel --force`

---

## 📚 Full Guide
See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.

## 🎯 You're Ready!
Your app should be live and working! 🎉
