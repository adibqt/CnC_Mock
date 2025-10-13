# LiveKit RoomService and Authentication Fixes

## Issues Fixed

### 1. RoomService Constructor Error
**Error**: `RoomService.__init__() missing 1 required positional argument: 'api_secret'`

**Root Cause**: The LiveKit `RoomService` constructor signature requires:
```python
RoomService(session: aiohttp.ClientSession, url: str, api_key: str, api_secret: str)
```

We were incorrectly calling it as:
```python
RoomService(url, api_key, api_secret)  # Missing session parameter
```

**Solution**: Updated `backend/services/livekit_service.py`:
1. Added `aiohttp` import for async HTTP sessions
2. Made all room management methods async
3. Create `aiohttp.ClientSession` for each API call
4. Pass session as first parameter to RoomService

### 2. 401 Unauthorized on Room Status Endpoint
**Error**: `INFO: 127.0.0.1:57947 - "GET /livekit/room-status/5 HTTP/1.1" 401 Unauthorized`

**Root Cause**: The axios interceptor in `src/services/api.js` was checking for `/api/livekit/` but the actual endpoint path is `/livekit/` (without `/api/` prefix).

**Solution**: Fixed the interceptor URL pattern matching from:
```javascript
config.url.includes('/api/livekit/')  // ❌ Wrong - never matches
```
to:
```javascript
config.url.includes('/livekit/')      // ✅ Correct - matches actual path
```

## Files Modified

### 1. backend/services/livekit_service.py

**Changes**:
- Added imports: `aiohttp`, `asyncio`
- Made `create_room()` async with ClientSession
- Made `end_room()` async with ClientSession
- Made `get_room_info()` async with ClientSession

**Example Fix**:
```python
# Before
def get_room_info(self, room_name: str):
    room_client = room_service.RoomService(self.livekit_url, self.api_key, self.api_secret)
    rooms = room_client.list_rooms(room_service.ListRoomsRequest())

# After
async def get_room_info(self, room_name: str):
    async with aiohttp.ClientSession() as session:
        room_client = room_service.RoomService(session, self.livekit_url, self.api_key, self.api_secret)
        rooms = await room_client.list_rooms(room_service.ListRoomsRequest())
```

### 2. backend/routers/livekit.py

**Changes**: Added `await` to all livekit_service method calls:
- `await livekit_service.get_room_info(room_name)`
- `await livekit_service.create_room(room_name, max_participants)`
- `await livekit_service.end_room(room_name)`

### 3. src/services/api.js

**Changes**: Fixed LiveKit endpoint pattern matching in axios interceptor:
```javascript
// Line ~70
} else if (config.url.includes('/livekit/')) {  // Changed from '/api/livekit/'
  const token = doctorToken || patientToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
}
```

## Testing Instructions

### 1. Verify Backend Auto-Reload
The uvicorn server should automatically reload with the Python changes. Check terminal:
```
INFO:     Watching for changes in 'C:\Users\USER\Desktop\CnC_Mock\backend'
INFO:     Application startup complete.
```

### 2. Verify No More Errors

**Before Fix**:
- ❌ `Error getting room info: RoomService.__init__() missing 1 required positional argument: 'api_secret'`
- ❌ `INFO: 127.0.0.1:57947 - "GET /livekit/room-status/5 HTTP/1.1" 401 Unauthorized`

**After Fix**:
- ✅ No RoomService init errors
- ✅ Room status returns 200 OK with proper authentication
- ✅ Both authenticated and unauthenticated requests handled properly

### 3. Test Video Call Flow

1. **Login as Patient or Doctor**
2. **Navigate to appointments**
3. **Click "Join Video Call"** on a confirmed appointment
4. **Check Browser Console** (F12):
   ```
   🔑 API Request: { method: 'GET', url: '/livekit/room-status/5', usingToken: 'PATIENT' }
   ```
5. **Check Backend Terminal**:
   ```
   INFO: 127.0.0.1:xxxxx - "GET /livekit/room-status/5 HTTP/1.1" 200 OK
   ```

### 4. Monitor Polling

The notification system polls every 5 seconds. You should see:
```
🔑 API Request: { method: 'GET', url: '/livekit/room-status/X', hasAuthHeader: true }
```

## Technical Details

### Why AsyncIO is Required

The LiveKit Python SDK uses async/await for API calls because:
1. Room operations involve network HTTP requests
2. aiohttp provides async HTTP client functionality
3. FastAPI routes can be async, making this a natural fit

### Token Priority for LiveKit

The interceptor uses `doctorToken || patientToken`:
- Tries doctor token first (doctors manage rooms)
- Falls back to patient token (patients join rooms)
- Both user types need access to room-status endpoint

### Room Status Endpoint Behavior

- **200 OK with is_active: true** - Room exists and has participants
- **200 OK with is_active: false** - Room doesn't exist or is empty
- **401 Unauthorized** - No valid auth token (now fixed)
- **403 Forbidden** - User doesn't have access to this appointment

## Expected Behavior Now

### Backend Logs (No More Errors)
```
INFO: 127.0.0.1:xxxxx - "GET /livekit/room-status/5 HTTP/1.1" 200 OK
INFO: 127.0.0.1:xxxxx - "GET /livekit/room-status/5 HTTP/1.1" 200 OK
```

### Browser Console
```javascript
🔑 API Request: {
  method: 'GET',
  url: '/livekit/room-status/5',
  hasPatientToken: true,
  hasDoctorToken: false,
  hasAuthHeader: true,
  usingToken: 'PATIENT'
}
```

## Important Notes

⚠️ **LiveKit Server Still Required**

These fixes resolve the API calling issues, but you still need to configure a real LiveKit server in `backend/.env`:

```env
LIVEKIT_API_KEY=your-actual-api-key-here
LIVEKIT_API_SECRET=your-actual-secret-here
LIVEKIT_URL=wss://your-server.livekit.cloud
```

Currently using placeholders:
- `LIVEKIT_API_KEY=your-api-key`
- `LIVEKIT_API_SECRET=your-api-secret`
- `LIVEKIT_URL=wss://your-livekit-server.livekit.io`

### Get LiveKit Credentials

**Option 1: LiveKit Cloud (Recommended)**
1. Sign up: https://cloud.livekit.io
2. Create project
3. Copy credentials to `.env`

**Option 2: Self-Hosted**
1. Deploy LiveKit: https://docs.livekit.io/home/self-hosting/deployment/
2. Generate API credentials
3. Use your server's WebSocket URL

## Next Steps

1. ✅ Backend errors fixed (RoomService constructor)
2. ✅ Authentication fixed (401 errors resolved)
3. ⏳ Configure real LiveKit server credentials
4. ⏳ Test actual video call connections
5. ⏳ Re-enable time restrictions for production

## Troubleshooting

If you still see errors:

1. **401 Unauthorized**: Check browser console for token presence
   ```javascript
   localStorage.getItem('patient_accessToken')
   localStorage.getItem('doctor_accessToken')
   ```

2. **RoomService Errors**: Check backend terminal for import errors
   ```
   python -c "from livekit.api import room_service; print('OK')"
   ```

3. **Connection Refused**: Ensure backend is running on port 8000
   ```
   netstat -an | findstr :8000
   ```
