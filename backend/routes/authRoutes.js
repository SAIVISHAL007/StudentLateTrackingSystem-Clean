import express from "express";
import jwt from "jsonwebtoken";
import Faculty from "../models/faculty.js";
import AuditLog from "../models/auditLog.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { logger } from "../middleware/logger.js";
import { 
  validate, 
  loginSchema, 
  registerFacultySchema, 
  forgotPasswordSchema 
} from "../validators/index.js";

const router = express.Router();

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token valid for 7 days

// Middleware to verify JWT token
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: "No authentication token provided" });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const faculty = await Faculty.findById(decoded.facultyId).select('-password');
    
    if (!faculty) {
      return res.status(401).json({ error: "Faculty not found" });
    }
    
    if (!faculty.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }
    
    req.faculty = faculty;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(500).json({ error: "Authentication error" });
  }
};

// Register new faculty (admin/superadmin only)
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const { name, branch, email, password } = req.body;
    
    // Validation
    if (!name || !branch || !email || !password) {
      return res.status(400).json({ 
        error: "All fields are required",
        required: ["name", "branch", "email", "password"]
      });
    }
    
    // Authorization: only admin or superadmin can create
    if (!['admin','superadmin'].includes(req.faculty.role)) {
      return res.status(403).json({ error: "Not authorized. Only admin/superadmin can register faculty." });
    }

    // Check if faculty already exists
    const existingFaculty = await Faculty.findOne({ email: email.toLowerCase() });
    if (existingFaculty) {
      return res.status(409).json({ error: "Faculty with this email already exists", existing: true });
    }
    
    // Create new faculty
    const faculty = new Faculty({
      name,
      branch: branch.toUpperCase(),
      email: email.toLowerCase(),
      password
    });
    
    await faculty.save();
    
    // Create audit log (actor is the admin performing registration)
    await AuditLog.create({
      action: 'FACULTY_REGISTER',
      performedBy: {
        facultyId: req.faculty._id,
        facultyName: req.faculty.name,
        facultyEmail: req.faculty.email,
        actorRole: req.faculty.role
      },
      target: {
        facultyId: faculty._id,
        facultyName: faculty.name,
        facultyEmail: faculty.email
      },
      details: { branch: faculty.branch },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // For security do not auto-login the newly created faculty (admin created). Return faculty summary only.
    res.status(201).json({
      message: "Faculty registered successfully",
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        branch: faculty.branch,
        role: faculty.role
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: "Validation error", details: messages });
    }
    
    res.status(500).json({ error: "Registration failed", details: error.message });
  }
});

// Update faculty details (admin/superadmin only). Cannot view or retrieve original password.
router.patch('/faculty/:id', authMiddleware, async (req, res) => {
  try {
    if (!['admin','superadmin'].includes(req.faculty.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { name, branch, role, isActive } = req.body;
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    const updates = {};
    if (name) updates.name = name.trim();
    if (branch) updates.branch = branch.toUpperCase();
    if (role && ['faculty','admin','superadmin'].includes(role)) updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    Object.assign(faculty, updates);
    await faculty.save();

    await AuditLog.create({
      action: 'FACULTY_UPDATE',
      performedBy: {
        facultyId: req.faculty._id,
        facultyName: req.faculty.name,
        facultyEmail: req.faculty.email,
        actorRole: req.faculty.role
      },
      target: {
        facultyId: faculty._id,
        facultyName: faculty.name,
        facultyEmail: faculty.email
      },
      details: updates,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'Faculty updated successfully',
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        branch: faculty.branch,
        role: faculty.role,
        isActive: faculty.isActive
      }
    });
  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({ error: 'Failed to update faculty', details: error.message });
  }
});

// Login faculty
router.post("/login", authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Find faculty by email
  const faculty = await Faculty.findOne({ email: email.toLowerCase() });
  if (!faculty) {
    logger.warn('Login failed: Faculty not found', { email, correlationId: req.correlationId });
    throw new AppError("Invalid email or password", 401, 'INVALID_CREDENTIALS');
  }
  
  // Check if account is active
  if (!faculty.isActive) {
    logger.warn('Login failed: Account deactivated', { email, correlationId: req.correlationId });
    throw new AppError("Account is deactivated. Contact administrator.", 403, 'ACCOUNT_DEACTIVATED');
  }
  
  // Verify password
  const isPasswordValid = await faculty.comparePassword(password);
  if (!isPasswordValid) {
    logger.warn('Login failed: Invalid password', { email, correlationId: req.correlationId });
    throw new AppError("Invalid email or password", 401, 'INVALID_CREDENTIALS');
  }
    
    // Update last login and login history
    faculty.lastLogin = new Date();
    faculty.loginHistory.push({
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Keep only last 10 login records
    if (faculty.loginHistory.length > 10) {
      faculty.loginHistory = faculty.loginHistory.slice(-10);
    }
    
  await faculty.save();
  
  // Create audit log
  await AuditLog.create({
    action: 'FACULTY_LOGIN',
    performedBy: {
      facultyId: faculty._id,
      facultyName: faculty.name,
      facultyEmail: faculty.email
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Generate JWT token
  // MULTI-SESSION SUPPORT: Each login creates a new independent token
  // Multiple devices/browsers can be logged in simultaneously
  // No token invalidation on new login - all sessions remain active until expiry
  const token = jwt.sign(
    { 
      facultyId: faculty._id, 
      email: faculty.email, 
      role: faculty.role,
      loginTime: Date.now() // Unique identifier for each session
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  logger.info('Login successful', { 
    email, 
    facultyId: faculty._id, 
    correlationId: req.correlationId 
  });
  
  res.json({
    message: "Login successful",
    token,
    faculty: {
      id: faculty._id,
      name: faculty.name,
      email: faculty.email,
      branch: faculty.branch,
      role: faculty.role,
      lastLogin: faculty.lastLogin
    }
  });
}));

// Request password reset OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Find faculty
    const faculty = await Faculty.findOne({ email: email.toLowerCase() });
    if (!faculty) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: "If an account with that email exists, an OTP has been sent." 
      });
    }
    
    // Generate OTP
    const otp = faculty.generatePasswordResetOTP();
    await faculty.save();
    
    // Send OTP via email (Email service not configured - OTP logged to console)
    try {
      console.log('🔑 PASSWORD RESET OTP:', {
        email: faculty.email,
        name: faculty.name,
        otp: otp,
        expiresIn: '10 minutes'
      });
      
      // Create audit log
      await AuditLog.create({
        action: 'PASSWORD_RESET_REQUEST',
        performedBy: {
          facultyId: faculty._id,
          facultyName: faculty.name,
          facultyEmail: faculty.email
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.json({ 
        message: "OTP generated. Check server console for OTP (Email service not configured).",
        email: faculty.email,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show OTP in development
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({ 
        error: "Failed to send OTP email. Please contact administrator.",
        details: "Email service configuration may be incorrect"
      });
    }
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: "Failed to process request", details: error.message });
  }
});

// Verify OTP and reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        error: "Email, OTP, and new password are required" 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }
    
    // Find faculty
    const faculty = await Faculty.findOne({ email: email.toLowerCase() });
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    
    // Verify OTP
    if (!faculty.verifyPasswordResetOTP(otp)) {
      return res.status(400).json({ 
        error: "Invalid or expired OTP. Please request a new one." 
      });
    }
    
    // Update password
    faculty.password = newPassword;
    faculty.passwordResetOTP = undefined;
    faculty.passwordResetExpires = undefined;
    await faculty.save();
    
    // Create audit log
    await AuditLog.create({
      action: 'PASSWORD_RESET_SUCCESS',
      performedBy: {
        facultyId: faculty._id,
        facultyName: faculty.name,
        facultyEmail: faculty.email
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ 
      message: "Password reset successful. You can now login with your new password." 
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: "Failed to reset password", details: error.message });
  }
});

// Get current faculty profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    res.json({
      faculty: {
        id: req.faculty._id,
        name: req.faculty.name,
        email: req.faculty.email,
        branch: req.faculty.branch,
        role: req.faculty.role,
        lastLogin: req.faculty.lastLogin,
        createdAt: req.faculty.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Logout (client-side handles token removal, but we log it)
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    // Create audit log
    await AuditLog.create({
      action: 'FACULTY_LOGOUT',
      performedBy: {
        facultyId: req.faculty._id,
        facultyName: req.faculty.name,
        facultyEmail: req.faculty.email
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// List faculty (admin/superadmin only) with optional search & role filter
router.get('/faculty', authMiddleware, async (req, res) => {
  try {
    if (!['admin','superadmin'].includes(req.faculty.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { search = '', role = 'all', page = 1, limit = 50 } = req.query;
    const q = {};
    if (search.trim()) {
      q.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    if (role !== 'all') q.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Faculty.find(q).select('name email branch role isActive createdAt lastLogin plaintextPassword').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Faculty.countDocuments(q)
    ]);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      items
    });
  } catch (error) {
    console.error('Faculty list error:', error);
    res.status(500).json({ error: 'Failed to list faculty', details: error.message });
  }
});

// Faculty detail (admin/superadmin only)
router.get('/faculty/:id', authMiddleware, async (req, res) => {
  try {
    if (!['admin','superadmin'].includes(req.faculty.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const faculty = await Faculty.findById(req.params.id).select('name email branch role isActive createdAt lastLogin loginHistory plaintextPassword').lean();
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    res.json({ faculty });
  } catch (error) {
    console.error('Faculty detail error:', error);
    res.status(500).json({ error: 'Failed to fetch faculty', details: error.message });
  }
});

// Admin reset another faculty password (force reset)
router.post('/faculty/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    if (!['admin','superadmin'].includes(req.faculty.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    faculty.password = newPassword;
    await faculty.save();
    await AuditLog.create({
      action: 'ADMIN_PASSWORD_RESET',
      performedBy: {
        facultyId: req.faculty._id,
        facultyName: req.faculty.name,
        facultyEmail: req.faculty.email,
        actorRole: req.faculty.role
      },
      target: {
        facultyId: faculty._id,
        facultyName: faculty.name,
        facultyEmail: faculty.email
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
});

export default router;
