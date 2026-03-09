/**
 * Export Service for Calendar Appointments View
 * Generates CSV files from appointment data
 */

/**
 * Export appointments to CSV file
 * @param {Array} appointments - Array of appointment objects
 * @param {Date} startDate - Start date of the week
 * @param {Date} endDate - End date of the week
 */
export const exportToCSV = (appointments, startDate, endDate) => {
  try {
    // CSV Header
    const headers = ['Date', 'Time', 'Patient Name', 'Doctor Name', 'Reason', 'Status', 'Booking Source']
    
    // Convert appointments to CSV rows
    const rows = appointments.map(apt => {
      const patientName = apt.patient 
        ? `${apt.patient.first_name} ${apt.patient.last_name}`
        : 'Unknown Patient'
      
      const doctorName = apt.doctor
        ? `Dr. ${apt.doctor.first_name} ${apt.doctor.last_name}`
        : 'Unknown Doctor'
      
      const bookingSource = apt.booking_source === 'online' ? 'Online' : 'Walk-in'
      
      // Escape fields that might contain commas or quotes
      const escapeCSV = (field) => {
        if (field === null || field === undefined) return ''
        const str = String(field)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }
      
      return [
        escapeCSV(apt.appointment_date),
        escapeCSV(apt.appointment_time),
        escapeCSV(patientName),
        escapeCSV(doctorName),
        escapeCSV(apt.reason),
        escapeCSV(apt.status),
        escapeCSV(bookingSource)
      ].join(',')
    })
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n')
    
    // Generate filename with date range
    const formatDate = (date) => {
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const filename = `appointments_${formatDate(startDate)}_to_${formatDate(endDate)}.csv`
    
    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, filename)
    } else {
      // Modern browsers
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
    
    return { success: true, filename }
  } catch (error) {
    console.error('CSV export failed:', error)
    throw new Error('Failed to export CSV: ' + error.message)
  }
}

/**
 * Copy appointment data to clipboard as fallback
 * @param {Array} appointments - Array of appointment objects
 */
export const copyToClipboard = async (appointments) => {
  try {
    const headers = ['Date', 'Time', 'Patient Name', 'Doctor Name', 'Reason', 'Status', 'Booking Source']
    
    const rows = appointments.map(apt => {
      const patientName = apt.patient 
        ? `${apt.patient.first_name} ${apt.patient.last_name}`
        : 'Unknown Patient'
      
      const doctorName = apt.doctor
        ? `Dr. ${apt.doctor.first_name} ${apt.doctor.last_name}`
        : 'Unknown Doctor'
      
      const bookingSource = apt.booking_source === 'online' ? 'Online' : 'Walk-in'
      
      return [
        apt.appointment_date,
        apt.appointment_time,
        patientName,
        doctorName,
        apt.reason,
        apt.status,
        bookingSource
      ].join('\t') // Tab-separated for better paste into spreadsheets
    })
    
    const content = [headers.join('\t'), ...rows].join('\n')
    
    await navigator.clipboard.writeText(content)
    return { success: true }
  } catch (error) {
    console.error('Clipboard copy failed:', error)
    throw new Error('Failed to copy to clipboard: ' + error.message)
  }
}
