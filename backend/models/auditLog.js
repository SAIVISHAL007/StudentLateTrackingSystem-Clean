import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'FACULTY_REGISTER',
      'FACULTY_LOGIN',
      'FACULTY_LOGOUT',
      'FACULTY_UPDATE',
      'ADMIN_PASSWORD_RESET',
      'PASSWORD_RESET_REQUEST',
      'PASSWORD_RESET_SUCCESS',
      'STUDENT_MARKED_LATE',
      'LATE_RECORD_REMOVED',
      'STUDENT_CREATED',
      'STUDENT_UPDATED',
      'STUDENT_DELETED',
      'SEMESTER_PROMOTION',
      'DATA_EXPORT',
      'FINE_APPLIED',
      'FINE_PAID',
      'SYSTEM_CONFIG_CHANGE'
    ]
  },
  performedBy: {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    facultyName: String,
    facultyEmail: String,
    actorRole: String // Role of the person performing the action
  },
  target: {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    facultyName: String,
    facultyEmail: String
  },
  targetStudent: {
    rollNo: String,
    name: String,
    branch: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible field for action-specific data
  },
  reason: String,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for querying
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ 'performedBy.facultyId': 1 });
auditLogSchema.index({ 'targetStudent.rollNo': 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
