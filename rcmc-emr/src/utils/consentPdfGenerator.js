/**
 * Consent PDF Generator
 * 
 * Generates professional PDF documents for patient consent records
 * for the Clinical Safety Trio feature.
 * 
 * Requirements: 2.8
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generate consent PDF document
 * 
 * @param {Object} options - PDF generation options
 * @param {Object} options.consentRecord - Consent record from database
 * @param {Object} options.patientInfo - Patient information
 * @param {Object} options.witnessInfo - Witness user profile
 * @param {boolean} options.includeSignature - Include signature image (default: true)
 * @param {boolean} options.includeWatermark - Include watermark (default: false)
 * @param {string} options.clinicName - Clinic name (default: 'RCMC Medical Clinic')
 * @param {string} options.clinicAddress - Clinic address
 * @param {string} options.clinicContact - Clinic contact information
 * @returns {Promise<Blob>} PDF blob
 */
export const generateConsentPDF = async (options) => {
  const {
    consentRecord,
    patientInfo,
    witnessInfo,
    includeSignature = true,
    includeWatermark = false,
    clinicName = 'RCMC Medical Clinic',
    clinicAddress = '',
    clinicContact = ''
  } = options;

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addWrappedText = (text, fontSize = 10, fontStyle = 'normal', maxWidth = contentWidth) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach(line => {
      checkPageBreak(7);
      doc.text(line, margin, yPos);
      yPos += 6;
    });
  };

  // Add watermark if requested
  if (includeWatermark) {
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.text('COPY', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.setTextColor(0, 0, 0);
  }

  // === HEADER SECTION ===
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(clinicName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  if (clinicAddress) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(clinicAddress, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }

  if (clinicContact) {
    doc.setFontSize(9);
    doc.text(clinicContact, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }

  yPos += 5;

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Document title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT CONSENT FORM', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // === CONSENT TYPE SECTION ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const consentTypeLabel = consentRecord.consent_type
    .replace(/_/g, ' ')
    .toUpperCase();
  doc.text(`Consent Type: ${consentTypeLabel}`, margin, yPos);
  yPos += 10;

  // === PATIENT INFORMATION SECTION ===
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT INFORMATION', margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const patientFields = [
    { label: 'Name', value: `${patientInfo.first_name} ${patientInfo.last_name}` },
    { label: 'Patient Number', value: patientInfo.patient_number },
    { label: 'Date of Birth', value: new Date(patientInfo.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
    { label: 'Contact Number', value: patientInfo.contact_number || 'N/A' }
  ];

  patientFields.forEach(field => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${field.label}:`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(field.value, margin + 40, yPos);
    yPos += 6;
  });

  yPos += 5;

  // === CONSENT STATEMENT SECTION ===
  checkPageBreak(30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSENT STATEMENT', margin, yPos);
  yPos += 7;

  // Language indicator
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const languageLabel = consentRecord.language === 'en' ? 'English' : 'Filipino';
  doc.text(`Language: ${languageLabel}`, margin, yPos);
  yPos += 7;

  // Consent text in box
  const boxY = yPos;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const consentLines = doc.splitTextToSize(consentRecord.consent_text, contentWidth - 10);
  
  // Calculate box height
  const lineHeight = 5;
  const boxHeight = (consentLines.length * lineHeight) + 10;
  
  // Check if box fits on current page
  if (yPos + boxHeight > pageHeight - margin) {
    doc.addPage();
    yPos = margin;
  }

  // Draw box
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, contentWidth, boxHeight);

  // Add text inside box
  yPos += 7;
  consentLines.forEach(line => {
    doc.text(line, margin + 5, yPos);
    yPos += lineHeight;
  });

  yPos += 10;

  // === SIGNATURE SECTION ===
  checkPageBreak(50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT SIGNATURE', margin, yPos);
  yPos += 7;

  if (includeSignature && consentRecord.signature_data) {
    try {
      // Add signature image
      const signatureWidth = 80;
      const signatureHeight = 30;
      
      doc.addImage(
        consentRecord.signature_data,
        'PNG',
        margin,
        yPos,
        signatureWidth,
        signatureHeight
      );
      yPos += signatureHeight + 5;
    } catch (error) {
      console.error('Failed to add signature image:', error);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('[Signature image not available]', margin, yPos);
      yPos += 10;
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('[Signature not included in this copy]', margin, yPos);
    yPos += 10;
  }

  // Signature line
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, margin + 80, yPos);
  yPos += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Patient Signature', margin, yPos);
  yPos += 10;

  // === CONSENT DETAILS SECTION ===
  checkPageBreak(30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSENT DETAILS', margin, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const consentDetails = [
    { label: 'Consent Date', value: new Date(consentRecord.consent_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
    { label: 'Expiration Date', value: new Date(consentRecord.expiration_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
    { label: 'Status', value: consentRecord.consent_status.toUpperCase() },
    { label: 'Consent ID', value: consentRecord.id }
  ];

  consentDetails.forEach(detail => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${detail.label}:`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(detail.value, margin + 40, yPos);
    yPos += 6;
  });

  yPos += 5;

  // === WITNESS SECTION ===
  checkPageBreak(25);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('WITNESSED BY', margin, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const witnessFields = [
    { label: 'Name', value: `${witnessInfo.first_name} ${witnessInfo.last_name}` },
    { label: 'Role', value: witnessInfo.role || 'Healthcare Staff' },
    { label: 'Date', value: new Date(consentRecord.consent_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }
  ];

  witnessFields.forEach(field => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${field.label}:`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(field.value, margin + 40, yPos);
    yPos += 6;
  });

  yPos += 10;

  // === QR CODE SECTION ===
  checkPageBreak(40);
  try {
    // Generate QR code with consent verification URL
    const verificationUrl = `${window.location.origin}/verify-consent/${consentRecord.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 1
    });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFICATION QR CODE', margin, yPos);
    yPos += 5;

    doc.addImage(qrCodeDataUrl, 'PNG', margin, yPos, 30, 30);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Scan to verify consent authenticity', margin + 35, yPos + 15);
    yPos += 35;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
  }

  // === FOOTER SECTION ===
  const addFooter = (pageNum, totalPages) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    
    // Left footer - generation timestamp
    doc.text(
      `Generated: ${new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`,
      margin,
      pageHeight - 10
    );
    
    // Center footer - confidentiality notice
    doc.text(
      'CONFIDENTIAL MEDICAL RECORD',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Right footer - page number
    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
    
    doc.setTextColor(0, 0, 0);
  };

  // Add footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Return PDF as blob
  return doc.output('blob');
};

/**
 * Download consent PDF
 * 
 * @param {Blob} pdfBlob - PDF blob from generateConsentPDF
 * @param {string} filename - Filename for download
 */
export const downloadConsentPDF = (pdfBlob, filename) => {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate filename for consent PDF
 * 
 * @param {Object} consentRecord - Consent record
 * @param {Object} patientInfo - Patient information
 * @returns {string} Filename
 */
export const generateConsentFilename = (consentRecord, patientInfo) => {
  const date = new Date(consentRecord.consent_date).toISOString().split('T')[0];
  const patientName = `${patientInfo.last_name}_${patientInfo.first_name}`.replace(/\s+/g, '_');
  const consentType = consentRecord.consent_type;
  return `Consent_${consentType}_${patientName}_${date}.pdf`;
};
