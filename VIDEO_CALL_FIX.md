# Video Call Error Fixes

## Issues Fixed

### 1. Backend Error: `module 'livekit.api' has no attribute 'RoomService'`

**Problem**: The code was trying to access `api.RoomService()` directly, but in the livekit-api Python package, `RoomService` is located in `api.room_service` submodule.

**Solution**: Updated `backend/services/livekit_service.py`:
- Added import: `from livekit.api import room_service`
- Changed all instances of `api.RoomService` to `room_service.RoomService`
- Changed all instances of `api.CreateRoomRequest` to `room_service.CreateRoomRequest`
- Changed all instances of `api.DeleteRoomRequest` to `room_service.DeleteRoomRequest`
- Changed all instances of `api.ListRoomsRequest` to `room_service.ListRoomsRequest`

### 2. Frontend Error: `joinRoom is not a function`

**Problem**: The `useVideoCall` hook in `VideoCall.jsx` was exporting `joinCall` and `leaveCall`, but `DoctorHome.jsx` was trying to use `joinRoom` and `leaveRoom`.

**Solution**: Updated `src/components/VideoCall.jsx`:
- Renamed primary functions from `joinCall`/`leaveCall` to `joinRoom`/`leaveRoom`
- Added legacy aliases for backwards compatibility
- Added `error` state to the hook return
- Enhanced logging for debugging
- Both naming conventions now work

## Files Modified

1. **backend/services/livekit_service.py**
   - Fixed RoomService import and usage
   - All room management methods now work correctly

2. **src/components/VideoCall.jsx**
   - Updated `useVideoCall` hook to export both `joinRoom/leaveRoom` and `joinCall/leaveCall`
   - Added error handling
   - Enhanced logging

## Testing Instructions

1. **Clear browser cache** (already done if you cleared localStorage earlier)

2. **Restart backend server** (if not auto-reloaded):
   ```powershell
   # The uvicorn server should auto-reload, but if needed:
   cd C:\Users\USER\Desktop\CnC_Mock\backend
   .\venv\Scripts\Activate.ps1
   uvicorn main:app --reload
   ```

3. **Test video call**:
   - Login as doctor or patient
   - Find a confirmed appointment
   - Click "Join Video Call" button
   - Should now connect without errors

## Expected Behavior

- **Backend**: Room status endpoint should work without RoomService errors
- **Frontend**: Video call should initiate properly without "joinRoom is not a function" error
- **Console**: Should see connection logs like "Joining room for appointment: X as doctor/patient"

## Important Notes

⚠️ **LiveKit Server Configuration Required**

The video calls will only fully work once you configure actual LiveKit server credentials in `backend/.env`:

```env
LIVEKIT_API_KEY=your-actual-api-key
LIVEKIT_API_SECRET=your-actual-api-secret
LIVEKIT_URL=wss://your-livekit-server.livekit.io
```

Currently using placeholder values:
- `LIVEKIT_API_KEY=your-api-key`
- `LIVEKIT_API_SECRET=your-api-secret`
- `LIVEKIT_URL=wss://your-livekit-server.livekit.io`

### How to Get LiveKit Credentials

1. **Option 1: LiveKit Cloud (Easiest)**
   - Sign up at https://cloud.livekit.io
   - Create a project
   - Copy API Key, API Secret, and WebSocket URL

2. **Option 2: Self-Hosted**
   - Deploy LiveKit server: https://docs.livekit.io/home/self-hosting/deployment/
   - Generate API key/secret pair
   - Use your server's WebSocket URL

## Verification Steps

After fixing, you should NOT see these errors:

❌ **Backend Terminal**: `Error getting room info: module 'livekit.api' has no attribute 'RoomService'`
❌ **Browser Console**: `Failed to join video call: TypeError: joinRoom is not a function`

✅ **Should see instead**:
- Backend: Room info retrieved successfully (or appropriate error if room doesn't exist yet)
- Frontend: "Connecting to video call..." loading state
- Console: "Joining room for appointment: X as doctor/patient"

## Next Steps

1. Test the fix by clicking "Join Video Call" on a confirmed appointment
2. If errors persist, check browser console for new error messages
3. Once confirmed working, configure actual LiveKit server credentials for full functionality
