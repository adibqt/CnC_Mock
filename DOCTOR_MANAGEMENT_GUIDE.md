# Doctor Management System - Complete Documentation

## Overview
The Doctor Management system provides comprehensive tools for administrators to verify doctor credentials, manage documents (BMDC, MBBS, FCPS certificates), and approve or suspend doctor accounts in the Click & Care platform.

## Access
- **URL**: `http://localhost:5173/admin/doctors`
- **Authentication**: Requires admin login
- **From Dashboard**: Click "Go to Full Doctor Management" button in Doctors tab

## Features

### 1. Doctor List View
Display all registered doctors with comprehensive information:
- **Doctor ID**: Unique identifier
- **Name**: With profile picture or placeholder avatar
- **Specialization**: Color-coded specialty badge
- **BMDC Number**: License registration number
- **Phone**: Contact number
- **Experience**: Years of practice
- **Documents**: Visual indicators for MBBS, FCPS, BMDC certificates
- **Verification Status**: Verified/Unverified badge with icon
- **Registration Date**: Account creation date
- **Actions**: View details and verify/suspend buttons

### 2. Search & Filter
- **Search Bar**: Search by name, specialization, or BMDC number
- **Filter Options**:
  - All Doctors
  - Verified (approved doctors)
  - Unverified (pending verification)
- **Real-time Updates**: Results update as you type

### 3. Pagination
- **20 doctors per page**
- **Smart pagination**: Shows up to 5 page numbers
- Previous/Next navigation buttons
- Total count displayed

### 4. Doctor Details Modal
Comprehensive verification and information view:

#### Doctor Profile Card
- Profile picture with elegant styling
- Full name and specialization
- Doctor ID and BMDC number
- Verification status badge
- Quick verification action buttons

#### Professional Information
- Phone number
- Email address
- Years of experience
- Location/City
- Consultation fee
- Member since date
- Bio/Description (if provided)

#### Statistics Cards
- Total Appointments
- Prescriptions Written
- Patients Served

#### Document Verification Tab
Visual document cards for:
- **MBBS Certificate**: Medical degree verification
- **FCPS Certificate**: Specialization certificate
- **BMDC Registration**: License verification

Each document card shows:
- Document type with icon
- Upload status (Uploaded/Not Uploaded)
- Color-coded indicators
- View Document button (if uploaded)

#### Document Viewer
Full-screen document viewer with:
- High-quality image/PDF display
- Open in new tab option
- Download functionality
- Close/navigate controls

#### Consultations History Tab
- Recent consultation records
- Appointment details with dates
- Patient information
- Symptoms reported
- Status badges
- Prescription count

### 5. Verification Management
- **Verify & Approve**: Activate doctor for consultations
- **Suspend Doctor**: Deactivate doctor access
- **Verification Notes**: Add administrative notes
- **Confirmation Dialogs**: Prevent accidental changes
- **Success Notifications**: Confirm action completion

## API Endpoints

### Get All Doctors
```http
GET /api/admin/doctors
Authorization: Bearer {admin_token}
Query Parameters:
  - skip: Offset for pagination (default: 0)
  - limit: Number of results (default: 20)
  - search: Search by name, specialization, or BMDC
  - is_verified: Filter by verification status (true/false)
```

**Response:**
```json
{
  "doctors": [
    {
      "id": 1,
      "phone": "01712345678",
      "name": "Dr. Ahmed Hassan",
      "full_name": "Dr. Ahmed Hassan",
      "specialization": "Cardiologist",
      "bmdc_number": "BMDC-12345",
      "years_of_experience": 10,
      "city": "Dhaka",
      "consultation_fee": 1000,
      "mbbs_certificate_url": "/uploads/certificates/mbbs/...",
      "fcps_certificate_url": "/uploads/certificates/fcps/...",
      "bmdc_certificate_url": "/uploads/certificates/bmdc/...",
      "is_verified": false,
      "created_at": "2025-01-01T10:00:00",
      "profile_picture_url": "/uploads/profile_pictures/..."
    }
  ],
  "total": 50
}
```

### Get Doctor Details
```http
GET /api/admin/doctors/{doctor_id}
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "doctor": {
    "id": 1,
    "phone": "01712345678",
    "email": "doctor@example.com",
    "name": "Dr. Ahmed Hassan",
    "specialization": "Cardiologist",
    "bmdc_number": "BMDC-12345",
    "years_of_experience": 10,
    "city": "Dhaka",
    "consultation_fee": 1000,
    "bio": "Experienced cardiologist...",
    "mbbs_certificate_url": "/uploads/certificates/mbbs/...",
    "fcps_certificate_url": "/uploads/certificates/fcps/...",
    "bmdc_certificate_url": "/uploads/certificates/bmdc/...",
    "is_verified": false,
    "created_at": "2025-01-01T10:00:00",
    "profile_picture_url": "/uploads/profile_pictures/..."
  },
  "appointments": [
    {
      "id": 101,
      "appointment_date": "2025-10-15",
      "time_slot": "10:00 AM - 10:30 AM",
      "status": "completed",
      "symptoms": "Chest pain",
      "created_at": "2025-10-10T14:30:00",
      "prescription_count": 1,
      "patient": {
        "id": 5,
        "name": "John Doe",
        "phone": "01798765432"
      }
    }
  ],
  "stats": {
    "total_appointments": 45,
    "total_prescriptions": 38,
    "total_patients": 42
  }
}
```

### Verify/Suspend Doctor
```http
PUT /api/admin/doctors/{doctor_id}/verify
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "is_verified": true,
  "verification_notes": "All credentials verified successfully"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Doctor verified successfully",
  "doctor": {
    "id": 1,
    "name": "Dr. Ahmed Hassan",
    "is_verified": true
  }
}
```

## User Interface Design

### Color Scheme
- **Background**: Gradient from light blue-gray to darker tones
- **Primary**: Indigo/Purple (#6366f1, #8b5cf6)
- **Success**: Green (#10b981) for verified status
- **Warning**: Yellow (#fbbf24) for unverified status
- **Danger**: Red (#ef4444) for suspend actions
- **Neutral**: Gray shades for text and borders

### Document Color Coding
- **MBBS**: Blue gradient (#3b82f6)
- **FCPS**: Purple gradient (#8b5cf6)
- **BMDC**: Green gradient (#10b981)

### Components
1. **Header Section**
   - Back to Dashboard button
   - Page title and description

2. **Controls Section**
   - Search box with icon
   - Filter buttons with active state
   - Total count badge

3. **Table View**
   - Responsive design
   - Profile avatars
   - Specialization badges
   - Document indicators (mini badges)
   - Verification status badges
   - Action buttons with icons

4. **Pagination**
   - Clean button design
   - Active page highlighting
   - Disabled state for boundaries

5. **Details Modal**
   - Large doctor profile card
   - Statistics grid
   - Tabbed interface
   - Document cards with hover effects
   - Verification action buttons

6. **Document Viewer**
   - Full-screen overlay
   - Image/PDF display
   - Action buttons (open, download, close)
   - Dark background for focus

### Responsive Design
- **Desktop**: Full table layout with all columns
- **Tablet**: Adjusted spacing, maintained functionality
- **Mobile**: Horizontal scroll for table, stacked layout for modal

## Usage Flow

### Viewing Doctors
1. Navigate to Doctor Management page
2. Use search/filter to find specific doctors
3. Check document indicators in table
4. Browse through paginated results

### Verifying Doctor Credentials
1. Click eye icon to view doctor details
2. Review professional information
3. Click "Credentials & Documents" tab
4. Click on each document card to view certificates
5. Inspect MBBS, FCPS, and BMDC certificates
6. Review consultation history
7. Add verification notes (optional)
8. Click "Verify & Approve" button
9. Confirm action in dialog
10. System updates status and notifies

### Suspending a Doctor
1. Open doctor details modal
2. Review reason for suspension
3. Add notes about suspension decision
4. Click "Suspend Doctor" button
5. Confirm action
6. Doctor account is deactivated

### Viewing Documents
1. Click on any document card with "Uploaded" status
2. Document opens in full-screen viewer
3. Options available:
   - View in current window
   - Open in new tab
   - Download for offline review
   - Close viewer

## Document Verification Process

### Step 1: Initial Review
- Check if all required documents are uploaded
- Verify document indicators in table view
- Missing documents show red indicator

### Step 2: Document Inspection
- Open doctor details modal
- Navigate to "Credentials & Documents" tab
- Review each certificate:
  - **MBBS**: Verify medical degree authenticity
  - **FCPS**: Verify specialization training
  - **BMDC**: Verify license number matches

### Step 3: Cross-Verification
- Match BMDC number in profile with certificate
- Verify doctor name matches on all documents
- Check specialization matches FCPS certificate
- Review experience years against graduation date

### Step 4: Decision Making
- If all documents valid: Click "Verify & Approve"
- If documents questionable: Add notes and review later
- If documents fake: Click "Suspend Doctor" with notes

### Step 5: Record Keeping
- Add verification notes for future reference
- Document any concerns or special conditions
- Notes are saved with verification decision

## Security Features
- **Authentication Required**: All endpoints require admin JWT token
- **Role-Based Access**: Only admins can verify doctors
- **Confirmation Dialogs**: Prevent accidental verification/suspension
- **Token Validation**: Automatic redirect to login if token expires
- **Secure Document URLs**: Documents served through authenticated endpoints

## Performance Optimizations
- **Pagination**: Loads only 20 doctors at a time
- **Lazy Loading**: Consultations loaded only when tab is clicked
- **Search Debouncing**: Reduces API calls during typing
- **Image Optimization**: Documents loaded on-demand
- **Caching**: Doctor list cached until filters change

## Error Handling
- **Network Errors**: User-friendly error messages
- **Empty States**: Clear "no results" indicators
- **Loading States**: Spinner indicators during data fetch
- **401 Unauthorized**: Automatic redirect to admin login
- **Missing Documents**: Clear visual indicators
- **Document Load Errors**: Fallback error messages

## Document Management

### Supported Formats
- **Images**: JPG, JPEG, PNG, GIF, WEBP
- **Documents**: PDF (displayed in iframe)

### Document Storage
- Stored in: `backend/uploads/certificates/`
- Subdirectories:
  - `mbbs/` - MBBS certificates
  - `fcps/` - FCPS certificates
  - `bmdc/` - BMDC registration (if separate from others)

### Document Display
- Images: Full-size responsive display
- PDFs: Embedded iframe viewer
- Download: Direct file download
- New Tab: Opens in separate window for detailed review

## Best Practices for Admins

### Verification Checklist
✅ Verify doctor name on all certificates matches profile
✅ Check BMDC number matches registration certificate
✅ Confirm specialization matches FCPS certificate
✅ Review experience years for consistency
✅ Inspect document quality and authenticity
✅ Check for any alterations or discrepancies
✅ Add verification notes for documentation
✅ Confirm before approving

### When to Suspend
- Fake or altered documents
- BMDC number doesn't match
- Name discrepancies
- Missing required certificates
- Expired licenses
- Complaints or ethical concerns

### Communication
- Add clear notes for future reference
- Document reasons for suspension
- Note any follow-up required
- Record verification date

## Future Enhancements
- Email notifications to doctors on verification
- Bulk verification for multiple doctors
- Document expiry tracking
- Automated BMDC number validation
- Document quality analysis
- Verification workflow with multiple reviewers
- Audit log for all verification actions
- Statistics and analytics dashboard
- Export doctor credentials report

## Testing Checklist

### Functional Testing
- ✅ Doctor list loads with correct data
- ✅ Search by name works correctly
- ✅ Search by specialization works
- ✅ Search by BMDC number works
- ✅ Verified filter shows only verified doctors
- ✅ Unverified filter shows only unverified doctors
- ✅ Pagination navigation works
- ✅ Doctor details modal opens correctly
- ✅ Documents tab displays all certificates
- ✅ Document viewer opens and displays correctly
- ✅ Download document works
- ✅ Open in new tab works
- ✅ Consultations tab displays history
- ✅ Verify doctor works
- ✅ Suspend doctor works
- ✅ Verification notes are saved
- ✅ Confirmation dialogs appear
- ✅ Success messages show after actions

### UI/UX Testing
- ✅ Responsive design works on all screen sizes
- ✅ Animations are smooth
- ✅ Loading states are clear
- ✅ Empty states are informative
- ✅ Status badges are color-coded correctly
- ✅ Document indicators are visible
- ✅ Icons are properly sized and aligned
- ✅ Modal is properly centered and scrollable
- ✅ Document viewer is full-screen
- ✅ Image quality is maintained

### Security Testing
- ✅ Unauthenticated access redirects to login
- ✅ Token expiration handled properly
- ✅ Admin role verification works
- ✅ Document URLs are authenticated
- ✅ Sensitive data is protected

### Document Testing
- ✅ MBBS certificate displays correctly
- ✅ FCPS certificate displays correctly
- ✅ BMDC certificate displays correctly
- ✅ Missing documents show proper indicator
- ✅ Image formats render properly
- ✅ PDF documents load in iframe
- ✅ Download functionality works
- ✅ New tab opens correctly

## Support & Maintenance

### Common Issues

**Issue**: Documents not loading
- **Solution**: Check backend uploads directory permissions
- Verify file paths in database
- Check if backend server is serving static files

**Issue**: Search not working
- **Solution**: Verify search parameter in API call
- Check database query syntax
- Review backend logs for errors

**Issue**: Verification not updating
- **Solution**: Check database connection
- Verify API endpoint is correct
- Review JWT token validity

### Maintenance Tasks
1. Regular backup of doctor documents
2. Monitor document storage space
3. Review and clean old verification notes
4. Update document format support as needed
5. Optimize image sizes for performance

## Developer Notes
- **Framework**: React 18 with functional components
- **State Management**: useState and useEffect hooks
- **Routing**: React Router v6
- **Styling**: Custom CSS with gradients and animations
- **Icons**: Icofont library
- **API**: RESTful endpoints with JWT authentication
- **Document Handling**: Dynamic viewer for images and PDFs
- **Modals**: Nested modal support for document viewer

## Integration Points
- **Doctor Sign-up**: Doctors upload certificates during profile update
- **Appointment System**: Only verified doctors can accept appointments
- **Consultation**: Verification status visible to patients
- **Admin Dashboard**: Statistics include verification metrics

---

## Quick Reference

### Access Credentials
- Admin URL: `http://localhost:5173/admin`
- Username: `admin`
- Password: `admin123`

### Key URLs
- Doctor Management: `/admin/doctors`
- Admin Dashboard: `/admin/dashboard`

### Important Files
- Component: `src/pages/DoctorManagement.jsx`
- Styles: `src/pages/DoctorManagement.css`
- API Router: `backend/routers/admin.py`
- Document Storage: `backend/uploads/certificates/`

### Status Codes
- **Verified**: Green badge, can accept consultations
- **Unverified**: Yellow badge, cannot accept consultations
- **Suspended**: Same as unverified, requires re-verification

---

**Doctor Management System Ready for Production!** 🏥
