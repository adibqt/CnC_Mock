# LiveKit Environment Variables Not Loading

## Issue
After adding LiveKit credentials to `.env`, the backend still shows:
```
Error getting room info: Cannot connect to host your-livekit-server.livekit.io:443
```

## Root Cause
Uvicorn's `--reload` flag only watches for **Python file changes**, not `.env` file changes. The `LiveKitService` instance was created with the old placeholder values and is cached in memory.

## Solution

### Option 1: Manual Restart (Recommended)
1. Go to the terminal running uvicorn
2. Press `Ctrl+C` to stop
3. Run: `uvicorn main:app --reload`

### Option 2: Force Auto-Reload
Make any small change to a Python file (add/remove a comment) and save it. This triggers uvicorn's file watcher.

### Option 3: Touch a File (PowerShell)
```powershell
cd C:\Users\USER\Desktop\CnC_Mock\backend
(Get-Item main.py).LastWriteTime = Get-Date
```

## Verification

After restart, check the startup logs:
```
INFO:     Will watch for changes in these directories: ['C:\\Users\\USER\\Desktop\\CnC_Mock\\backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using WatchFiles
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Then test video call - should connect to:
```
wss://cncmock-klusg79b.livekit.cloud
```

Instead of:
```
wss://your-livekit-server.livekit.io  ❌ (old placeholder)
```

## Why This Happens

Python's environment variable loading:
1. `.env` file is loaded when app starts
2. `LiveKitService.__init__()` reads `os.getenv()` at instantiation
3. Global instance `livekit_service = LiveKitService()` created once
4. Changing `.env` doesn't affect already-loaded values in memory
5. Must restart Python process to reload

## Prevention

For development, you can add a helper command to reload environment:
```python
@app.get("/reload-config")
def reload_config():
    """Force reload environment variables (dev only)"""
    from services.livekit_service import livekit_service
    livekit_service.__init__()  # Re-initialize with new env vars
    return {"message": "Config reloaded"}
```

But for security, **never** expose this in production!

## Current Credentials (Confirmed Loaded)

From your `.env`:
```
LIVEKIT_URL=wss://cncmock-klusg79b.livekit.cloud
LIVEKIT_API_KEY=APITXEUZdY... (10 chars shown)
LIVEKIT_API_SECRET=o9CAch1m1g... (loaded)
```

These are correct LiveKit Cloud credentials and will work once server restarts.
