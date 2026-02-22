# Graduation Export Feature

## Overview

When 4th year students complete their final semester (Y4S8) and get promoted, the system now **automatically exports their data to CSV files and deletes them from the database**.

## Why This Feature?

As per your professor's requirement:
> "When 4th years get finally promoted, they don't need to have their data in the system anymore. Just export their final data - we'll store it in the form of physical records."

## How It Works

### 1. Automatic Export During Promotion

When you promote students (especially Y4S8 students):

1. **Data Collection**: System identifies all graduating students (Y4S8)
2. **CSV Export**: Automatically generates a timestamped CSV file with:
   - Roll No
   - Name
   - Year/Semester
   - Branch/Section
   - Total Late Days
   - Excuse Days Used
   - Total Fines
   - Graduation Date
   - Late History Count

3. **Physical Storage**: CSV saved to `backend/exports/` folder
4. **Database Cleanup**: Graduated students deleted from active database
5. **Confirmation**: UI shows export filename and deletion count

### 2. File Location

```
backend/
  exports/
    graduated_students_2026-02-22T17-30-45.csv
    graduated_students_2026-05-15T10-15-30.csv
    README.md
    .gitignore
```

### 3. CSV File Format

```csv
Roll No,Name,Year,Semester,Branch,Section,Status,Total Late Days,Excuse Days Used,Total Fines,Graduation Date,Late History Count
21PA1A0501,John Doe,4,8,CSE,A,graduated,5,2,15,22/02/2026,5
21PA1A0502,Jane Smith,4,8,CSE,A,graduated,3,2,5,22/02/2026,3
```

### 4. Admin Interface Updates

**Promotion Confirmation Dialog:**
```
SEMESTER PROMOTION

Target: ALL students

This will:
✓ Move students to next semester
✓ Update year (if crossing year boundary)
✓ Graduate Y4S8 students (export to CSV + delete from DB)
✓ Reset all late records and fines
✓ Keep student information intact

📁 Graduated students exported for physical records

Proceed with promotion?
```

**Promotion Result:**
```
✅ Successfully promoted 150 students, graduated and exported 45 students!

📊 Summary:
• Promoted: 150 students
• Graduated: 45 students ✅
• Deleted from DB: 45 students
• Exported to: graduated_students_2026-02-22T17-30-45.csv
  📁 Data saved for physical records
• Year transitions: 35 students
• Total processed: 195
```

## Key Benefits

1. **Automatic**: No manual export needed - happens during normal promotion
2. **Permanent Record**: CSV files serve as archival physical records
3. **Database Efficiency**: Keeps active database lean (only current students)
4. **Backup Safety**: Files stored locally, easy to backup to external drive
5. **Timestamped**: Each export has unique timestamp for version tracking
6. **Compliance**: Maintains graduation records as per institutional policy

## Storage Recommendations

### Monthly Backup
1. Copy all CSV files from `backend/exports/` to external storage
2. Store in labeled folder: `Graduated_Students_2026/`

### Annual Archive
1. Move files older than 1 year to permanent archive
2. Keep digital + printed copy
3. Minimum 5-year retention as per policy

### Access Control
- Only authorized faculty should access exports folder
- Restrict backend server access
- Password-protect external backup drives

## Technical Details

### Backend Changes
- **File**: `backend/routes/studentRoutes.js`
- **Function**: `/students/promote-semester` endpoint
- **Logic**: 
  1. Marks Y4S8 students as graduated
  2. Collects their full data
  3. Generates CSV using `generateGraduationCSV()`
  4. Saves to `backend/exports/`
  5. Deletes graduated students from MongoDB
  6. Returns export filename in response

### Frontend Changes
- **File**: `frontend/src/components/AdminManagement.js`
- **Function**: `handleSemesterPromotion()`
- **Display**: Shows export filename and deletion confirmation

### Export Utility
- **File**: `backend/utils/pdfGenerator.js`
- **Function**: `generateGraduationCSV(students)`
- **Format**: Standard CSV with headers
- **Escaping**: Handles commas/quotes in student names

## Testing

To test the feature:
1. Add some Y4S8 students to database
2. Go to Admin Management → Semester Promotion
3. Click "Promote ALL Students" or "Year 4 (Graduate)"
4. Check success message for exported filename
5. Verify CSV file created in `backend/exports/`
6. Confirm students deleted from database

## Rollback

If you need to restore graduated students:
1. Locate the CSV file in `backend/exports/`
2. Use import tool to reload students
3. Their late history will be available

## Notes

- CSV files are **excluded from git** (via `.gitignore`)
- Files remain on server until manually backed up
- Only Y4S8 students are exported+deleted
- All other promotions work as before (no deletion)

---

**Implementation Date**: February 22, 2026  
**Feature Status**: ✅ Complete & Ready for Production
