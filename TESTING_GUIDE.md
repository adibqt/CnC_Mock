# Quick Testing Guide - Appointment System

## 🚀 Quick Start

### 1. Start Backend Server
```powershell
cd C:\Users\USER\Desktop\CnC_Mock\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```
✅ Look for: "✓ Database tables created successfully!"

### 2. Start Frontend Server
```powershell
cd C:\Users\USER\Desktop\CnC_Mock
npm run dev
```
✅ Look for: Server running at http://localhost:5173

---

## 📝 Test Scenario 1: Book Appointment as Patient

### Steps:
1. **Open Browser** → http://localhost:5173
2. **Login as Patient** (or create new account)
3. **Click "Available Doctors"** section on home page
4. **Click "Book Appointment"** on any doctor
5. **Select a Date** (must be tomorrow or later)
6. **Wait for Time Slots** to load
7. **Click on an Available Slot** (not marked "Booked")
8. **Fill in Symptoms** (optional)
9. **Click "Confirm Appointment"**

### ✅ Expected Results:
- Success message appears: "Appointment Booked Successfully!"
- You're redirected to User Home after 2 seconds
- Backend logs show: "✓ Appointment created successfully: ID X"

### ❌ If Error Occurs:
- Check backend terminal for error messages
- Verify the date is tomorrow or later
- Ensure time slot is not already booked

---

## 📅 Test Scenario 2: View Appointments (Patient Side)

### Steps:
1. **From User Home**, click **"Dashboard"** button (top right)
2. **Scroll down** to "My Activities" section
3. **Click "Schedule"** button (calendar icon)
4. **Appointment section slides down** with animation

### ✅ Expected Results:
- Your booked appointment appears with:
  - ✅ Doctor's name and photo
  - ✅ Specialization
  - ✅ Date (in large format: day + month)
  - ✅ Time slot
  - ✅ Status badge (colored: pending/confirmed/completed/cancelled)
  - ✅ Symptoms preview (if you entered any)

### 🎨 Visual Features:
- Appointment cards have colored left borders based on status:
  - 🟠 **Orange** = Pending
  - 🟢 **Green** = Confirmed
  - 🔵 **Blue** = Completed
  - 🔴 **Red** = Cancelled
- Cards have hover effects
- Smooth slide-down animation when opening

---

## 👨‍⚕️ Test Scenario 3: View Appointments (Doctor Side)

### Steps:
1. **Logout from Patient** account
2. **Login as Doctor** (or create doctor account)
3. **Automatic redirect** to Doctor Home
4. **Look at "This Week's Appointments"** section

### ✅ Expected Results:
- Your patient's appointment appears with:
  - ✅ Patient name and photo
  - ✅ Date (formatted: "Mon, Jan 15")
  - ✅ Time slot
  - ✅ Symptoms (if patient entered any)
  - ✅ Status badge
  - ✅ Call button (phone icon)

### 📊 Stats Section Shows:
- Total Patients count
- Today's Appointments count
- Pending Reports
- Doctor Rating

---

## 🚫 Test Scenario 4: Double Booking Prevention

### Steps:
1. **Login as a DIFFERENT patient** (or create new patient account)
2. **Navigate to the SAME doctor**
3. **Select the SAME date**
4. **Try to book the SAME time slot**

### ✅ Expected Results:
- ❌ Time slot shows **"Booked"** label
- ❌ Slot button is **disabled** (greyed out)
- ❌ Can't click on booked slot
- ✅ Can select OTHER available slots

### If You Force the Booking (somehow):
- Backend returns error: "This time slot is already booked. Please choose another time."
- Frontend shows error alert

---

## 🔍 Debugging Tips

### Check Backend Logs:
Look for these messages in the backend terminal:

**✅ Good Signs:**
```
Creating appointment for user X with doctor Y
✓ Appointment created successfully: ID Z
Found N appointments for patient X
Found M appointments for doctor Y
```

**❌ Error Signs:**
```
✗ Error creating appointment: [error message]
Doctor X not found or inactive
Time slot already booked
```

### Check Browser Console:
Press F12 → Console tab

**✅ Good Signs:**
```
🔑 API Request: {url: '/api/appointments/', hasPatientToken: true}
```

**❌ Error Signs:**
```
POST http://localhost:8000/api/appointments/ 500 (Internal Server Error)
Failed to create appointment
```

### Check Database:
If you have database access:
```sql
-- See all appointments
SELECT * FROM appointments ORDER BY created_at DESC LIMIT 10;

-- See specific patient's appointments
SELECT * FROM appointments WHERE patient_id = X;

-- See specific doctor's appointments
SELECT * FROM appointments WHERE doctor_id = Y;
```

---

## 🎯 Key Features to Verify

### Patient Dashboard:
- [x] Schedule button toggles appointments section
- [x] Appointments display in chronological order
- [x] Status colors match appointment status
- [x] Can close appointments section with X button
- [x] "Book an Appointment" button when no appointments
- [x] Responsive design on mobile screens

### Doctor Dashboard:
- [x] Week filter works (current/all)
- [x] Appointments sorted by date and time
- [x] Patient information displays correctly
- [x] Call button links to patient phone number
- [x] Empty state shows when no appointments
- [x] "Manage Schedule" button navigates to schedule page

### Booking Flow:
- [x] Date picker only allows future dates
- [x] Time slots load based on doctor's schedule
- [x] Booked slots are disabled/marked
- [x] Form validation works (date + time required)
- [x] Success message appears after booking
- [x] Redirect to home page after success

---

## 🆘 Common Issues & Solutions

### Issue: "Failed to create appointment"
**Solution**: 
- Check backend logs for specific error
- Verify doctor exists and is active
- Ensure date format is YYYY-MM-DD
- Check database connection

### Issue: Appointments not showing in patient dashboard
**Solution**:
- Click the "Schedule" button to toggle display
- Refresh the page
- Check browser console for errors
- Verify patient is logged in (check token in localStorage)

### Issue: Appointments not showing in doctor dashboard
**Solution**:
- Check week filter (change from "current" to "all")
- Verify doctor is logged in with correct account
- Check backend logs for database errors
- Ensure appointment date is within current week

### Issue: All time slots show as booked
**Solution**:
- Check doctor's schedule is set up
- Verify date is a valid working day for doctor
- Try a different date
- Check backend logs for slot availability calculation

---

## ✨ Success Indicators

**You know everything is working when:**

1. ✅ Patient books appointment → Success message appears
2. ✅ Patient sees appointment in Dashboard → Schedule section
3. ✅ Doctor sees appointment in their dashboard
4. ✅ Time slot shows "Booked" for other patients
5. ✅ Backend logs show successful creation
6. ✅ No console errors in browser
7. ✅ Status badges display with correct colors
8. ✅ All information (doctor/patient/time) is correct

---

## 📞 Need Help?

If you encounter issues not covered here:
1. Check `APPOINTMENT_FIXES.md` for detailed technical information
2. Review backend terminal logs
3. Check browser console (F12)
4. Verify database connection
5. Ensure both frontend and backend are running

**Remember**: The backend must be running on http://localhost:8000 and frontend on http://localhost:5173 for everything to work!
