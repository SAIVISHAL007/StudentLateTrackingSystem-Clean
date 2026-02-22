import * as XLSX from 'xlsx';

/**
 * Export students data to Excel with filtering support
 * @param {Array} students - Array of student objects
 * @param {string} filename - Base filename for the export
 * @param {Object} filters - Applied filters (year, branch, section, period)
 */
export const exportToExcel = (students, filename, filters = {}) => {
  try {
    // Helper function to get today's late marking info
    const getTodayMarkedBy = (lateLogs) => {
      if (!lateLogs || lateLogs.length === 0) return 'N/A';
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayLog = lateLogs.find(log => {
        const logDate = new Date(log.date);
        return logDate >= today && logDate < tomorrow;
      });
      
      return todayLog?.markedByName || 'Unknown';
    };
    
    const getTodayMarkedTime = (lateLogs) => {
      if (!lateLogs || lateLogs.length === 0) return 'N/A';
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayLog = lateLogs.find(log => {
        const logDate = new Date(log.date);
        return logDate >= today && logDate < tomorrow;
      });
      
      return todayLog ? new Date(todayLog.date).toLocaleTimeString() : 'N/A';
    };
    
    // Prepare data for Excel with faculty authorization info
    const excelData = students.map((student, index) => ({
      'S.No': index + 1,
      'Roll Number': student.rollNo || 'N/A',
      'Name': student.name || 'N/A',
      'Year': student.year || 'N/A',
      'Semester': student.semester || 'N/A',
      'Branch': student.branch || 'N/A',
      'Section': student.section || 'N/A',
      'Total Late Days': student.lateDays || 0,
      'Excuse Days Used': student.excuseDaysUsed || 0,
      'Status': student.status || 'normal',
      'Total Fines (₹)': student.fines || 0,
      'Alert Faculty': student.alertFaculty ? 'Yes' : 'No',
      'Last Late Date': student.lateLogs && student.lateLogs.length > 0 
        ? new Date(student.lateLogs[student.lateLogs.length - 1].date).toLocaleDateString()
        : 'Never',
      'Marked By (Today)': getTodayMarkedBy(student.lateLogs),
      'Marked Time (Today)': getTodayMarkedTime(student.lateLogs)
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 6 },  // S.No
      { wch: 15 }, // Roll Number
      { wch: 25 }, // Name
      { wch: 6 },  // Year
      { wch: 10 }, // Semester
      { wch: 10 }, // Branch
      { wch: 10 }, // Section
      { wch: 14 }, // Total Late Days
      { wch: 16 }, // Excuse Days Used
      { wch: 12 }, // Status
      { wch: 14 }, // Total Fines
      { wch: 12 }, // Alert Faculty
      { wch: 15 }, // Last Late Date
      { wch: 25 }, // Marked By (Today)
      { wch: 18 }  // Marked Time (Today)
    ];
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Late Students');

    // Create summary sheet if filters are applied
    if (Object.keys(filters).length > 0) {
      const summaryData = [
        { Field: 'Export Date', Value: new Date().toLocaleString() },
        { Field: 'Total Students', Value: students.length },
        { Field: 'Year Filter', Value: filters.year || 'All Years' },
        { Field: 'Branch Filter', Value: filters.branch || 'All Branches' },
        { Field: 'Section Filter', Value: filters.section || 'All Sections' },
        { Field: 'Period', Value: filters.period || 'N/A' },
        { Field: '', Value: '' },
        { Field: 'Total Late Days', Value: students.reduce((sum, s) => sum + (s.lateDays || 0), 0) },
        { Field: 'Total Fines Collected', Value: `₹${students.reduce((sum, s) => sum + (s.fines || 0), 0)}` },
        { Field: 'Students Being Fined', Value: students.filter(s => s.status === 'fined').length },
        { Field: 'Students with Alerts', Value: students.filter(s => s.alertFaculty).length }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fullFilename = `${filename}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, fullFilename);
    
    return true;
  } catch (error) {
    console.error('Excel export error:', error);
    return false;
  }
};

/**
 * Export late records with detailed information
 * @param {Array} students - Array of student objects with late logs
 * @param {string} filename - Base filename
 * @param {Object} filters - Applied filters
 * @param {Object} periodInfo - Period information (startDate, endDate, period name)
 */
export const exportLateRecordsToExcel = (students, filename, filters = {}, periodInfo = {}) => {
  try {
    // Main student data
    const studentsData = students.map((student, index) => ({
      'S.No': index + 1,
      'Roll Number': student.rollNo || 'N/A',
      'Name': student.name || 'N/A',
      'Year': student.year || 'N/A',
      'Semester': student.semester || 'N/A',
      'Branch': student.branch || 'N/A',
      'Section': student.section || 'N/A',
      'Late Days (Total)': student.lateDays || 0,
      'Late Days (Period)': student.lateCountInPeriod || 0,
      'Excuse Days Used': student.excuseDaysUsed || 0,
      'Status': student.status || 'normal',
      'Total Fines (₹)': student.fines || 0,
      'Alert': student.alertFaculty ? 'Yes' : 'No'
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(studentsData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 6 }, { wch: 10 }, 
      { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, 
      { wch: 12 }, { wch: 14 }, { wch: 8 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Create detailed late logs sheet with FACULTY information
    const lateLogsData = [];
    students.forEach(student => {
      if (student.lateLogs && student.lateLogs.length > 0) {
        student.lateLogs.forEach(log => {
          lateLogsData.push({
            'Roll Number': student.rollNo,
            'Name': student.name,
            'Year': student.year || 'N/A',
            'Semester': student.semester || 'N/A',
            'Branch': student.branch || 'N/A',
            'Section': student.section || 'N/A',
            'Date': new Date(log.date).toLocaleDateString(),
            'Time': new Date(log.date).toLocaleTimeString(),
            'Marked By': log.markedByName || 'Unknown Faculty',
            'Faculty Email': log.markedByEmail || 'N/A',
            'Notes': log.notes || ''
          });
        });
      }
    });

    if (lateLogsData.length > 0) {
      const logsSheet = XLSX.utils.json_to_sheet(lateLogsData);
      logsSheet['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 6 }, { wch: 10 }, 
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(workbook, logsSheet, 'Late Logs');
    }

    // Summary sheet
    const summaryData = [
      { Field: 'Report Title', Value: 'Student Late Tracking - Attendance Records' },
      { Field: 'Generated On', Value: new Date().toLocaleString() },
      { Field: '', Value: '' },
      { Field: 'Period', Value: periodInfo.period || 'N/A' },
      { Field: 'Start Date', Value: periodInfo.startDate ? new Date(periodInfo.startDate).toLocaleDateString() : 'N/A' },
      { Field: 'End Date', Value: periodInfo.endDate ? new Date(periodInfo.endDate).toLocaleDateString() : 'N/A' },
      { Field: '', Value: '' },
      { Field: 'Filters Applied', Value: '' },
      { Field: '  Year', Value: filters.year || 'All Years' },
      { Field: '  Branch', Value: filters.branch || 'All Branches' },
      { Field: '  Section', Value: filters.section || 'All Sections' },
      { Field: '', Value: '' },
      { Field: 'Statistics', Value: '' },
      { Field: '  Total Students', Value: students.length },
      { Field: '  Total Late Instances', Value: students.reduce((sum, s) => sum + (s.lateCountInPeriod || 0), 0) },
      { Field: '  Total Fines', Value: `₹${students.reduce((sum, s) => sum + (s.fines || 0), 0)}` },
      { Field: '  Students Being Fined', Value: students.filter(s => s.status === 'fined').length },
      { Field: '  Students with Alerts', Value: students.filter(s => s.alertFaculty).length },
      { Field: '', Value: '' },
      { Field: 'Branch Distribution', Value: '' }
    ];

    // Add branch distribution
    const branchCounts = {};
    students.forEach(s => {
      const branch = s.branch || 'Unknown';
      branchCounts[branch] = (branchCounts[branch] || 0) + 1;
    });
    Object.entries(branchCounts).forEach(([branch, count]) => {
      summaryData.push({ Field: `  ${branch}`, Value: count });
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fullFilename = `${filename}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, fullFilename);
    
    return true;
  } catch (error) {
    console.error('Excel export error:', error);
    return false;
  }
};

/**
 * Export today's late students to Excel
 * @param {Array} students - Students late today
 * @param {Object} filters - Applied filters
 */
export const exportTodayLateToExcel = (students, filters = {}) => {
  const filename = `late_students_today`;
  const enhancedFilters = {
    ...filters,
    period: `Today - ${new Date().toLocaleDateString()}`
  };
  return exportToExcel(students, filename, enhancedFilters);
};
