#  Student Late Tracking System

> A comprehensive, production-ready full-stack web application for educational institutions to track student attendance, automate fine calculations, generate real-time analytics, and manage role-based access control with enterprise-grade security.

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://frontend-bice-six-7xa3qoyuae.vercel.app)
[![Backend API](https://img.shields.io/badge/API-live-blue?style=for-the-badge)](https://backend-amber-three-76.vercel.app)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/cloud/atlas)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**🔗 Live Application:** [https://frontend-bice-six-7xa3qoyuae.vercel.app](https://frontend-bice-six-7xa3qoyuae.vercel.app)

---

##  Table of Contents
- [Overview](#overview)
- [Key Features by Role](#key-features-by-role)
- [Role-Based Access Control](#role-based-access-control)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Screenshots](#screenshots)
- [Installation](#installation--setup)
- [Usage](#usage-guide-by-role)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
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

##  Key Features by Role

### 👨‍🏫 Faculty Operations
Faculty members have core attendance management capabilities:

| Feature | Description | Impact |
|---------|-------------|--------|
| **Mark Student Late** | One-click attendance marking with QR/barcode scan or search | Real-time entry of attendance |
| **Today's Late List** | View all students marked late today with filters | Quick overview of daily attendance |
| **Late Records** | Access historical records (weekly/monthly/semester) | Comprehensive attendance tracking |
| **Live Analytics** | View real-time dashboard with student metrics | Data-driven insights |
| **Export Reports** | Download attendance data in Excel/TXT format | Data portability and external reporting |
| **Leaderboards** | See top late, most improved, and best-performing students | Performance comparison |

**Access:** Login with faculty credentials → Limited to core attendance features

---

### 🔧 Admin Operations
Admins have all faculty features PLUS management capabilities:

| Feature | Description | Impact |
|---------|-------------|--------|
| **All Faculty Operations** | Complete access to attendance marking and viewing | Foundation for admin role |
| **Student Master Data** | Add, edit, delete student records in bulk | Manage student database |
| **Faculty Directory** | View all faculty, create accounts, reset passwords | Manage faculty accounts and roles |
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

```mermaid
graph TB
    A[Client Browser]
    A -->|HTTPS| B[Vercel CDN]
    B -->|React Frontend| C[UI Components]
    C -->|JWT in Headers| D[API Interceptor]
    D -->|HTTPS REST| E[Vercel Serverless]
    E -->|Mongoose ODM| F[MongoDB Atlas]
    E -->|JWT Validation| G[Auth Middleware]
    G -->|Role Check| H[Route Handler]
    C -->|Service Worker| I[IndexedDB Cache]
    
    style C fill:#61DAFB
    style E fill:#68A063
    style F fill:#4DB33D
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

---

## 📸 Screenshots

### 🔐 Login Page
<img src="./screenshots/login page.png" alt="Login Page" width="900"/>

**Features:**
- Modern glassmorphism design with gradient background
- Test credentials display for demo
- Responsive layout (mobile, tablet, desktop)
- Field validation with error messages
- Password visibility toggle
- Forgot Password link

---

### 📝 Mark Student Late (Faculty & Admin)
<img src="./screenshots/mark student late.png" alt="Mark Student Late" width="900"/>

**Features:**
- QR/Barcode scanner integration
- Roll number search with auto-complete
- Student details display (name, year, semester)
- Automated fine calculation with breakdown
- Confirmation dialog before submission
- Toast notification on success
- Offline queue support

---

### 📋 Late Students Today (Faculty & Admin)
<img src="./screenshots/late student today.png" alt="Late Students Today" width="900"/>

**Features:**
- Today's late students list with timestamps
- Search by roll number or name
- Filter by year, branch, semester
- Column sorting (name, roll number, time)
- Excel/TXT export options
- Student detail view
- Batch operations for admins

---

### 📊 Late Records (Faculty & Admin)
<img src="./screenshots/student late record.png" alt="Late Records" width="900"/>

**Features:**
- Weekly, monthly, and semester views
- Search and filter capabilities
- Detailed student late tracking
- Fine history breakdown
- Export to Excel/TXT
- Department-wise statistics
- Period selection dropdown

---

### 📈 Live Analytics Dashboard (Faculty & Admin)
<img src="./screenshots/live analytics.png" alt="Analytics Dashboard" width="900"/>

**Features:**
- Real-time student late count metrics
- Financial analytics (total fines, payment rates)
- Student performance leaderboards
- Most late, most improved, best-performing students
- Interactive charts with trend indicators
- Auto-refresh capability (5-second intervals)
- Department breakdown statistics
- Responsive grid layout

---

### 👥 Faculty Directory (Admin Only)
<img src="./screenshots/faculty directory.png" alt="Faculty Directory" width="900"/>

**Features:**
- Complete faculty listing with pagination
- Faculty role badges (Faculty, Admin, SuperAdmin)
- Account status indicators
- Email and branch information
- Edit faculty details (name, email, role)
- Create new faculty accounts
- Reset password functionality (admin controlled)
- Deactivate/reactivate faculty accounts
- Audit trail integration

---

### ⚙️ Admin Management (Admin Only)
<img src="./screenshots/admin management.png" alt="Admin Management" width="900"/>

**Features:**
- System statistics dashboard
- Real-time metrics (total students, faculty, fines)
- Semester promotion with bulk filtering
- Student Master Data management (add/edit/delete)
- Bulk late record removal with proof export
- Fine management and payment tracking
- Year/Branch/Section filtering
- Operation confirmation dialogs
- Audit log viewing
- PDF proof generation for record removals

---

### 📊 Students Master Data (Admin Only)
<img src="./screenshots/students master data.png" alt="Students Master Data" width="900"/>

**Features:**
- Complete student database view
- Add new student records
- Edit student information
- Bulk import from CSV
- Student status management
- Year/Branch/Section organization
- Search and filtering
- Pagination for large datasets
- Deactivate/reactivate students
- Export student list

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
git clone https://github.com/SAIVISHAL007/StudentLateTrackingSystem-Clean.git
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
- **Production:** `https://backend-amber-three-76.vercel.app/api`
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

**Chelluri Sai Vishal**
- GitHub: [@SAIVISHAL007](https://github.com/SAIVISHAL007)
- Email: chellurisaivishal@gmail.com

---

## 🙏 Acknowledgments

- **ANITS** - For the project opportunity
- **MongoDB Atlas** - Cloud database hosting
- **Vercel** - Deployment platform
- **React Community** - Amazing framework

---

<div align="center">

**⭐ Star this repo if you find it useful! ⭐**

Made with ❤️ by Chelluri Sai Vishal

</div>
