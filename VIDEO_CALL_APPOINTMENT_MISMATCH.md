# Video Call Testing Guide

## Current Situation

From database:
- **Appointment 5**: Patient (ID:2) ↔ Doctor (ID:2) - ⚠️ Same user!
- **Appointment 10**: Patient (ID:2) ↔ Doctor (ID:1) - ✅ Different users

From LiveKit:
- **appointment_10_consultation**: 1 participant connected (Doctor)
- **appointment_5_consultation**: No room (nobody connected)

## The Problem

You're trying to test with **Appointment 5**, but:
- Patient and Doctor are the **same person** (User ID: 2)
- Creates token conflicts (patient token vs doctor token)
- Not a realistic test scenario

## Solution: Use Appointment 10

### Step 1: Doctor (User ID: 1)
1. Login as the doctor account (User ID: 1)
2. Go to "This Week's Appointments"
3. Find **Appointment ID: 10** (scheduled for Oct 14)
4. Click "Join Video Call"
5. Wait for connection
6. **Keep the window open**

### Step 2: Patient (User ID: 2 - Adib Rahman)
1. Login as patient account (User ID: 2)
2. Go to "Schedule" or appointments
3. Find **Appointment ID: 10** (with Doctor ID: 1)
4. Wait 5-10 seconds for notification
5. Should see: "Dr. [Name] is calling..."
6. Click "Join Call"
7. Both should connect!

## Why Appointment 5 Doesn't Work

Appointment 5 has:
- Patient ID: 2 (Adib Rahman)
- Doctor ID: 2 (Adib Rahman)

This is the **same user ID** as both patient and doctor!

When you try to test:
1. Login as "doctor" for appointment 5 → Gets doctor token
2. Try to login as "patient" for appointment 5 → But it's the same user!
3. Token conflict: Is this user a patient or doctor?
4. Authentication gets confused
5. Connection fails

## Creating Proper Test Appointments

For testing, you need appointments where:
- Patient ID ≠ Doctor ID
- Two separate user accounts
- One logged in as patient
- One logged in as doctor

### Current Valid Test:
- **Appointment 10**:
  - Patient: User ID 2 (Adib Rahman)
  - Doctor: User ID 1 (Different doctor)
  - Room: `appointment_10_consultation` ✅

## Testing with Two Browsers

### Browser 1 (Chrome - Doctor):
```
Login as: Doctor account (User ID: 1)
Navigate to: Doctor Dashboard → This Week's Appointments
Find: Appointment 10
Action: Click "Join Video Call"
Status: Keep window open and connected
```

### Browser 2 (Firefox/Edge/Incognito - Patient):
```
Login as: Patient account (User ID: 2 - Adib Rahman)
Navigate to: Patient Dashboard → Schedule/Appointments
Find: Appointment 10
Wait: 5-10 seconds for notification
Action: Click "Join Call" when notification appears
Status: Should connect to same room as doctor
```

## Verification

After patient joins, run:
```bash
python test_rooms.py
```

Should show:
```
📍 Room: appointment_10_consultation
   Participants: 2  ← Both doctor and patient
```

## Backend Logs Should Show

When doctor joins:
```
🎥 Generated LiveKit token for user 1 (Dr. [Name]) in room appointment_10_consultation
   Participant identity: doctor_1
```

When patient joins:
```
🎥 Generated LiveKit token for user 2 (Adib Rahman) in room appointment_10_consultation
   Participant identity: patient_2
```

## Common Issues

### Issue: "Room not found"
- Doctor not connected yet
- Or doctor left the call
- Or checking wrong appointment ID

### Issue: "Client initiated disconnect"
- Token conflict (same user as patient and doctor)
- Wrong appointment being used
- Network/firewall issue

### Issue: Notification not showing
- Patient polling appointment 5, but doctor in appointment 10
- Need to check the same appointment
- Clear localStorage and re-login

## Quick Fix

Right now:
1. Doctor is in **appointment 10** ✅
2. Patient is polling **appointment 5** ❌

**Solution**: Patient needs to look at appointment 10 instead!

Check the patient's UI - which appointment are they viewing/trying to join?
Make sure it's the same appointment number (10) that the doctor is in.
