import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import studentRoutes from "./routes/studentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { forceHTTPS, securityHeaders, sanitizeRequest, sanitizeErrors } from "./middleware/security.js";

dotenv.config();

const app = express();

// CORS configuration with explicit allowlist
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser clients
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true); // allow all Vercel deploys
    
    // Allow local network IPs during development (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (process.env.NODE_ENV !== 'production') {
      const isLocalIP = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[01]\.)/.test(origin);
      if (isLocalIP) return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Security middleware
app.use(forceHTTPS);
app.use(securityHeaders);
app.use(sanitizeRequest);

// Increase payload limit for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes with DB connection check for serverless
app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      await connectDB();
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/ai", aiRoutes);

// Error handling middleware (must be last)
app.use(sanitizeErrors);

// Use MONGODB_URI for production deployment
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/studentLateTracking';

// Serverless-friendly MongoDB connection
let isConnecting = false;
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  if (isConnecting) return;
  
  isConnecting = true;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true
    });
    isConnected = true;
    isConnecting = false;
    console.log("✅ MongoDB Connected Successfully");
    console.log(`🌐 Connected to database: ${mongoose.connection.name}`);
  } catch (err) {
    isConnecting = false;
    console.error("❌ DB Connection Error:", err);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw err;
  }
};

// Connect immediately for local development
if (process.env.NODE_ENV !== 'production') {
  connectDB().catch(console.error);
}

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    isConnected = false;
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
    isConnected = false;
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});
process.on('SIGINT', async () => {
    console.log('\n⏹️ Shutting down gracefully...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
});

// Handle nodemon restart signal (SIGUSR2) to close DB cleanly before reload
process.once('SIGUSR2', async () => {
  console.log('\n🔄 Nodemon restart detected (SIGUSR2) - closing MongoDB connection...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed before restart');
  } catch (err) {
    console.error('❌ Error closing MongoDB during restart:', err);
  } finally {
    // Re-send SIGUSR2 to let nodemon proceed with restart
    process.kill(process.pid, 'SIGUSR2');
  }
});

// Handle SIGTERM (deployment platforms / process managers)
process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM - shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during SIGTERM shutdown:', err);
    process.exit(1);
  }
});

app.get("/", async (req, res) => {
  try {
    const { default: Student } = await import('./models/student.js');
    
    const students = await Student.find({}).lean();
    
    if (students.length === 0) {
      return res.send(`
        <html>
        <head>
          <title>Student Late Tracking - Backend API</title>
          <meta http-equiv="refresh" content="30">
          <style>body { font-family: Arial, sans-serif; margin: 20px; }</style>
        </head>
        <body>
        <h2>📚 Student Late Tracking System - Backend API</h2>
        <p><strong>Status:</strong> Running on port ${process.env.PORT || 5000}</p>
        <p><strong>Database:</strong> Connected to MongoDB</p>
        <p><strong>Students:</strong> No students found</p>
        <p style="color: #666; font-size: 0.9em; font-style: italic;">🔄 Auto-refreshes every 30 seconds</p>
        <hr>
        <h3>Available API Endpoints:</h3>
        <ul>
          <li><strong>POST</strong> /api/students/mark-late - Mark student late</li>
          <li><strong>GET</strong> /api/students/late-today - Get today's late students</li>
          <li><strong>GET</strong> /api/students/records/:period - Get attendance records</li>
          <li><strong>GET</strong> /health - Health check</li>
        </ul>
        <p><em>🕒 Last updated: ${new Date().toLocaleString()}</em></p>
        </body>
        </html>
      `);
    }

    // Generate HTML table with student data
    let html = `
      <html>
      <head>
        <title>Student Late Tracking - Backend API</title>
        <meta http-equiv="refresh" content="30">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { padding: 8px 12px; text-align: left; border: 1px solid #ddd; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .refresh-note { color: #666; font-size: 0.9em; font-style: italic; }
        </style>
      </head>
      <body>
      <h2>📚 Student Late Tracking System - Backend API</h2>
      <p><strong>Status:</strong> Running on port ${process.env.PORT || 5000}</p>
      <p><strong>Database:</strong> Connected to MongoDB</p>
      <p><strong>Total Students:</strong> ${students.length}</p>
      <p class="refresh-note">🔄 Auto-refreshes every 30 seconds</p>
      <hr>
      <h3>All Students Data:</h3>
      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Year</th>
            <th>Semester</th>
            <th>Late Days</th>
            <th>Status</th>
            <th>Fines (₹)</th>
            <th>Grace Used</th>
            <th>Last Late Date</th>
          </tr>
        </thead>
        <tbody>
    `;

    students.forEach(student => {
      const lastLateDate = student.lateLogs && student.lateLogs.length > 0 
        ? new Date(student.lateLogs[student.lateLogs.length - 1].date).toLocaleDateString()
        : 'Never';
      
      const statusColor = {
        'normal': '#28a745',
        'approaching_limit': '#ffc107',
        'grace_period': '#fd7e14', 
        'fined': '#dc3545'
      }[student.status] || '#6c757d';

      html += `
        <tr>
          <td><strong>${student.rollNo}</strong></td>
          <td>${student.name}</td>
          <td>${student.year}</td>
          <td>${student.semester}</td>
          <td>${student.lateDays}</td>
          <td style="color: ${statusColor}; font-weight: bold;">${student.status}</td>
          <td>${student.fines}</td>
          <td>${student.gracePeriodUsed}/4</td>
          <td>${lastLateDate}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      <hr>
      <h3>Available API Endpoints:</h3>
      <ul>
        <li><strong>POST</strong> /api/students/mark-late - Mark student late</li>
        <li><strong>GET</strong> /api/students/late-today - Get today's late students</li>
        <li><strong>GET</strong> /api/students/records/:period - Get attendance records</li>
        <li><strong>GET</strong> /api/students/system-stats - Get system statistics</li>
        <li><strong>POST</strong> /api/students/promote-semester - Promote all students</li>
        <li><strong>DELETE</strong> /api/students/remove-late-record - Remove specific late record</li>
        <li><strong>DELETE</strong> /api/students/student/:rollNo - Delete specific student</li>
        <li><strong>GET</strong> /health - Health check</li>
      </ul>
      <p><em>🕒 Last updated: ${new Date().toLocaleString()}</em></p>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    res.send(`
      <h2>📚 Student Late Tracking System - Backend API</h2>
      <p><strong>Status:</strong> Running on port ${process.env.PORT || 5000}</p>
      <p><strong>Database Error:</strong> ${err.message}</p>
      <p>Please check your MongoDB connection.</p>
    `);
  }
});

app.get("/health", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const health = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        state: dbStates[dbState],
        name: mongoose.connection.name || 'unknown'
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version
      }
    };

    if (dbState === 1) {
      const testQuery = await mongoose.connection.db.admin().ping();
      health.database.ping = testQuery.ok === 1 ? 'success' : 'failed';
    }

    res.status(dbState === 1 ? 200 : 503).json(health);
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// For Vercel serverless deployment, export the app
// For local development, start the server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Export for Vercel serverless
export default app;
