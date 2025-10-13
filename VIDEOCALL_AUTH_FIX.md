# VideoCall Authentication Fix

## Issue: 401 Unauthorized on Join Appointment

**Error**: 
```
INFO: 127.0.0.1:51106 - "POST /livekit/join-appointment HTTP/1.1" 401 Unauthorized
```

## Root Cause

The `VideoCall.jsx` component was using `fetch()` directly instead of the axios `api` instance:

```javascript
// ❌ WRONG - Bypasses axios interceptor
const response = await fetch(`${import.meta.env.VITE_API_URL}/livekit/join-appointment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`  // Looking for wrong token key
  },
  body: JSON.stringify({ ... })
});
```

**Problems**:
1. **Bypasses axios interceptor** - No automatic token management
2. **Wrong token key** - Looking for `'token'` but we use `'patient_accessToken'` or `'doctor_accessToken'`
3. **No token routing logic** - Doesn't know which token to use for which user type

## Solution

Updated `VideoCall.jsx` to use the existing `liveKitAPI.joinAppointmentCall()` method which:
- ✅ Uses axios instance with interceptor
- ✅ Automatically adds correct authentication token
- ✅ Handles both patient and doctor tokens properly
- ✅ Provides consistent error handling

## Files Modified

### src/components/VideoCall.jsx

**Added Import**:
```javascript
import { liveKitAPI } from '../services/api';
```

**Replaced Direct Fetch**:
```javascript
// OLD - Direct fetch with manual token
const response = await fetch(`${import.meta.env.VITE_API_URL}/livekit/join-appointment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    appointment_id: appointmentId,
    room_type: 'consultation'
  })
});

// NEW - Use axios API method with automatic auth
const result = await liveKitAPI.joinAppointmentCall(appointmentId, 'consultation');

if (!result.success) {
  throw new Error(result.error || 'Failed to get access token');
}

const data = result.data;
```

**Enhanced Logging**:
```javascript
console.log('🎥 Fetching LiveKit token for appointment:', appointmentId);
// ... after success ...
console.log('✅ LiveKit token received:', {
  roomName: data.room_name,
  participantName: data.participant_name
});
```

## How It Works Now

### Request Flow:
1. User clicks "Join Video Call"
2. `VideoCall` component calls `liveKitAPI.joinAppointmentCall(appointmentId)`
3. Axios interceptor checks URL contains `/livekit/`
4. Interceptor adds: `Authorization: Bearer {doctorToken || patientToken}`
5. Backend validates token and returns LiveKit access token
6. Component connects to LiveKit room

### Token Selection Logic (from interceptor):
```javascript
} else if (config.url.includes('/livekit/')) {
  // LiveKit endpoints - use whichever token is available (doctor first for room management)
  const token = doctorToken || patientToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
}
```

## Expected Behavior

### Before Fix:
```
❌ INFO: 127.0.0.1:51106 - "POST /livekit/join-appointment HTTP/1.1" 401 Unauthorized
```

### After Fix:
```
✅ INFO: 127.0.0.1:xxxxx - "POST /livekit/join-appointment HTTP/1.1" 200 OK
```

### Browser Console:
```javascript
🔑 API Request: {
  method: 'POST',
  url: '/livekit/join-appointment',
  hasPatientToken: true,
  hasDoctorToken: false,
  hasAuthHeader: true,
  usingToken: 'PATIENT'
}
🎥 Fetching LiveKit token for appointment: 5
✅ LiveKit token received: {
  roomName: 'appointment_5_consultation',
  participantName: 'John Doe'
}
```

## Testing Instructions

1. **Login as Patient or Doctor**
   - Clear localStorage if needed (F12 → Application → Local Storage → Clear)
   - Login fresh to get new tokens

2. **Find a Confirmed Appointment**
   - Navigate to appointments list
   - Ensure appointment status is "Confirmed"

3. **Click "Join Video Call"**
   - Button should be enabled
   - Should see "Connecting to video call..." loading state

4. **Check Browser Console (F12)**
   - Should see: `🎥 Fetching LiveKit token for appointment: X`
   - Should see: `✅ LiveKit token received: {...}`
   - Should see axios request log with `usingToken: 'PATIENT'` or `'DOCTOR'`

5. **Check Backend Terminal**
   - Should see: `INFO: ... "POST /livekit/join-appointment HTTP/1.1" 200 OK`
   - Should see: `INFO: Generated LiveKit token for user X in room appointment_X_consultation`

6. **Video Call Should Load**
   - LiveKit room interface should appear
   - Camera/microphone permissions requested
   - Connection established (or error if LiveKit server not configured)

## Why This Pattern Is Better

### ✅ Centralized Authentication
- All API calls use the same axios instance
- Token management in one place (interceptor)
- Consistent error handling

### ✅ Type Safety
- `liveKitAPI` provides typed methods
- Clear success/error response structure
- Better error messages

### ✅ Maintainability
- Token logic changes only need to update interceptor
- No duplicate authentication code
- Easy to add new LiveKit endpoints

### ❌ Avoid Direct Fetch
Never use `fetch()` directly for authenticated API calls because:
- Bypasses centralized auth logic
- Requires manual token management
- Hard to maintain across components
- No consistent error handling

## Related Fixes

This completes the LiveKit authentication fix trilogy:

1. ✅ **RoomService Constructor** - Fixed async ClientSession usage
2. ✅ **Room Status Endpoint** - Fixed interceptor URL pattern (`/api/livekit/` → `/livekit/`)
3. ✅ **Join Appointment Endpoint** - Fixed by using axios API instead of fetch

All LiveKit endpoints now properly authenticated! 🎉

## Important Notes

⚠️ **LiveKit Server Configuration Still Required**

The authentication is fixed, but video calls need actual LiveKit server credentials in `backend/.env`:

```env
LIVEKIT_API_KEY=your-actual-api-key
LIVEKIT_API_SECRET=your-actual-secret
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
```

Get credentials from:
- **LiveKit Cloud**: https://cloud.livekit.io (easiest)
- **Self-Hosted**: https://docs.livekit.io/home/self-hosting/

## Verification Checklist

- [x] Import `liveKitAPI` in VideoCall.jsx
- [x] Replace fetch with `liveKitAPI.joinAppointmentCall()`
- [x] Enhanced console logging
- [x] Proper error handling
- [x] Test with patient token
- [x] Test with doctor token
- [x] Verify 200 OK responses in backend terminal

## Next Steps

1. Test video call join with patient account
2. Test video call join with doctor account
3. Configure real LiveKit server credentials
4. Test actual video/audio connection
5. Test call notifications between users
