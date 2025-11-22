export const convertToCSV = (data, headers = null) => {
  if (!data || data.length === 0) return '';
  
  const csvHeaders = headers || Object.keys(data[0]);
  const headerRow = csvHeaders.join(',');
  const dataRows = data.map(row => 
    csvHeaders.map(header => {
      let value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        // For arrays or objects, convert to string
        if (Array.isArray(value)) {
          value = value.length;
        } else {
          value = JSON.stringify(value);
        }
      } else {
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }
      }
      
      return value;
    }).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};

export const downloadCSV = (data, filename, headers = null) => {
  try {
    const csv = convertToCSV(data, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading CSV:', error);
    return false;
  }
};

export const generateTextReport = (data, title = "Report") => {
  if (!data || data.length === 0) return `${title}\n\nNo data available.`;
  
  let report = `${title}\n`;
  report += `Generated on: ${new Date().toLocaleString()}\n`;
  report += `Total Records: ${data.length}\n`;
  report += '='.repeat(120) + '\n\n';
  
  // Get column headers from the first data item
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    
    // Calculate column widths (max of header length or max data length in that column)
    const columnWidths = headers.map(header => {
      const maxDataLength = Math.max(
        ...data.map(item => {
          const value = item[header];
          if (value === null || value === undefined) return 3; // "N/A" length
          if (Array.isArray(value)) return String(value.length).length;
          if (typeof value === 'object') return 10; // Reasonable default for objects
          return String(value).length;
        })
      );
      return Math.max(header.length, maxDataLength, 8); // Minimum width of 8
    });
    
    // Create header row
    const headerRow = headers.map((header, i) => header.padEnd(columnWidths[i])).join(' | ');
    report += headerRow + '\n';
    
    // Create separator row
    const separator = columnWidths.map(width => '-'.repeat(width)).join('-+-');
    report += separator + '\n';
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map((header, i) => {
        let value = item[header];
        
        // Format value
        if (value === null || value === undefined) {
          value = 'N/A';
        } else if (Array.isArray(value)) {
          value = value.length;
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        return String(value).padEnd(columnWidths[i]);
      }).join(' | ');
      
      report += row + '\n';
    });
  }
  
  report += '\n' + '='.repeat(120) + '\n';
  report += `End of Report\n`;
  
  return report;
};

export const downloadTextReport = (data, filename, title = "Report") => {
  try {
    const reportContent = generateTextReport(data, title);
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.txt`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading text report:', error);
    return false;
  }
};

export const formatStudentDataForExport = (students) => {
  return students.map(student => ({
    'Roll Number': student.rollNo,
    'Name': student.name,
    'Year': student.year,
    'Semester': student.semester || 'N/A',
    'Branch': student.branch || 'N/A',
    'Section': student.section || 'N/A',
    'Late Days (Total)': student.lateDays,
    'Excuse Days Used': student.excuseDaysUsed || 0,
    'Status': student.status,
    'Total Fines (₹)': student.fines,
    'Alert Faculty': student.alertFaculty ? 'Yes' : 'No',
    'Total Late Records': student.lateLogs ? student.lateLogs.length : 0
  }));
};

export const formatLateRecordsForExport = (records, period = '') => {
  const formatted = [];
  
  records.forEach(student => {
    if (student.lateLogs && student.lateLogs.length > 0) {
      student.lateLogs.forEach(log => {
        formatted.push({
          'Roll Number': student.rollNo,
          'Name': student.name,
          'Year': student.year,
          'Semester': student.semester || 'N/A',
          'Branch': student.branch || 'N/A',
          'Section': student.section || 'N/A',
          'Late Date': new Date(log.date).toLocaleDateString(),
          'Late Time': new Date(log.date).toLocaleTimeString(),
          'Late Days (Total)': student.lateDays,
          'Excuse Days Used': student.excuseDaysUsed || 0,
          'Total Fines (₹)': student.fines,
          'Status': student.status,
          'Alert': student.alertFaculty ? 'Yes' : 'No'
        });
      });
    }
  });
  
  return formatted;
};

export const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
};