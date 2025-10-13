# LiveKit Room Not Found - Diagnostic Guide

## The Error

```
Error getting room info: Room appointment_5_consultation not found
```

**Browser**: `could not createOffer with closed peer connection`

## What This Means

LiveKit rooms are **ephemeral**:
- Room is created when **first person joins**
- Room is **automatically deleted** when last person leaves or after timeout
- Room doesn't exist until someone actually connects

## Common Scenarios

### Scenario 1: Doctor Left Before Patient Joined ❌
```
1. Doctor clicks "Join Call" → Room created
2. Doctor's video loads briefly
3. Doctor closes tab/browser → Room deleted
4. Patient tries to join → "Room not found"
```

**Solution**: Doctor must **stay in the call** for patient to join

### Scenario 2: Room Status Checking Before Creation ✅
```
1. Patient polling checks room → Not found (normal)
2. Doctor clicks "Join Call" → Room being created...
3. Patient poll checks again → Not found (room still creating)
4. Doctor fully connected → Room now exists
5. Next patient poll → Room found! → Notification shows
```

**This is normal behavior** - polls will show "not found" until doctor is fully connected

### Scenario 3: Network/Connection Issues ❌
```
1. Doctor clicks "Join Call"
2. Token fetched successfully
3. Connection to LiveKit fails → Room never created
4. Patient sees no notification
```

**Check**:
- LiveKit server URL accessible: `wss://cncmock-klusg79b.livekit.cloud`
- Firewall not blocking WebSocket connections
- Browser console for connection errors

## Diagnostic Steps

### 1. Verify Doctor Stays Connected

**Doctor Side**:
1. Click "Join Video Call"
2. Wait for "✅ Successfully connected to room: appointment_X_consultation" in console
3. **Keep the call window open**
4. Don't close tab or navigate away

**Check Browser Console**:
```javascript
✅ 🎥 Fetching LiveKit token for appointment: 5 userType: doctor
✅ ✅ LiveKit token received: {roomName: 'appointment_5_consultation', ...}
✅ ✅ Successfully connected to room: appointment_5_consultation
✅ 👤 Participant: Dr. Smith
```

### 2. Patient Checks While Doctor is Connected

**Patient Side** (different browser/incognito):
1. Login as patient
2. Go to appointments
3. Wait 5-10 seconds for polling
4. Check console for room status checks:

```javascript
// Before doctor joins
{is_active: false, participant_count: 0, room_name: 'appointment_5_consultation'}

// After doctor joins
{is_active: true, participant_count: 1, room_name: 'appointment_5_consultation'}
```

### 3. Backend Logs Analysis

**While doctor is in call**, backend should show:
```
INFO: Generated LiveKit token for user X in room appointment_5_consultation
INFO: Room appointment_5_consultation is active with 1 participants
```

**When patient tries to join**:
```
INFO: Generated LiveKit token for user Y in room appointment_5_consultation
INFO: Room appointment_5_consultation is active with 2 participants
```

## Testing Checklist

- [ ] Doctor clicks "Join Call"
- [ ] Doctor sees their own video/camera
- [ ] Doctor console shows "Successfully connected"
- [ ] **Doctor keeps the call window open** (don't close!)
- [ ] Patient waits 5-10 seconds
- [ ] Patient sees notification: "Dr. [Name] is calling..."
- [ ] Patient clicks "Join Call"
- [ ] Patient connects to same room
- [ ] Both see each other

## If Patient Still Can't Join

### Check 1: Doctor Actually Connected?

**Doctor Console Must Show**:
```
✅ Successfully connected to room: appointment_5_consultation
```

**Not just**:
```
✅ LiveKit token received  ← This is not enough!
```

The token being received doesn't mean connected. Connection happens after.

### Check 2: Room Name Consistency

**Backend logs should show**:
```
Generated LiveKit token for user X in room appointment_5_consultation
```

**Not**:
```
Generated LiveKit token for user X in room appointment_5  ← Wrong!
Generated LiveKit token for user X in room room_5  ← Wrong!
```

### Check 3: LiveKit Server Reachable

Test in browser console:
```javascript
// Check if LiveKit URL is accessible
fetch('https://cncmock-klusg79b.livekit.cloud')
  .then(r => console.log('LiveKit server reachable'))
  .catch(e => console.error('Cannot reach LiveKit server:', e));
```

### Check 4: Token Expiration

Tokens expire after 24 hours. If testing over multiple days, old tokens won't work.

**Solution**: Always fetch fresh token when joining (which the code already does).

## Common Mistakes

### ❌ Doctor closes tab immediately
Room gets deleted, patient can't join.

### ❌ Using different browsers for testing without incognito
Tokens/sessions may conflict.

### ❌ Not waiting for connection
Doctor clicks join → immediately checks if patient can see → too fast, room still connecting.

### ❌ Wrong room name in code
If doctor joins `appointment_5_consultation` but patient polls for `room_5` → won't match.

## Expected Flow (Step by Step)

**Time 0:00 - Doctor Joins**
```
Doctor: Click "Join Video Call"
Backend: Generates token for appointment_5_consultation
Doctor Browser: Connects to LiveKit
LiveKit Server: Creates room appointment_5_consultation
Doctor: Sees own video
```

**Time 0:05 - Patient Polling**
```
Patient Browser: Checks /livekit/room-status/5 (every 5s)
Backend: Queries LiveKit for appointment_5_consultation
LiveKit: Reports 1 participant (doctor)
Patient: Notification appears!
```

**Time 0:10 - Patient Joins**
```
Patient: Clicks "Join Call"
Backend: Generates token for appointment_5_consultation (same room)
Patient Browser: Connects to LiveKit
LiveKit Server: Adds patient to existing room
Both: See each other!
```

## Troubleshooting Commands

### Check if room exists on LiveKit server
```python
# In backend terminal
python -c "
import asyncio
from services.livekit_service import livekit_service

async def check():
    try:
        info = await livekit_service.get_room_info('appointment_5_consultation')
        print('Room found:', info)
    except Exception as e:
        print('Room not found:', e)

asyncio.run(check())
"
```

### Force create a room
```python
# In backend terminal
python -c "
import asyncio
from services.livekit_service import livekit_service

async def create():
    try:
        room = await livekit_service.create_room('test_room_123', 10)
        print('Room created:', room)
    except Exception as e:
        print('Failed to create room:', e)

asyncio.run(create())
"
```

## Key Takeaway

**LiveKit rooms don't persist without participants!**

The doctor must be **actively connected and in the call** for the patient to join. The room doesn't exist as a "waiting room" - it only exists while someone is connected to it.

This is by design for security and cost optimization. Empty rooms are automatically cleaned up.
