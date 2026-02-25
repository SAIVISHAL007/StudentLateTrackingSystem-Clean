>  Student Late Tracking System

> A comprehensive, production-ready full-stack web application for educational institutions to track student attendance, automate fine calculations, generate real-time analytics, and manage role-based access control with enterprise-grade security.

Recent updates: server-side search implementation, graduation export system, student master data validation enhancements, and critical bug fixes.

**Latest Version: v3.1.0** | [Release Notes](#-whats-new-in-v310) | [Changelog](#-changelog)

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://your-frontend-app.vercel.app/)
[![Backend API](https://img.shields.io/badge/API-live-blue?style=for-the-badge)](https://your-backend-api.vercel.app)
[![Version](https://img.shields.io/badge/version-3.1.0-orange?style=for-the-badge)](https://github.com/yourusername/StudentLateTrackingSystem/releases/tag/v3.1.0)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/cloud/atlas)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**🔗 Live Application:** Deploy to your own Vercel account (see [Deployment](#deployment) section)

---

##  Table of Contents
- [Overview](#overview)
- [What's New in v3.1.0](#-whats-new-in-v310)
- [Key Features by Role](#key-features-by-role)
- [Role-Based Access Control](#role-based-access-control)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Screenshots](#screenshots)
- [Installation](#installation--setup)
- [Usage](#usage-guide-by-role)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Changelog](#-changelog)
- [Contributing](#contributing)

---

##  Overview

The **Student Late Tracking System** is a modern, enterprise-grade solution designed to digitize and automate attendance management for educational institutions. Built with the MERN stack and deployed on Vercel with MongoDB Atlas, this system handles real-time attendance tracking, automated fine calculations, role-based access control, comprehensive analytics, and provides secure, scalable infrastructure for multiple user roles.

###  Problem Statement
Traditional manual attendance tracking systems are:
- Time-consuming and error-prone
- Lack real-time insights and analytics
- Difficult to maintain historical records
- Have no automated fine calculation or semester management
- Lack proper role-based access control
- Cannot handle bulk operations efficiently

###  Solution Delivered
This system provides:
- **Instant attendance recording** with instant fine calculation
- **Automated fine calculation** with configurable progressive rates
- **Real-time analytics dashboard** with visual insights and leaderboards
- **Robust role-based access control** (Faculty, Admin, SuperAdmin)
- **Offline-first architecture** with service worker support and automatic sync
- **Comprehensive audit logging** for accountability and compliance
- **Bulk operations** for semester promotions and record management
- **Professional UI** with responsive design and modern glassmorphism effects

---

## 🎉 What's New in v3.1.0

**Released: February 22, 2026 - Bug Fixes & Search Optimization**

### 🐛 Critical Bug Fixes

- **Student Profile Search Fixed** 🔍
  - Re-added `/students/search` endpoint (accidentally removed during cleanup)
  - Search by roll number or name with limit of 20 results
  - Excludes graduated students from search results
  - StudentProfile component now functional again

- **Graduation Export System Improved** 🎓
  - Fixed data preservation: student data now fetched BEFORE status update
  - Added comprehensive console logging (📊 Found, 💾 Saving, ✅ Success, 🗑️ Deleting)
  - Export/deletion wrapped in try-catch with error handling
  - Verification check: warns if deletedCount doesn't match expected count
  - Creates `backend/exports/` directory if missing
  - CSV format: 12 fields including late history, fines, graduation date
  - Files saved as: `graduated_students_YYYY-MM-DDTHH-MM-SS.csv`

- **New Student Registration Fixed** ✅
  - Added `isLate: false` flag support to prevent marking new students late on entry
  - Register-only mode when `isLate === false`
  - Returns `registered: true` in response with success message
  - Students can now be added to master data without late marking

### ⚡ Search & Pagination Overhaul

- **Server-Side Search Implementation** 🚀
  - **Problem Fixed**: Search results appearing on wrong pages (empty pages 1-4, results on page 5)
  - Moved from client-side filtering to server-side MongoDB queries
  - Search parameter added to `/students/all` endpoint
  - MongoDB `$or` query searches across 4 fields: rollNo, name, branch, section
  - Case-insensitive regex matching for better UX
  - Automatically resets to page 1 when search query changes
  - Returns `searchQuery` in response for UI feedback

- **Visual Search Enhancements** 🎨
  - Search icon turns blue when actively searching
  - Input border highlights (2px blue) during active search
  - Shows "🔍 Searching for: 'query'" indicator below search box
  - Clear button (X) properly resets pagination to page 1
  - Pagination footer displays: `Showing X of Y students (search: "query")`
  - Count display: "Found: X students" vs "Total: X students"

### 📊 Student Master Data Enhancements

- **Year-Semester Validation** ✓
  - Prevents invalid semester-year combinations (e.g., Year 1 with Semester 8)
  - Validation logic: `Year 1 → Sem 1-2`, `Year 2 → Sem 3-4`, `Year 3 → Sem 5-6`, `Year 4 → Sem 7-8`
  - Error messages: "Invalid semester for Year X. Must be between Y and Z."
  - Dynamic semester dropdown shows only valid semesters for selected year
  - Helper text: "Year 1: Sem 1-2" for better UX

- **Smart Semester Auto-Selection** 🧠
  - Auto-adjusts semester when year changes
  - `Year 1 → Semester 1`, `Year 2 → Semester 3`, `Year 3 → Semester 5`, `Year 4 → Semester 7`
  - Prevents manual selection errors
  - Smooth user experience with intelligent defaults

- **Visual Edit Mode Indicators** 👁️
  - Blue background and border when editing existing student
  - Warning banner shows: "⚠️ Editing student: [ROLLNO]"
  - Roll number change warning displayed prominently
  - Clear distinction between "Add New" and "Edit" modes

- **Section Input Improvement** 📝
  - Changed from text input to dropdown (values: A-F)
  - Prevents typos and invalid section entries
  - Consistent data format in database

### 🛠️ Technical Improvements

- **Frontend Code Quality**
  - Fixed `'sections' is not defined` ESLint warning
  - Added `sections` constant: `["A", "B", "C", "D", "E", "F"]`
  - Removed duplicate filtering logic (now handled server-side)
  - Simplified `sortedStudents` memoization (only sorting, no filtering)
  - Added `searchQuery` to `fetchAllStudents` dependencies

- **Backend Enhancements**
  - Search query sanitization (trim whitespace)
  - Regex options set to case-insensitive (`options: 'i'`)
  - Returns both `students` and `totalCount` for accurate pagination
  - Maintains backward compatibility (search is optional parameter)

### 📋 Files Modified (3 files)
- `backend/routes/studentRoutes.js` - Search endpoint + graduation logic + mark-late flag
- `frontend/src/components/StudentManagement.js` - Server-side search + validation + UI
- `backend/utils/pdfGenerator.js` - CSV export function

### 🎯 User-Requested Features Implemented
- ✅ "When 4th years get promoted, export their data and remove from system" → Graduation CSV export
- ✅ "Student profile search not returning data" → Re-added search endpoint
- ✅ "Graduation logic didn't work" → Fixed with improved logging
- ✅ "New students marked late during entry" → Added isLate flag
- ✅ "Check Student Master Data logic" → Validation + smart defaults
- ✅ "Search shows empty pages" → Server-side search implementation

---

##  Key Features by Role

### 👨‍🏫 Faculty Operations
Faculty members have core attendance management capabilities:

| Feature | Description | Impact |
|---------|-------------|--------|
| **Mark Student Late** | One-click attendance marking with QR/barcode scan or search | Real-time entry of attendance |
| **Today's Late List** | View all students marked late today with filters | Quick overview of daily attendance |
| **Late Records** | Access historical records (weekly/monthly/semester) | Comprehensive attendance tracking |
| **Live Analytics** | View real-time dashboard with student metrics | Data-driven insights |
| **AI Insights (NEW)** | Predictive risk scoring and pattern analysis dashboard | Proactive student intervention |
| **Export Reports** | Download attendance data in Excel/TXT format | Data portability and external reporting |
| **Leaderboards** | See top late, most improved, and best-performing students | Performance comparison |

**Access:** Login with faculty credentials → Limited to core attendance features

---

### 🔧 Admin Operations
Admins have all faculty features PLUS management capabilities:

| Feature | Description | Impact |
|---------|-------------|--------|
| **All Faculty Operations** | Complete access to attendance marking and viewing | Foundation for admin role |
| **Student Master Data** | Add, edit, delete student records in bulk + CSV bulk import | Manage student database |
| **Faculty Directory** | View all faculty, create accounts, delete profiles, reset passwords, manage roles | Manage faculty accounts |
| **Semester Promotion** | Bulk promote students with automated year calculation | Year-end batch operations |
| **Bulk Record Removal** | Remove late records for selected students | Data correction and management |
| **Fine Management** | Clear fines for individual or groups of students | Financial record management |
| **System Statistics** | Real-time overview of students, faculty, fines | High-level system monitoring |
| **Audit Logs** | View all system actions with user, IP, timestamp | Compliance and accountability |
| **Financial Analytics** | Track fine collection, payment rates, projections | Business intelligence |

**Access:** Login with admin credentials → Full system access except SuperAdmin functions

---

### 👑 SuperAdmin Operations
SuperAdmins have complete system control:

| Feature | Description | Impact |
|---------|-------------|--------|
| **All Admin Operations** | Complete access to all admin and faculty features | Full system control |
| **System Configuration** | Modify fine rates and grace periods | Customize business logic |
| **Role Management** | Promote/demote users to/from admin role | User hierarchy management |
| **Database Operations** | Direct database access, backup/restore | System maintenance |
| **Advanced Analytics** | System-wide metrics and predictions | Strategic planning |

**Access:** Login with superadmin credentials → Unrestricted system access

---

## 🔐 Role-Based Access Control

### Authentication Flow
```
User Login
    ↓
Email + Password Validation
    ↓
JWT Token Generated (7-day expiry)
    ↓
User Role Extracted from Database
    ↓
Route Authorization Based on Role
    ↓
Access Granted/Denied
```

### Permission Matrix

| Operation | Faculty | Admin | SuperAdmin |
|-----------|---------|-------|-----------|
| Mark Student Late | ✅ | ✅ | ✅ |
| View Late Records | ✅ | ✅ | ✅ |
| View Today's Late | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ✅ |
| Export Reports | ✅ | ✅ | ✅ |
| Student Master Data | ❌ | ✅ | ✅ |
| Faculty Directory | ❌ | ✅ | ✅ |
| Semester Promotion | ❌ | ✅ | ✅ |
| Remove Late Records | ❌ | ✅ | ✅ |
| Manage Fines | ❌ | ✅ | ✅ |
| View Audit Logs | ❌ | ✅ | ✅ |
| System Configuration | ❌ | ❌ | ✅ |
| Role Management | ❌ | ❌ | ✅ |
| Database Operations | ❌ | ❌ | ✅ |

---

##  Tech Stack

### Frontend Architecture
```
React 19.0.0 (Latest)
├── React Hooks          → State management and side effects
├── Axios                → HTTP client with JWT interceptors
├── React Icons (fi)     → Professional iconography
├── XLSX (SheetJS)       → Excel export with BLOB fallback
├── HTML5-QRCode         → QR/Barcode scanning support
├── Service Workers      → Offline queue and cache management
├── Tailwind CSS         → Utility-first CSS framework
├── CRACO                → Webpack configuration override
└── Custom Utilities     → Auth, date formatting, export, offline sync
```

### Backend Architecture
```
Node.js v16+ & Express v5.1.0
├── MongoDB Atlas        → Cloud NoSQL database (Mongoose v8.18.2)
├── JWT                  → Stateless authentication (9.0.2)
├── Bcrypt               → Password hashing (bcryptjs v2.4.3)
├── Joi                  → Request validation
├── CORS                 → Cross-origin resource sharing
├── PDFKit               → PDF generation for removal proofs
├── Dotenv               → Environment configuration
└── Morgan               → HTTP request logging
```

### Database Schema (MongoDB)
```javascript
Students Collection
├── Personal Info        (rollNo, name, year, semester, branch)
├── Late Tracking        (lateDays, status, gracePeriodUsed)
├── Financial            (fines, finesPaid)
├── History              (lateLogs[], fineHistory[])
└── Metadata             (createdAt, updatedAt, isActive)

Faculty Collection
├── Credentials          (email, passwordHash)
├── Profile              (name, branch, role: [faculty|admin|superadmin])
├── Auth Tracking        (lastLogin, loginHistory[])
└── Status               (isActive, createdAt, updatedAt)

AuditLog Collection
├── Action Details       (action, timestamp)
├── Actor Info           (facultyId, name, email, role)
├── Target              (affected resources)
└── Context              (ipAddress, userAgent)
```

### Deployment & DevOps
| Component | Platform | Configuration |
|-----------|----------|---------------|
| **Frontend** | Vercel | React build, automatic HTTPS, CDN, serverless functions |
| **Backend API** | Vercel Serverless | Node.js runtime, auto-scaling, global edge network |
| **Database** | MongoDB Atlas | Cloud-hosted, automated backups, replication, 3-node cluster |
| **Version Control** | GitHub | CI/CD with Vercel auto-deployment on push |
| **Security** | Vercel SSL + Auth | HTTPS everywhere, JWT tokens, rate limiting |

**Environment Variables:**
- Frontend: `REACT_APP_API_URL`
- Backend: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, `FRONTEND_URL`

---

##  Architecture

### System Architecture Diagram
```mermaid
graph TB
    subgraph Client["🖥️ Client Layer (React Frontend)"]
        UI["UI Components"]
        Auth["JWT Auth Manager"]
        Cache["IndexedDB Cache"]
        SW["Service Worker"]
    end
    
    subgraph API["🌐 API Gateway (Vercel Edge)"]
        CORS["CORS Handler"]
        RateLimit["Rate Limiter"]
        JWT["JWT Validator"]
    end
    
    subgraph Server["⚙️ Backend Server (Node.js/Express)"]
        Route["Route Handlers"]
        RBAC["Role-Based Auth"]
        Validate["Input Validation"]
        AI["AI Predictor"]
    end
    
    subgraph Models["📊 Data Models"]
        StudentModel["Student Schema"]
        FacultyModel["Faculty Schema"]
        AuditModel["Audit Log Schema"]
    end
    
    subgraph Database["🗄️ MongoDB Atlas"]
        Students["Students Collection"]
        Faculty["Faculty Collection"]
        Logs["Audit Logs Collection"]
    end
    
    Client -->|HTTPS + JWT| API
    API -->|Validates| JWT
    API -->|Rate Limits| CORS
    CORS -->|Forwards| Server
    Server -->|Checks Role| RBAC
    Server -->|Validates Data| Validate
    Server -->|Risk Analysis| AI
    Server -->|Maps Data| Models
    Models -->|Query/Update| Database
    Database -->|Replicates| Database
    Client -->|Offline Sync| SW
    SW -->|Caches| Cache
    
    style Client fill:#61DAFB,stroke:#0288D1,stroke-width:2px
    style API fill:#F7B500,stroke:#FFA000,stroke-width:2px
    style Server fill:#68A063,stroke:#2E7D32,stroke-width:2px
    style Models fill:#AB47BC,stroke:#7B1FA2,stroke-width:2px
    style Database fill:#4DB33D,stroke:#33691E,stroke-width:2px
```

### Data Flow Architecture
```mermaid
sequenceDiagram
    participant User
    participant Browser as React Browser
    participant API as Vercel API
    participant Backend as Node.js Server
    participant DB as MongoDB Atlas
    
    User->>Browser: 1. Login with credentials
    Browser->>API: 2. POST /auth/login (HTTPS)
    API->>Backend: 3. Validate email/password
    Backend->>DB: 4. Query faculty collection
    DB-->>Backend: 5. Return faculty record
    Backend->>Backend: 6. Hash password + JWT generation
    Backend-->>API: 7. Return JWT token + user info
    API-->>Browser: 8. Token stored in localStorage
    
    User->>Browser: 9. Navigate to Mark Late
    Browser->>API: 10. GET /students/search?query (JWT header)
    API->>Backend: 11. Validate JWT signature
    Backend->>Backend: 12. Extract role from token
    Backend->>DB: 13. MongoDB $or query on 4 fields
    DB-->>Backend: 14. Return filtered students
    Backend-->>API: 15. Send results + pagination
    API-->>Browser: 16. Update UI with results
    Browser->>Browser: 17. Render student cards
    
    User->>Browser: 18. Select student + mark late
    Browser->>API: 19. POST /students/mark-late
    API->>Backend: 20. Role + permission check
    Backend->>Backend: 21. Calculate fine (date-based)
    Backend->>DB: 22. Update student document
    DB-->>Backend: 23. Return updated record
    Backend->>DB: 24. Create audit log entry
    Backend-->>API: 25. Success response
    API-->>Browser: 26. Show toast notification
```

### Component Architecture
```
App.js (Main Router)
├── Navbar (Header + User Menu)
├── Sidebar (Navigation)
└── Routes:
    ├── Login.js
    ├── Mark Student Late
    │   └── StudentForm.js (Client-side)
    │   └── PrefetchedStudentForm.js (Enhanced)
    ├── Late Management
    │   ├── LateList.js
    │   └── Record.js
    ├── Analytics
    │   ├── Analytics.js (Dashboard)
    │   └── AIInsights.js (ML Predictions)
    ├── Student Profiles
    │   ├── StudentProfile.js (Search)
    │   └── StudentDashboard.js
    ├── Admin Features
    │   ├── StudentManagement.js (Master Data)
    │   ├── FacultyDirectory.js
    │   └── AdminManagement.js
    └── Faculty Features
        └── FacultyRegister.js
```

### Backend API Structure
```
backend/
├── server.js (Express app + routes)
├── routes/
│   ├── authRoutes.js (Login, Faculty CRUD, Role Management)
│   ├── studentRoutes.js (Mark late, Search, Records, Graduation Export)
│   ├── aiRoutes.js (Risk predictions, Pattern analysis, Warnings)
├── models/ (Mongoose schemas)
│   ├── student.js (Roll No, Year, Semester, Late tracking)
│   ├── faculty.js (Email, Role, Branch, Auth)
│   └── auditLog.js (Action logging, Compliance)
├── middleware/
│   ├── errorHandler.js (Global error catch)
│   ├── logger.js (Morgan HTTP logging)
│   └── rateLimiter.js (Request throttling)
├── services/
│   └── aiPredictor.js (ML heuristics, Risk scoring)
├── utils/
│   └── pdfGenerator.js (CSV export, Graduation data)
└── validators/
    └── index.js (Input validation schemas)
```

**Data Flow:**
1. User authenticates with email/password → JWT token issued (7-day expiry)
2. Token stored in localStorage, included in all API requests via Axios interceptor
3. Backend validates JWT signature and checks user role
4. Role-based middleware determines what endpoints are accessible
5. Mongoose performs database operations on MongoDB Atlas
6. Response returned with appropriate data based on permissions
7. Frontend updates UI with toast notifications and state updates
8. Service worker caches operations for offline support
9. All actions logged to audit collection for compliance

---

## 📸 Screenshots

### 🔐 Login Page
<img src="./screenshots/login_page.png" alt="Login Page" width="900"/>

**Features:**
- Clean and professional login interface
- Faculty authentication with email and password
- Role-based access control (Admin, Faculty, Student)
- Secure JWT token-based authentication
- Password validation and error handling
- "Remember Me" functionality
- Responsive design for mobile and desktop
- Dark mode support
- Session management with 7-day token expiry
- Forgot password option (if implemented)

---

### 📝 Mark Student Late (Faculty & Admin)
<img src="./screenshots/mark student late (2).png" alt="Mark Student Late - Prefetched Form" width="900"/>

**Features:**
- Enhanced student selection with cascading filters (Year → Branch → Section)
- Prefetched student form for rapid marking
- Real-time filtering by academic year, branch, and section
- Server-side search with pagination (limit: 20 results)
- Auto-population of student details after selection
- Automated fine calculation with rate breakdown
- Confirmation dialog before marking
- Toast notification with marking timestamp
- Offline queue support for network interruptions

---

### 📋 Late Students Today and records management (Faculty & Admin)
<img src="./screenshots/late management.png" alt="Late Students Records" width="900"/>

**Features:**
- Real-time students marked late today view
- Two tabs: "Late Students Today" and "Late Records"
- Search by roll number or student name
- Filter by academic year, branch, and section
- Display: Roll No, Name, Year, Semester, Branch, Section, Late Days count
- Column header sorting capabilities
- Excel export button (green) and TXT table export (purple)
- "View Details" button for individual student profiles
- Professional card-based layout with status badges

---

### 📈 Live Analytics Dashboard (Faculty & Admin)
<img src="./screenshots/live analytics.png" alt="Live Analytics Dashboard" width="900"/>

**Features:**
- Real-time "Students Late Today" metric (large red card with big number)
- Auto-refresh functionality (30-second intervals)
- Financial Analytics section showing:
  - Total fines collected (₹)
  - Pending fines (₹)
  - Projected revenue (₹)
  - Payment rate (%)
- Average fine per student calculation
- Department Breakdown section:
  - Late Students by Branch (bar chart)
  - Fines Distribution by Branch (visual breakdown)
- Responsive grid layout optimized for all screen sizes
- Color-coded metrics for quick interpretation

---

### 👤 Student Profile Search (Faculty & Admin)
<img src="./screenshots/student profile search.png" alt="Student Profile Search" width="900"/>

**Features:**
- Search students by roll number or name (e.g., A23120552001 or Adari Maheswari)
- Professional profile card display with:
  - Student name, year, semester, branch, section
  - Faculty advisor information
  - Visual status badges (color-coded)
- Quick statistics cards:
  - Total late days count
  - Total fines incurred (₹)
  - Excuse days used
  - Current status (Excused/Active)
- Late Attendance History with period filters:
  - All time view, Today, This Week, This Month, Custom date range
  - Historical instances with timestamps
  - Chronological listing of late entries

---

### 🤖 AI Insights Dashboard (Faculty & Admin)
<img src="./screenshots/AI insights.png" alt="AI Insights - Predictive Analytics" width="900"/>

**Features:**
- Machine Learning powered student risk assessment
- Three interactive analysis tabs:
  1. **Risk Predictions**: Students categorized as High/Medium/Low risk
     - Risk scoring on 0-100 scale
     - Color-coded boxes (Red/Orange/Green)
     - Top 20 high-risk students listed with scores
  2. **Pattern Analysis**: Behavioral pattern detection
     - Trend indicators and heuristic analysis
  3. **Early Warnings**: Proactive alert system
     - At-risk student identification
     - Recommended interventions
- Visual cards with ranking numbers
- Department-wide comparative metrics
- Refresh button for real-time updates

---

### 📊 Student Master Data Management (Admin Only)
<img src="./screenshots/students master data.png" alt="Student Master Data Management" width="900"/>

**Features:**
- Complete student database with 571+ records visible
- Search functionality across roll number, name, branch, and section
- Bulk add new students button (green "Add Student" button)
- Refresh data button (purple "Refresh" button)
- Aggregated statistics: "Total: 571 students" displayed
- Table columns (sortable):
  - Roll No (ascending order ▲)
  - Name
  - Year (numeric)
  - Semester (SEM)
  - Branch (CSM - Computer Science & Engineering)
  - Section (A-F, color-highlighted)
  - Late Days count
  - Fines (₹)
  - Action buttons: Edit (pencil icon) and Delete (trash icon)
- Year/semester/branch filtering dropdowns
- Inline edit and delete operations
- Student status management (Active/Inactive toggle)
- Pagination support for large datasets

---

### 👥 Faculty Directory (Admin Only)
<img src="./screenshots/faculty directory.png" alt="Faculty Directory Management" width="900"/>

**Features:**
- Complete faculty listing with 9+ faculty cards displayed
- Faculty cards showing:
  - Faculty name with professional typography
  - Email address (clickable)
  - Branch assignment (CSM)
  - Role badge (Faculty, Admin, SuperAdmin)
  - Active status indicator (green checkmark ✓)
  - Password field masked (••••••)
  - Last login timestamp
- Search functionality by name or email
- Role filter dropdown ("All Roles" default)
- Refresh button for real-time updates
- New Faculty button (purple) for account creation
- Card-based responsive layout (3 columns on desktop)
- Status indicators with color coding

---

### ⚙️ Admin Management Dashboard (Admin Only)
<img src="./screenshots/admin management.png" alt="Admin Management - System statistics" width="900"/>

**Features:**
- Three management tabs: Management (active), Audit Trail, Fine Management
- **System Statistics Dashboard** showing:
  - Total Students: 571
  - Students with Late Records: 130
  - Using Excuse Days: 124
  - Being Fined: 6
  - Alert Status: 0 (all clear)
  - Total Fines: ₹30
  - Year Distribution: Y1: 282, Y3: 278
  - Branch Distribution: CSM: 565, CSE: 1, MECH: 1, CIVIL: 1, IT: 1, CSD: 1
- Buttons for bulk operations:
  - Refresh Stats (purple button)
  - Download Database (green button)
- Semester promotion form section
- Fine management and bulk record removal capabilities
- Comprehensive audit logging integration

---

> **Security Note:** All screenshots showcase the production-deployed application running on Vercel with encrypted MongoDB Atlas backend. User data is protected with JWT authentication and role-based access control.

---

##  Installation & Setup

### Prerequisites
- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **MongoDB Atlas Account** ([Sign up free](https://www.mongodb.com/cloud/atlas/register))
- **Git** ([Download](https://git-scm.com/downloads))

### Local Development Setup

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/StudentLateTrackingSystem.git
cd StudentLateTrackingSystem-Clean
```

#### 2️⃣ Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
```

**Edit `backend/.env`:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendanceDB
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Start backend server:**
```bash
npm run dev
# Server runs on http://localhost:5000
```

#### 3️⃣ Frontend Setup
```bash
cd ../frontend
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env.local
```

**Start frontend development server:**
```bash
npm start
# Opens browser at http://localhost:3000
```

### 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin.admin@anits.edu.in` | See Login Page |
| **Faculty** | `faculty@anits.edu.in` | See Login Page |

> **Important Security Notice:** 
> - Test credentials are displayed on the login page for demo purposes
> - **For production deployment, change all default passwords immediately**
> - Create strong, unique passwords for all accounts
> - Enable 2FA if available
> - Restrict access based on actual user roles

---

## 📖 Usage Guide by Role

### 👨‍🏫 Faculty Workflow

**Day-to-Day Operations:**
1. **Login** with your faculty email
2. **Mark Students Late**
   - Navigate to "Mark Student Late"
   - Scan QR code from student ID or search by roll number
   - Confirm student details
   - System auto-calculates fine based on date and grace period
   - Receive confirmation notification

3. **View Today's Late List**
   - See all students marked late today
   - Filter by year, branch, section
   - Search for specific students
   - Export daily report for records

4. **Check Historical Records**
   - Select period (weekly/monthly/semester)
   - View detailed attendance history
   - Export reports in Excel/TXT format
   - Analyze patterns and trends

5. **Monitor Live Analytics**
   - View real-time dashboard
   - See student performance leaderboards
   - Monitor department statistics
   - Check financial metrics

**Limitations:**
- Cannot access student data management
- Cannot access faculty directory
- Cannot promote semesters or remove records
- Cannot view system configuration

---

### 🔧 Admin Workflow

**Management Operations:**
1. **All Faculty Operations** (complete access)
2. **Student Master Data Management**
   - Add new students in bulk
   - Edit existing student information
   - Delete inactive students
   - Manage student status
   - Filter by year/branch/semester

3. **Faculty Directory**
   - View all faculty accounts
   - Create new faculty accounts
   - Edit faculty details (name, email, role)
   - Reset faculty passwords
   - Manage faculty roles
   - Deactivate/reactivate accounts

4. **Semester Promotion**
   - Bulk promote all students to next semester
   - Filter by year, branch, or section
   - Automatic year calculation (S1-2→Y1, S3-4→Y2, etc.)
   - Mark Y4S8 students as graduated
   - Reset late data while preserving student records
   - Generate promotion report

5. **Bulk Record Management**
   - Remove multiple late records at once
   - Generate PDF proof of removal
   - Clear fines for students
   - Manage financial records
   - Export removal proofs

6. **Analytics & Reports**
   - Access extended analytics
   - View system statistics
   - Monitor financial metrics
   - Export comprehensive reports
   - Access audit logs

7. **Audit & Compliance**
   - View all system actions (audit logs)
   - Filter by user, action, date
   - Track data modifications
   - Ensure accountability

---

### 👑 SuperAdmin Operations

**System Control:**
1. **All Admin Operations** (complete access)
2. **System Configuration**
   - Modify fine calculation rates
   - Adjust grace periods
   - Configure system parameters
   - Set business rules

3. **Role Management**
   - Promote faculty to admin
   - Demote admin to faculty
   - Manage role hierarchy
   - Assign special permissions

4. **Database Operations**
   - Direct database access
   - Backup and restore data
   - Data migration tasks
   - System maintenance

5. **Advanced Analytics**
   - System-wide performance metrics
   - Predictive analytics
   - Trend analysis
   - Strategic planning

---

## 📡 API Documentation

### Base URL
- **Production:** `https://your-backend-api.vercel.app/api`
- **Local Development:** `http://localhost:5000/api`

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "faculty@anits.edu.in",
  "password": "password123"
}

Response (200 OK):
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "faculty@anits.edu.in",
    "name": "John Doe",
    "role": "faculty",
    "branch": "CSE"
  }
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer {token}

Response (200 OK):
{
  "id": "507f1f77bcf86cd799439011",
  "email": "faculty@anits.edu.in",
  "name": "John Doe",
  "role": "faculty",
  "branch": "CSE",
  "lastLogin": "2024-02-04T10:30:00Z",
  "isActive": true
}
```

#### List Faculty (Admin Only)
```http
GET /auth/faculty?page=1&limit=10
Authorization: Bearer {admin_token}

Response (200 OK):
{
  "message": "Faculty retrieved",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "email": "faculty@anits.edu.in",
      "name": "John Doe",
      "role": "faculty",
      "branch": "CSE",
      "isActive": true,
      "createdAt": "2024-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### Student Management Endpoints

#### Mark Student Late
```http
POST /students/mark-late
Authorization: Bearer {token}
Content-Type: application/json

{
  "rollNumber": "21A91A05H3"
}

Response (200 OK):
{
  "message": "Student marked late successfully",
  "data": {
    "rollNumber": "21A91A05H3",
    "name": "Student Name",
    "year": 1,
    "semester": 1,
    "branch": "CSE",
    "lateDays": 5,
    "todayFine": 3,
    "totalFine": 15,
    "timestamp": "2024-02-04T10:30:00Z"
  }
}
```

#### Get Today's Late Students
```http
GET /students/late-today?branch=CSE&year=1
Authorization: Bearer {token}

Response (200 OK):
{
  "message": "Late students retrieved",
  "data": [
    {
      "rollNumber": "21A91A05H3",
      "name": "Student Name",
      "year": 1,
      "semester": 1,
      "branch": "CSE",
      "lateDays": 5,
      "time": "10:30 AM",
      "markedBy": "John Doe"
    }
  ],
  "count": 12
}
```

### Error Handling

**Standard Error Response:**
```json
{
  "error": "Error message",
  "details": "Additional context if available",
  "code": "ERROR_CODE"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created successfully
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions for role)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate entry, e.g., duplicate email)
- `500` - Internal Server Error

---

## 🚢 Deployment

### Pre-Deployment Checklist
- [ ] Change all default passwords in production
- [ ] Set strong JWT_SECRET (min 32 characters)
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Update CORS origins to production domain
- [ ] Test all role-based access controls
- [ ] Review audit logs configuration
- [ ] Optimize database indexes
- [ ] Set up monitoring and error tracking

### Deploy on Vercel

#### Step 1: Prepare Repository
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Deploy Backend
```bash
cd backend
vercel --prod
```

Set environment variables in Vercel:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT (min 32 chars)
- `NODE_ENV` - Set to `production`
- `FRONTEND_URL` - Your frontend URL

#### Step 3: Deploy Frontend
```bash
cd frontend
vercel --prod
```

Set environment variables:
- `REACT_APP_API_URL` - Your backend URL + `/api`

---

## 📋 Changelog

### Version 3.1.0 (February 22, 2026)
**Production Release: Bug Fixes & Search Optimization**

**Critical Bug Fixes:**
- ✅ Re-added `/students/search` endpoint (accidentally removed during cleanup)
- ✅ Fixed graduation export system with improved data preservation and logging
- ✅ Fixed new student registration with `isLate` flag support

**Search & Pagination Overhaul:**
- ✅ Moved from client-side to server-side search implementation
- ✅ Fixed empty pages 1-4 issue in search results
- ✅ MongoDB `$or` query searches across 4 fields: rollNo, name, branch, section
- ✅ Auto-reset pagination to page 1 when search query changes
- ✅ Search icon visual indicators (blue highlighting during active search)

**Student Master Data Enhancements:**
- ✅ Year-Semester validation (prevents invalid combinations)
- ✅ Smart semester auto-selection based on year
- ✅ Visual edit mode indicators with warning banners
- ✅ Section input changed from text to dropdown

**Features:**
- [x] Full student late tracking system
- [x] Role-based access control (Faculty, Admin, SuperAdmin)
- [x] Real-time analytics dashboard
- [x] AI-powered risk predictions
- [x] CSV bulk import tool
- [x] Graduation export with auto-deletion
- [x] Offline-first architecture with Service Worker
- [x] Dark mode support
- [x] Mobile responsiveness
- [x] Comprehensive audit logging
- [x] Academic year and semester management
- [x] Fine calculation and management

**Deployment Status:** ✅ Production-Ready (v3.1.0)

---

## 🤝 Contributing

Contributions are welcome! 

1. **Fork** the repository
2. **Create Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit Changes** (`git commit -m 'Add feature'`)
4. **Push to Branch** (`git push origin feature/AmazingFeature`)
5. **Open Pull Request**

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- **ANITS** - For the project opportunity
- **MongoDB Atlas** - Cloud database hosting
- **Vercel** - Deployment platform
- **React Community** - Amazing framework

---

<div align="center">

**⭐ Star this repo if you find it useful! ⭐**

Made with ❤️ for Educational Institutions

</div>
