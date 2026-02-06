/**
 * AI Predictor Service
 * Provides AI-powered insights without Python dependency
 * Uses JavaScript-based statistical analysis as alternative to ML model
 */

import Student from '../models/student.js';

/**
 * Encode branch to numerical value
 */
const encodeBranch = (branch) => {
  const branchMap = {
    'CSE': 1, 'ECE': 2, 'MECH': 3, 'EEE': 4,
    'CIVIL': 5, 'CSM': 6, 'IT': 7
  };
  return branchMap[branch] || 0;
};

/**
 * Calculate day pattern from late logs
 */
const calculateDayPattern = (lateLogs) => {
  if (!lateLogs || lateLogs.length === 0) return 0;
  
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  lateLogs.forEach(log => {
    if (log.date) {
      const dayOfWeek = new Date(log.date).getDay();
      dayCounts[dayOfWeek]++;
    }
  });
  
  return dayCounts.indexOf(Math.max(...dayCounts));
};

/**
 * Calculate recent trend (increasing or decreasing lates)
 */
const calculateRecentTrend = (lateLogs) => {
  if (!lateLogs || lateLogs.length < 4) return 0;
  
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  
  const recentCount = lateLogs.filter(log => 
    log.date && new Date(log.date) >= twoWeeksAgo
  ).length;
  
  const previousCount = lateLogs.filter(log => 
    log.date && new Date(log.date) >= fourWeeksAgo && new Date(log.date) < twoWeeksAgo
  ).length;
  
  if (previousCount === 0) {
    return recentCount > 0 ? 1 : 0;
  }
  
  return (recentCount - previousCount) / previousCount;
};

/**
 * Calculate risk score using heuristic algorithm (0-100)
 */
const calculateRiskScore = (student) => {
  let score = 0;
  
  // Base score from late days (0-40 points)
  const lateDays = student.lateDays || 0;
  score += Math.min(lateDays * 4, 40);
  
  // Recent trend factor (0-20 points)
  const trend = calculateRecentTrend(student.lateLogs || []);
  if (trend > 0.5) score += 20;
  else if (trend > 0.2) score += 10;
  else if (trend > 0) score += 5;
  
  // Late per semester ratio (0-15 points)
  const semester = student.semester || 1;
  const latePerSemester = lateDays / semester;
  if (latePerSemester > 5) score += 15;
  else if (latePerSemester > 3) score += 10;
  else if (latePerSemester > 2) score += 5;
  
  // Grace period used (10 points)
  if (student.gracePeriodUsed) score += 10;
  
  // Status factor (0-15 points)
  if (student.status === 'Being Fined') score += 15;
  else if (student.status === 'Warning') score += 10;
  else if (lateDays >= 7) score += 5;
  
  // Ensure score is between 0-100
  return Math.min(Math.max(score, 0), 100);
};

/**
 * Categorize risk level
 */
const categorizeRisk = (score) => {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
};

/**
 * Predict risk for a single student
 */
const predictStudentRisk = (student) => {
  const riskScore = calculateRiskScore(student);
  const riskCategory = categorizeRisk(riskScore);
  
  return {
    student_id: student._id.toString(),
    roll_no: student.rollNo,
    name: student.name,
    branch: student.branch,
    year: student.year,
    late_days: student.lateDays || 0,
    risk_score: riskScore,
    risk_category: riskCategory,
    risk_probability: (riskScore / 100).toFixed(3)
  };
};

/**
 * Analyze patterns across all students
 */
const analyzePatterns = (students) => {
  if (!students || students.length === 0) {
    return {};
  }
  
  // Day of week analysis
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  
  students.forEach(student => {
    (student.lateLogs || []).forEach(log => {
      if (log.date) {
        const dayOfWeek = new Date(log.date).getDay();
        dayCounts[dayOfWeek]++;
      }
    });
  });
  
  const peakDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const dayBreakdown = {};
  dayNames.forEach((day, i) => {
    dayBreakdown[day] = dayCounts[i];
  });
  
  // Branch analysis
  const branchStats = {};
  students.forEach(student => {
    const branch = student.branch || 'Unknown';
    if (!branchStats[branch]) {
      branchStats[branch] = { count: 0, total_lates: 0 };
    }
    branchStats[branch].count++;
    branchStats[branch].total_lates += student.lateDays || 0;
  });
  
  const branchPercentages = {};
  const totalLates = Object.values(branchStats).reduce((sum, stats) => sum + stats.total_lates, 0);
  
  for (const [branch, stats] of Object.entries(branchStats)) {
    if (totalLates > 0) {
      branchPercentages[branch] = parseFloat(((stats.total_lates / totalLates) * 100).toFixed(1));
    }
  }
  
  // Year analysis
  const yearStats = {};
  students.forEach(student => {
    const year = student.year || 0;
    if (!yearStats[year]) {
      yearStats[year] = [];
    }
    yearStats[year].push(student.lateDays || 0);
  });
  
  const yearAverages = {};
  for (const [year, lates] of Object.entries(yearStats)) {
    const avg = lates.reduce((sum, val) => sum + val, 0) / lates.length;
    yearAverages[year] = parseFloat(avg.toFixed(1));
  }
  
  return {
    peak_late_day: {
      day: dayNames[peakDayIndex],
      count: dayCounts[peakDayIndex],
      day_breakdown: dayBreakdown
    },
    branch_distribution: branchPercentages,
    year_averages: yearAverages,
    total_students_analyzed: students.length,
    students_with_lates: students.filter(s => (s.lateDays || 0) > 0).length
  };
};

/**
 * Get early warnings for students
 */
const getEarlyWarnings = (students) => {
  const warnings = [];
  
  students.forEach(student => {
    const lateDays = student.lateDays || 0;
    const status = student.status || '';
    
    // Near fine threshold
    if (lateDays >= 7 && lateDays <= 9 && status !== 'Being Fined') {
      warnings.push({
        student_id: student._id.toString(),
        roll_no: student.rollNo,
        name: student.name,
        late_days: lateDays,
        warning_type: 'NEAR_THRESHOLD',
        message: `${10 - lateDays} more late days until fine threshold`,
        severity: 'HIGH'
      });
    }
    
    // Sudden increase
    const recentTrend = calculateRecentTrend(student.lateLogs || []);
    if (recentTrend > 0.5 && lateDays >= 3) {
      warnings.push({
        student_id: student._id.toString(),
        roll_no: student.rollNo,
        name: student.name,
        late_days: lateDays,
        warning_type: 'SUDDEN_INCREASE',
        message: `Late frequency increased by ${Math.round(recentTrend * 100)}%`,
        severity: 'MEDIUM'
      });
    }
    
    // High late count
    if (lateDays >= 15) {
      warnings.push({
        student_id: student._id.toString(),
        roll_no: student.rollNo,
        name: student.name,
        late_days: lateDays,
        warning_type: 'EXCESSIVE_LATES',
        message: `Excessive late days: ${lateDays}`,
        severity: 'HIGH'
      });
    }
  });
  
  // Sort by severity and late days
  return warnings.sort((a, b) => {
    if (a.severity === 'HIGH' && b.severity !== 'HIGH') return -1;
    if (a.severity !== 'HIGH' && b.severity === 'HIGH') return 1;
    return b.late_days - a.late_days;
  });
};

/**
 * Generate all AI insights
 */
const generateInsights = async () => {
  try {
    // Fetch all students with late logs
    const students = await Student.find({}).lean();
    
    // Predict risk scores for students with late history
    const predictions = [];
    students.forEach(student => {
      if ((student.lateDays || 0) > 0) {
        predictions.push(predictStudentRisk(student));
      }
    });
    
    // Sort by risk score
    predictions.sort((a, b) => b.risk_score - a.risk_score);
    
    // Get patterns
    const patterns = analyzePatterns(students);
    
    // Get early warnings
    const warnings = getEarlyWarnings(students);
    
    return {
      predictions: predictions.slice(0, 20), // Top 20 high-risk students
      patterns,
      early_warnings: warnings.slice(0, 10), // Top 10 warnings
      summary: {
        total_students: students.length,
        high_risk_count: predictions.filter(p => p.risk_category === 'HIGH').length,
        medium_risk_count: predictions.filter(p => p.risk_category === 'MEDIUM').length,
        low_risk_count: predictions.filter(p => p.risk_category === 'LOW').length,
        warnings_count: warnings.length
      }
    };
  } catch (error) {
    console.error('Error generating AI insights:', error);
    throw error;
  }
};

export {
  generateInsights,
  predictStudentRisk,
  analyzePatterns,
  getEarlyWarnings
};
