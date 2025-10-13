# 🎥 Video Conferencing - Quick Reference

## ✅ What's Been Implemented

### Core Features:
1. **✅ Anytime Video Calls** - No time restrictions (for testing)
2. **✅ Real-Time Notifications** - 5-second polling for active rooms
3. **✅ Patient Initiation** - From "Schedule" button → Appointments modal
4. **✅ Doctor Initiation** - From "This Week's Appointments" section
5. **✅ Bidirectional Notifications** - Both parties get notified when other joins

---

## 🎯 Quick Start

### Patient Flow:
```
Login → Dashboard → "Schedule" Button → See Appointments
→ Click "Join Video Call" on confirmed appointment
→ Enter video room
```

### Doctor Flow:
```
Login → Dashboard → See "This Week's Appointments"
→ Click "Video Call" button on confirmed appointment
→ Enter video room
```

### Notification Flow:
```
Party A joins call
→ System detects active room (within 5-10 seconds)
→ Party B sees purple notification popup
→ Party B clicks "Join Call"
→ Both connected!
```

---

## 📁 Files Modified/Created

### Frontend:
- ✅ `src/pages/UserHome.jsx` - Added notification system, removed time restrictions
- ✅ `src/pages/DoctorHome.jsx` - Added notification system, removed time restrictions
- ✅ `src/components/CallNotification.jsx` - NEW: Notification popup component
- ✅ `src/components/CallNotification.css` - NEW: Notification styles
- ✅ `src/hooks/useCallNotification.js` - NEW: Polling hook for active rooms
- ✅ `src/services/api.js` - Added checkRoomStatus API call

### Backend:
- ✅ `backend/routers/livekit.py` - Added /room-status/{appointment_id} endpoint
- ✅ `backend/services/livekit_service.py` - Added get_room_info() method

### Documentation:
- ✅ `VIDEO_CONFERENCING_GUIDE.md` - Complete setup guide
- ✅ `VIDEO_TESTING_GUIDE.md` - Testing instructions
- ✅ `VIDEO_QUICK_REFERENCE.md` - This file

---

## 🧪 Testing (2 Browsers Required)

### Browser 1: Patient
1. Login as patient
2. Go to dashboard
3. Click "Schedule"
4. Click "Join Video Call"
5. Wait in room...

### Browser 2: Doctor (5-10 seconds later)
1. Login as doctor
2. **Purple notification appears!**
3. Shows "Patient Name is waiting..."
4. Click "Join Call"
5. **Connected!** 🎉

---

## 🔑 Key Components

### CallNotification Component:
- Purple gradient design
- Animated ring icon
- 30-second auto-dismiss
- One-click join/dismiss
- Shows caller name & type

### useCallNotification Hook:
- Polls every 5 seconds
- Checks confirmed appointments only
- Tracks notified rooms
- Returns notification state

### Room Status API:
```javascript
GET /api/livekit/room-status/123
Returns:
{
  "is_active": true,
  "participant_count": 1,
  "room_name": "room_123"
}
```

---

## ⚙️ Configuration

### Polling Interval (Default: 5 seconds):
```javascript
// useCallNotification.js, line 52
const interval = setInterval(checkForActiveCalls, 5000);
```

### Auto-Dismiss Time (Default: 30 seconds):
```javascript
// CallNotification.jsx, line 14
const timer = setTimeout(() => handleDismiss(), 30000);
```

### Time Restrictions (Currently Disabled):
```javascript
// UserHome.jsx & DoctorHome.jsx
const canJoinVideoCall = (appointment) => {
  return appointment.status?.toLowerCase() === 'confirmed';
  // To re-enable time restrictions, restore original code
};
```

---

## 🎨 UI Elements

### Video Call Button:
- **Patient**: In appointments modal
- **Doctor**: On appointment cards
- **Color**: Purple gradient
- **Icon**: Camera icon
- **States**: Normal, Disabled, In Call

### Notification Popup:
- **Position**: Top-right corner
- **Animation**: Slides in from right
- **Effects**: Pulse glow, ring animation
- **Timer**: Visual countdown bar
- **Sound**: Plays notification.mp3 (if available)

---

## 🔐 Security

- ✅ JWT authentication required
- ✅ Only appointment participants can check room status
- ✅ Unique room per appointment
- ✅ No cross-appointment access
- ✅ Verified participant types

---

## 📊 Status Indicators

### Video Call Button Text:
- **"Join Video Call"** - Room is ready
- **"In Call"** - Currently in this room
- **Disabled** - Already in another call

### Notification States:
- **Visible** - Someone waiting in room
- **Hidden** - No active calls or already notified
- **Dismissed** - User manually closed

---

## 🚀 Next Steps (Optional)

### Production Enhancements:
1. Re-enable time restrictions for appointments
2. Add Firebase push notifications
3. Implement call history logging
4. Add call quality indicators
5. Store call recordings
6. Add screen sharing
7. Implement chat during call
8. Add multiple participants support

### Performance Optimizations:
1. Implement WebSocket for real-time updates (eliminate polling)
2. Add Redis caching for room status
3. Rate limiting on API calls
4. Optimize notification state management

---

## 📞 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| No notification appears | Wait 5-10 seconds, check appointment is confirmed |
| Button not showing | Verify appointment status = "confirmed" |
| Can't join call | Check LiveKit credentials, browser permissions |
| Duplicate notifications | Check console, restart browser |
| Room not found | Ensure other party actually joined |

---

## 🎯 Success Metrics

**Working Correctly When:**
- ✅ Notifications appear within 10 seconds
- ✅ One-click join from notification works
- ✅ Both participants can see/hear each other
- ✅ No duplicate notifications
- ✅ Calls work in both directions
- ✅ Multiple appointments work independently

---

## 📝 Code Snippets

### Check if notification is working:
```javascript
// Open Browser Console on Patient/Doctor page
// Watch for logs every 5 seconds:
console.log('Checking for active calls...');
```

### Manually trigger notification (for debugging):
```javascript
// In browser console:
const testNotification = {
  callerName: 'Test User',
  callerType: 'doctor',
  appointmentId: 123,
  appointment: { id: 123 }
};
// Trigger notification state
```

### Check room status manually:
```javascript
// API call:
fetch('/api/livekit/room-status/123', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);
```

---

**🎉 Everything is set up and ready for testing!**

Open 2 browsers, create confirmed appointment, and test the flow!
