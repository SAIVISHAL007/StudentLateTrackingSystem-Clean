# Changelog

All notable changes to this project are documented in this file.

## v3.1.0 - 2026-02-22

### Summary
- Focused release for reliability and search correctness.
- Restored missing search behavior for student profile lookup.
- Fixed graduation export ordering and added safer export checks.
- Added register-only mode to avoid accidental late marking for new students.

### Critical Fixes
- Restored `GET /students/search` endpoint used by Student Profile lookup.
- Graduation export flow now fetches and preserves student data before status update.
- Added export/deletion safety checks and better error handling around graduation flow.
- Added `isLate: false` register-only path for Student Master Data entry.

### Search and Pagination
- Moved student list search from client-side filtering to server-side query execution.
- Added search support to `/students/all` with pagination compatibility.
- Search now uses case-insensitive matching across roll number, name, branch, and section.
- Reset-to-page-1 behavior applied when search query changes.

### Student Master Data Improvements
- Added year-semester validation to block invalid combinations.
- Added dynamic semester options based on selected year.
- Added smart semester auto-selection defaults on year change.
- Updated section input to controlled dropdown values (`A`-`F`).

### Technical Notes
- Frontend removed duplicate local filtering logic after server-side search migration.
- Backend preserves backward compatibility by making search parameter optional.
- Graduation export writes CSV files to `backend/exports/` when graduation promotions run.

### Files Touched in This Release
- `backend/routes/studentRoutes.js`
- `frontend/src/components/StudentManagement.js`
- `backend/utils/pdfGenerator.js`

## v3.0.x and earlier
- Initial production deployment and role-based late-tracking workflow.
- JWT-based authentication and role hierarchy.
- Analytics dashboards, fine management, and audit trail support.
