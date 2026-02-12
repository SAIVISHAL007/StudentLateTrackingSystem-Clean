// IMPLEMENTATION GUIDE: Prevent Multiple Daily Late Markings
// (For future implementation after trial week)

/**
 * FEATURE: Prevent students from being marked late multiple times on the same day
 * 
 * LOCATION: backend/routes/studentRoutes.js
 * ENDPOINT: POST /students/mark-late
 * 
 * INSERT THIS CODE AFTER LINE 107 (after finding existing student):
 */

// Check if student was already marked late today
const today = new Date();
today.setHours(0, 0, 0, 0);

const todayslog = student.lateLogs.find(log => {
  const logDate = new Date(log.date);
  logDate.setHours(0, 0, 0, 0);
  return logDate.getTime() === today.getTime();
});

if (alreadyMarkedToday) {
  console.log(`⚠️ ${student.name} (${rollNo}) already marked late today`);
  
  return res.status(400).json({ 
    error: "Already marked late today",
    message: `${student.name} was already marked late today at ${alreadyMarkedToday.date.toLocaleTimeString()}. Cannot mark again until tomorrow.`,
    student: {
      rollNo: student.rollNo,
      name: student.name,
      lateDays: student.lateDays,
      lastMarked: alreadyMarkedToday.date
    }
  });
}

/**
 * FRONTEND HANDLING:
 * 
 * LOCATION: frontend/src/components/PrefetchedStudentForm.js
 * FUNCTION: handleMarkLate
 * 
 * UPDATE THE CATCH BLOCK TO HANDLE 400 STATUS:
 */

try {
  await API.post("/students/mark-late", payload);
  toast.success(
    `Student marked late: ${selectedStudent.name} (${selectedStudent.rollNo})`
  );
  setShowConfirmation(false);
  setSelectedStudent(null);
} catch (error) {
  if (error.response?.status === 400) {
    // Already marked today
    toast.warning(error.response.data.message || "Student already marked late today");
    setShowConfirmation(false);
    setSelectedStudent(null);
  } else if (error.message === "Network Error" || !navigator.onLine) {
    // Offline - queue for sync
    enqueueLateMark(payload);
    toast.warning(
      `Queued for sync: ${selectedStudent.name} - Will update when online`
    );
    setShowConfirmation(false);
    setSelectedStudent(null);
  } else {
    throw error;
  }
}

/**
 * TESTING SCENARIOS:
 * 
 * 1. Mark a student late for the first time today → Should succeed
 * 2. Try marking same student late again today → Should fail with warning
 * 3. Mark same student late tomorrow → Should succeed again
 * 4. Mark multiple different students late today → Each should succeed once
 * 
 * EDGE CASES TO CONSIDER:
 * - What if faculty accidentally scans same ID twice in succession?
 * - What if student comes late to multiple classes same day?
 * - Should there be an override option for administrators?
 * - How to handle timezone issues?
 * 
 * DISCUSSION POINTS:
 * - Do you want to allow multiple entries per day but only count once toward late count?
 * - Or strictly prevent any duplicate marking?
 * - Should there be a grace period (e.g., can mark again after 12 hours)?
 */

/**
 * OPTIONAL: Add visual indicator on frontend
 * 
 * Show badge on student cards if already marked today:
 */

const isMarkedToday = (student) => {
  if (!student.lateLogs || student.lateLogs.length === 0) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return student.lateLogs.some(log => {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });
};

// In student card render:
{isMarkedToday(student) && (
  <span style={{
    padding: "0.25rem 0.5rem",
    background: "#e0e7ff",
    color: "#4338ca",
    fontSize: "0.7rem",
    borderRadius: "4px",
    fontWeight: "600"
  }}>
    Already marked today
  </span>
)}

/**
 * DECISION REQUIRED BEFORE IMPLEMENTATION:
 * 
 * Ask your team/management:
 * 1. Should we implement this for trial week or after?
 * 2. Should admin users have override capability?
 * 3. How to handle edge cases (multiple classes, mistakes)?
 * 4. Should we log attempted duplicates for audit purposes?
 */
