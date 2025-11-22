import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1, max: 4 },
  semester: { type: Number, default: 1, min: 1, max: 8 },
  branch: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true,
    enum: ['CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']
  },
  section: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true,
    default: 'A'
  },
  lateDays: { type: Number, default: 0 },
  excuseDaysUsed: { type: Number, default: 0 }, // Tracks 2 excuse days
  fines: { type: Number, default: 0 },
  consecutiveLateDays: { type: Number, default: 0 }, // For tracking continuous late pattern
  lateLogs: [{ 
    date: { type: Date, default: Date.now },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    photo: String, // Base64 encoded photo or URL
    notes: String
  }],
  fineHistory: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    reason: String,
    paid: { type: Boolean, default: false },
    paidDate: Date
  }],
  limitExceeded: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['normal', 'approaching_limit', 'excused', 'fined', 'alert', 'graduated'], 
    default: 'normal' 
  },
  alertFaculty: { type: Boolean, default: false }, // Flag for continuous late pattern
  // New barcode field for ID scanning
  barcodeId: { type: String, unique: true, sparse: true, trim: true }
}, {
  timestamps: true
});

// Indexes for fast querying
studentSchema.index({ year: 1 });
studentSchema.index({ branch: 1 });
studentSchema.index({ section: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ lateDays: 1 });
studentSchema.index({ 'lateLogs.date': 1 });
studentSchema.index({ createdAt: 1 });
studentSchema.index({ year: 1, branch: 1, section: 1 }); // Compound index for filtering
studentSchema.index({ branch: 1, status: 1 }); // For branch-wise reports

studentSchema.index({ 
  name: 'text', 
  rollNo: 'text' 
}, {
  weights: { rollNo: 2, name: 1 },
  name: 'student_text_index'
});

export default mongoose.model("Student", studentSchema);
