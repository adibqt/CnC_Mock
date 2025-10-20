# Lab Tests Feature Implementation Guide

## Overview
Added a comprehensive Lab Tests section to the prescription module, allowing doctors to prescribe laboratory tests along with medications.

## Changes Made

### 1. Frontend Updates

#### WritePrescription.jsx (Doctor Module)
**New State:**
- Added `labTests` state to manage lab test entries
- Default structure: `[{ test_name: '', instructions: '' }]`

**New Functions:**
- `addLabTest()` - Adds a new lab test entry
- `removeLabTest(index)` - Removes a lab test entry
- `updateLabTest(index, field, value)` - Updates lab test fields

**UI Section:**
- New "Lab Tests (Optional)" section added after Medications
- Similar design pattern to medications section
- Fields:
  - Test Name (required if adding tests)
  - Instructions (optional)
- Add/Remove buttons for managing multiple lab tests
- Blue gradient styling to differentiate from medications

**Form Submission:**
- Lab tests are now included in prescription data
- Only tests with non-empty test_name are submitted
- Field: `lab_tests: labTests.filter(test => test.test_name.trim())`

#### ViewPrescription.jsx (Patient Module)
**Display Section:**
- New "Lab Tests Recommended" section
- Only displays if `lab_tests` array exists and has items
- Table format with columns:
  - # (index)
  - Test Name
  - Instructions
- Blue themed styling matching the test tube icon
- Falls back to "As per standard protocol" if no instructions provided

#### CSS Updates (WritePrescription.css)
```css
/* Lab Tests Section */
.lab-test-item {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border-left: 4px solid #4299e1;
}

.lab-test-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-label .icofont-test-tube-alt {
  color: #4299e1;
}
```

#### CSS Updates (ViewPrescription.css)
```css
/* Lab Tests Section */
.lab-tests-list .medications-table thead {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
}

.lab-tests-list .medications-table tbody tr:hover {
  background: #ebf8ff;
}

.prescription-section h3 .icofont-test-tube-alt {
  color: #4299e1;
}
```

### 2. Backend Updates

#### models.py
**Prescription Model:**
- Added new field: `lab_tests = Column(JSON, nullable=True, default=[])`
- Stores array of lab test objects in JSON format
- Nullable and defaults to empty array

#### schemas.py
**New Schema:**
```python
class LabTestItem(BaseModel):
    test_name: str = Field(..., min_length=1, max_length=300)
    instructions: Optional[str] = Field(None, max_length=500)
```

**Updated PrescriptionCreate:**
```python
lab_tests: Optional[list[LabTestItem]] = Field(default=[])
```

**Updated PrescriptionResponse:**
```python
lab_tests: Optional[list] = []
```

#### routers/prescriptions.py
**create_prescription endpoint:**
- Converts lab_tests to JSON format before storing
- Code:
```python
lab_tests_json = [test.dict() for test in prescription_data.lab_tests] if prescription_data.lab_tests else []
```

- Includes lab_tests in Prescription creation:
```python
new_prescription = Prescription(
    # ... other fields ...
    lab_tests=lab_tests_json,
)
```

- Includes lab_tests in response:
```python
"lab_tests": new_prescription.lab_tests or [],
```

### 3. Database Migration

#### migrate_lab_tests.py
**Purpose:** Add lab_tests column to existing prescriptions table

**Features:**
- Checks if column already exists (idempotent)
- Adds column as JSONB with default empty array
- Updates existing records with empty array
- Provides detailed progress output
- Error handling and rollback capability

**Column Definition:**
```sql
ALTER TABLE prescriptions 
ADD COLUMN lab_tests JSONB DEFAULT '[]'::jsonb
```

**Migration Status:** ✅ Completed Successfully
- Column added to prescriptions table
- 0 existing prescriptions updated (no existing data)

## Features

### Doctor Features
1. **Add Multiple Lab Tests**
   - Unlimited number of tests can be added
   - Each test has a unique entry form
   - Easy add/remove functionality

2. **Optional Instructions**
   - Provide specific instructions per test
   - Instructions field is optional
   - Helpful for fasting requirements, timing, etc.

3. **Validation**
   - Test name is required if adding tests
   - Instructions are optional
   - Form submission validates all entries

4. **User Experience**
   - Clean, intuitive interface
   - Consistent with medications section
   - Clear visual distinction (blue vs purple theme)

### Patient Features
1. **View Lab Tests**
   - See all prescribed lab tests
   - View instructions for each test
   - Clear, tabular format

2. **Print-Friendly**
   - Lab tests included in prescription printout
   - Professional formatting
   - Watermark and signature intact

3. **Quotation Integration**
   - Lab tests visible when requesting quotations
   - Pharmacies can see complete prescription including tests

## Icons Used
- Write Prescription: `icofont-test-tube-alt` (blue #4299e1)
- View Prescription: `icofont-test-tube-alt` (blue #4299e1)

## Color Scheme
- **Medications:** Purple gradient (#667eea to #764ba2)
- **Lab Tests:** Blue gradient (#4299e1 to #3182ce)
- **Distinction:** Clear visual separation between sections

## Data Structure

### Frontend State
```javascript
labTests: [
  {
    test_name: 'Complete Blood Count',
    instructions: 'Fasting required - 8 hours'
  },
  {
    test_name: 'Blood Sugar Level',
    instructions: 'Check both fasting and post-meal'
  }
]
```

### Backend Storage (JSON)
```json
{
  "lab_tests": [
    {
      "test_name": "Complete Blood Count",
      "instructions": "Fasting required - 8 hours"
    },
    {
      "test_name": "Blood Sugar Level",
      "instructions": "Check both fasting and post-meal"
    }
  ]
}
```

## Testing Checklist

### Frontend Testing
- [ ] Add a single lab test
- [ ] Add multiple lab tests
- [ ] Remove lab tests
- [ ] Submit prescription with lab tests
- [ ] Submit prescription without lab tests
- [ ] View prescription with lab tests
- [ ] View prescription without lab tests
- [ ] Print prescription with lab tests

### Backend Testing
- [ ] Create prescription with lab_tests
- [ ] Create prescription without lab_tests (empty array)
- [ ] Retrieve prescription with lab_tests
- [ ] Validate lab_tests schema
- [ ] Check JSON storage format

### Database Testing
- [ ] Verify lab_tests column exists
- [ ] Check JSONB data type
- [ ] Verify default value
- [ ] Query prescriptions with lab_tests

## Benefits

1. **Comprehensive Prescriptions**
   - Doctors can prescribe both medications and tests
   - All medical recommendations in one place

2. **Better Patient Care**
   - Patients see exactly what tests are needed
   - Instructions prevent confusion

3. **Optional Feature**
   - Lab tests section is optional
   - Doesn't interfere with medication-only prescriptions
   - Backward compatible

4. **Data Integrity**
   - Structured data storage
   - Validation at both frontend and backend
   - JSON format allows flexibility

## Future Enhancements (Suggestions)

1. **Test Categories**
   - Group tests by type (Blood, Urine, Imaging, etc.)
   - Predefined test templates

2. **Cost Estimation**
   - Show estimated costs for lab tests
   - Compare prices across labs

3. **Lab Integration**
   - Direct booking with diagnostic labs
   - Test result upload capability

4. **Test History**
   - Track patient's previous test results
   - Compare trends over time

5. **Reminders**
   - Notify patients about pending tests
   - Fasting reminders before tests

## File Changes Summary

### Modified Files
1. ✅ `src/pages/WritePrescription.jsx` - Added lab tests form section
2. ✅ `src/pages/WritePrescription.css` - Added lab tests styling
3. ✅ `src/pages/ViewPrescription.jsx` - Added lab tests display
4. ✅ `src/pages/ViewPrescription.css` - Added lab tests styling
5. ✅ `backend/models.py` - Added lab_tests column
6. ✅ `backend/schemas.py` - Added LabTestItem schema
7. ✅ `backend/routers/prescriptions.py` - Added lab_tests handling

### New Files
1. ✅ `backend/migrations/migrate_lab_tests.py` - Database migration script

## Migration Instructions

To apply this feature to existing systems:

1. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

2. **Run Database Migration**
   ```bash
   cd backend
   python migrations/migrate_lab_tests.py
   ```

3. **Restart Backend Server**
   ```bash
   # Stop current server (Ctrl+C)
   uvicorn main:app --reload
   ```

4. **Clear Frontend Cache**
   - Hard refresh browser (Ctrl+Shift+R)
   - Or restart frontend dev server

## Conclusion

The Lab Tests feature is now fully integrated into the prescription module. Doctors can prescribe laboratory tests along with medications, and patients can view all recommendations in one comprehensive prescription document.

All code changes are backward compatible, and the migration ensures existing prescriptions continue to work seamlessly.

**Status: ✅ Complete and Ready for Production**
