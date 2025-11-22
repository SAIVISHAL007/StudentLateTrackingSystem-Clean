# 🎓 Student Late Tracking System

A modern, full-stack web application for tracking student late arrivals with automated fine calculation, semester management, and comprehensive analytics.

## Features

### Core Functionality
- ✅ **Smart Late Tracking**: Record student late arrivals with automated fine calculation
- ✅ **Semester Management**: Automatic year/semester tracking and promotion system
- ✅ **Fine System**: Intelligent fine calculation (2 excuse days, progressive fines)
- ✅ **QR/Barcode Scanning**: Quick student ID scanning support
- ✅ **Offline Support**: Queue system for marking students late without internet

### Analytics & Reporting
- 📊 **Live Analytics Dashboard**: Real-time metrics with trend indicators
- 📈 **Department Breakdown**: Per-department statistics with visual progress bars
- 🏆 **Leaderboards**: Most late, most improved, and best performers
- 💰 **Financial Analytics**: Total fines, payment rates, projections
- 📥 **Export Options**: Excel and TXT reports with comprehensive data

### User Management
- 👥 **Role-Based Access**: SuperAdmin, Admin, Faculty roles with granular permissions
- 🔐 **Secure Authentication**: JWT-based auth with 7-day token expiry
- 👨‍💼 **Faculty Directory**: Manage faculty accounts with password reset
- 📝 **Audit Logging**: Complete action tracking for accountability

### Admin Features
- 🎓 **Semester Promotion**: Bulk student promotion with year transitions
- 🗑️ **Bulk Record Removal**: Remove late records with authorization tracking
- 💳 **Fine Management**: Clear fines for multiple students
- 📊 **System Statistics**: Comprehensive overview of all data

## Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **React Router v7** - Client-side routing
- **Axios** - HTTP client
- **HTML5-QRCode** - QR/Barcode scanning
- **XLSX** - Excel export functionality
- **CRACO** - Custom webpack configuration

### Backend
- **Node.js & Express** - Server framework
- **MongoDB with Mongoose** - Database
- **JWT** - Secure authentication
- **Bcrypt** - Password encryption
- **Nodemon** - Development auto-reload

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Installation

**1. Clone the repository:**
```bash
git clone <repository-url>
cd StudentLateTrackingSystem-Clean
```

**2. Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
``` 

**3. Frontend Setup:**
```bash
cd frontend
npm install
npm start
```

The application will run on:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## Default Credentials

**SuperAdmin:**
- Email: `superadmin@college.edu`
- Password: `SuperAdmin@123`

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

## API Endpoints

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register faculty (admin only)
- `GET /auth/faculty` - List faculty
- `PATCH /auth/faculty/:id` - Update faculty
- `POST /auth/faculty/:id/reset-password` - Reset password

### Students
- `POST /students/mark-late` - Mark student late
- `GET /students/late-today` - Today's late students
- `GET /students/records/:period` - Historical records (weekly/monthly/semester)
- `GET /students/analytics/leaderboard` - Analytics data
- `GET /students/analytics/financial` - Financial metrics
- `POST /students/promote-semester` - Bulk promotion
- `POST /students/bulk-remove-late-records` - Remove records
- `POST /students/pay-fine` - Clear fines

## Development

### Running in Development Mode
```bash
# Backend (with auto-reload)
cd backend
npm run dev

# Frontend (with hot reload)
cd frontend
npm start
```

### Building for Production
```bash
cd frontend
npm run build
```

## Contributing
Contributions are welcome! Please ensure all tests pass and follow the existing code style.

## License
MIT License - See LICENSE file for details

---
**Version:** 2.0.0  
**Last Updated:** December 2024  
**Developed by:** ANITS Development Team