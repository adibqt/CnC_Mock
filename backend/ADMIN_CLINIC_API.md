# Admin Clinic Management API Documentation

## Overview
This document describes the admin endpoints for managing clinics in the Care & Cure healthcare system.

## Authentication
All endpoints require admin authentication. Include the admin access token in the Authorization header:
```
Authorization: Bearer <admin_access_token>
```

---

## Endpoints

### 1. Get All Clinics
**GET** `/api/admin/clinics`

Retrieve a list of all clinics with optional filtering and pagination.

**Query Parameters:**
- `skip` (int, optional): Number of records to skip (default: 0)
- `limit` (int, optional): Maximum number of records to return (default: 100)
- `is_verified` (bool, optional): Filter by verification status
- `is_active` (bool, optional): Filter by active status
- `search` (string, optional): Search in clinic name, license number, phone, or city

**Example Request:**
```bash
GET /api/admin/clinics?is_verified=false&limit=20
Authorization: Bearer <admin_token>
```

**Example Response:**
```json
[
  {
    "id": 1,
    "phone": "01712345678",
    "clinic_name": "City Diagnostics Center",
    "license_number": "LAB-2024-001",
    "address": "123 Medical Road, Building 5",
    "city": "Dhaka",
    "state": "Dhaka",
    "postal_code": "1207",
    "email": "info@citydiagnostics.com",
    "contact_person": "Dr. Ahmed Hassan",
    "is_verified": false,
    "is_active": true,
    "verified_at": null,
    "created_at": "2025-10-15T10:30:00",
    "updated_at": "2025-10-15T10:30:00"
  }
]
```

---

### 2. Get Clinic Details
**GET** `/api/admin/clinics/{clinic_id}`

Retrieve detailed information about a specific clinic including statistics.

**Path Parameters:**
- `clinic_id` (int): The clinic's ID

**Example Request:**
```bash
GET /api/admin/clinics/1
Authorization: Bearer <admin_token>
```

**Example Response:**
```json
{
  "id": 1,
  "phone": "01712345678",
  "clinic_name": "City Diagnostics Center",
  "license_number": "LAB-2024-001",
  "address": "123 Medical Road, Building 5",
  "city": "Dhaka",
  "state": "Dhaka",
  "postal_code": "1207",
  "email": "info@citydiagnostics.com",
  "contact_person": "Dr. Ahmed Hassan",
  "is_verified": true,
  "is_active": true,
  "verified_at": "2025-10-16T14:20:00",
  "verified_by": 1,
  "created_at": "2025-10-15T10:30:00",
  "updated_at": "2025-10-16T14:20:00",
  "stats": {
    "total_quotations": 45,
    "total_reports": 32
  }
}
```

---

### 3. Verify/Reject Clinic
**PUT** `/api/admin/clinics/{clinic_id}/verify`

Verify or reject a clinic's registration. This endpoint also allows activating/deactivating the clinic.

**Path Parameters:**
- `clinic_id` (int): The clinic's ID

**Request Body:**
```json
{
  "is_verified": true,
  "is_active": true
}
```

**Fields:**
- `is_verified` (bool, optional): Set to `true` to verify, `false` to reject
- `is_active` (bool, optional): Set to `true` to activate, `false` to deactivate

**Example Request:**
```bash
PUT /api/admin/clinics/1/verify
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "is_verified": true,
  "is_active": true
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Clinic verified successfully",
  "clinic": {
    "id": 1,
    "clinic_name": "City Diagnostics Center",
    "is_verified": true,
    "is_active": true,
    "verified_at": "2025-10-20T09:15:00"
  }
}
```

---

### 4. Toggle Clinic Active Status
**PUT** `/api/admin/clinics/{clinic_id}/toggle-active`

Quickly toggle a clinic's active status (activate ↔ deactivate).

**Path Parameters:**
- `clinic_id` (int): The clinic's ID

**Example Request:**
```bash
PUT /api/admin/clinics/1/toggle-active
Authorization: Bearer <admin_token>
```

**Example Response:**
```json
{
  "success": true,
  "message": "Clinic deactivated successfully",
  "clinic": {
    "id": 1,
    "clinic_name": "City Diagnostics Center",
    "is_active": false
  }
}
```

---

### 5. Get Clinic Statistics
**GET** `/api/admin/clinics/stats/summary`

Get summary statistics for all clinics in the system.

**Example Request:**
```bash
GET /api/admin/clinics/stats/summary
Authorization: Bearer <admin_token>
```

**Example Response:**
```json
{
  "total_clinics": 15,
  "verified_clinics": 10,
  "pending_verification": 3,
  "inactive_clinics": 2
}
```

---

### 6. Get Dashboard Stats (Updated)
**GET** `/api/admin/dashboard/stats`

Get comprehensive dashboard statistics including all entity types.

**Example Request:**
```bash
GET /api/admin/dashboard/stats
Authorization: Bearer <admin_token>
```

**Example Response:**
```json
{
  "totals": {
    "patients": 1250,
    "doctors": 85,
    "appointments": 3420,
    "prescriptions": 2890,
    "pharmacies": 25,
    "clinics": 15
  },
  "pending": {
    "unverified_doctors": 5,
    "unverified_pharmacies": 3,
    "unverified_clinics": 2,
    "pending_appointments": 12,
    "confirmed_appointments": 8
  },
  "recent": {
    "new_patients_7d": 45,
    "new_doctors_7d": 3,
    "new_pharmacies_7d": 2,
    "new_clinics_7d": 1
  }
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "detail": "Clinic not found"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not authorized to perform this action"
}
```

---

## Workflow Examples

### 1. Verify a New Clinic Registration

**Step 1:** List pending clinics
```bash
GET /api/admin/clinics?is_verified=false&is_active=true
```

**Step 2:** Review clinic details
```bash
GET /api/admin/clinics/5
```

**Step 3:** Verify the clinic
```bash
PUT /api/admin/clinics/5/verify
{
  "is_verified": true,
  "is_active": true
}
```

### 2. Deactivate a Problematic Clinic

**Step 1:** Find the clinic
```bash
GET /api/admin/clinics?search=City Diagnostics
```

**Step 2:** Deactivate it
```bash
PUT /api/admin/clinics/8/toggle-active
```

Or use verify endpoint:
```bash
PUT /api/admin/clinics/8/verify
{
  "is_active": false
}
```

### 3. Monitor Clinic Performance

**Step 1:** Get clinic statistics
```bash
GET /api/admin/clinics/stats/summary
```

**Step 2:** Review individual clinic details
```bash
GET /api/admin/clinics/3
# Check stats.total_quotations and stats.total_reports
```

---

## Database Fields Reference

### Clinic Table Fields:
- `id` - Primary key
- `phone` - Unique phone number (login identifier)
- `hashed_password` - Encrypted password
- `clinic_name` - Clinic business name
- `license_number` - Unique clinic/lab license number
- `address` - Full street address
- `city` - City location
- `state` - State/province
- `postal_code` - ZIP/postal code
- `email` - Contact email
- `contact_person` - Name of primary contact
- `is_verified` - Admin verification status (default: False)
- `is_active` - Active status (default: True)
- `verified_at` - Timestamp when verified
- `verified_by` - Admin ID who verified
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

---

## Notes

1. **Verification Required**: Clinics must be verified by admin before they can:
   - Submit quotation responses
   - Create lab reports
   - Appear in patient clinic selection lists

2. **Active Status**: Inactive clinics:
   - Cannot login
   - Do not appear in clinic selection lists
   - Cannot create new quotations or reports

3. **Admin Tracking**: All verification actions are tracked:
   - `verified_by` stores the admin ID
   - `verified_at` stores the verification timestamp

4. **Statistics**: Clinic statistics include:
   - Total quotations submitted
   - Total lab reports created
   - Useful for performance monitoring

---

## Integration with Frontend

### Admin Dashboard - Clinics Tab

**Display Statistics Card:**
```jsx
const stats = await fetchClinicStats();
// Show: Total, Verified, Pending, Inactive
```

**List Clinics with Filters:**
```jsx
const clinics = await fetchClinics({
  is_verified: false, // Show pending
  limit: 20
});
```

**Verification Modal:**
```jsx
async function handleVerify(clinicId) {
  await verifyClinic(clinicId, {
    is_verified: true,
    is_active: true
  });
  // Refresh list
}
```

**Quick Actions:**
```jsx
// Toggle active status
await toggleClinicActive(clinicId);
```

---

## Testing with Postman/cURL

### Create Test Clinic (via clinic signup):
```bash
POST http://localhost:8000/api/clinic/signup
Content-Type: application/json

{
  "phone": "01712345678",
  "password": "securepass123",
  "clinic_name": "City Diagnostics Center",
  "license_number": "LAB-2024-001",
  "address": "123 Medical Road",
  "city": "Dhaka",
  "email": "info@citydiag.com",
  "contact_person": "Dr. Ahmed"
}
```

### Admin Login:
```bash
POST http://localhost:8000/api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Verify the Clinic:
```bash
PUT http://localhost:8000/api/admin/clinics/1/verify
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "is_verified": true,
  "is_active": true
}
```

---

## Summary

✅ **6 Admin Endpoints** for complete clinic management
✅ **Full CRUD** operations (List, Read, Update)
✅ **Filtering & Search** capabilities
✅ **Statistics** for dashboard monitoring
✅ **Verification Workflow** tracking
✅ **Active Status** management
✅ **Integrated** with existing admin system

**Backend Status**: 100% Complete for Clinic Module
**Next Step**: Implement frontend admin clinic management UI
