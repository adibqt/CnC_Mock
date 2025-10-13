# 🔧 Troubleshooting: "Only doctors can access this endpoint"

## ✅ Issue Fixed!

### Problem:
When a doctor clicks "Confirm" or any status management button, they get the error:
```
Failed to update status: Only doctors can access this endpoint
```

### Root Cause:
The API token authentication system was using the **patient token** instead of the **doctor token** when making PATCH requests to update appointment status.

---

## 🔧 What Was Fixed:

### 1. **API Request Logic (src/services/api.js)**

**Before:**
```javascript
// General appointment operations - used patient token first
const token = patientToken || doctorToken;
```

**After:**
```javascript
// PATCH/PUT requests (status updates) - doctor operations only
if (config.method === 'patch' || config.method === 'put') {
  if (doctorToken) {
    config.headers.Authorization = `Bearer ${doctorToken}`;
  }
}
```

### 2. **Token Clearing on Login**

**Doctor Login:**
- Now automatically clears patient tokens when doctor logs in
- Prevents token conflicts

**Patient Login:**
- Now automatically clears doctor tokens when patient logs in
- Ensures clean authentication state

---

## 🧪 How to Test the Fix:

### Step 1: Clear Browser Storage (Important!)
```
1. Open Browser DevTools (F12)
2. Go to "Application" tab
3. Click "Local Storage" → "http://localhost:5173"
4. Clear all items (or right-click → Clear)
5. Refresh the page
```

### Step 2: Login as Doctor
```
1. Go to Doctor Login page
2. Enter doctor credentials
3. Login successfully
```

### Step 3: Test Status Management
```
1. Go to Doctor Dashboard
2. Find a pending appointment
3. Click "Confirm" button
4. ✅ Status should update to "Confirmed" (green badge)
5. No error should appear
```

---

## 🔍 Debugging Tools:

### Check Console Logs:
When you click "Confirm", check the browser console. You should see:
```javascript
🔑 API Request: {
  method: "PATCH",
  url: "/api/appointments/123",
  hasPatientToken: false,  // Should be false after doctor login
  hasDoctorToken: true,    // Should be true
  hasAuthHeader: true,
  usingToken: "DOCTOR"     // Should say DOCTOR
}
```

### Check Local Storage:
```javascript
// Open Console and run:
console.log({
  patientToken: localStorage.getItem('patient_accessToken'),
  doctorToken: localStorage.getItem('doctor_accessToken')
});

// After doctor login, you should see:
// patientToken: null
// doctorToken: "eyJ..." (actual token)
```

---

## 🚨 If Still Having Issues:

### Quick Fix - Manual Token Clear:
```javascript
// Paste this in browser console and hit Enter:
localStorage.clear();
location.reload();

// Then login as doctor again
```

### Check Backend Logs:
Look for errors in the backend terminal. The endpoint expects:
```python
current_doctor: Doctor = Depends(get_current_doctor)
```

---

## 📋 Status Management - Complete Flow:

### 1. Patient Books Appointment
```
Patient → Book Appointment
→ Status: "Pending"
→ Stored in database
```

### 2. Doctor Reviews and Confirms
```
Doctor Login → Dashboard
→ See "Pending" appointment
→ Click "Confirm" button
→ API call: PATCH /api/appointments/{id} with doctorToken
→ Backend validates doctor token ✅
→ Status updated to "Confirmed"
→ UI refreshes automatically
```

### 3. Video Call Available
```
Status: "Confirmed"
→ Both patient and doctor see video call button
→ Can join video room anytime (testing mode)
```

### 4. Mark as Complete
```
After consultation
→ Doctor clicks "Complete"
→ Status: "Completed"
→ Appointment archived
```

---

## 🎯 Expected Behavior Now:

| Action | What Should Happen |
|--------|-------------------|
| Doctor logs in | Patient tokens cleared automatically |
| Patient logs in | Doctor tokens cleared automatically |
| Doctor clicks "Confirm" | Uses doctor token ✅ |
| Doctor clicks "Reject" | Uses doctor token ✅ |
| Doctor clicks "Complete" | Uses doctor token ✅ |
| Status updates | No errors, UI refreshes |
| Console logs | Show "usingToken: DOCTOR" |

---

## 🔐 Token Management Summary:

### Storage Keys:
- **Patient**: `patient_accessToken`, `patient_userType`, `patient_userData`
- **Doctor**: `doctor_accessToken`, `doctor_userType`, `doctor_userData`

### API Logic:
- **POST /api/appointments/** → Uses patient token (booking)
- **PATCH /api/appointments/{id}** → Uses doctor token (status update)
- **GET /api/appointments/patient/** → Uses patient token
- **GET /api/appointments/doctor/** → Uses doctor token

---

## 💡 Pro Tips:

1. **Always logout before switching** between patient and doctor accounts
2. **Use incognito/private window** for testing different user types
3. **Check console logs** to verify which token is being used
4. **Clear browser storage** if you encounter authentication issues
5. **Restart backend server** if endpoints aren't responding correctly

---

## ✅ Verification Checklist:

After implementing the fix, verify:

- [ ] Doctor can login successfully
- [ ] Patient tokens are cleared after doctor login
- [ ] Doctor can see pending appointments
- [ ] "Confirm" button works without errors
- [ ] Status badge updates to "Confirmed" (green)
- [ ] "Reject" button works correctly
- [ ] "Complete" button works for confirmed appointments
- [ ] Console shows "usingToken: DOCTOR" for PATCH requests
- [ ] No "Only doctors can access" error appears
- [ ] Video call button appears for confirmed appointments

---

## 📞 Still Need Help?

If the issue persists:

1. **Check backend is running**: `uvicorn main:app --reload`
2. **Check frontend is running**: `npm run dev`
3. **Verify doctor account exists** in database
4. **Check doctor is_active** = true in database
5. **Review backend terminal** for detailed error messages
6. **Check network tab** in DevTools for actual API requests

---

**🎉 The fix is now deployed! Test by logging in as doctor and clicking "Confirm" on any pending appointment.**
