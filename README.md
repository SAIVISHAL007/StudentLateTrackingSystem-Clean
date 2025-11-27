# 🎓 Student Late Tracking System

> A comprehensive, production-ready full-stack web application for educational institutions to track student attendance, automate fine calculations, and generate real-time analytics.

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://frontend-bice-six-7xa3qoyuae.vercel.app)
[![Backend API](https://img.shields.io/badge/API-live-blue?style=for-the-badge)](https://backend-amber-three-76.vercel.app)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/cloud/atlas)

**🔗 Live Application:** [https://frontend-bice-six-7xa3qoyuae.vercel.app](https://frontend-bice-six-7xa3qoyuae.vercel.app)

---

## 📋 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🌟 Overview

The **Student Late Tracking System** is a modern, enterprise-grade solution designed to digitize and automate attendance management for educational institutions. Built with the MERN stack and deployed on Vercel with MongoDB Atlas, this system handles real-time attendance tracking, automated fine calculations, role-based access control, and comprehensive analytics.

### 🎯 Problem Statement
Traditional manual attendance tracking systems are:
- Time-consuming and error-prone
- Lack real-time insights and analytics
- Difficult to maintain historical records
- Have no automated fine calculation or semester management

### ✅ Solution Delivered
This system provides:
- **Instant attendance recording** with QR/barcode scanning support
- **Automated fine calculation** with configurable progressive rates
- **Real-time analytics dashboard** with visual insights
- **Role-based access control** (SuperAdmin, Admin, Faculty)
- **Offline-first architecture** with service worker support
- **Comprehensive audit logging** for accountability
- **Bulk operations** for semester promotions and record management

---

## ✨ Key Features

### 🎯 Core Functionality
| Feature | Description |
|---------|-------------|
| **Smart Late Tracking** | One-click attendance recording with automated timestamp and fine calculation |
| **QR/Barcode Scanning** | Quick student identification using HTML5-QRCode library |
| **Offline Queue System** | Service worker-powered offline support with automatic sync |
| **Progressive Fine System** | Intelligent fine calculation (2 excuse days, then ₹3→₹5→₹8→progressive) |
| **Semester Management** | Bulk promotion system with year/branch filtering and graduation tracking |

### 📊 Analytics & Reporting
- **📈 Real-time Dashboard** - Live metrics with trend indicators and visual progress bars
- **🏆 Smart Leaderboards** - Track most late, most improved, and best-performing students
- **💰 Financial Analytics** - Total fines collected, payment rates, and revenue projections
- **📥 Multi-format Export** - Download reports in Excel (.xlsx) and TXT format
- **🔍 Historical Records** - Weekly, monthly, and semester-wise attendance reports
- **📊 Department Breakdown** - Per-branch statistics with percentage calculations

### 👥 User Management & Security
- **🔐 JWT Authentication** - Secure token-based auth with 7-day expiry
- **🛡️ Role-Based Access Control** - Three-tier system (SuperAdmin, Admin, Faculty)
- **👨‍💼 Faculty Directory** - Complete faculty management with email editing
- **🔑 Password Management** - Admin-controlled password resets (no OTP complexity)
- **📝 Comprehensive Audit Logs** - Track all actions with user, timestamp, and IP address
- **⚡ Session Management** - Auto-logout on token expiry with clean localStorage handling

### 🛠️ Admin Features
| Feature | Capability |
|---------|------------|
| **Semester Promotion** | Bulk promote students with automatic year calculation and late data reset |
| **Bulk Record Removal** | Remove multiple late records with admin authorization tracking |
| **Fine Management** | Clear fines for selected students or entire departments |
| **Student Import** | Bulk student upload via CSV with validation |
| **System Statistics** | Real-time overview of students, faculty, total fines, and records |

### 🎨 User Experience
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **🌓 Modern UI** - Gradient backgrounds, glassmorphism effects, smooth animations
- **🔔 Toast Notifications** - Real-time feedback for all operations
- **⚡ Fast Performance** - Optimized API calls, lazy loading, and efficient state management
- **♿ Accessibility** - Keyboard navigation, ARIA labels, semantic HTML

## 🛠️ Tech Stack

### Frontend Architecture
```
React 19.0.0 (Latest)
├── React Router v7       → Client-side routing with nested routes
├── Axios                 → HTTP client with interceptors for JWT
├── HTML5-QRCode         → QR/Barcode scanning support
├── XLSX (SheetJS)       → Excel export with BLOB fallback
├── Service Workers      → Offline queue and cache management
└── CRACO                → Webpack configuration override
```

**Key Libraries:**
- `@testing-library/*` - Comprehensive testing suite
- `web-vitals` - Performance monitoring
- Custom utilities for auth, date formatting, and offline sync

### Backend Architecture
```
Node.js v16+ & Express v5.1.0
├── MongoDB Atlas (Mongoose v8.18.2)  → Cloud NoSQL database
├── JWT (jsonwebtoken v9.0.2)         → Stateless authentication
├── Bcrypt (bcryptjs v2.4.3)          → Password hashing
├── Joi                                → Request validation
├── CORS                               → Cross-origin resource sharing
└── Dotenv                             → Environment configuration
```

**Security Features:**
- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with configurable expiry
- CORS protection with origin whitelisting
- Input validation and sanitization
- Mongoose schema validation

### Database Schema (MongoDB)
```javascript
Students Collection
├── Personal Info (rollNo, name, year, semester, branch)
├── Late Tracking (lateDays, status, gracePeriodUsed)
├── Financial (fines, finesPaid)
├── History (lateLogs[], fineHistory[])
└── Metadata (createdAt, updatedAt, isActive)

Faculty Collection
├── Credentials (email, password hash)
├── Profile (name, branch, role)
├── Auth Tracking (lastLogin, loginHistory[])
└── Status (isActive, createdAt)

AuditLog Collection
├── Action Details (action, timestamp)
├── Actor Info (facultyId, name, email, role)
├── Target (affected resources)
└── Context (ipAddress, userAgent)
```

### Deployment & DevOps
| Component | Platform | Configuration |
|-----------|----------|---------------|
| **Frontend** | Vercel | React build, automatic HTTPS, edge network |
| **Backend API** | Vercel Serverless | Node.js runtime, auto-scaling, global CDN |
| **Database** | MongoDB Atlas | Cloud-hosted, automated backups, replication |
| **Version Control** | GitHub | CI/CD with Vercel auto-deployment |

**Environment Variables:**
- Frontend: `REACT_APP_API_URL`
- Backend: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, `FRONTEND_URL`

## 🏗️ Architecture

```mermaid
graph TB
    A[Client Browser] -->|HTTPS| B[Vercel CDN]
    B --> C[React Frontend]
    C -->|API Calls| D[Vercel Serverless Functions]
    D -->|Mongoose ODM| E[MongoDB Atlas]
    D -->|JWT Validation| F[Auth Middleware]
    C -->|Service Worker| G[IndexedDB Cache]
    
    style C fill:#61DAFB
    style D fill:#68A063
    style E fill:#4DB33D
```

**Data Flow:**
1. User interacts with React frontend (JWT stored in localStorage)
2. Axios interceptor adds Authorization header to API requests
3. Backend validates JWT and processes request
4. Mongoose performs database operations on MongoDB Atlas
5. Response sent back with appropriate status codes
6. Frontend updates UI with toast notifications

---

## 📸 Screenshots

### Login Page
Modern, responsive login interface with gradient background and glassmorphism effects.

### Dashboard & Analytics
Real-time analytics with live metrics, trend indicators, department breakdown, and financial insights.

### Student Management
Quick student late marking with QR scanner, search functionality, and instant feedback.

### Admin Panel
Comprehensive admin controls for semester promotion, bulk operations, and faculty management.

### Records & Reports
Historical attendance records with weekly/monthly/semester views and multi-format export options.

> **Note:** Screenshots showcase the production-deployed application running on Vercel with MongoDB Atlas backend.

---

## 🚀 Installation & Setup

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
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
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
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

**Start frontend development server:**
```bash
npm start
# Opens browser at http://localhost:3000
```

### 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin.admin@anits.edu.in` | `Admin@123` |

> **Note:** Create additional faculty accounts from the Admin panel after first login.

---

## 📖 Usage

### For Faculty
1. **Login** with your credentials
2. **Mark Students Late** - Scan QR code or search by roll number
3. **View Today's Late List** - See all students marked late today
4. **Check Records** - View weekly/monthly/semester attendance history
5. **Export Reports** - Download Excel or TXT reports

### For Admins
1. All faculty features plus:
2. **Manage Faculty** - Create, edit, deactivate faculty accounts
3. **Promote Semester** - Bulk student promotion with filtering
4. **Analytics Dashboard** - Real-time system statistics and trends
5. **Bulk Operations** - Remove late records, clear fines
6. **Audit Logs** - Review all system actions

### For SuperAdmin
1. All admin features plus:
2. **System Configuration** - Modify fine rates, grace periods
3. **User Role Management** - Promote/demote admins
4. **Database Operations** - Backup, restore, maintenance

## Project Structure

```
StudentLateTrackingSystem-Clean/
├── backend/
│   ├── models/           # MongoDB schemas
│   │   ├── student.js    # Student model with semester tracking
│   │   ├── faculty.js    # Faculty/user model
│   │   └── auditLog.js   # Audit trail model
│   ├── routes/           # API endpoints
│   │   ├── studentRoutes.js  # Student operations
│   │   └── authRoutes.js     # Authentication & faculty management
│   ├── server.js         # Express server setup
│   ├── .env              # Environment variables
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── service-worker.js  # Offline support
│   │   └── index.html
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Login.js
│   │   │   ├── StudentForm.js      # Mark students late
│   │   │   ├── LateList.js         # Today's late students
│   │   │   ├── Record.js           # Historical records
│   │   │   ├── Analytics.js        # Live dashboard
│   │   │   ├── AdminManagement.js  # Admin operations
│   │   │   ├── FacultyDirectory.js # Faculty management
│   │   │   ├── ForgotPassword.js
│   │   │   ├── Navbar.js
│   │   │   └── Sidebar.js
│   │   ├── services/
│   │   │   └── api.js    # Axios configuration
│   │   ├── utils/
│   │   │   ├── auth.js           # Auth helpers
│   │   │   ├── dateUtils.js      # Date formatting
│   │   │   ├── exportUtils.js    # TXT/CSV export
│   │   │   ├── excelExport.js    # Excel export
│   │   │   └── offlineQueue.js   # Offline queue management
│   │   ├── App.js        # Main app component
│   │   ├── App.css       # Global styles
│   │   ├── index.js      # Entry point
│   │   └── index.css     # Base styles
│   ├── craco.config.js   # Webpack config override
│   ├── .env              # Environment variables
│   └── package.json
│
└── README.md
```

## Key Features Explained

### Fine Calculation System
```
Days 1-2:  Excuse days (no fine)
Days 3-5:  ₹3 per day
Days 6-8:  ₹5 per day
Days 9-11: ₹8 per day
Days 12+:  Progressive increase (₹13, ₹18, ₹23...)
```

### Semester Promotion
- Automatically calculates year based on semester (S1-2=Y1, S3-4=Y2, S5-6=Y3, S7-8=Y4)
- Bulk promotion with flexible filtering (by year/branch)
- Resets late data while preserving student information
- Marks Y4S8 students as graduated

### Offline Support
- Service worker caches mark-late operations
- Visual queue counter with manual sync
- Auto-sync when connection restored
- Toast notifications for all operations

## 📡 API Documentation

### Base URL
- **Production:** `https://backend-amber-three-76.vercel.app/api`
- **Local:** `http://localhost:5000/api`

### Authentication Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | ❌ | Login with email and password |
| `POST` | `/auth/register` | ✅ Admin | Create new faculty account |
| `GET` | `/auth/profile` | ✅ | Get current user profile |
| `GET` | `/auth/faculty` | ✅ Admin | List all faculty (paginated) |
| `GET` | `/auth/faculty/:id` | ✅ Admin | Get specific faculty details |
| `PATCH` | `/auth/faculty/:id` | ✅ Admin | Update faculty (name, email, role) |
| `POST` | `/auth/faculty/:id/reset-password` | ✅ Admin | Admin reset password |
| `POST` | `/auth/logout` | ✅ | Logout (audit log) |

### Student Management Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/students/mark-late` | ✅ | Mark student late with automated fine |
| `GET` | `/students/late-today` | ✅ | Get today's late students |
| `GET` | `/students/records/:period` | ✅ | Get records (weekly/monthly/semester) |
| `GET` | `/students/system-stats` | ✅ Admin | System statistics overview |
| `POST` | `/students/promote-semester` | ✅ Admin | Bulk semester promotion |
| `POST` | `/students/bulk-remove-late-records` | ✅ Admin | Remove multiple late records |
| `POST` | `/students/pay-fine` | ✅ Admin | Clear student fines |
| `DELETE` | `/students/student/:rollNo` | ✅ Admin | Delete student account |

### Analytics Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/students/analytics/leaderboard` | ✅ | Get leaderboard data |
| `GET` | `/students/analytics/financial` | ✅ Admin | Financial metrics |

### Request Examples

**Login:**
```bash
curl -X POST https://backend-amber-three-76.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin.admin@anits.edu.in","password":"Admin@123"}'
```

**Mark Student Late:**
```bash
curl -X POST https://backend-amber-three-76.vercel.app/api/students/mark-late \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"rollNumber":"21A91A05H3"}'
```

### Response Formats

**Success Response:**
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Additional context"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## 🚢 Deployment

This project is deployed using **Vercel** with separate frontend and backend projects connected to the same GitHub repository.

### Deployment Architecture
```
GitHub Repository (main branch)
├── Frontend Project (Vercel)
│   ├── Root Directory: frontend/
│   ├── Build Command: npm run build
│   ├── Output Directory: build
│   └── Environment: REACT_APP_API_URL
│
└── Backend Project (Vercel Serverless)
    ├── Root Directory: backend/
    ├── Serverless Function: api/index.js
    ├── Environment: MONGODB_URI, JWT_SECRET, NODE_ENV
    └── Auto-scaling enabled
```

### Deploy Your Own

#### 1. Fork this repository

#### 2. Deploy Backend
```bash
cd backend
vercel --prod
```
Set environment variables in Vercel dashboard:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT (min 32 chars)
- `NODE_ENV` - Set to `production`

#### 3. Deploy Frontend
```bash
cd frontend
vercel --prod
```
Set environment variables:
- `REACT_APP_API_URL` - Your backend URL + `/api`

#### 4. Connect to GitHub
In Vercel dashboard → Settings → Git:
- Connect both projects to your GitHub repo
- Set Root Directory for each project
- Enable auto-deployment on push to main

---

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests (if configured)
cd backend
npm test
```

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Code Style
- Use ESLint configuration provided
- Follow existing naming conventions
- Add comments for complex logic
- Update README for new features

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Chelluri Sai Vishal**
- GitHub: [@SAIVISHAL007](https://github.com/SAIVISHAL007)
- LinkedIn: [Connect with me](https://www.linkedin.com/in/yourprofile)
- Portfolio: [Your Portfolio](https://yourportfolio.com)

---

## 🙏 Acknowledgments

- **ANITS** - For the project opportunity
- **MongoDB Atlas** - Cloud database hosting
- **Vercel** - Deployment platform
- **React Community** - Amazing framework and ecosystem
- **Open Source Contributors** - For the libraries and tools used

---

## 📊 Project Stats

![GitHub repo size](https://img.shields.io/github/repo-size/SAIVISHAL007/StudentLateTrackingSystem-Clean)
![GitHub language count](https://img.shields.io/github/languages/count/SAIVISHAL007/StudentLateTrackingSystem-Clean)
![GitHub top language](https://img.shields.io/github/languages/top/SAIVISHAL007/StudentLateTrackingSystem-Clean)
![GitHub last commit](https://img.shields.io/github/last-commit/SAIVISHAL007/StudentLateTrackingSystem-Clean)

---

## 📞 Support

For support, email saivishal@anits.edu.in or open an issue in this repository.

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Email notifications for late students
- [ ] SMS integration for parents
- [ ] Biometric attendance integration
- [ ] Multi-language support
- [ ] Advanced analytics with ML predictions
- [ ] Parent portal
- [ ] Fine payment gateway integration

---

<div align="center">

**⭐ Star this repo if you find it useful! ⭐**

Made with ❤️ by Chelluri Sai Vishal

[Report Bug](https://github.com/SAIVISHAL007/StudentLateTrackingSystem-Clean/issues) · [Request Feature](https://github.com/SAIVISHAL007/StudentLateTrackingSystem-Clean/issues)

</div>