import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const facultySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Name is required"],
    trim: true 
  },
  branch: { 
    type: String, 
    required: [true, "Branch/Department is required"],
    trim: true,
    uppercase: true,
    enum: ['CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'ADMIN']
  },
  email: { 
    type: String, 
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        // Must end with @anits.edu.in
        return /^[a-z]+\.[a-z]+@anits\.edu\.in$/.test(email);
      },
      message: 'Email must be in format: name.branch@anits.edu.in'
    }
  },
  password: { 
    type: String, 
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  plaintextPassword: {
    type: String,
    select: false // Hidden by default for security
  },
  role: {
    type: String,
    enum: ['faculty', 'admin', 'superadmin'],
    default: 'faculty'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  passwordResetOTP: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
facultySchema.index({ branch: 1 });
facultySchema.index({ isActive: 1 });

// Hash password before saving
facultySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Store plaintext for admin viewing (security note: not best practice but required)
    this.plaintextPassword = this.password;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
facultySchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate OTP
facultySchema.methods.generatePasswordResetOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.passwordResetOTP = otp;
  // OTP expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return otp;
};

// Method to verify OTP
facultySchema.methods.verifyPasswordResetOTP = function(otp) {
  if (!this.passwordResetOTP || !this.passwordResetExpires) {
    return false;
  }
  
  if (Date.now() > this.passwordResetExpires) {
    return false; // OTP expired
  }
  
  return this.passwordResetOTP === otp;
};

export default mongoose.model("Faculty", facultySchema);
