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
      doc.text(`Total Fines Refunded: ₹${removalData.totalFinesRefunded || 0}`, { indent: 10 });
      doc.moveDown(0.8);

      // Detailed Records Table
      if (removalData.removalRecords && removalData.removalRecords.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('Detailed Removal Records');
        doc.moveDown(0.3);

        // Table header
        const tableTop = doc.y;
        const colWidth = 475 / 3;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Roll No', 50, tableTop, { width: colWidth, align: 'left' });
        doc.text('Student Name', 50 + colWidth, tableTop, { width: colWidth, align: 'left' });
        doc.text('Date Removed', 50 + colWidth * 2, tableTop, { width: colWidth, align: 'left' });

        // Draw line under header
        doc.moveTo(40, tableTop + 18).lineTo(555, tableTop + 18).stroke();
        doc.moveDown(0.8);

        // Table rows
        doc.fontSize(8).font('Helvetica');
        removalData.removalRecords.forEach((record, index) => {
          const rowY = doc.y;
          doc.text(record.rollNo || 'N/A', 50, rowY, { width: colWidth, align: 'left' });
          doc.text(record.name || 'N/A', 50 + colWidth, rowY, { width: colWidth, align: 'left' });
          doc.text(record.date ? new Date(record.date).toLocaleString() : 'N/A', 50 + colWidth * 2, rowY, { width: colWidth, align: 'left' });
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

export default { generateRemovalProof };
