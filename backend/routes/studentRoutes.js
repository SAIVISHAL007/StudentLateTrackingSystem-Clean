import express from "express";
import mongoose from "mongoose";
import Student from "../models/student.js";
import AuditLog from "../models/auditLog.js";
import { generateRemovalProof, generateAuditTrailPDF } from "../utils/pdfGenerator.js";

const router = express.Router();

const validateMarkLateData = (req, res, next) => {
  const { rollNo, name, year, branch, section } = req.body;
  
  if (!rollNo) {
    return res.status(400).json({ 
      error: "Roll number is required",
      required: ["rollNo"]
    });
  }
  
  if (typeof rollNo !== 'string' || rollNo.trim().length === 0) {
    return res.status(400).json({ 
      error: "Roll number must be a non-empty string" 
    });
  }
  
  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ 
      error: "Name must be a non-empty string if provided" 
    });
  }
  
  if (year !== undefined && (!Number.isInteger(year) || year < 1 || year > 4)) {
    return res.status(400).json({ 
      error: "Year must be an integer between 1 and 4 if provided" 
    });
  }
  
  if (branch !== undefined) {
    const validBranches = ['CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
    if (!validBranches.includes(branch.toUpperCase())) {
      return res.status(400).json({ 
        error: "Invalid branch. Must be one of: " + validBranches.join(', ')
      });
    }
  }
  
  if (section !== undefined && (typeof section !== 'string' || section.trim().length === 0)) {
    return res.status(400).json({ 
      error: "Section must be a non-empty string if provided" 
    });
  }
  
  next();
};
const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: "Database connection unavailable",
      details: "Please try again in a moment"
    });
  }
  next();
};


// Mark student late
router.post("/mark-late", checkDbConnection, validateMarkLateData, async (req, res) => {
  try {
    const { rollNo, name, year, semester, branch, section } = req.body;

    // Check if student exists
    let student = await Student.findOne({ rollNo });

    if (!student) {
      // For new students, all fields are required
      if (!name || !year || !branch || !section) {
        return res.status(400).json({ 
          error: "New student detected. Name, year, branch, and section are required for first-time registration.",
          required: ["name", "year", "branch", "section"],
          rollNo: rollNo
        });
      }
      
      // Calculate semester if not provided (default to first semester of the year)
      let studentSemester = semester;
      if (!studentSemester) {
        // Auto-calculate: Year 1 → Sem 1, Year 2 → Sem 3, Year 3 → Sem 5, Year 4 → Sem 7
        studentSemester = (year * 2) - 1;
      }
      
      // Create new student
      student = new Student({ 
        rollNo, 
        name, 
        year,
        semester: studentSemester,
        branch: branch.toUpperCase(),
        section: section.toUpperCase()
      });
    } else {
      // For existing students without semester, calculate and set it
      if (!student.semester) {
        student.semester = (student.year * 2) - 1; // Default to first semester of their year
      }
      // For existing students, use stored data

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alreadyMarkedToday = (student.lateLogs || []).some(log => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      });

      if (alreadyMarkedToday) {
        return res.status(400).json({
          error: "Already marked late today",
          message: "Already marked late today.",
          student: {
            rollNo: student.rollNo,
            name: student.name,
            lateDays: student.lateDays
          }
        });
      }
    }

    // Increment lateDays and add log
    student.lateDays += 1;
    student.lateLogs.push({ date: new Date() });

    // UNIFIED FINE STRUCTURE (NEW):
    // - Days 1-2: Excuse days (no fine) ₹0
    // - Days 3+: ₹5 per day (uniform rate)
    
    const EXCUSE_DAYS = 2;
    const FINE_PER_DAY = 5; // ₹5 per late day after excuse period
    let fineAmount = 0;
    let statusMessage = "";
    let alertType = "success";

    if (student.lateDays <= EXCUSE_DAYS) {
      // Excuse period - no fines
      student.excuseDaysUsed = student.lateDays;
      student.status = 'excused';
      const remainingExcuse = EXCUSE_DAYS - student.lateDays;
      statusMessage = `${student.name} marked late. (Excuse day ${student.lateDays}/${EXCUSE_DAYS} used)`;
      if (remainingExcuse > 0) {
        statusMessage += ` - ${remainingExcuse} excuse day(s) remaining.`;
      } else {
        statusMessage += ` - No more excuse days. Next late will incur fine.`;
        alertType = "warning";
      }
    } else {
      // Calculate fine based on unified model: ₹5 per day after excuse period
      fineAmount = FINE_PER_DAY;
      
      // Add fine to student's total
      student.fines += fineAmount;
      student.status = 'fined';
      student.alertFaculty = student.lateDays > 5;
      student.consecutiveLateDays = student.lateDays - EXCUSE_DAYS;
      
      student.fineHistory.push({
        amount: fineAmount,
        date: new Date(),
        reason: `Late day #${student.lateDays} - Day ${student.lateDays - EXCUSE_DAYS} after excuse period (₹${FINE_PER_DAY}/day)`
      });
      
      statusMessage = `Fine applied: ${student.name} charged ₹${fineAmount}. (Day ${student.lateDays - EXCUSE_DAYS} after excuse) - Total fines: ₹${student.fines}`;
      
      if (student.alertFaculty) {
        statusMessage += ` - Alert faculty.`;
      }
      
      alertType = "error";
    }

    await student.save({ 
      timeout: 10000,
      writeConcern: { w: 'majority', j: true }
    });
    
    res.json({
      ...student._doc,
      message: statusMessage,
      alertType: alertType,
      fineAmount: fineAmount,
      totalFines: student.fines,
      excuseDaysRemaining: Math.max(0, EXCUSE_DAYS - student.excuseDaysUsed)
    });

  } catch (err) {
    console.error('❌ Error marking student late:', err);
    
    if (err.name === 'ValidationError') {
      res.status(400).json({ 
        error: "Invalid student data",
        details: Object.values(err.errors).map(e => e.message)
      });
    } else if (err.code === 11000) {
      res.status(409).json({ 
        error: "Student with this roll number already exists with different data"
      });
    } else if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
      res.status(503).json({ 
        error: "Database timeout. Please try again.",
        details: "The operation took too long to complete"
      });
    } else {
      res.status(500).json({ 
        error: "Failed to mark student late",
        details: err.message 
      });
    }
  }
});

// ========================================

// Get students who were late today (with pagination support)
router.get("/late-today", checkDbConnection, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Default 50 students per page
    const skip = (page - 1) * limit;
    
    // Find students with late logs from today with optimized query and pagination
    const students = await Student.find({
      "lateLogs.date": {
        $gte: today,
        $lt: tomorrow
      }
    })
    .select("rollNo name year semester branch section lateDays lateLogs status excuseDaysUsed fines limitExceeded alertFaculty consecutiveLateDays")
    .sort({ lateDays: -1, rollNo: 1 }) // Sort by late days desc, then roll number
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean for better performance
    
    // Get total count for pagination
    const totalCount = await Student.countDocuments({
      "lateLogs.date": {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    // Filter to show only today's logs
    const studentsWithTodayLogs = students.map(student => ({
      ...student,
      lateLogs: student.lateLogs.filter(log => 
        log.date >= today && log.date < tomorrow
      )
    }));
    
    res.json({
      date: today.toDateString(),
      count: studentsWithTodayLogs.length,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
      students: studentsWithTodayLogs
    });
  } catch (err) {
    console.error('❌ Error fetching late today:', err);
    
    if (err.name === 'MongooseError' && err.message.includes('timed out')) {
      res.status(503).json({ 
        error: "Database query timeout. Please try again.",
        details: "The query took too long to complete"
      });
    } else {
      res.status(500).json({ 
        error: "Failed to fetch today's late students",
        details: err.message 
      });
    }
  }
});

// Search students (optimized with text index)
// Get all students (for admin management)
router.get("/all", checkDbConnection, async (req, res) => {
  try {
    const { year, page, limit } = req.query;
    let query = {};
    
    if (year && year !== 'all') {
      query.year = parseInt(year);
    }
    
    const baseQuery = Student.find(query)
      .select("rollNo name year semester branch section lateDays status fines")
      .sort({ year: 1, semester: 1, section: 1, rollNo: 1 })
      .lean();

    const shouldPaginate = page !== undefined || limit !== undefined;

    if (!shouldPaginate) {
      const students = await baseQuery;
      return res.json({ students, totalCount: students.length });
    }

    const pageNum = Math.max(parseInt(page || "1", 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit || "50", 10), 1), 200);
    const skip = (pageNum - 1) * limitNum;

    const [students, totalCount] = await Promise.all([
      baseQuery.skip(skip).limit(limitNum),
      Student.countDocuments(query)
    ]);

    return res.json({
      students,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum)
    });
  } catch (err) {
    console.error('❌ Get all students error:', err);
    res.status(500).json({ 
      error: "Failed to fetch students", 
      details: err.message 
    });
  }
});

router.get("/search", checkDbConnection, async (req, res) => {
  try {
    const { q, year, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: "Search query must be at least 2 characters long" 
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};
    
    // Build search query
    if (q) {
      // Use text search if available, otherwise use regex
      query.$or = [
        { rollNo: { $regex: q.trim(), $options: 'i' } },
        { name: { $regex: q.trim(), $options: 'i' } }
      ];
    }
    
    // Add year filter if specified
    if (year && year !== 'all') {
      query.year = parseInt(year);
    }
    
    const students = await Student.find(query)
      .select("rollNo name year branch section lateDays status fines limitExceeded excuseDaysUsed alertFaculty")
      .sort({ lateDays: -1, rollNo: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const totalCount = await Student.countDocuments(query);
    
    res.json({
      query: q,
      year: year || 'all',
      page: parseInt(page),
      limit: parseInt(limit),
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      students
    });
  } catch (err) {
    console.error('❌ Search error:', err);
    res.status(500).json({ 
      error: "Search failed", 
      details: err.message 
    });
  }
});

// Get all students with pending fines
router.get("/with-fines", checkDbConnection, async (req, res) => {
  try {
    const students = await Student.find({
      fines: { $gt: 0 }
    })
    .select("rollNo name year branch section fines lateDays status")
    .sort({ fines: -1, rollNo: 1 })
    .lean();
    
    res.json({
      count: students.length,
      totalFines: students.reduce((sum, s) => sum + s.fines, 0),
      students
    });
  } catch (err) {
    console.error('❌ Error fetching students with fines:', err);
    res.status(500).json({ 
      error: "Failed to fetch students with fines", 
      details: err.message 
    });
  }
});

// Pay/Clear fine for a student
router.post("/pay-fine", checkDbConnection, async (req, res) => {
  try {
    const { rollNo, amount, paidBy } = req.body;

    if (!rollNo) {
      return res.status(400).json({ error: "Roll number is required" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid payment amount is required" });
    }

    const student = await Student.findOne({ rollNo });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (student.fines === 0) {
      return res.status(400).json({ error: "Student has no pending fines" });
    }

    if (amount > student.fines) {
      return res.status(400).json({ 
        error: `Payment amount (₹${amount}) exceeds total fines (₹${student.fines})` 
      });
    }

    // Deduct the payment from fines
    const previousFines = student.fines;
    student.fines -= amount;

    // Mark unpaid fines as paid (oldest first)
    let remainingPayment = amount;
    for (let fine of student.fineHistory) {
      if (!fine.paid && remainingPayment > 0) {
        if (remainingPayment >= fine.amount) {
          fine.paid = true;
          fine.paidDate = new Date();
          remainingPayment -= fine.amount;
        }
      }
    }

    // Add payment record to fine history
    student.fineHistory.push({
      amount: -amount, // Negative amount indicates payment
      date: new Date(),
      reason: `Fine payment${paidBy ? ` by ${paidBy}` : ''}`,
      paid: true,
      paidDate: new Date()
    });

    // Update status if all fines are paid
    if (student.fines === 0) {
      student.status = student.lateDays <= 2 ? 'excused' : 'normal';
      student.alertFaculty = false;
    }

    await student.save();

    res.json({
      success: true,
      message: `✅ Payment of ₹${amount} recorded successfully!`,
      student: {
        rollNo: student.rollNo,
        name: student.name,
        previousFines: previousFines,
        paidAmount: amount,
        remainingFines: student.fines,
        status: student.status
      }
    });

  } catch (err) {
    console.error('❌ Error processing fine payment:', err);
    res.status(500).json({ 
      error: "Failed to process payment", 
      details: err.message 
    });
  }
});

// Get records by time period (weekly, monthly, semester)
router.get("/records/:period", async (req, res) => {
  try {
    const { period } = req.params;
    const { page, limit } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "semester":
        // Assuming semester starts in January or August
        const currentMonth = now.getMonth();
        if (currentMonth >= 7) { // August-December (Fall semester)
          startDate = new Date(now.getFullYear(), 7, 1); // August 1st
        } else { // January-July (Spring semester)
          startDate = new Date(now.getFullYear(), 0, 1); // January 1st
        }
        break;
      default:
        return res.status(400).json({ error: "Invalid period. Use weekly, monthly, or semester" });
    }

    // Find students with late logs in the specified period
    const students = await Student.find({
      "lateLogs.date": {
        $gte: startDate,
        $lte: now
      }
    })
    .select("rollNo name year semester branch section lateDays lateLogs fines status excuseDaysUsed limitExceeded alertFaculty consecutiveLateDays")
    .lean();

    // Filter late logs to only include those in the period
    const studentsWithFilteredLogs = students.map(student => ({
      ...student,
      lateLogs: student.lateLogs.filter(log => 
        log.date >= startDate && log.date <= now
      ),
      lateCountInPeriod: student.lateLogs.filter(log => 
        log.date >= startDate && log.date <= now
      ).length
    })).filter(student => student.lateCountInPeriod > 0);

    const shouldPaginate = page !== undefined || limit !== undefined;
    if (!shouldPaginate) {
      return res.json({
        period,
        startDate,
        endDate: now,
        students: studentsWithFilteredLogs,
        totalRecords: studentsWithFilteredLogs.length
      });
    }

    const pageNum = Math.max(parseInt(page || "1", 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit || "50", 10), 1), 200);
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paged = studentsWithFilteredLogs.slice(start, end);

    return res.json({
      period,
      startDate,
      endDate: now,
      students: paged,
      totalRecords: studentsWithFilteredLogs.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(studentsWithFilteredLogs.length / limitNum)
    });
  } catch (err) {
    console.error('❌ Error fetching records:', err);
    res.status(500).json({ error: err.message });
  }
});

// ADMIN/MANAGEMENT ENDPOINTS

// Promote all students to next semester (resets late data)
router.post("/promote-semester", async (req, res) => {
  try {
    // Get configuration from request body (optional - allows different promotion rules per batch)
    const { 
      specificYear = null,  // null = promote all, or specify 1/2/3/4
      specificBranch = null, // null = all branches, or specify branch
      graduateYear4Sem8 = true // Whether to mark Y4S8 students as graduated
    } = req.body;

    // Build filter
    const filter = {};
    if (specificYear) filter.year = specificYear;
    if (specificBranch) filter.branch = specificBranch.toUpperCase();
    
    // First check if there are any students to promote
    const studentCount = await Student.countDocuments(filter);
    
    if (studentCount === 0) {
      return res.status(404).json({ 
        error: "No students found to promote",
        studentsPromoted: 0 
      });
    }

    // Fetch all students to promote (we need to calculate year changes individually)
    const students = await Student.find(filter).select('rollNo year semester').lean();
    
    let promotedCount = 0;
    let graduatedCount = 0;
    let yearChangedCount = 0;
    const promotionDetails = [];

    // Process each student
    for (const student of students) {
      const currentSemester = student.semester || 1;
      const currentYear = student.year;
      const newSemester = currentSemester + 1;
      
      // Calculate new year based on NEW semester after promotion
      // Year 1: Semesters 1-2
      // Year 2: Semesters 3-4
      // Year 3: Semesters 5-6
      // Year 4: Semesters 7-8
      // Example: Y3S6 → S7 → Y4 (correct!)
      let newYear = currentYear;
      if (newSemester >= 7) newYear = 4;
      else if (newSemester >= 5) newYear = 3;
      else if (newSemester >= 3) newYear = 2;
      else newYear = 1;

      const yearChanged = newYear !== currentYear;
      if (yearChanged) yearChangedCount++;

      // Check if student is graduating (Year 4, moving to Semester 9)
      if (currentYear === 4 && currentSemester >= 8 && graduateYear4Sem8) {
        // Mark as graduated (or you could delete, or move to alumni collection)
        await Student.updateOne(
          { rollNo: student.rollNo },
          {
            $set: {
              semester: 8, // Keep at 8 (max)
              year: 4, // Keep at 4 (max)
              status: 'graduated',
              lateDays: 0,
              excuseDaysUsed: 0,
              consecutiveLateDays: 0,
              fines: 0,
              limitExceeded: false,
              alertFaculty: false,
              lateLogs: [],
              fineHistory: []
            }
          }
        );
        graduatedCount++;
        promotionDetails.push({
          rollNo: student.rollNo,
          action: 'graduated',
          from: `Y${currentYear}S${currentSemester}`,
          to: 'Graduated'
        });
      } else {
        // Regular promotion
        await Student.updateOne(
          { rollNo: student.rollNo },
          {
            $set: {
              semester: Math.min(newSemester, 8), // Cap at semester 8
              year: newYear,
              lateDays: 0,
              excuseDaysUsed: 0,
              consecutiveLateDays: 0,
              fines: 0,
              limitExceeded: false,
              status: 'normal',
              alertFaculty: false,
              lateLogs: [],
              fineHistory: []
            }
          }
        );
        promotedCount++;
        promotionDetails.push({
          rollNo: student.rollNo,
          action: 'promoted',
          from: `Y${currentYear}S${currentSemester}`,
          to: `Y${newYear}S${Math.min(newSemester, 8)}`,
          yearChanged
        });
      }
    }

    res.json({
      message: `Successfully promoted ${promotedCount} students${graduatedCount > 0 ? ` and graduated ${graduatedCount} students` : ''}!`,
      studentsPromoted: promotedCount,
      studentsGraduated: graduatedCount,
      yearTransitions: yearChangedCount,
      totalStudents: studentCount,
      details: promotionDetails.length <= 100 ? promotionDetails : { 
        note: 'Too many students to show details',
        sample: promotionDetails.slice(0, 10)
      }
    });
  } catch (err) {
    console.error('❌ Semester promotion error:', err);
    if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
      res.status(503).json({ 
        error: "Database connection timeout. Please check your connection and try again.",
        details: "The operation took too long to complete. This might be due to network issues."
      });
    } else {
      res.status(500).json({ 
        error: "Failed to promote students",
        details: err.message 
      });
    }
  }
});

// Demote students to previous semester (to fix accidental promotions)
router.post("/demote-semester", async (req, res) => {
  try {
    const { 
      currentYear = null,     // Year to find students in (e.g., 4)
      currentSemester = null, // Semester to find students in (e.g., 7)
      targetYear = null,      // Year to demote to (e.g., 2)
      targetSemester = null,  // Semester to demote to (e.g., 4)
      rollNumbers = []        // Optional: specific roll numbers to demote
    } = req.body;

    if (!targetYear || !targetSemester) {
      return res.status(400).json({ 
        error: "Target year and semester are required",
        example: { targetYear: 2, targetSemester: 4 }
      });
    }

    // Build filter - find students to demote
    let filter = {};
    if (currentYear) filter.year = currentYear;
    if (currentSemester) filter.semester = currentSemester;
    if (rollNumbers.length > 0) filter.rollNo = { $in: rollNumbers };

    // Check if there are students matching criteria
    const studentCount = await Student.countDocuments(filter);
    
    if (studentCount === 0) {
      return res.status(404).json({ 
        error: "No students found matching criteria",
        filter: filter,
        studentsAftered: 0 
      });
    }

    // Fetch students to demote
    const students = await Student.find(filter).select('rollNo year semester').lean();
    
    let demotedCount = 0;
    const demotionDetails = [];

    // Process each student
    for (const student of students) {
      const fromYear = student.year;
      const fromSemester = student.semester;

      // Update to target semester/year
      await Student.updateOne(
        { rollNo: student.rollNo },
        {
          $set: {
            semester: targetSemester,
            year: targetYear,
            // Keep status as-is to preserve historical context
            // But reset current semester flags
            limitExceeded: false,
            alertFaculty: false
          }
        }
      );
      
      demotedCount++;
      demotionDetails.push({
        rollNo: student.rollNo,
        action: 'demoted',
        from: `Y${fromYear}S${fromSemester}`,
        to: `Y${targetYear}S${targetSemester}`
      });
    }

    res.json({
      message: `Successfully demoted ${demotedCount} students to Y${targetYear}S${targetSemester}!`,
      studentsDemoted: demotedCount,
      totalAffected: studentCount,
      details: demotionDetails.length <= 100 ? demotionDetails : { 
        note: 'Too many students to show details',
        sample: demotionDetails.slice(0, 10)
      }
    });
  } catch (err) {
    console.error('❌ Semester demotion error:', err);
    res.status(500).json({ 
      error: "Failed to demote students",
      details: err.message 
    });
  }
});

// Reset all student data (for prototype testing)
router.post("/reset-all-data", async (req, res) => {
  try {
    // Check if there are students to reset
    const studentCount = await Student.countDocuments();
    
    if (studentCount === 0) {
      return res.status(404).json({ 
        error: "No students found to reset",
        studentsReset: 0 
      });
    }

    const result = await Student.updateMany(
      {},
      {
        $set: {
          lateDays: 0,
          excuseDaysUsed: 0,
          consecutiveLateDays: 0,
          fines: 0,
          limitExceeded: false,
          status: 'normal',
          alertFaculty: false,
          lateLogs: [],
          fineHistory: []
        }
      },
      { 
        timeout: 30000, // 30 second timeout
        writeConcern: { w: 'majority', j: true }
      }
    );

    res.json({
      message: `Successfully reset data for ${result.modifiedCount} students!`,
      studentsReset: result.modifiedCount,
      totalStudents: studentCount
    });
  } catch (err) {
    console.error('❌ Data reset error:', err);
    if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
      res.status(503).json({ 
        error: "Database connection timeout. Please check your connection and try again.",
        details: "The reset operation took too long to complete."
      });
    } else {
      res.status(500).json({ 
        error: "Failed to reset student data",
        details: err.message 
      });
    }
  }
});

// Delete a specific student
router.delete("/student/:rollNo", async (req, res) => {
  try {
    const { rollNo } = req.params;
    const deletedStudent = await Student.findOneAndDelete({ rollNo });

    if (!deletedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      message: `Successfully deleted student ${deletedStudent.name} (${rollNo})`,
      deletedStudent: {
        rollNo: deletedStudent.rollNo,
        name: deletedStudent.name,
        year: deletedStudent.year
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific student (details + late logs + fines summary)
router.get("/student/:rollNo", checkDbConnection, async (req, res) => {
  try {
    const { rollNo } = req.params;
    const student = await Student.findOne({ rollNo }).lean();

    if (!student) {
      return res.status(404).json({ error: "Student not found", rollNo });
    }

    // Sort late logs descending by date for UI convenience
    const sortedLogs = (student.lateLogs || []).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      rollNo: student.rollNo,
      name: student.name,
      year: student.year,
      semester: student.semester,
      branch: student.branch,
      section: student.section,
      lateDays: student.lateDays,
      fines: student.fines,
      status: student.status,
      excuseDaysUsed: student.excuseDaysUsed,
      consecutiveLateDays: student.consecutiveLateDays,
      alertFaculty: student.alertFaculty,
      lateLogs: sortedLogs,
      fineHistoryCount: (student.fineHistory || []).length
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch student", details: err.message });
  }
});

// Delete all students (complete reset for prototype)
router.delete("/delete-all-students", async (req, res) => {
  try {
    const result = await Student.deleteMany({});

    res.json({
      message: `Successfully deleted ${result.deletedCount} students from database!`,
      studentsDeleted: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Health check
router.get("/health", checkDbConnection, async (req, res) => {
  try {
    // Test database connectivity with a simple query
    const testCount = await Student.countDocuments().timeout(5000);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      totalStudents: testCount,
      message: 'Student API is running normally'
    });
  } catch (err) {
    console.error('❌ Health check failed:', err);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: err.message
    });
  }
});

// Get system statistics  
router.get("/system-stats", checkDbConnection, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const studentsWithLateRecords = await Student.countDocuments({ lateDays: { $gt: 0 } });
    const studentsWithExcuses = await Student.countDocuments({ status: 'excused' });
    const studentsBeingFined = await Student.countDocuments({ status: 'fined' });
    const studentsWithAlerts = await Student.countDocuments({ alertFaculty: true });
    const totalFinesCollected = await Student.aggregate([
      { $group: { _id: null, total: { $sum: "$fines" } } }
    ]);

    const yearDistribution = await Student.aggregate([
      { $group: { _id: "$year", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const branchDistribution = await Student.aggregate([
      { $group: { _id: "$branch", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalStudents,
      studentsWithLateRecords,
      studentsWithExcuses,
      studentsBeingFined,
      studentsWithAlerts,
      totalFinesCollected: totalFinesCollected[0]?.total || 0,
      yearDistribution,
      branchDistribution
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete specific late record for a student on a particular date
router.delete("/remove-late-record", checkDbConnection, async (req, res) => {
  try {
    const { rollNo, date, reason, authorizedBy } = req.body;

    // Validation
    if (!rollNo || !date || !reason || !authorizedBy) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["rollNo", "date", "reason", "authorizedBy"]
      });
    }

    // Find the student
    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res.status(404).json({ 
        error: "Student not found",
        rollNo: rollNo 
      });
    }

    // Parse the date to match (start and end of day)
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find late logs for that specific date
    const matchingLogs = student.lateLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startOfDay && logDate <= endOfDay;
    });

    if (matchingLogs.length === 0) {
      return res.status(404).json({ 
        error: "No late record found for the specified date",
        rollNo: rollNo,
        date: targetDate.toDateString()
      });
    }

    // Store original values for rollback calculation
    const originalLateDays = student.lateDays;
    const originalFines = student.fines;
    const originalStatus = student.status;

    // Remove the late logs for that date
    student.lateLogs = student.lateLogs.filter(log => {
      const logDate = new Date(log.date);
      return !(logDate >= startOfDay && logDate <= endOfDay);
    });

    // Recalculate student stats based on remaining logs
    const newLateDays = student.lateLogs.length;
    student.lateDays = newLateDays;

    // Recalculate status and fines based on UNIFIED fine structure
    // Days 1-2: Excuse days (₹0), Days 3+: ₹5 per day
    const EXCUSE_DAYS = 2;
    const FINE_PER_DAY = 5;

    // Reset all calculated fields
    student.fines = 0;
    student.excuseDaysUsed = 0;
    student.consecutiveLateDays = 0;
    student.limitExceeded = false;
    student.alertFaculty = false;
    student.fineHistory = [];

    if (newLateDays <= EXCUSE_DAYS) {
      // Still in excuse period
      student.excuseDaysUsed = newLateDays;
      student.status = 'excused';
    } else {
      // Calculate fines based on unified structure: ₹5 per day after excuse period
      student.excuseDaysUsed = EXCUSE_DAYS;
      student.status = 'fined';
      student.consecutiveLateDays = newLateDays - EXCUSE_DAYS;
      
      // Recalculate total fines: ₹5 per day after excuse period
      const daysAfterExcuse = newLateDays - EXCUSE_DAYS;
      student.fines = daysAfterExcuse * FINE_PER_DAY; // Simple: ₹5 × number of days after excuse
      
      // Also populate fineHistory for transparency
      for (let day = 3; day <= newLateDays; day++) {
        student.fineHistory.push({
          amount: FINE_PER_DAY,
          date: new Date(),
          reason: `Late day #${day} - Day ${day - EXCUSE_DAYS} after excuse period (₹${FINE_PER_DAY}/day)`
        });
      }
      
      if (newLateDays >= 5) {
        student.alertFaculty = true;
      }
    }

    // Save the updated student record
    await student.save({
      timeout: 10000,
      writeConcern: { w: 'majority', j: true }
    });

    // Create audit log entry
    const auditInfo = {
      action: 'LATE_RECORD_REMOVED',
      rollNo: rollNo,
      studentName: student.name,
      date: targetDate.toDateString(),
      reason: reason,
      authorizedBy: authorizedBy,
      timestamp: new Date(),
      recordsRemoved: matchingLogs.length,
      changes: {
        lateDays: { from: originalLateDays, to: newLateDays },
        fines: { from: originalFines, to: student.fines },
        status: { from: originalStatus, to: student.status }
      }
    };

    res.json({
      message: `Successfully removed ${matchingLogs.length} late record(s) for ${student.name} on ${targetDate.toDateString()}`,
      student: {
        rollNo: student.rollNo,
        name: student.name,
        lateDays: student.lateDays,
        status: student.status,
        fines: student.fines
      },
      removedRecords: {
        count: matchingLogs.length,
        date: targetDate.toDateString()
      },
      changes: {
        lateDaysChange: originalLateDays - newLateDays,
        finesChange: originalFines - student.fines,
        statusChange: originalStatus !== student.status
      },
      auditInfo: {
        reason: reason,
        authorizedBy: authorizedBy,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('❌ Error removing late record:', err);
    
    if (err.name === 'ValidationError') {
      res.status(400).json({ 
        error: "Invalid data provided",
        details: Object.values(err.errors).map(e => e.message)
      });
    } else if (err.name === 'MongooseError' && err.message.includes('timed out')) {
      res.status(503).json({ 
        error: "Database timeout. Please try again.",
        details: "The operation took too long to complete"
      });
    } else {
      res.status(500).json({ 
        error: "Failed to remove late record",
        details: err.message 
      });
    }
  }
});

// Bulk remove late records: accepts array of { rollNo, date, reason, authorizedBy }
router.post('/bulk-remove-late-records', checkDbConnection, async (req, res) => {
  try {
    const { records, reason, authorizedBy } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array required' });
    }
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'Reason must be at least 10 characters' });
    }
    if (!authorizedBy || !authorizedBy.trim()) {
      return res.status(400).json({ error: 'authorizedBy required' });
    }

    const summary = {
      totalRequested: records.length,
      processed: 0,
      removedCount: 0,
      affectedStudents: new Set(),
      fineReductionTotal: 0,
      failures: [],
      auditLogs: [] // Track audit logs to create
    };

    // Group records by rollNo for efficiency
    const groups = records.reduce((acc, r) => {
      if (!r.rollNo || !r.date) return acc;
      acc[r.rollNo] = acc[r.rollNo] || [];
      acc[r.rollNo].push(r.date);
      return acc;
    }, {});

    for (const [rollNo, dates] of Object.entries(groups)) {
      const student = await Student.findOne({ rollNo });
      if (!student) {
        dates.forEach(d => summary.failures.push({ rollNo, date: d, error: 'Student not found' }));
        continue;
      }
      summary.affectedStudents.add(rollNo);
      const originalLateDays = student.lateDays;
      const originalFines = student.fines;
      const originalStatus = student.status;

      // Remove matching logs
      const targetDates = dates.map(d => new Date(d).toDateString());
      const beforeLogs = student.lateLogs.length;
      student.lateLogs = student.lateLogs.filter(l => !targetDates.includes(new Date(l.date).toDateString()));
      const removedForStudent = beforeLogs - student.lateLogs.length;
      summary.removedCount += removedForStudent;
      summary.processed += dates.length;

      if (removedForStudent === 0) {
        dates.forEach(d => summary.failures.push({ rollNo, date: d, error: 'No matching record' }));
        continue;
      }

      // Recalculate lateDays
      student.lateDays = student.lateLogs.length;

      // Recalculate status based on valid enum values: 'normal', 'approaching_limit', 'excused', 'fined', 'alert', 'graduated'
      const EXCUSE_DAYS = 2;
      if (student.lateDays === 0) {
        student.status = 'normal';
        student.excuseDaysUsed = 0;
        student.consecutiveLateDays = 0;
        student.alertFaculty = false;
      } else if (student.lateDays <= EXCUSE_DAYS) {
        student.status = 'excused';
        student.excuseDaysUsed = student.lateDays;
      } else {
        student.status = 'fined';
        student.excuseDaysUsed = EXCUSE_DAYS;
        student.consecutiveLateDays = student.lateDays - EXCUSE_DAYS;
        if (student.lateDays >= 8) {
          student.status = 'alert';
          student.alertFaculty = true;
        } else if (student.lateDays >= 7) {
          student.status = 'approaching_limit';
        }
      }

      // Recalculate fines using existing logic (replicating fine calculation pattern)
      let newFines = 0;
      const dayCount = student.lateDays;
      for (let day = 1; day <= dayCount; day++) {
        if (day <= 2) continue; // excuse days
        if (day <= 5) newFines += 3; // days 3-5
        else {
          // Cycle increments every 3 days after day 5, pattern of +5 every 3 days
          const extraGroupIndex = Math.floor((day - 6) / 3); // 0-based
          // Each full group adds 5
          newFines += 5 * (extraGroupIndex + 1);
        }
      }
      summary.fineReductionTotal += Math.max(0, originalFines - newFines);
      student.fines = newFines;

      await student.save();

      // Create audit log for this removal
      const auditEntry = new AuditLog({
        action: 'LATE_RECORD_REMOVED',
        performedBy: {
          facultyEmail: req.body.authorizedByEmail || 'unknown',
          facultyName: req.body.authorizedBy || 'unknown',
          actorRole: req.body.authorizedByRole || 'faculty'
        },
        targetStudent: {
          rollNo: student.rollNo,
          name: student.name,
          branch: student.branch
        },
        details: {
          recordsRemoved: removedForStudent,
          removedDates: dates,
          changes: {
            lateDays: { from: originalLateDays, to: student.lateDays },
            fines: { from: originalFines, to: student.fines },
            status: { from: originalStatus, to: student.status }
          }
        },
        reason: reason,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        timestamp: new Date()
      });
      
      await auditEntry.save();
      summary.auditLogs.push(auditEntry._id);
    }

    res.json({
      message: 'Bulk removal processed',
      summary: {
        totalRequested: summary.totalRequested,
        processed: summary.processed,
        removedRecords: summary.removedCount,
        affectedStudents: summary.affectedStudents.size,
        fineReductionTotal: summary.fineReductionTotal,
        failures: summary.failures
      },
      audit: { reason, authorizedBy, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('❌ Bulk remove error:', error);
    res.status(500).json({ error: 'Bulk removal failed', details: error.message, stack: error.stack });
  }
});

  // Analytics - Leaderboard
  router.get("/analytics/leaderboard", checkDbConnection, async (req, res) => {
    try {
      // Most Late Students (top 10)
      const mostLate = await Student.find({ lateDays: { $gt: 0 } })
        .sort({ lateDays: -1 })
        .limit(10)
        .select('rollNo name year branch lateDays')
        .lean();

      // Least Late Students (top 10 with lowest late days, excluding 0)
      const leastLate = await Student.find({ lateDays: { $gt: 0 } })
        .sort({ lateDays: 1 })
        .limit(10)
        .select('rollNo name year branch lateDays')
        .lean();

      // Most Improved (students with declining late trend - simplified)
      // For demo: find students who were late but haven't been late recently
      const allStudents = await Student.find({ lateDays: { $gt: 0 } })
        .select('rollNo name year branch lateDays lateLogs')
        .lean();

      const mostImproved = allStudents
        .map(student => {
          const logs = student.lateLogs || [];
          if (logs.length === 0) return null;

          // Check if no lates in last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const recentLates = logs.filter(log => new Date(log.date) > sevenDaysAgo).length;

          // Calculate improvement (total lates - recent activity = improvement)
          const improvement = recentLates === 0 && student.lateDays > 0 ? student.lateDays : 0;

          return improvement > 0 ? { ...student, improvement } : null;
        })
        .filter(s => s !== null)
        .sort((a, b) => b.improvement - a.improvement)
        .slice(0, 10);

      res.json({
        mostLate,
        leastLate,
        mostImproved
      });
    } catch (err) {
      console.error('Leaderboard error:', err);
      res.status(500).json({ error: "Failed to fetch leaderboard", details: err.message });
    }
  });

  // Analytics - Financial
  router.get("/analytics/financial", checkDbConnection, async (req, res) => {
    try {
      // Get all students with financial data
      const students = await Student.find({}).select('fines fineHistory').lean();

      // Calculate total collected (sum of all fine history)
      let totalCollected = 0;
      let pendingFines = 0;

      students.forEach(student => {
        // Pending fines
        pendingFines += student.fines || 0;

        // Total collected from fine history
        if (student.fineHistory && student.fineHistory.length > 0) {
          student.fineHistory.forEach(history => {
            if (history.action === 'paid') {
              totalCollected += history.amount || 0;
            }
          });
        }
      });

      // Projected revenue (pending + collected)
      const projectedRevenue = totalCollected + pendingFines;

      // Payment rate (collected / projected * 100)
      const paymentRate = projectedRevenue > 0 
        ? Math.round((totalCollected / projectedRevenue) * 100) 
        : 0;

      // Average fine per student (only count students with fines > 0)
      const studentsWithFines = students.filter(s => (s.fines || 0) > 0);
      const avgFinePerStudent = studentsWithFines.length > 0
        ? Math.round(pendingFines / studentsWithFines.length)
        : 0;

      res.json({
        totalCollected,
        pendingFines,
        projectedRevenue,
        paymentRate,
        avgFinePerStudent
      });
    } catch (err) {
      console.error('Financial analytics error:', err);
      res.status(500).json({ error: "Failed to fetch financial analytics", details: err.message });
    }
  });

// BETA: Filter students by year, branch, semester for prefetched selection
// Supports partial filtering - can filter by just year, or year+branch, or all three
router.get("/filter", async (req, res) => {
  try {
    const { year, branch, semester, section } = req.query;
    
    // Year is required, branch and semester are optional for live filtering
    if (!year) {
      return res.status(400).json({ 
        error: "Year is required" 
      });
    }
    
    const queryYear = parseInt(year);
    if (isNaN(queryYear) || queryYear < 1 || queryYear > 4) {
      return res.status(400).json({ 
        error: "Year must be a number between 1 and 4" 
      });
    }
    
    // Build query dynamically
    const query = { year: queryYear };
    
    // Exclude graduated students from active student lists
    query.status = { $ne: 'graduated' };
    
    // Add branch filter if provided
    if (branch) {
      query.branch = branch.toUpperCase();
    }

    // Add section filter if provided
    if (section) {
      query.section = section.toUpperCase();
    }
    
    // Add semester filter if provided
    if (semester) {
      const querySemester = parseInt(semester);
      if (isNaN(querySemester) || querySemester < 1 || querySemester > 8) {
        return res.status(400).json({ 
          error: "Semester must be a number between 1 and 8" 
        });
      }
      query.semester = querySemester;
    }
    
    // Filter students with dynamic query (including lateDays for frontend)
    const students = await Student.find(query)
    .select("rollNo name year semester branch section lateDays fines status")
    .sort({ branch: 1, rollNo: 1 })
    .lean();
    
    res.json({
      success: true,
      count: students.length,
      students,
      filters: {
        year: queryYear,
        branch: branch || 'all',
        semester: semester || 'all',
        section: section || 'all'
      }
    });
  } catch (err) {
    console.error("Filter students error:", err);
    res.status(500).json({ 
      error: "Failed to filter students",
      details: err.message 
    });
  }
});

// Export late record removal proof as PDF
router.post("/export-removal-proof", async (req, res) => {
  try {
    const {
      removalRecords = [],
      reason,
      authorizedBy,
      authorizedByEmail,
      authorizedByRole,
      timestamp,
      totalLateDaysRemoved,
      totalFinesRefunded
    } = req.body || {};

    if (!Array.isArray(removalRecords) || removalRecords.length === 0) {
      return res.status(400).json({ error: "No removal records provided" });
    }
    if (!authorizedBy || !authorizedBy.trim()) {
      return res.status(400).json({ error: "Authorized by is required" });
    }
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: "Reason must be at least 5 characters" });
    }

    const removalData = {
      removalRecords,
      reason,
      authorizedBy,
      authorizedByEmail: authorizedByEmail || "",
      authorizedByRole: authorizedByRole || "faculty",
      timestamp: timestamp || new Date().toISOString(),
      totalLateDaysRemoved: totalLateDaysRemoved ?? removalRecords.length,
      totalFinesRefunded: totalFinesRefunded ?? removalRecords.reduce((sum, r) => sum + (r.fineAmount || 0), 0)
    };

    const pdfBuffer = await generateRemovalProof(removalData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=late_removal_proof_${Date.now()}.pdf`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Export removal proof error:", err);
    res.status(500).json({ error: "Failed to generate PDF", details: err.message });
  }
});

// Update student details (admin only)
router.put("/student/:rollNo", checkDbConnection, async (req, res) => {
  try {
    const { rollNo: oldRollNo } = req.params;
    const { rollNo: newRollNo, name, year, semester, branch, section } = req.body;

    if (!newRollNo || !name || !year || !semester || !branch || !section) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const student = await Student.findOne({ rollNo: oldRollNo });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if new roll number already exists (if changed)
    if (newRollNo.toUpperCase() !== oldRollNo.toUpperCase()) {
      const existingStudent = await Student.findOne({ rollNo: newRollNo.toUpperCase() });
      if (existingStudent) {
        return res.status(400).json({ error: "A student with this roll number already exists" });
      }
    }

    // Update student details
    student.rollNo = newRollNo.toUpperCase().trim();
    student.name = name.trim();
    student.year = parseInt(year);
    student.semester = parseInt(semester);
    student.branch = branch.toUpperCase();
    student.section = section.toUpperCase();

    await student.save();

    res.json({ 
      message: "Student updated successfully",
      student: {
        rollNo: student.rollNo,
        name: student.name,
        year: student.year,
        semester: student.semester,
        branch: student.branch,
        section: student.section
      }
    });
  } catch (err) {
    console.error("❌ Update student error:", err);
    res.status(500).json({ error: "Failed to update student", details: err.message });
  }
});

// Get audit trail for late record removals
router.get("/audit-logs/removal-history", checkDbConnection, async (req, res) => {
  try {
    const { rollNo, limit = 50, skip = 0 } = req.query;
    
    const query = { 
      action: 'LATE_RECORD_REMOVED'
    };
    
    // Optional: filter by specific student
    if (rollNo) {
      query['targetStudent.rollNo'] = rollNo;
    }
    
    // Get total count
    const totalCount = await AuditLog.countDocuments(query);
    
    // Fetch audit logs with pagination
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    res.json({
      message: 'Removal audit logs retrieved',
      totalCount,
      logs,
      pagination: {
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: parseInt(skip) + parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs', details: error.message });
  }
});

// Get audit statistics
router.get("/audit-logs/statistics", checkDbConnection, async (req, res) => {
  try {
    const stats = await AuditLog.aggregate([
      { $match: { action: 'LATE_RECORD_REMOVED' } },
      {
        $group: {
          _id: '$performedBy.facultyName',
          totalRemovals: { $sum: 1 },
          totalRecordsRemoved: { $sum: '$details.recordsRemoved' },
          totalFinesRefunded: { $sum: { $sum: '$details.changes.fines' } },
          lastAction: { $max: '$timestamp' }
        }
      },
      { $sort: { totalRemovals: -1 } }
    ]);
    
    res.json({
      message: 'Audit statistics retrieved',
      stats
    });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics', details: error.message });
  }
});

// Export audit trail as PDF
router.get("/audit-logs/export-pdf", checkDbConnection, async (req, res) => {
  try {
    const { rollNo, limit = 100 } = req.query;
    
    const query = { 
      action: 'LATE_RECORD_REMOVED'
    };
    
    // Optional: filter by specific student
    if (rollNo) {
      query['targetStudent.rollNo'] = rollNo;
    }
    
    // Get total count
    const totalCount = await AuditLog.countDocuments(query);
    
    // Fetch audit logs (limit to prevent huge PDFs)
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Get generated by info from request (if authenticated)
    const generatedBy = req.facultyName || 'System Administrator';
    
    // Generate PDF
    const pdfBuffer = await generateAuditTrailPDF({
      logs,
      totalCount,
      generatedBy
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audit-trail-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating audit trail PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

// Manual backup endpoint - exports all database collections as JSON
router.get("/export-backup", async (req, res) => {
  try {
    // Fetch all collections
    const students = await Student.find({}).lean();
    const auditLogs = await AuditLog.find({}).lean();
    
    // Import Faculty model dynamically to avoid circular dependencies
    const Faculty = mongoose.model('Faculty');
    const faculty = await Faculty.find({}).select('-password').lean(); // Exclude passwords
    
    // Create backup object with timestamp
    const backup = {
      timestamp: new Date().toISOString(),
      exportedBy: req.facultyName || 'System Administrator',
      collections: {
        students: students,
        auditLogs: auditLogs,
        faculty: faculty
      },
      counts: {
        students: students.length,
        auditLogs: auditLogs.length,
        faculty: faculty.length
      }
    };
    
    // Set response headers
    const filename = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.json(backup);
  } catch (error) {
    console.error('Error creating database backup:', error);
    res.status(500).json({ error: 'Failed to create backup', details: error.message });
  }
});

export default router;

