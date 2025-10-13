# Patient Connection Closes Immediately - Troubleshooting

## Error Details

**Browser Console**:
```
could not createOffer with closed peer connection
{room: 'appointment_10_consultation', roomID: 'RM_sBsLes3RKoZy', participant: 'patient_2', pID: 'PA_hE5SfstxgbNs'}
```

**Analysis**:
- ✅ Patient token generated (`patient_2`)
- ✅ Room ID correct (`appointment_10_consultation`)
- ✅ Participant ID created (`PA_hE5SfstxgbNs`)
- ❌ Connection closes immediately after WebRTC negotiation

## Common Causes

### 1. Camera/Microphone Permissions

**Symptoms**:
- Connection starts but closes immediately
- No permission prompt shown
- "createOffer" fails

**Solution**:
Check browser permissions:
```
Chrome: chrome://settings/content/camera
        chrome://settings/content/microphone

Edge: edge://settings/content/camera
      edge://settings/content/microphone
```

**Or click the camera icon** in address bar and allow permissions.

### 2. Same User in Multiple Tabs

**Issue**: If the same browser/user has multiple tabs open trying to connect:
- WebRTC conflicts
- Media device already in use
- Connection fails

**Solution**:
- Close all other video call tabs
- Use incognito/private window for patient
- Use different browser for patient

### 3. Network/Firewall Issues

**WebRTC Requirements**:
- UDP ports 50000-60000
- STUN/TURN server access
- No strict NAT restrictions

**Test**:
```javascript
// In browser console
navigator.mediaDevices.getUserMedia({video: true, audio: true})
  .then(stream => {
    console.log('✅ Media access granted:', stream);
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Media access denied:', err));
```

### 4. Token Issue

**Check**:
1. Backend logs show token generation
2. Token includes correct permissions
3. Token not expired

**Backend should show**:
```
🎥 Generated LiveKit token for user 2 (Adib Rahman) in room appointment_10_consultation
   Participant identity: patient_2
   LiveKit URL: wss://cncmock-klusg79b.livekit.cloud
```

### 5. Doctor Left the Room

**Issue**: If doctor disconnects before patient joins:
- Room might be deleted
- Patient connects to empty/closing room
- Connection fails

**Solution**:
- Ensure doctor stays connected
- Run `python test_rooms.py` to verify doctor still in room
- Should show 1 participant

## Diagnostic Steps

### Step 1: Verify Doctor is Still Connected

**Terminal**:
```bash
cd backend
python test_rooms.py
```

**Expected**:
```
📍 Room: appointment_10_consultation
   Participants: 1  ← Doctor still there
```

If 0 participants, doctor left. Doctor must rejoin first.

### Step 2: Check Browser Permissions

**Patient Browser**:
1. Click **lock icon** in address bar
2. Check Camera: **Allow**
3. Check Microphone: **Allow**
4. Reload page if changed

### Step 3: Check Console for Detailed Error

After clicking "Join Call", check console for:
```javascript
❌ LiveKit connection error: ...
Error details: {
  name: "...",
  message: "...",  ← Key information here
  code: "..."
}
```

Common error messages:
- **"Permission denied"** → Camera/mic permissions
- **"Connection timeout"** → Network/firewall
- **"Invalid token"** → Backend token issue
- **"Room not found"** → Doctor left

### Step 4: Test Media Access Directly

**Patient Browser Console**:
```javascript
// Test if browser can access camera/mic
navigator.mediaDevices.getUserMedia({video: true, audio: true})
  .then(stream => {
    console.log('✅ Media OK - got tracks:', stream.getTracks());
    // Create video element to show camera
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.style.position = 'fixed';
    video.style.top = '10px';
    video.style.right = '10px';
    video.style.width = '200px';
    video.style.zIndex = '99999';
    document.body.appendChild(video);
    
    // Stop after 5 seconds
    setTimeout(() => {
      stream.getTracks().forEach(t => t.stop());
      video.remove();
    }, 5000);
  })
  .catch(err => console.error('❌ Cannot access media:', err));
```

If this fails, the issue is **browser permissions**, not LiveKit.

### Step 5: Check if Multiple Tabs Open

**Issue**: Same user, multiple tabs trying to access camera

**Solution**:
1. Close ALL other tabs with the video call
2. Only keep one patient tab open
3. Try joining again

### Step 6: Try Different Browser

**Current setup**:
- Doctor: Browser A → Working ✅
- Patient: Browser B → Failing ❌

**Try**:
- Doctor: Chrome → Keep connected
- Patient: Firefox/Edge/Chrome Incognito → Test

Different browsers = Different media access = Avoid conflicts

## Recommended Testing Setup

### Clean Test (No Conflicts):

**Doctor (Chrome)**:
```
1. Clear cache: Ctrl+Shift+Delete
2. Login as doctor (User ID: 1)
3. Join appointment 10
4. Grant camera/mic permissions
5. See own video
6. Keep window open
```

**Patient (Firefox or Chrome Incognito)**:
```
1. Open incognito: Ctrl+Shift+N
2. Go to http://localhost:5173
3. Login as patient (User ID: 2)
4. Wait for notification
5. Click "Join Call"
6. Grant camera/mic permissions
7. Should connect
```

## Quick Fixes to Try

### Fix 1: Reload and Grant Permissions
```
1. Patient: Reload page (F5)
2. Click "Join Call"
3. When permission prompt appears: Click "Allow"
4. Should connect
```

### Fix 2: Test with Camera/Mic Disabled First
Modify VideoCall component temporarily:
```jsx
<LiveKitRoom
  video={false}  ← Disable video
  audio={false}  ← Disable audio
  token={token}
  serverUrl={wsURL}
  // ... rest
>
```

If this works, the issue is **media permissions**.

### Fix 3: Clear Browser State
```
Patient browser:
1. F12 → Application → Storage → Clear site data
2. Close browser completely
3. Reopen in incognito
4. Login and try again
```

## If Still Failing

Provide these details:
1. **Browser**: Chrome/Firefox/Edge/Safari + version
2. **OS**: Windows/Mac/Linux
3. **Console error message** (the full error object)
4. **Backend logs** when patient clicks "Join Call"
5. **Result of media test** (Step 4 above)
6. **Doctor still connected?** (Step 1 - test_rooms.py output)

## Most Likely Issue

Based on the error, **most likely**:
1. **Camera/Microphone permissions not granted**
2. **Same user in multiple browser tabs** (device conflict)

**Test this first**:
- Patient: Close ALL tabs, open ONE incognito tab
- Grant camera/mic permissions when prompted
- Try joining

The patient is reaching LiveKit (participant ID created), but WebRTC negotiation fails (can't create offer) → Usually permissions or device access issue.
