# 📦 Vercel Blob Storage Integration Guide

## ✅ What's Been Integrated

Your Click & Care app now uses **Vercel Blob Storage** for all file uploads:

### Files Updated:
1. ✅ **`backend/services/blob_service.py`** - New blob storage service
2. ✅ **`backend/routers/doctors.py`** - Profile pictures & certificates
3. ✅ **`backend/routers/users.py`** - User profile pictures
4. ✅ **`backend/routers/lab_reports.py`** - Lab report files & images
5. ✅ **`backend/requirements.txt`** - Added `aiohttp` dependency

### File Types Handled:
- ✅ Profile pictures (doctors & patients)
- ✅ Doctor certificates (MBBS, FCPS)
- ✅ Lab report PDFs
- ✅ Lab report images

---

## 🔧 Setup Instructions

### Step 1: Enable Vercel Blob Storage

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **Create Database** → Select **Blob**
4. Name it: `click-and-care-blob`
5. Click **Create**

### Step 2: Get Blob Token

After creating blob storage:

1. Go to Blob storage → **Settings**
2. Copy the **Read-Write Token**
3. It will look like: `vercel_blob_rw_XXXXXXXXXXXXX`

### Step 3: Add Environment Variable

In Vercel Project → **Settings** → **Environment Variables**:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXX
```

**Important:** Add this to all environments (Production, Preview, Development)

---

## 🧪 How It Works

### Development (Local)
- Files are saved to `uploads/` directory
- Works without Vercel Blob token
- Same behavior as before

### Production (Vercel)
- Automatically detects Vercel environment
- Uploads files to Vercel Blob Storage
- Returns public URLs for stored files
- No local storage needed

### Code Example

```python
from services.blob_service import blob_service

# Upload a file
file_url = await blob_service.upload_file(
    file_content=file_bytes,
    filename="profile.jpg",
    folder="profile_pictures",
    content_type="image/jpeg"
)

# Returns: https://xxxxx.public.blob.vercel-storage.com/profile_pictures/uuid.jpg
```

---

## 📊 Blob Storage Structure

Your files will be organized in folders:

```
Vercel Blob Storage/
├── profile_pictures/
│   ├── user_123_uuid.jpg
│   └── doctor_456_uuid.png
├── certificates/
│   ├── mbbs/
│   │   └── uuid.pdf
│   └── fcps/
│       └── uuid.pdf
└── lab_reports/
    ├── report_uuid.pdf
    └── image_uuid.jpg
```

---

## 💰 Vercel Blob Pricing

### Free Tier:
- **1 GB storage**
- **1 GB bandwidth/month**
- Good for development & small apps

### Pro Tier ($0.15/GB storage, $0.30/GB bandwidth):
- Unlimited storage (pay per GB)
- Ideal for production

### Estimation for Your App:
- Profile pictures: ~500KB each
- Certificates: ~2MB each
- Lab reports: ~1-5MB each

**Example:** 100 users + 50 doctors + 200 lab reports = ~1.5GB total

---

## 🔒 Security Features

✅ **Private by default** - Files require authentication
✅ **Unique filenames** - UUIDs prevent collisions
✅ **File type validation** - Only allowed types
✅ **Size limits** - 5MB images, 10MB PDFs
✅ **Content-type headers** - Proper MIME types

---

## 🧪 Testing Locally

### Without Vercel Blob (Development):
```powershell
# Just run normally - uses local storage
cd backend
uvicorn main:app --reload
```

### With Vercel Blob (Simulating Production):
```powershell
# Set the token in your local .env
$env:BLOB_READ_WRITE_TOKEN="your_token_here"
$env:VERCEL="1"  # Simulate Vercel environment

# Run backend
uvicorn main:app --reload
```

---

## 🐛 Troubleshooting

### Issue: Files not uploading
**Solution:** 
1. Check `BLOB_READ_WRITE_TOKEN` is set in Vercel
2. Verify token has read-write permissions
3. Check Vercel Function logs

### Issue: "Failed to upload to Vercel Blob"
**Solution:**
1. Ensure `aiohttp` is installed: `pip install aiohttp`
2. Check blob storage is created
3. Verify token is correct

### Issue: Files work locally but not on Vercel
**Solution:**
1. `BLOB_READ_WRITE_TOKEN` must be in Vercel environment variables
2. Redeploy after adding the token
3. Check Vercel Function logs for errors

### Issue: Old uploaded files broken
**Solution:**
- Old files in `uploads/` won't be accessible on Vercel
- Re-upload files after deploying with Blob storage
- Or migrate existing files to Blob storage

---

## 📈 Monitoring Usage

### Check Blob Storage Usage:
1. Vercel Dashboard → Storage → Blob
2. View **Storage Used** and **Bandwidth Used**
3. See individual files and their sizes

### Optimize Storage:
- Delete old/unused files
- Compress images before upload
- Use appropriate image formats (WebP for photos)

---

## 🔄 Migration from Local Storage

If you have existing files in `uploads/`:

### Option 1: Manual Migration Script
```python
# migration_script.py
import os
import asyncio
from pathlib import Path
from services.blob_service import blob_service

async def migrate_files():
    uploads_dir = Path("uploads")
    
    for file_path in uploads_dir.rglob("*"):
        if file_path.is_file():
            with open(file_path, "rb") as f:
                content = f.read()
            
            # Determine folder from path
            relative_path = file_path.relative_to(uploads_dir)
            folder = str(relative_path.parent)
            
            # Upload to blob
            url = await blob_service.upload_file(
                file_content=content,
                filename=file_path.name,
                folder=folder
            )
            
            print(f"Migrated: {file_path} -> {url}")

# Run migration
asyncio.run(migrate_files())
```

### Option 2: Start Fresh
- Deploy with Blob storage
- Have users re-upload their files
- Simpler but requires user action

---

## ✅ Deployment Checklist

Before deploying to Vercel:

- [ ] Vercel Blob Storage created
- [ ] `BLOB_READ_WRITE_TOKEN` added to environment variables
- [ ] `aiohttp` in requirements.txt
- [ ] Code updated to use `blob_service`
- [ ] Tested file uploads locally
- [ ] Database populated with migrations
- [ ] All other environment variables set

---

## 🎉 Benefits of Vercel Blob

1. **Serverless-friendly** - Works with Vercel Functions
2. **Global CDN** - Fast access worldwide
3. **No storage limits** - Scales automatically
4. **Simple API** - Easy to use
5. **Integrated billing** - One bill for everything

---

## 📚 Additional Resources

- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [Blob API Reference](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
- [Pricing Calculator](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing)

---

## 🚀 You're Ready!

Your app now uses Vercel Blob Storage for all file uploads. Just add the `BLOB_READ_WRITE_TOKEN` environment variable in Vercel, and you're good to go!
