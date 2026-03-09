import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/**
 * Export Service
 * 
 * Provides data export functionality for the analytics dashboard.
 * Supports PDF, Excel, and CSV formats with proper formatting and metadata.
 * 
 * Validates: Requirements 7.2-7.10, 14.1-14.5, 14.10
 */

/**
 * Generate filename with timestamp
 * Format: RCMC_Analytics_Report_YYYY-MM-DD_HHMMSS.ext
 * 
 * @param {string} format - File format (pdf, xlsx, csv)
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {string} Formatted filename
 * 
 * Validates: Requirements 7.6, 7.7, 7.8
 */
export function generateFilename(format, dateRange) {
  const now = new Date();
  
  // Format date as YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Format time as HHMMSS
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}${minutes}${seconds}`;
  
  return `RCMC_Analytics_Report_${dateStr}_${timeStr}.${format}`;
}

/**
 * Format date range for display
 */
function formatDateRange(dateRange) {
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

/**
 * Get metadata headers
 */
function getMetadataHeaders(dateRange) {
  const now = new Date();
  const exportDate = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return {
    hospitalName: 'RCMC Hospital',
    exportDate,
    dateRange: formatDateRange(dateRange)
  };
}

/**
 * Export dashboard data to PDF
 * 
 * @param {Object} data - Dashboard data (metrics, chartData)
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Promise<Blob>} PDF blob
 * 
 * Validates: Requirements 7.3, 7.9, 14.5
 */
export async function exportToPDF(data, dateRange) {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;
    
    const metadata = getMetadataHeaders(dateRange);
    
    // Add hospital branding
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(metadata.hospitalName, margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(16);
    pdf.text('Analytics Report', margin, yPosition);
    yPosition += 8;
    
    // Add metadata
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Export Date: ${metadata.exportDate}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Period: ${metadata.dateRange}`, margin, yPosition);
    yPosition += 10;
    
    // Add KPI Metrics section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Performance Indicators', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    if (data.metrics) {
      const kpis = [
        { label: 'Total Patients', value: data.metrics.totalPatients?.current || 0, change: data.metrics.totalPatients?.changePercentage || 0 },
        { label: 'Bed Occupancy Rate', value: `${data.metrics.bedOccupancy?.current || 0}%`, change: data.metrics.bedOccupancy?.changePercentage || 0 },
        { label: 'Patient Satisfaction', value: `${data.metrics.patientSatisfaction?.current || 0}/5.0`, change: data.metrics.patientSatisfaction?.changePercentage || 0 },
        { label: 'Total Revenue', value: `₱${(data.metrics.totalRevenue?.current || 0).toLocaleString()}`, change: data.metrics.totalRevenue?.changePercentage || 0 }
      ];
      
      kpis.forEach(kpi => {
        const changeStr = kpi.change >= 0 ? `+${kpi.change.toFixed(1)}%` : `${kpi.change.toFixed(1)}%`;
        pdf.text(`${kpi.label}: ${kpi.value} (${changeStr})`, margin, yPosition);
        yPosition += 6;
      });
    }
    
    yPosition += 5;
    
    // Add chart data sections
    if (data.chartData) {
      // Patient Distribution
      if (data.chartData.patientDistribution && data.chartData.patientDistribution.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Patient Distribution by Department', margin, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        data.chartData.patientDistribution.forEach(dept => {
          pdf.text(`${dept.department}: ${dept.count} patients (${dept.percentage}%)`, margin, yPosition);
          yPosition += 6;
        });
        
        yPosition += 5;
      }
      
      // Revenue Trend
      if (data.chartData.revenueTrend && data.chartData.revenueTrend.length > 0) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Revenue Trend', margin, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        data.chartData.revenueTrend.slice(-6).forEach(item => {
          pdf.text(`${item.period}: ₱${item.revenue.toLocaleString()}`, margin, yPosition);
          yPosition += 6;
        });
        
        yPosition += 5;
      }
      
      // Expense Breakdown
      if (data.chartData.expenseBreakdown && data.chartData.expenseBreakdown.length > 0) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Expense Breakdown', margin, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const totalExpenses = data.chartData.expenseBreakdown.reduce((sum, exp) => sum + exp.amount, 0);
        pdf.text(`Total Expenses: ₱${totalExpenses.toLocaleString()}`, margin, yPosition);
        yPosition += 8;
        
        data.chartData.expenseBreakdown.forEach(exp => {
          pdf.text(`${exp.category}: ₱${exp.amount.toLocaleString()} (${exp.percentage}%)`, margin, yPosition);
          yPosition += 6;
        });
        
        yPosition += 5;
      }
      
      // Performance Comparison
      if (data.chartData.performanceComparison) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Performance Metrics', margin, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const hospital = data.chartData.performanceComparison.hospital;
        const baseline = data.chartData.performanceComparison.baseline;
        
        const metrics = [
          { label: 'Patient Satisfaction', hospital: hospital.patientSatisfaction, baseline: baseline.patientSatisfaction },
          { label: 'Recovery Rate', hospital: hospital.recoveryRate, baseline: baseline.recoveryRate },
          { label: 'Emergency Response', hospital: hospital.emergencyResponse, baseline: baseline.emergencyResponse },
          { label: 'Follow-up Rate', hospital: hospital.followUpRate, baseline: baseline.followUpRate },
          { label: 'Treatment Success', hospital: hospital.treatmentSuccess, baseline: baseline.treatmentSuccess }
        ];
        
        metrics.forEach(metric => {
          pdf.text(`${metric.label}: ${metric.hospital.toFixed(1)}/5.0 (Avg: ${metric.baseline.toFixed(1)}/5.0)`, margin, yPosition);
          yPosition += 6;
        });
      }
    }
    
    // Add footer
    const footerY = pageHeight - 10;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Generated by RCMC Analytics Dashboard', margin, footerY);
    
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Export dashboard data to Excel
 * 
 * @param {Object} data - Dashboard data (metrics, chartData)
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Promise<Blob>} Excel blob
 * 
 * Validates: Requirements 7.4, 7.7, 14.3, 14.4
 */
export async function exportToExcel(data, dateRange) {
  try {
    const workbook = XLSX.utils.book_new();
    const metadata = getMetadataHeaders(dateRange);
    
    // KPIs Sheet
    const kpisData = [
      ['RCMC Hospital - Analytics Report'],
      [`Export Date: ${metadata.exportDate}`],
      [`Period: ${metadata.dateRange}`],
      [],
      ['Key Performance Indicators'],
      ['Metric', 'Current Value', 'Previous Value', 'Change', 'Change %']
    ];
    
    if (data.metrics) {
      kpisData.push(
        ['Total Patients', data.metrics.totalPatients?.current || 0, data.metrics.totalPatients?.previous || 0, data.metrics.totalPatients?.change || 0, data.metrics.totalPatients?.changePercentage || 0],
        ['Bed Occupancy Rate (%)', data.metrics.bedOccupancy?.current || 0, data.metrics.bedOccupancy?.previous || 0, data.metrics.bedOccupancy?.change || 0, data.metrics.bedOccupancy?.changePercentage || 0],
        ['Patient Satisfaction', data.metrics.patientSatisfaction?.current || 0, data.metrics.patientSatisfaction?.previous || 0, data.metrics.patientSatisfaction?.change || 0, data.metrics.patientSatisfaction?.changePercentage || 0],
        ['Total Revenue (₱)', data.metrics.totalRevenue?.current || 0, data.metrics.totalRevenue?.previous || 0, data.metrics.totalRevenue?.change || 0, data.metrics.totalRevenue?.changePercentage || 0]
      );
    }
    
    const kpisSheet = XLSX.utils.aoa_to_sheet(kpisData);
    XLSX.utils.book_append_sheet(workbook, kpisSheet, 'KPIs');
    
    // Revenue Sheet
    if (data.chartData?.revenueTrend) {
      const revenueData = [
        ['Revenue Trend'],
        ['Period', 'Revenue (₱)']
      ];
      
      data.chartData.revenueTrend.forEach(item => {
        revenueData.push([item.period, item.revenue]);
      });
      
      const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue');
    }
    
    // Expenses Sheet
    if (data.chartData?.expenseBreakdown) {
      const expensesData = [
        ['Expense Breakdown'],
        ['Category', 'Amount (₱)', 'Percentage (%)']
      ];
      
      data.chartData.expenseBreakdown.forEach(exp => {
        expensesData.push([exp.category, exp.amount, exp.percentage]);
      });
      
      const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');
    }
    
    // Performance Sheet
    if (data.chartData?.performanceComparison) {
      const performanceData = [
        ['Performance Metrics'],
        ['Metric', 'Your Hospital', 'Average Hospital']
      ];
      
      const hospital = data.chartData.performanceComparison.hospital;
      const baseline = data.chartData.performanceComparison.baseline;
      
      performanceData.push(
        ['Patient Satisfaction', hospital.patientSatisfaction, baseline.patientSatisfaction],
        ['Recovery Rate', hospital.recoveryRate, baseline.recoveryRate],
        ['Emergency Response', hospital.emergencyResponse, baseline.emergencyResponse],
        ['Follow-up Rate', hospital.followUpRate, baseline.followUpRate],
        ['Treatment Success', hospital.treatmentSuccess, baseline.treatmentSuccess]
      );
      
      const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
      XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Performance');
    }
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error(`Failed to generate Excel: ${error.message}`);
  }
}

/**
 * Escape CSV special characters (RFC 4180 compliant)
 * 
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 * 
 * Validates: Requirements 14.1, 14.2
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Export dashboard data to CSV
 * 
 * @param {Object} data - Dashboard data (metrics, chartData)
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Promise<Blob>} CSV blob
 * 
 * Validates: Requirements 7.5, 14.1, 14.2, 14.10
 */
export async function exportToCSV(data, dateRange) {
  try {
    const metadata = getMetadataHeaders(dateRange);
    let csv = '';
    
    // Add metadata headers
    csv += `${escapeCSV('RCMC Hospital - Analytics Report')}\n`;
    csv += `${escapeCSV('Export Date')},${escapeCSV(metadata.exportDate)}\n`;
    csv += `${escapeCSV('Period')},${escapeCSV(metadata.dateRange)}\n`;
    csv += '\n';
    
    // KPIs section
    csv += `${escapeCSV('Key Performance Indicators')}\n`;
    csv += `${escapeCSV('Metric')},${escapeCSV('Current Value')},${escapeCSV('Previous Value')},${escapeCSV('Change')},${escapeCSV('Change %')}\n`;
    
    if (data.metrics) {
      csv += `${escapeCSV('Total Patients')},${escapeCSV(data.metrics.totalPatients?.current || 0)},${escapeCSV(data.metrics.totalPatients?.previous || 0)},${escapeCSV(data.metrics.totalPatients?.change || 0)},${escapeCSV(data.metrics.totalPatients?.changePercentage || 0)}\n`;
      csv += `${escapeCSV('Bed Occupancy Rate (%)')},${escapeCSV(data.metrics.bedOccupancy?.current || 0)},${escapeCSV(data.metrics.bedOccupancy?.previous || 0)},${escapeCSV(data.metrics.bedOccupancy?.change || 0)},${escapeCSV(data.metrics.bedOccupancy?.changePercentage || 0)}\n`;
      csv += `${escapeCSV('Patient Satisfaction')},${escapeCSV(data.metrics.patientSatisfaction?.current || 0)},${escapeCSV(data.metrics.patientSatisfaction?.previous || 0)},${escapeCSV(data.metrics.patientSatisfaction?.change || 0)},${escapeCSV(data.metrics.patientSatisfaction?.changePercentage || 0)}\n`;
      csv += `${escapeCSV('Total Revenue (₱)')},${escapeCSV(data.metrics.totalRevenue?.current || 0)},${escapeCSV(data.metrics.totalRevenue?.previous || 0)},${escapeCSV(data.metrics.totalRevenue?.change || 0)},${escapeCSV(data.metrics.totalRevenue?.changePercentage || 0)}\n`;
    }
    
    csv += '\n';
    
    // Patient Distribution section
    if (data.chartData?.patientDistribution) {
      csv += `${escapeCSV('Patient Distribution by Department')}\n`;
      csv += `${escapeCSV('Department')},${escapeCSV('Count')},${escapeCSV('Percentage (%)')}\n`;
      
      data.chartData.patientDistribution.forEach(dept => {
        csv += `${escapeCSV(dept.department)},${escapeCSV(dept.count)},${escapeCSV(dept.percentage)}\n`;
      });
      
      csv += '\n';
    }
    
    // Revenue Trend section
    if (data.chartData?.revenueTrend) {
      csv += `${escapeCSV('Revenue Trend')}\n`;
      csv += `${escapeCSV('Period')},${escapeCSV('Revenue (₱)')}\n`;
      
      data.chartData.revenueTrend.forEach(item => {
        csv += `${escapeCSV(item.period)},${escapeCSV(item.revenue)}\n`;
      });
      
      csv += '\n';
    }
    
    // Expense Breakdown section
    if (data.chartData?.expenseBreakdown) {
      csv += `${escapeCSV('Expense Breakdown')}\n`;
      csv += `${escapeCSV('Category')},${escapeCSV('Amount (₱)')},${escapeCSV('Percentage (%)')}\n`;
      
      data.chartData.expenseBreakdown.forEach(exp => {
        csv += `${escapeCSV(exp.category)},${escapeCSV(exp.amount)},${escapeCSV(exp.percentage)}\n`;
      });
      
      csv += '\n';
    }
    
    // Performance Metrics section
    if (data.chartData?.performanceComparison) {
      csv += `${escapeCSV('Performance Metrics')}\n`;
      csv += `${escapeCSV('Metric')},${escapeCSV('Your Hospital')},${escapeCSV('Average Hospital')}\n`;
      
      const hospital = data.chartData.performanceComparison.hospital;
      const baseline = data.chartData.performanceComparison.baseline;
      
      csv += `${escapeCSV('Patient Satisfaction')},${escapeCSV(hospital.patientSatisfaction)},${escapeCSV(baseline.patientSatisfaction)}\n`;
      csv += `${escapeCSV('Recovery Rate')},${escapeCSV(hospital.recoveryRate)},${escapeCSV(baseline.recoveryRate)}\n`;
      csv += `${escapeCSV('Emergency Response')},${escapeCSV(hospital.emergencyResponse)},${escapeCSV(baseline.emergencyResponse)}\n`;
      csv += `${escapeCSV('Follow-up Rate')},${escapeCSV(hospital.followUpRate)},${escapeCSV(baseline.followUpRate)}\n`;
      csv += `${escapeCSV('Treatment Success')},${escapeCSV(hospital.treatmentSuccess)},${escapeCSV(baseline.treatmentSuccess)}\n`;
    }
    
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw new Error(`Failed to generate CSV: ${error.message}`);
  }
}

/**
 * Download blob as file
 */
export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ==================== DOCTOR REVENUE REPORT EXPORTS ====================

/**
 * Generate filename for doctor revenue report
 * Format: doctor-revenue-report-YYYY-MM-DD-to-YYYY-MM-DD.ext
 * 
 * @param {string} format - File format (pdf, xlsx, csv)
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {string} Formatted filename
 * 
 * Validates: Requirements 5.5
 */
export function generateRevenueReportFilename(format, dateRange) {
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDate = formatDate(dateRange.startDate);
  const endDate = formatDate(dateRange.endDate);
  
  return `doctor-revenue-report-${startDate}-to-${endDate}.${format}`;
}

/**
 * Export doctor revenue report to CSV
 * 
 * @param {Object} data - Revenue report data from getRevenueReport()
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Promise<Blob>} CSV blob
 * 
 * Validates: Requirements 5.2, 5.7, 14.1, 14.2
 */
export async function exportRevenueReportCSV(data, dateRange) {
  try {
    let csv = '';
    
    // Add metadata headers
    csv += `${escapeCSV('RCMC Hospital - Doctor Revenue Sharing Report')}\n`;
    csv += `${escapeCSV('Export Date')},${escapeCSV(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}\n`;
    csv += `${escapeCSV('Period')},${escapeCSV(formatDateRange(dateRange))}\n`;
    csv += `${escapeCSV('Revenue Split')},${escapeCSV('60% Doctor / 40% Clinic')}\n`;
    csv += '\n';
    
    // Summary Statistics section
    csv += `${escapeCSV('Summary Statistics')}\n`;
    csv += `${escapeCSV('Metric')},${escapeCSV('Value')}\n`;
    csv += `${escapeCSV('Total Consultations')},${escapeCSV(data.summary.totalConsultations)}\n`;
    csv += `${escapeCSV('Total Revenue')},${escapeCSV('₱' + data.summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}\n`;
    csv += `${escapeCSV('Total Doctor Share (60%)')},${escapeCSV('₱' + data.summary.totalDoctorShare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}\n`;
    csv += `${escapeCSV('Total Clinic Share (40%)')},${escapeCSV('₱' + data.summary.totalClinicShare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}\n`;
    csv += `${escapeCSV('Data Quality Score')},${escapeCSV(data.dataQualityScore.toFixed(1) + '%')}\n`;
    csv += '\n';
    
    // Per-Doctor Revenue Breakdown section
    csv += `${escapeCSV('Per-Doctor Revenue Breakdown')}\n`;
    csv += `${escapeCSV('Doctor Name')},${escapeCSV('Specialization')},${escapeCSV('Consultations')},${escapeCSV('Consultation Fees')},${escapeCSV('Procedures')},${escapeCSV('Services')},${escapeCSV('Medicine')},${escapeCSV('Labs')},${escapeCSV('Other')},${escapeCSV('Total Revenue')},${escapeCSV('Doctor Share (60%)')},${escapeCSV('Clinic Share (40%)')}\n`;
    
    data.doctors.forEach(doctor => {
      csv += `${escapeCSV(doctor.doctorName)},`;
      csv += `${escapeCSV(doctor.specialization)},`;
      csv += `${escapeCSV(doctor.consultationCount)},`;
      csv += `${escapeCSV('₱' + doctor.revenueByCategory.consultationFees.total.toFixed(2))},`;
      csv += `${escapeCSV('₱' + doctor.revenueByCategory.procedures.total.toFixed(2))},`;
      csv += `${escapeCSV('₱' + doctor.revenueByCategory.services.total.toFixed(2))},`;
      csv += `${escapeCSV('₱' + doctor.revenueByCategory.medicine.total.toFixed(2))},`;
      csv += `${escapeCSV('₱' + doctor.revenueByCategory.labs.total.toFixed(2))},`;
      csv += `${escapeCSV('₱' + doctor.revenueByCategory.other.total.toFixed(2))},`;
      csv += `${escapeCSV('₱' + doctor.totalRevenue.toFixed(2))},`;
      csv += `${escapeCSV('₱' + doctor.doctorShare.toFixed(2))},`;
      csv += `${escapeCSV('₱' + doctor.clinicShare.toFixed(2))}\n`;
    });
    
    csv += '\n';
    
    // Detailed Category Breakdown section
    csv += `${escapeCSV('Detailed Category Breakdown by Doctor')}\n`;
    csv += `${escapeCSV('Doctor Name')},${escapeCSV('Category')},${escapeCSV('Total Revenue')},${escapeCSV('Doctor Share (60%)')},${escapeCSV('Clinic Share (40%)')}\n`;
    
    data.doctors.forEach(doctor => {
      const categories = [
        { name: 'Consultation Fees', data: doctor.revenueByCategory.consultationFees },
        { name: 'Procedures', data: doctor.revenueByCategory.procedures },
        { name: 'Services', data: doctor.revenueByCategory.services },
        { name: 'Medicine', data: doctor.revenueByCategory.medicine },
        { name: 'Labs', data: doctor.revenueByCategory.labs },
        { name: 'Other', data: doctor.revenueByCategory.other }
      ];
      
      categories.forEach(category => {
        if (category.data.total > 0) {
          csv += `${escapeCSV(doctor.doctorName)},`;
          csv += `${escapeCSV(category.name)},`;
          csv += `${escapeCSV('₱' + category.data.total.toFixed(2))},`;
          csv += `${escapeCSV('₱' + category.data.doctorShare.toFixed(2))},`;
          csv += `${escapeCSV('₱' + category.data.clinicShare.toFixed(2))}\n`;
        }
      });
    });
    
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  } catch (error) {
    console.error('Error generating revenue report CSV:', error);
    throw new Error(`Failed to generate CSV: ${error.message}`);
  }
}

/**
 * Export doctor revenue report to PDF
 * 
 * @param {Object} data - Revenue report data from getRevenueReport()
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Promise<Blob>} PDF blob
 * 
 * Validates: Requirements 5.3
 */
export async function exportRevenueReportPDF(data, dateRange) {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;
    
    // Add hospital branding
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RCMC Hospital', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(16);
    pdf.text('Doctor Revenue Sharing Report', margin, yPosition);
    yPosition += 8;
    
    // Add metadata
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Period: ${formatDateRange(dateRange)}`, margin, yPosition);
    yPosition += 5;
    pdf.text('Revenue Split: 60% Doctor / 40% Clinic', margin, yPosition);
    yPosition += 10;
    
    // Add Summary Statistics section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary Statistics', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Consultations: ${data.summary.totalConsultations}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Total Revenue: ₱${data.summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Total Doctor Share (60%): ₱${data.summary.totalDoctorShare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Total Clinic Share (40%): ₱${data.summary.totalClinicShare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Data Quality Score: ${data.dataQualityScore.toFixed(1)}%`, margin, yPosition);
    yPosition += 10;
    
    // Add Per-Doctor Revenue Breakdown section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Per-Doctor Revenue Breakdown', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    data.doctors.forEach((doctor, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Doctor header
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${doctor.doctorName} - ${doctor.specialization}`, margin, yPosition);
      yPosition += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Consultations: ${doctor.consultationCount}`, margin + 5, yPosition);
      yPosition += 5;
      
      // Revenue breakdown
      pdf.text(`Consultation Fees: ₱${doctor.revenueByCategory.consultationFees.total.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Procedures: ₱${doctor.revenueByCategory.procedures.total.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Services: ₱${doctor.revenueByCategory.services.total.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Medicine: ₱${doctor.revenueByCategory.medicine.total.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Labs: ₱${doctor.revenueByCategory.labs.total.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Other: ₱${doctor.revenueByCategory.other.total.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 5;
      
      // Totals
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Revenue: ₱${doctor.totalRevenue.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Doctor Share (60%): ₱${doctor.doctorShare.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 4;
      pdf.text(`Clinic Share (40%): ₱${doctor.clinicShare.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 8;
    });
    
    // Add footer on each page
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated by RCMC EMR - Page ${i} of ${totalPages}`, margin, pageHeight - 10);
    }
    
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating revenue report PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Export doctor revenue report to Excel
 * 
 * @param {Object} data - Revenue report data from getRevenueReport()
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Promise<Blob>} Excel blob
 * 
 * Validates: Requirements 5.4
 */
export async function exportRevenueReportExcel(data, dateRange) {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['RCMC Hospital - Doctor Revenue Sharing Report'],
      [`Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`],
      [`Period: ${formatDateRange(dateRange)}`],
      ['Revenue Split: 60% Doctor / 40% Clinic'],
      [],
      ['Summary Statistics'],
      ['Metric', 'Value'],
      ['Total Consultations', data.summary.totalConsultations],
      ['Total Revenue (₱)', data.summary.totalRevenue],
      ['Total Doctor Share (60%) (₱)', data.summary.totalDoctorShare],
      ['Total Clinic Share (40%) (₱)', data.summary.totalClinicShare],
      ['Data Quality Score (%)', data.dataQualityScore]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Per-Doctor Revenue Sheet
    const doctorData = [
      ['Per-Doctor Revenue Breakdown'],
      ['Doctor Name', 'Specialization', 'Consultations', 'Consultation Fees (₱)', 'Procedures (₱)', 'Services (₱)', 'Medicine (₱)', 'Labs (₱)', 'Other (₱)', 'Total Revenue (₱)', 'Doctor Share 60% (₱)', 'Clinic Share 40% (₱)']
    ];
    
    data.doctors.forEach(doctor => {
      doctorData.push([
        doctor.doctorName,
        doctor.specialization,
        doctor.consultationCount,
        doctor.revenueByCategory.consultationFees.total,
        doctor.revenueByCategory.procedures.total,
        doctor.revenueByCategory.services.total,
        doctor.revenueByCategory.medicine.total,
        doctor.revenueByCategory.labs.total,
        doctor.revenueByCategory.other.total,
        doctor.totalRevenue,
        doctor.doctorShare,
        doctor.clinicShare
      ]);
    });
    
    // Add totals row with formulas
    const startRow = 3; // Data starts at row 3 (0-indexed)
    const endRow = startRow + data.doctors.length - 1;
    doctorData.push([
      'TOTAL',
      '',
      { f: `SUM(C${startRow}:C${endRow})` },
      { f: `SUM(D${startRow}:D${endRow})` },
      { f: `SUM(E${startRow}:E${endRow})` },
      { f: `SUM(F${startRow}:F${endRow})` },
      { f: `SUM(G${startRow}:G${endRow})` },
      { f: `SUM(H${startRow}:H${endRow})` },
      { f: `SUM(I${startRow}:I${endRow})` },
      { f: `SUM(J${startRow}:J${endRow})` },
      { f: `SUM(K${startRow}:K${endRow})` },
      { f: `SUM(L${startRow}:L${endRow})` }
    ]);
    
    const doctorSheet = XLSX.utils.aoa_to_sheet(doctorData);
    XLSX.utils.book_append_sheet(workbook, doctorSheet, 'Doctor Revenue');
    
    // Detailed Category Breakdown Sheet
    const categoryData = [
      ['Detailed Category Breakdown by Doctor'],
      ['Doctor Name', 'Category', 'Total Revenue (₱)', 'Doctor Share 60% (₱)', 'Clinic Share 40% (₱)']
    ];
    
    data.doctors.forEach(doctor => {
      const categories = [
        { name: 'Consultation Fees', data: doctor.revenueByCategory.consultationFees },
        { name: 'Procedures', data: doctor.revenueByCategory.procedures },
        { name: 'Services', data: doctor.revenueByCategory.services },
        { name: 'Medicine', data: doctor.revenueByCategory.medicine },
        { name: 'Labs', data: doctor.revenueByCategory.labs },
        { name: 'Other', data: doctor.revenueByCategory.other }
      ];
      
      categories.forEach(category => {
        if (category.data.total > 0) {
          categoryData.push([
            doctor.doctorName,
            category.name,
            category.data.total,
            category.data.doctorShare,
            category.data.clinicShare
          ]);
        }
      });
    });
    
    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Breakdown');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error('Error generating revenue report Excel:', error);
    throw new Error(`Failed to generate Excel: ${error.message}`);
  }
}

export default {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  generateFilename,
  downloadFile,
  exportRevenueReportCSV,
  exportRevenueReportPDF,
  exportRevenueReportExcel,
  generateRevenueReportFilename
};
