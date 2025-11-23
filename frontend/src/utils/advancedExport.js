import * as XLSX from 'xlsx';

/**
 * Enhanced Excel export with multiple sheets, styling, and auto-column widths
 */

export const exportLateRecordsToExcel = (students, filename, filters, periodInfo) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Summary
    const summary = createSummarySheet(students, filters, periodInfo);
    const summaryWS = XLSX.utils.aoa_to_sheet(summary);
    summaryWS['!cols'] = [
      { wch: 25 }, // Metric
      { wch: 20 }  // Value
    ];
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
    
    // Sheet 2: Raw Logs (detailed records)
    const rawLogs = createRawLogsSheet(students);
    const rawLogsWS = XLSX.utils.json_to_sheet(rawLogs);
    rawLogsWS['!cols'] = [
      { wch: 12 }, // Roll No
      { wch: 25 }, // Name
      { wch: 8 },  // Year
      { wch: 10 }, // Semester
      { wch: 10 }, // Branch
      { wch: 10 }, // Section
      { wch: 12 }, // Late Date
      { wch: 12 }, // Late Time
      { wch: 12 }, // Total Late Days
      { wch: 12 }, // Status
      { wch: 12 }  // Fines
    ];
    XLSX.utils.book_append_sheet(workbook, rawLogsWS, 'Raw Logs');
    
    // Sheet 3: Fines Overview
    const fines = createFinesSheet(students);
    const finesWS = XLSX.utils.json_to_sheet(fines);
    finesWS['!cols'] = [
      { wch: 12 }, // Roll No
      { wch: 25 }, // Name
      { wch: 8 },  // Year
      { wch: 10 }, // Branch
      { wch: 10 }, // Section
      { wch: 12 }, // Total Late Days
      { wch: 12 }, // Excused Days
      { wch: 12 }, // Fines (₹)
      { wch: 15 }  // Status
    ];
    XLSX.utils.book_append_sheet(workbook, finesWS, 'Fines');
    
    // Sheet 4: Leaderboard (Most Late Students)
    const leaderboard = createLeaderboardSheet(students);
    const leaderboardWS = XLSX.utils.json_to_sheet(leaderboard);
    leaderboardWS['!cols'] = [
      { wch: 8 },  // Rank
      { wch: 12 }, // Roll No
      { wch: 25 }, // Name
      { wch: 8 },  // Year
      { wch: 10 }, // Branch
      { wch: 12 }, // Total Late Days
      { wch: 12 }  // Fines
    ];
    XLSX.utils.book_append_sheet(workbook, leaderboardWS, 'Leaderboard');
    
    // Write file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Excel export error:', error);
    return false;
  }
};

const createSummarySheet = (students, filters, periodInfo) => {
  const totalStudents = students.length;
  const totalLateDays = students.reduce((sum, s) => sum + (s.lateCountInPeriod || 0), 0);
  const totalFines = students.reduce((sum, s) => sum + (s.fines || 0), 0);
  const avgLateDays = totalStudents > 0 ? (totalLateDays / totalStudents).toFixed(2) : 0;
  
  const statusCounts = students.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return [
    ['📊 Late Records Summary Report'],
    [],
    ['Report Generated:', new Date().toLocaleString()],
    ['Period:', periodInfo.period || 'N/A'],
    ['Filter - Year:', filters.year === 'all' ? 'All Years' : `Year ${filters.year}`],
    ['Filter - Branch:', filters.branch === 'all' ? 'All Branches' : filters.branch],
    ['Filter - Section:', filters.section === 'all' ? 'All Sections' : filters.section],
    [],
    ['📈 Statistics'],
    ['Total Students:', totalStudents],
    ['Total Late Occurrences:', totalLateDays],
    ['Average Late Days per Student:', avgLateDays],
    ['Total Fines Collected (₹):', totalFines],
    [],
    ['📌 Status Distribution'],
    ...Object.entries(statusCounts).map(([status, count]) => [status, count]),
    [],
    ['💡 Notes'],
    ['- This report includes all students with late records in the selected period'],
    ['- Fines are calculated based on college late policy'],
    ['- Contact administration for any discrepancies']
  ];
};

const createRawLogsSheet = (students) => {
  const logs = [];
  
  students.forEach(student => {
    if (student.lateLogs && student.lateLogs.length > 0) {
      student.lateLogs.forEach(log => {
        const date = new Date(log.date);
        logs.push({
          'Roll Number': student.rollNo,
          'Name': student.name,
          'Year': student.year,
          'Semester': student.semester || 'N/A',
          'Branch': student.branch || 'N/A',
          'Section': student.section || 'N/A',
          'Late Date': date.toLocaleDateString(),
          'Late Time': date.toLocaleTimeString(),
          'Total Late Days': student.lateDays,
          'Status': student.status,
          'Total Fines (₹)': student.fines
        });
      });
    }
  });
  
  return logs.length > 0 ? logs : [{ 'Roll Number': 'No records found' }];
};

const createFinesSheet = (students) => {
  return students
    .filter(s => s.fines > 0 || s.lateDays > 0)
    .map(student => ({
      'Roll Number': student.rollNo,
      'Name': student.name,
      'Year': student.year,
      'Branch': student.branch || 'N/A',
      'Section': student.section || 'N/A',
      'Total Late Days': student.lateDays,
      'Excused Days': student.excuseDaysUsed || 0,
      'Total Fines (₹)': student.fines,
      'Status': student.status
    }))
    .sort((a, b) => b['Total Fines (₹)'] - a['Total Fines (₹)']);
};

const createLeaderboardSheet = (students) => {
  return students
    .filter(s => s.lateDays > 0)
    .sort((a, b) => b.lateDays - a.lateDays)
    .slice(0, 50) // Top 50
    .map((student, index) => ({
      'Rank': index + 1,
      'Roll Number': student.rollNo,
      'Name': student.name,
      'Year': student.year,
      'Branch': student.branch || 'N/A',
      'Total Late Days': student.lateDays,
      'Total Fines (₹)': student.fines
    }));
};

// TXT format export with table structure
export const exportToTXT = (students, filename) => {
  try {
    const header = `LATE RECORDS REPORT\nGenerated: ${new Date().toLocaleString()}\nTotal Students: ${students.length}\n${'-'.repeat(120)}\n\n`;
    
    const table = formatAsTable(students);
    const content = header + table;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    return true;
  } catch (error) {
    console.error('TXT export error:', error);
    return false;
  }
};

const formatAsTable = (students) => {
  const colWidths = {
    rollNo: 12,
    name: 25,
    year: 6,
    branch: 10,
    section: 8,
    lateDays: 10,
    fines: 12,
    status: 15
  };
  
  const pad = (str, width) => String(str).padEnd(width).slice(0, width);
  
  let table = '';
  table += `${pad('Roll Number', colWidths.rollNo)}${pad('Name', colWidths.name)}${pad('Year', colWidths.year)}${pad('Branch', colWidths.branch)}${pad('Section', colWidths.section)}${pad('Late Days', colWidths.lateDays)}${pad('Fines (₹)', colWidths.fines)}${pad('Status', colWidths.status)}\n`;
  table += '-'.repeat(120) + '\n';
  
  students.forEach(s => {
    table += `${pad(s.rollNo, colWidths.rollNo)}${pad(s.name, colWidths.name)}${pad(s.year, colWidths.year)}${pad(s.branch || 'N/A', colWidths.branch)}${pad(s.section || 'N/A', colWidths.section)}${pad(s.lateDays, colWidths.lateDays)}${pad(s.fines, colWidths.fines)}${pad(s.status, colWidths.status)}\n`;
  });
  
  return table;
};
