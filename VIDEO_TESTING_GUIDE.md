# 🎥 Video Conferencing - Testing Guide

## ✅ Implementation Complete!

### What's Been Updated:

1. **✅ Removed Time Restrictions**
   - Video call buttons now show for ANY confirmed appointment
   - No date/time limitations for testing purposes
   - Available 24/7 for confirmed appointments

2. **✅ Real-Time Call Notifications**
   - When doctor joins a call, patient gets notified
   - When patient joins a call, doctor gets notified
   - Beautiful animated notification popup
   - Auto-dismisses after 30 seconds
   - One-click join from notification

3. **✅ Automatic Room Detection**
   - System checks every 5 seconds for active video rooms
   - Shows notification when someone is waiting
   - Prevents duplicate notifications

---

## 🚀 How to Test

### Step 1: Setup Appointments

1. **Login as Patient**
   - Navigate to DoctorDetails
   - Book an appointment with any doctor
   
2. **Login as Doctor** (different browser/incognito)
   - Go to Doctor Home Dashboard
   - Find the pending appointment in "This Week's Appointments"
   - **Click "Confirm" button** to change status to "Confirmed"
   - (The appointment status badge will update immediately)

### Step 2: Test Patient Initiating Call

1. **Patient Side:**
   ```
   Login as Patient → Dashboard → Click "Schedule" Button
   → Find confirmed appointment → Click "Join Video Call"
   ```
   - Patient enters video room
   - Video feed should appear

2. **Doctor Side (Different Browser):**
   ```
   Login as Doctor → Home Dashboard
   → Look at "This Week's Appointments"
   ```
   - **Within 5 seconds**, a purple notification will popup in top-right
   - Notification shows: "Patient Name is waiting in the video room"
   - Click "Join Call" button on notification
   - Doctor enters same room
   - **Both can see each other!** 🎉

### Step 3: Test Doctor Initiating Call

1. **Doctor Side:**
   ```
   Login as Doctor → Home Dashboard
   → Find appointment in "This Week's Appointments"
   → Click "Video Call" button
   ```
   - Doctor enters video room

2. **Patient Side (Different Browser):**
   ```
   Login as Patient → Dashboard
   ```
   - **Within 5 seconds**, purple notification appears
   - Shows: "Doctor Name is waiting in the video room"
   - Click "Join Call"
   - Patient enters room
   - **Video conference active!** 🎉

---

## 🎬 Demo Scenario

### Complete Walkthrough:

```
Browser 1: Patient Account
Browser 2: Doctor Account

1. Browser 1: Login as test@patient.com
2. Browser 2: Login as doctor@test.com

3. Browser 1: Book appointment with that doctor
4. Browser 2: Go to schedule, confirm the appointment

5. Browser 1: Dashboard → "Schedule" → See appointment
6. Browser 1: Click "Join Video Call" button
   - Patient enters video room alone

7. Browser 2: Wait 5 seconds...
   - 🔔 Notification pops up!
   - "Test Patient is waiting in the video room"
   
8. Browser 2: Click "Join Call" on notification
   - Doctor enters room
   - Both participants connected!
   - Video/audio working
   - Can leave call anytime
```

---

## 📱 UI Features

### Call Notification Popup:

**Appearance:**
- 🟣 Purple gradient header with animated ring icon
- 👤 Caller name and type (Doctor/Patient)
- 🔢 Appointment ID
- ⏱️ 30-second auto-dismiss timer bar
- 🔊 Plays notification sound (if available)

**Animations:**
- Slides in from right
- Pulses with purple glow
- Icon rings like incoming call
- Timer bar counts down

**Actions:**
- 🟢 "Join Call" - Enter video room immediately
- ⚪ "Dismiss" - Close notification

---

## 🔧 Technical Details

### Polling System:
- Checks for active rooms every **5 seconds**
- Only checks **confirmed appointments**
- Tracks which rooms have been notified
- Prevents duplicate notifications

### Room Status API:
```javascript
GET /api/livekit/room-status/{appointment_id}

Response:
{
  "is_active": true,
  "participant_count": 1,
  "room_name": "room_123"
}
```

### Notification Logic:
```javascript
if (room_is_active && participant_count > 0 && !already_notified) {
  show_notification();
  mark_as_notified();
}
```

---

## 🎯 Key Features

### ✅ Patient Features:
- Join video call from "Schedule" modal
- Receive notifications when doctor joins
- See video call button on ANY confirmed appointment
- One-click join from notification
- Leave call anytime

### ✅ Doctor Features:
- Join video call from "This Week's Appointments"
- Receive notifications when patient joins
- See video call button on confirmed appointments
- One-click join from notification
- Leave call anytime

---

## 🐛 Troubleshooting

### Notification Not Appearing?

**Check:**
1. ✅ Appointment is **confirmed** (not pending/cancelled)
2. ✅ Other party actually joined the call
3. ✅ Wait 5-10 seconds for polling
4. ✅ Not already in a call
5. ✅ Backend server is running
6. ✅ Browser console for errors

### Button Not Showing?

**Solution:**
- Only confirmed appointments show buttons
- Refresh the page
- Check appointment status in database

### Can't Connect?

**Fix:**
1. Check LiveKit credentials in `.env`
2. Verify backend is running
3. Check browser permissions (camera/mic)
4. Try different browser
5. Check console for errors

---

## 🔐 Security

### Access Control:
- ✅ JWT authentication required
- ✅ Only appointment participants can check room status
- ✅ Patient can only see their appointments
- ✅ Doctor can only see their appointments
- ✅ Unique room per appointment

### Notification Privacy:
- Only shown to appointment participants
- Room status checks are authenticated
- No cross-appointment notifications

---

## 📊 Testing Checklist

- [ ] Patient can initiate call
- [ ] Doctor receives notification within 5-10 seconds
- [ ] Doctor can join from notification
- [ ] Both participants can see/hear each other
- [ ] Doctor can initiate call
- [ ] Patient receives notification
- [ ] Patient can join from notification
- [ ] Notification auto-dismisses after 30 seconds
- [ ] Can manually dismiss notification
- [ ] No duplicate notifications
- [ ] Leave call works for both parties
- [ ] Multiple appointments work independently

---

## 🎨 Customization

### Adjust Polling Interval:
```javascript
// In useCallNotification.js
const interval = setInterval(checkForActiveCalls, 5000); // 5 seconds
// Change to 3000 for 3 seconds, 10000 for 10 seconds, etc.
```

### Adjust Auto-Dismiss Time:
```javascript
// In CallNotification.jsx
const timer = setTimeout(() => {
  handleDismiss();
}, 30000); // 30 seconds
// Change to 60000 for 1 minute, etc.
```

---

## 🚀 Production Recommendations

### Before Going Live:

1. **Re-enable Time Restrictions:**
   - Uncomment the date/time validation
   - Limit to 30 min before to 2 hours after appointment

2. **Add Push Notifications:**
   - Integrate Firebase Cloud Messaging
   - Send push notifications even when browser closed
   - Works on mobile devices

3. **Add Call History:**
   - Log when calls start/end
   - Track call duration
   - Store for billing/records

4. **Rate Limiting:**
   - Limit room status checks
   - Prevent API abuse
   - Add caching

5. **Error Handling:**
   - Graceful degradation if LiveKit is down
   - Show clear error messages
   - Retry logic

---

## 📞 Support

### Common Issues:

**"Cannot read property of undefined"**
- Ensure appointments have patient/doctor data populated
- Check API responses include related data

**"Failed to join video call"**
- Verify LiveKit credentials
- Check LiveKit server status
- Ensure room creation permissions

**Notification stuck/not dismissing**
- Check browser console
- Verify state management
- Try hard refresh (Ctrl+Shift+R)

---

## 🎉 Success Criteria

### Test is Successful When:

1. ✅ Patient joins call → Doctor gets notified within 10 seconds
2. ✅ Doctor joins call → Patient gets notified within 10 seconds
3. ✅ Clicking notification joins the call
4. ✅ Both participants can see/hear each other
5. ✅ No duplicate notifications
6. ✅ Notification auto-dismisses
7. ✅ Call works bidirectionally
8. ✅ Multiple appointments don't interfere

---

**Happy Testing! 🎥✨**

Test with 2 browsers, 2 accounts, and watch the magic happen!
