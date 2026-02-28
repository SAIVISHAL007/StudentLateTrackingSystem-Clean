import * as XLSX from 'xlsx';

/**
 * Format date safely from various formats
 * @param {string|Date} dateInput - Date in ISO format or Date object
 * @returns {string} - Formatted date as DD/MM/YYYY
 */
const formatDateSafely = (dateInput) => {
  try {
    if (!dateInput) return 'N/A';
    
    let date;
    if (typeof dateInput === 'string') {
      // Handle ISO format (2026-02-23T10:30:00Z)
      // Or simple format like 2026-02-23
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A';
    
    // Format as DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (err) {
    console.error('Date formatting error:', err);
    return 'N/A';
  }
};

/**
 * Auto-fit column widths based on content
 * @param {Array} data - Array of row objects
 * @param {Object} sheet - XLSX worksheet object
 */
const autoFitColumns = (data, sheet) => {
  const columnWidths = [];
  
  // Get all column headers
  const headers = Object.keys(data[0] || {});
  
  headers.forEach((header, colIndex) => {
    // Start with header length
    let maxWidth = header.length;
    
    // Check all rows for maximum content width
    data.forEach(row => {
      const cellValue = String(row[header] || '');
      maxWidth = Math.max(maxWidth, cellValue.length);
    });
    
    // Add some padding and set limits (min 10, max 60)
    columnWidths.push({ wch: Math.min(Math.max(maxWidth + 2, 10), 60) });
  });
  
  sheet['!cols'] = columnWidths;
};


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

    // Auto-fit column widths
    autoFitColumns(excelData, worksheet);

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
      autoFitColumns(summaryData, summarySheet);
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
 * Export late records with detailed information - RESTRUCTURED TO 2 SHEETS
 * @param {Array} students - Array of student objects with late logs
 * @param {string} filename - Base filename
 * @param {Object} filters - Applied filters
 * @param {Object} dateRangeInfo - Date range information (startDate, endDate, totalRecordsInRange)
 */
export const exportLateRecordsToExcel = (students, filename, filters = {}, dateRangeInfo = null) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // ===== CALENDAR DATE RANGE EXPORT (2 sheets with hybrid format) =====
    if (dateRangeInfo) {
      // ============================================
      // SHEET 1: Calendar-Based Date Range Selection Data with Separate Columns per Range
      // ============================================
      const calendarBasedData = students.map((student, index) => {
        const row = {
          'S.No': index + 1,
          'Name': student.name || 'N/A',
          'Roll Number': student.rollNo || 'N/A',
          'Branch': student.branch || 'N/A',
          'Year': student.year || 'N/A',
          'Section': student.section || 'N/A'
        };
        
        // Add columns for each date range in correct order (Period, Count, Period, Count...)
        if (dateRangeInfo && dateRangeInfo.ranges && dateRangeInfo.ranges.length > 0) {
          // Build an array of all date range data first
          const rangeData = dateRangeInfo.ranges.map((range, idx) => {
            const rangeNum = idx + 1;
            const dateRangeStr = `${range.start} to ${range.end}`;
            
            // Calculate late count for this specific range - use original lateLogs to get accurate count per range
            const logsInThisRange = (student.lateLogs || []).filter(log => {
              // Parse log date properly - convert ISO date string to Date object for accurate comparison
              const logParts = log.date.split('T')[0].split('-');
              const logDate = new Date(parseInt(logParts[0]), parseInt(logParts[1]) - 1, parseInt(logParts[2]));
              logDate.setHours(12, 0, 0, 0);
              
              // Parse range dates
              const rangeParts = range.start.split('-');
              const rangeStart = new Date(parseInt(rangeParts[0]), parseInt(rangeParts[1]) - 1, parseInt(rangeParts[2]));
              rangeStart.setHours(0, 0, 0, 0);
              
              const rangeEndParts = range.end.split('-');
              const rangeEnd = new Date(parseInt(rangeEndParts[0]), parseInt(rangeEndParts[1]) - 1, parseInt(rangeEndParts[2]));
              rangeEnd.setHours(23, 59, 59, 999);
              
              // Compare as Date objects
              return logDate >= rangeStart && logDate <= rangeEnd;
            });
            
            return {
              periodKey: `Selection Date Period ${rangeNum}`,
              periodValue: dateRangeStr,
              countKey: `Late Count Period ${rangeNum}`,
              countValue: logsInThisRange.length
            };
          });
          
          // Add them in the correct order (Period 1, Count 1, Period 2, Count 2, ...)
          rangeData.forEach(data => {
            row[data.periodKey] = data.periodValue;
            row[data.countKey] = data.countValue;
          });
        }
        
        // Add total late count
        row['Overall Late Count'] = student.lateDays || 0;
        
        return row;
      });
      
      const calendarSheet = XLSX.utils.json_to_sheet(calendarBasedData);
      autoFitColumns(calendarBasedData, calendarSheet);
      XLSX.utils.book_append_sheet(workbook, calendarSheet, 'Calendar Based Data');
      
      // ============================================
      // SHEET 2: Overall Data - Hybrid Format for Calendar Export
      // ============================================
      const comprehensiveData = [];
      let serialNo = 1;
      
      students.forEach(student => {
        const logs = (dateRangeInfo && student.logsInRange) ? student.logsInRange : [];
        
        if (logs.length > 0) {
          const lateDatesInPeriod = logs
            .map(log => formatDateSafely(log.date))
            .filter(date => date !== 'N/A')
            .join(', ');
          
          const facultyWithDateTime = logs
            .map(log => {
              const facultyName = log.markedByName || 'Unknown';
              const date = formatDateSafely(log.date);
              const time = log.date ? new Date(log.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A';
              return `${facultyName}(${date}, ${time})`;
            })
            .join(', ');
          
          comprehensiveData.push({
            'S.No': serialNo++,
            'Roll Number': student.rollNo || 'N/A',
            'Name': student.name || 'N/A',
            'Year': student.year || 'N/A',
            'Semester': student.semester || 'N/A',
            'Branch': student.branch || 'N/A',
            'Section': student.section || 'N/A',
            'Late Days (Total)': student.lateDays || 0,
            'Excuse Days Used': student.excuseDaysUsed || 0,
            'Status': student.status || 'normal',
            'Total Fines (₹)': student.fines || 0,
            'Alert Faculty': student.alertFaculty ? 'Yes' : 'No',
            'Late Count in Period': logs.length,
            'Late Dates in Period': lateDatesInPeriod,
            'Faculty Marked By': facultyWithDateTime
          });
        }
      });
      
      const comprehensiveSheet = XLSX.utils.json_to_sheet(comprehensiveData);
      autoFitColumns(comprehensiveData, comprehensiveSheet);
      XLSX.utils.book_append_sheet(workbook, comprehensiveSheet, 'Overall Data');
      
    } else {
      // ===== WEEKLY/MONTHLY/SEMESTER EXPORT (Simple format - one row per log entry) =====
      const detailedData = [];
      let serialNo = 1;
      
      students.forEach(student => {
        const logs = student.lateLogs || [];
        logs.forEach(log => {
          detailedData.push({
            'S.No': serialNo++,
            'Roll Number': student.rollNo || 'N/A',
            'Name': student.name || 'N/A',
            'Year': student.year || 'N/A',
            'Semester': student.semester || 'N/A',
            'Branch': student.branch || 'N/A',
            'Section': student.section || 'N/A',
            'Date': formatDateSafely(log.date),
            'Time': log.date ? new Date(log.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A',
            'Late Days (Total)': student.lateDays || 0,
            'Excuse Days Used': student.excuseDaysUsed || 0,
            'Status': student.status || 'normal',
            'Total Fines (₹)': student.fines || 0,
            'Alert Faculty': student.alertFaculty ? 'Yes' : 'No',
            'Marked By': log.markedByName || 'N/A',
            'Faculty Email': log.markedByEmail || 'N/A',
            'Notes': log.notes || ''
          });
        });
      });
      
      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      autoFitColumns(detailedData, detailedSheet);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Late Records');
    }

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
