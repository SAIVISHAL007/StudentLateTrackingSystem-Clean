import PDFDocument from 'pdfkit';

/**
 * Generate a PDF proof document for late record removal
 * @param {Object} removalData - Contains removalRecords, authorizedBy, authorizedByEmail, authorizedByRole, reason, timestamp
 * @returns {Promise<Buffer>} PDF document as buffer
 */
export const generateRemovalProof = (removalData = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header - professional
      doc.fontSize(20).font('Helvetica-Bold').text('Late Record Removal Proof', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text('Official Audit Document - Keep for Records', { align: 'center', color: '#666666' });
      doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke();
      doc.moveDown(1);

      // Document Info
      doc.fontSize(11).font('Helvetica-Bold').text('Document Information');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Generated: ${new Date().toLocaleString()}`, { indent: 10 });
      doc.text(`Document ID: ${removalData.documentId || 'PDF-' + Date.now()}`, { indent: 10 });
      doc.moveDown(0.5);

      // Authorization Details
      doc.fontSize(11).font('Helvetica-Bold').text('Authorized By');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Faculty Name: ${removalData.authorizedBy || 'N/A'}`, { indent: 10 });
      const roleDisplay = removalData.authorizedByRole ? removalData.authorizedByRole.charAt(0).toUpperCase() + removalData.authorizedByRole.slice(1) : 'Unknown';
      doc.text(`Faculty Role: ${roleDisplay}`, { indent: 10 });
      doc.text(`Faculty Email: ${removalData.authorizedByEmail || 'N/A'}`, { indent: 10 });
      doc.text(`Authorization Date: ${new Date(removalData.timestamp || Date.now()).toLocaleString()}`, { indent: 10 });
      doc.moveDown(0.5);

      // Removal Reason
      doc.fontSize(11).font('Helvetica-Bold').text('Removal Reason');
      doc.fontSize(10).font('Helvetica');
      const reason = removalData.reason || 'No reason provided';
      doc.text(reason, { indent: 10, align: 'left', width: 475 });
      doc.moveDown(0.5);

      // Affected Records Summary
      doc.fontSize(11).font('Helvetica-Bold').text('Removal Summary');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Records Removed: ${removalData.removalRecords?.length || 0}`, { indent: 10 });
      doc.text(`Total Late Days Reduced: ${removalData.totalLateDaysRemoved || 0}`, { indent: 10 });
      doc.text(`Total Fines Refunded: Rs.${removalData.totalFinesRefunded || 0}`, { indent: 10 });
      doc.moveDown(0.8);

      // Detailed Records Table
      if (removalData.removalRecords && removalData.removalRecords.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('Detailed Removal Records');
        doc.moveDown(0.3);

        // Table header with better styling
        const tableTop = doc.y;
        const col1Width = 100;
        const col2Width = 200;
        const col3Width = 175;
        
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Roll No', 50, tableTop, { width: col1Width, align: 'left' });
        doc.text('Student Name', 50 + col1Width, tableTop, { width: col2Width, align: 'left' });
        doc.text('Date Removed', 50 + col1Width + col2Width, tableTop, { width: col3Width, align: 'left' });

        // Draw line under header
        doc.moveTo(40, tableTop + 18).lineTo(555, tableTop + 18).stroke();
        doc.moveDown(0.8);

        // Table rows
        doc.fontSize(8).font('Helvetica');
        removalData.removalRecords.forEach((record, index) => {
          const rowY = doc.y;
          
          // Ensure data is displayed
          const rollNo = record.rollNo ? String(record.rollNo).trim() : 'N/A';
          const studentName = record.name ? String(record.name).trim() : 'N/A';
          const dateRemoved = record.date ? new Date(record.date).toLocaleString() : 'N/A';
          
          doc.text(rollNo, 50, rowY, { width: col1Width, align: 'left' });
          doc.text(studentName, 50 + col1Width, rowY, { width: col2Width, align: 'left' });
          doc.text(dateRemoved, 50 + col1Width + col2Width, rowY, { width: col3Width, align: 'left' });
          doc.moveDown(0.6);

          // Alternate row background
          if (index % 2 === 0) {
            const currentY = rowY;
            const height = 16;
            doc.rect(40, currentY - 2, 515, height).fillOpacity(0.02).fill('#cccccc');
          }
        });

        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.8);
      }

      // Footer with signature line
      doc.fontSize(10).font('Helvetica-Bold').text('Official Acknowledgment', { align: 'left' });
      doc.moveDown(1.5);
      doc.fontSize(9).font('Helvetica').text('Authorized Officer Signature: ________________________', { align: 'left' });
      doc.moveDown(0.2);
      doc.fontSize(8).font('Helvetica').text('(For Official Use Only - Print & File)', { align: 'left', color: '#999999' });

      // Final disclaimer
      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica').fillColor('#666666').text(
        'This document is a proof of late record removal from the Student Late Tracking System. ' +
        'It is generated automatically and serves as an official record. ' +
        'Keep this document safe for auditing and verification purposes.',
        { align: 'center', width: 475 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate a PDF audit trail report for all removal actions
 * @param {Object} auditData - Contains logs array, totalCount, dateRange, generatedBy
 * @returns {Promise<Buffer>} PDF document as buffer
 */
export const generateAuditTrailPDF = (auditData = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header - professional
      doc.fontSize(22).font('Helvetica-Bold').text('Audit Trail Report', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text('Complete Removal History - Official Document', { align: 'center', color: '#666666' });
      doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke();
      doc.moveDown(1);

      // Report Info
      doc.fontSize(11).font('Helvetica-Bold').text('Report Information');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Generated: ${new Date().toLocaleString()}`, { indent: 10 });
      doc.text(`Generated By: ${auditData.generatedBy || 'System Administrator'}`, { indent: 10 });
      doc.text(`Total Records: ${auditData.totalCount || 0}`, { indent: 10 });
      doc.text(`Report Type: Complete Audit Trail`, { indent: 10 });
      doc.moveDown(1);

      // Watermark/Badge
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#2563eb')
         .text('[LOCKED] READ-ONLY | NON-EDITABLE RECORD', { align: 'center' });
      doc.fillColor('#000000');
      doc.moveDown(1);

      const logs = auditData.logs || [];

      if (logs.length === 0) {
        doc.fontSize(11).font('Helvetica').text('No audit records found.', { align: 'center' });
      } else {
        // Summary Statistics
        const totalRecordsRemoved = logs.reduce((sum, log) => sum + (log.details?.recordsRemoved || 0), 0);
        const totalFinesRefunded = logs.reduce((sum, log) => {
          const changes = log.details?.changes;
          if (changes && changes.fines) {
            return sum + (changes.fines.from - changes.fines.to);
          }
          return sum;
        }, 0);

        doc.fontSize(11).font('Helvetica-Bold').text('Summary Statistics');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Removal Actions: ${logs.length}`, { indent: 10 });
        doc.text(`Total Late Records Removed: ${totalRecordsRemoved}`, { indent: 10 });
        doc.text(`Total Fines Refunded: Rs.${totalFinesRefunded}`, { indent: 10 });
        doc.moveDown(1);

        // Detailed Audit Log Entries
        doc.fontSize(11).font('Helvetica-Bold').text('Detailed Audit Log');
        doc.moveDown(0.5);

        logs.forEach((log, index) => {
          // Check page space, add new page if needed
          if (doc.y > 700) {
            doc.addPage();
            doc.fontSize(11).font('Helvetica-Bold').text('Detailed Audit Log (continued)', { align: 'left' });
            doc.moveDown(0.5);
          }

          const startY = doc.y;
          
          // Entry header with number
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af');
          doc.text(`Entry #${index + 1}`, { continued: false });
          doc.fillColor('#000000');
          doc.moveDown(0.3);

          // Entry details
          doc.fontSize(9).font('Helvetica');
          const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
          const performedBy = log.performedBy?.facultyName || 'Unknown';
          const performedByEmail = log.performedBy?.facultyEmail || 'N/A';
          const studentName = log.targetStudent?.name || 'N/A';
          const rollNo = log.targetStudent?.rollNo || 'N/A';
          const recordsRemoved = log.details?.recordsRemoved || 0;
          const reason = log.reason || 'No reason provided';
          
          const fineChange = log.details?.changes?.fines 
            ? (log.details.changes.fines.from - log.details.changes.fines.to) 
            : 0;

          doc.text(`Date & Time: ${timestamp}`, { indent: 10 });
          doc.text(`Performed By: ${performedBy} (${performedByEmail})`, { indent: 10 });
          doc.text(`Student: ${studentName} (Roll No: ${rollNo})`, { indent: 10 });
          doc.text(`Records Removed: ${recordsRemoved}`, { indent: 10 });
          doc.text(`Fine Impact: Rs.${fineChange}`, { indent: 10 });
          doc.fontSize(9).font('Helvetica-Bold').text('Reason:', { indent: 10 });
          doc.fontSize(8).font('Helvetica').text(reason, { indent: 20, width: 455 });
          
          // Separator line
          doc.moveDown(0.3);
          doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#cccccc').stroke();
          doc.strokeColor('#000000');
          doc.moveDown(0.5);
        });
      }

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#666666');
      const footerY = doc.page.height - 60;
      doc.text(
        'This audit trail is an official immutable record generated by the Student Late Tracking System. ' +
        'All removal actions are logged automatically for compliance and verification purposes.',
        40, footerY, { align: 'center', width: 475 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default { generateRemovalProof, generateAuditTrailPDF };
