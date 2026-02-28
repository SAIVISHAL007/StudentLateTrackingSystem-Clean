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
    markedByName: { type: String }, // Faculty name for quick access without populate
    markedByEmail: { type: String }, // Faculty email for transparency
    photo: String, // Base64 encoded photo or URL
    notes: String,
    editedAt: { type: Date }, // Track if/when entry was edited
    editedBy: { type: String }, // Who edited it
    isEdited: { type: Boolean, default: false } // Flag for edited entries
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

// PERFORMANCE: Optimized indexes for fast querying
// Single field indexes
studentSchema.index({ year: 1 });
studentSchema.index({ branch: 1 });
studentSchema.index({ section: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ lateDays: -1 }); // Descending for leaderboard queries
studentSchema.index({ fines: 1 }); // For fine-related queries
studentSchema.index({ createdAt: 1 });
studentSchema.index({ 'lateLogs.date': -1 }); // Descending for recent logs

// Compound indexes for common query patterns
studentSchema.index({ year: 1, branch: 1, section: 1 }); // Class filtering
studentSchema.index({ year: 1, semester: 1, branch: 1, section: 1 }); // Detailed filtering
studentSchema.index({ branch: 1, status: 1 }); // Branch-wise reports
studentSchema.index({ branch: 1, lateDays: -1 }); // Branch leaderboard
studentSchema.index({ status: 1, lateDays: -1 }); // Status-based sorting
studentSchema.index({ 'lateLogs.date': -1, rollNo: 1 }); // Date range queries with sorting
studentSchema.index({ fines: 1, status: 1 }); // Fine management
studentSchema.index({ 'lateLogs.date': -1, year: 1, branch: 1, section: 1 }); // Date-range + class filters

// Partial indexes for frequent selective queries
studentSchema.index(
  { fines: -1, rollNo: 1 },
  { partialFilterExpression: { fines: { $gt: 0 } } }
); // Fast pending-fines listing
studentSchema.index(
  { alertFaculty: 1, lateDays: -1 },
  { partialFilterExpression: { alertFaculty: true } }
); // Fast alert dashboards

// Text search index for name and roll number
studentSchema.index({ 
  name: 'text', 
  rollNo: 'text' 
}, {
  weights: { rollNo: 2, name: 1 },
  name: 'student_text_index'
});

export default mongoose.model("Student", studentSchema);
