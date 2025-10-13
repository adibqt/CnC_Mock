# 🎥 Video Conferencing Guide

## How to Initiate Video Conference Between Doctor and Patient

### Prerequisites
1. **LiveKit Server Setup** (Required)
   - Sign up for LiveKit Cloud: https://livekit.io/
   - Or deploy your own LiveKit server
   - Get your API credentials

2. **Environment Configuration**
   Add these to `backend/.env`:
   ```env
   LIVEKIT_API_KEY=your_api_key_here
   LIVEKIT_API_SECRET=your_api_secret_here
   LIVEKIT_URL=wss://your-server.livekit.cloud
   ```

---

## 📋 Step-by-Step Process

### For Patients:

1. **Login** to your patient account
2. **Navigate** to the home dashboard
3. **Click** the "Schedule" button to view appointments
4. **Find** today's confirmed appointment
5. **Click** "Join Video Call" button (appears 30 min before appointment)
6. **Wait** for doctor to join

### For Doctors:

1. **Login** to your doctor account
2. **View** appointments on the home dashboard
3. **Find** today's confirmed appointment with the video call button
4. **Click** "Video Call" button to join
5. **Connect** with your patient

---

## ⏰ Video Call Availability Rules

Video call buttons only appear when:
- ✅ Appointment status is "Confirmed"
- ✅ Appointment is scheduled for TODAY
- ✅ Current time is within the window:
  - 30 minutes BEFORE appointment time
  - Up to 2 hours AFTER appointment time

### Example:
Appointment at 2:00 PM
- Video call available: 1:30 PM - 4:00 PM
- Outside this window: Button hidden

---

## 🎬 Video Call Features

### During a Call:

**Patient View:**
- See and hear the doctor
- Control your microphone/camera
- Screen sharing capability
- Leave call button

**Doctor View:**
- See and hear the patient
- Control your microphone/camera
- Screen sharing capability
- Leave call button

---

## 🔧 Technical Implementation

### How It Works:

1. **Patient clicks "Join Video Call"**
   ```
   UserHome.jsx → handleJoinVideoCall()
   ```

2. **Request access token from backend**
   ```
   liveKitAPI.joinAppointment(appointmentId, 'patient')
   ```

3. **Backend generates LiveKit token**
   ```
   LiveKitService.generate_access_token()
   ```

4. **VideoCall component connects**
   ```
   LiveKitRoom connects to room_{appointmentId}
   ```

5. **Doctor joins same room**
   ```
   DoctorHome.jsx → handleJoinVideoCall()
   Same room: room_{appointmentId}
   ```

6. **Real-time video/audio begins!** 🎉

---

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Patient   │         │   Backend    │         │   Doctor    │
│  Dashboard  │◄───────►│   FastAPI    │◄───────►│  Dashboard  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │                        ▼                        │
      │                 ┌──────────────┐                │
      └────────────────►│  LiveKit     │◄───────────────┘
                        │   Server     │
                        └──────────────┘
```

---

## 🚀 Testing the Feature

### Quick Test Steps:

1. **Create an appointment**
   - Patient books appointment with doctor
   - Doctor confirms the appointment

2. **Set appointment to today**
   - Use database or API to set `appointment_date` to today
   - Ensure `status` = 'confirmed'

3. **Test as patient**
   - Login as patient
   - Go to dashboard → Schedule
   - See video call button
   - Click to join

4. **Test as doctor**
   - Login as doctor
   - See appointment on home dashboard
   - See video call button
   - Click to join

5. **Verify connection**
   - Both should see each other
   - Audio/video should work
   - Can leave call cleanly

---

## 🔐 Security Features

- ✅ JWT authentication required
- ✅ Appointment-based room access
- ✅ Time-window restrictions
- ✅ Participant type validation
- ✅ Secure token generation
- ✅ Room-level permissions

---

## 📱 UI Locations

### Patient Side:
- **File**: `src/pages/UserHome.jsx`
- **Location**: Appointments modal
- **Trigger**: "Schedule" button → Modal → "Join Video Call"

### Doctor Side:
- **File**: `src/pages/DoctorHome.jsx`
- **Location**: This Week's Appointments section
- **Trigger**: "Video Call" button on appointment card

---

## 🎨 Styling

### Video Call Button:
- Purple gradient background
- Camera icon
- Hover effects
- Disabled state when in call
- Status text changes

### VideoCall Component:
- Full-screen overlay
- Controls bar
- Participant grid
- Leave button
- Connection status

---

## 🐛 Troubleshooting

### Button Not Showing?
- Check appointment is confirmed
- Verify appointment is today
- Check time window (30 min before to 2 hours after)
- Refresh the page

### Can't Connect?
- Verify LiveKit credentials in `.env`
- Check LiveKit server is running
- Check browser permissions (camera/microphone)
- Check network connectivity

### No Video/Audio?
- Grant browser permissions
- Check camera/mic hardware
- Test in browser settings first
- Try different browser

---

## 📞 Support

For issues:
1. Check browser console for errors
2. Check backend logs
3. Verify LiveKit server status
4. Check appointment status in database

---

## 🎯 Next Steps

### Future Enhancements:
- [ ] Recording capability
- [ ] Chat during call
- [ ] Screen sharing
- [ ] Multiple participants
- [ ] Call history
- [ ] Quality settings
- [ ] Mobile app support

---

**Happy Video Conferencing! 🎥✨**
