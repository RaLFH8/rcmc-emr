/**
 * Emergency Access Service
 * 
 * Implements "break glass" emergency access override functionality
 * for the Clinical Safety Trio feature.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 3.12, 3.13, 6.3
 * 
 * Features:
 * - Request emergency access with justification validation
 * - Check active emergency access sessions
 * - Revoke emergency access manually
 * - Get active emergency access sessions for a user
 * - Get emergency access history with filtering
 * - Send real-time notifications to physicians and admins
 * - Generate compliance reports as PDF
 * - Rate limiting (max 10 requests per user per day)
 */

import { supabase } from '../lib/supabase'
import { sendNotification } from './notificationService'
import jsPDF from 'jspdf'

/**
 * Request emergency access to a patient's records
 * 
 * @param {Object} request - Emergency access request
 * @param {string} request.patientId - Patient UUID
 * @param {string} request.userId - User UUID requesting access
 * @param {string} request.justification - Justification text (min 30 chars)
 * @param {string} request.emergencyType - Type: life_threatening, urgent_care, critical_condition
 * @returns {Promise<Object>} Emergency access log record
 * @throws {Error} If validation fails or rate limit exceeded
 */
export const requestEmergencyAccess = async (request) => {
  const { patientId, userId, justification, emergencyType } = request

  // Validate justification length (minimum 30 characters)
  if (!justification || justification.trim().length < 30) {
    throw new Error('Justification must be at least 30 characters')
  }

  // Validate emergency type
  const validTypes = ['life_threatening', 'urgent_care', 'critical_condition']
  if (!validTypes.includes(emergencyType)) {
    throw new Error('Invalid emergency type')
  }

  // Check rate limiting (max 10 requests per user per day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { count, error: countError } = await supabase
    .from('emergency_access_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('access_granted_at', today.toISOString())
    .lt('access_granted_at', tomorrow.toISOString())

  if (countError) throw countError

  if (count >= 10) {
    throw new Error('Daily emergency access limit (10) exceeded')
  }

  // Check concurrent session limit (max 5) - enforced by database trigger
  // but we check here for better error message
  const { count: activeCount, error: activeError } = await supabase
    .from('emergency_access_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gt('access_expires_at', new Date().toISOString())
    .is('access_revoked_at', null)

  if (activeError) throw activeError

  if (activeCount >= 5) {
    throw new Error('Maximum concurrent emergency access sessions (5) reached')
  }

  // Get patient and user information for notifications
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, first_name, last_name, patient_number, primary_physician_id')
    .eq('id', patientId)
    .single()

  if (patientError) throw patientError
  if (!patient) throw new Error('Patient not found')

  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, role, email')
    .eq('id', userId)
    .single()

  if (userError) throw userError
  if (!user) throw new Error('User not found')

  // Verify user has authorized role
  const authorizedRoles = ['doctor', 'nurse', 'emergency_staff']
  if (!authorizedRoles.includes(user.role)) {
    throw new Error('Your role is not authorized for emergency access')
  }

  // Create emergency access log
  // access_expires_at will be set automatically by trigger to 24 hours from now
  const { data: accessLog, error: insertError } = await supabase
    .from('emergency_access_logs')
    .insert([{
      user_id: userId,
      patient_id: patientId,
      justification: justification.trim(),
      emergency_type: emergencyType,
      access_granted_at: new Date().toISOString()
      // access_expires_at set by trigger
      // primary_physician_notified and admin_notified will be updated after sending notifications
    }])
    .select()
    .single()

  if (insertError) throw insertError

  // Send notifications asynchronously (don't block access grant)
  sendEmergencyNotifications(accessLog, patient, user).catch(error => {
    console.error('Failed to send emergency access notifications:', error)
  })

  // Create audit log entry
  try {
    await supabase
      .from('audit_log')
      .insert([{
        operation_type: 'emergency_access_granted',
        user_id: userId,
        emergency_access_log_id: accessLog.id,
        new_data: {
          patient_id: patientId,
          patient_name: `${patient.first_name} ${patient.last_name}`,
          emergency_type: emergencyType,
          justification: justification.trim()
        }
      }])
  } catch (auditError) {
    console.error('Failed to create audit log:', auditError)
  }

  return accessLog
}

/**
 * Check if a user has active emergency access to a patient
 * 
 * @param {string} userId - User UUID
 * @param {string} patientId - Patient UUID
 * @returns {Promise<boolean>} True if user has active emergency access
 */
export const checkEmergencyAccess = async (userId, patientId) => {
  const { data, error } = await supabase
    .rpc('check_emergency_access', {
      p_user_id: userId,
      p_patient_id: patientId
    })

  if (error) {
    console.error('Error checking emergency access:', error)
    return false
  }

  return data === true
}

/**
 * Revoke emergency access manually
 * 
 * @param {string} accessLogId - Emergency access log UUID
 * @param {string} revocationReason - Optional reason for revocation
 * @returns {Promise<Object>} Updated emergency access log
 */
export const revokeEmergencyAccess = async (accessLogId, revocationReason = null) => {
  const { data, error } = await supabase
    .from('emergency_access_logs')
    .update({
      access_revoked_at: new Date().toISOString(),
      revocation_reason: revocationReason
    })
    .eq('id', accessLogId)
    .is('access_revoked_at', null) // Only revoke if not already revoked
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Emergency access not found or already revoked')

  // Create audit log entry
  try {
    await supabase
      .from('audit_log')
      .insert([{
        operation_type: 'emergency_access_revoked',
        user_id: data.user_id,
        emergency_access_log_id: accessLogId,
        new_data: {
          revocation_reason: revocationReason,
          access_duration_seconds: data.access_duration_seconds
        }
      }])
  } catch (auditError) {
    console.error('Failed to create audit log:', auditError)
  }

  return data
}

/**
 * Get active emergency access sessions for a user
 * 
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of active emergency access logs
 */
export const getActiveEmergencyAccess = async (userId) => {
  const { data, error } = await supabase
    .from('emergency_access_logs')
    .select(`
      *,
      patient:patients(id, first_name, last_name, patient_number)
    `)
    .eq('user_id', userId)
    .gt('access_expires_at', new Date().toISOString())
    .is('access_revoked_at', null)
    .order('access_granted_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get emergency access history with filtering
 * 
 * @param {Object} filters - Filter options
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.patientId - Filter by patient ID
 * @param {string} filters.emergencyType - Filter by emergency type
 * @param {Date} filters.startDate - Filter by start date
 * @param {Date} filters.endDate - Filter by end date
 * @param {boolean} filters.includeRevoked - Include revoked access (default: true)
 * @param {number} filters.limit - Limit results (default: 100)
 * @returns {Promise<Array>} Array of emergency access logs
 */
export const getEmergencyAccessHistory = async (filters = {}) => {
  const {
    userId,
    patientId,
    emergencyType,
    startDate,
    endDate,
    includeRevoked = true,
    limit = 100
  } = filters

  let query = supabase
    .from('emergency_access_logs')
    .select(`
      *,
      patient:patients(id, first_name, last_name, patient_number),
      user:user_profiles!emergency_access_logs_user_id_fkey(id, first_name, last_name, role)
    `)
    .order('access_granted_at', { ascending: false })
    .limit(limit)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (patientId) {
    query = query.eq('patient_id', patientId)
  }

  if (emergencyType) {
    query = query.eq('emergency_type', emergencyType)
  }

  if (startDate) {
    query = query.gte('access_granted_at', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('access_granted_at', endDate.toISOString())
  }

  if (!includeRevoked) {
    query = query.is('access_revoked_at', null)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Send emergency access notifications to primary physician and admins
 * 
 * @param {Object} accessLog - Emergency access log record
 * @param {Object} patient - Patient record
 * @param {Object} user - User who requested access
 * @returns {Promise<Object>} Notification results
 */
export const sendEmergencyNotifications = async (accessLog, patient, user) => {
  const results = {
    primaryPhysician: { sent: false, success: false },
    admins: { sent: false, success: false, count: 0 }
  }

  const patientName = `${patient.first_name} ${patient.last_name}`
  const userName = `${user.first_name} ${user.last_name}`
  const emergencyTypeLabel = accessLog.emergency_type.replace(/_/g, ' ').toUpperCase()

  // Notify primary physician if assigned
  if (patient.primary_physician_id) {
    try {
      const { data: physician, error: physicianError } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email, contact_number')
        .eq('id', patient.primary_physician_id)
        .single()

      if (!physicianError && physician) {
        const message = `EMERGENCY ACCESS ALERT: ${userName} (${user.role}) has accessed patient ${patientName} (${patient.patient_number}) records. Emergency type: ${emergencyTypeLabel}. Justification: ${accessLog.justification}`

        const notificationResult = await sendNotification({
          phone: physician.contact_number,
          email: physician.email,
          smsMessage: message,
          emailSubject: `Emergency Access Alert - Patient ${patientName}`,
          emailHtml: `
            <h2>Emergency Access Alert</h2>
            <p><strong>${userName}</strong> (${user.role}) has activated emergency access to patient records.</p>
            <h3>Patient Information:</h3>
            <ul>
              <li><strong>Name:</strong> ${patientName}</li>
              <li><strong>Patient Number:</strong> ${patient.patient_number}</li>
            </ul>
            <h3>Emergency Access Details:</h3>
            <ul>
              <li><strong>Emergency Type:</strong> ${emergencyTypeLabel}</li>
              <li><strong>Justification:</strong> ${accessLog.justification}</li>
              <li><strong>Access Granted:</strong> ${new Date(accessLog.access_granted_at).toLocaleString()}</li>
              <li><strong>Access Expires:</strong> ${new Date(accessLog.access_expires_at).toLocaleString()}</li>
            </ul>
            <p>This access has been logged for compliance and audit purposes.</p>
          `
        })

        results.primaryPhysician.sent = true
        results.primaryPhysician.success = notificationResult.sms.success || notificationResult.email.success

        // Update notification flag
        await supabase
          .from('emergency_access_logs')
          .update({ primary_physician_notified: true })
          .eq('id', accessLog.id)
      }
    } catch (error) {
      console.error('Failed to notify primary physician:', error)
    }
  }

  // Notify all admins
  try {
    const { data: admins, error: adminsError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, contact_number')
      .eq('role', 'admin')

    if (!adminsError && admins && admins.length > 0) {
      const message = `EMERGENCY ACCESS: ${userName} accessed ${patientName} (${patient.patient_number}). Type: ${emergencyTypeLabel}`

      for (const admin of admins) {
        try {
          await sendNotification({
            phone: admin.contact_number,
            email: admin.email,
            smsMessage: message,
            emailSubject: `Emergency Access Alert - ${patientName}`,
            emailHtml: `
              <h2>Emergency Access Alert</h2>
              <p><strong>${userName}</strong> (${user.role}) has activated emergency access.</p>
              <h3>Details:</h3>
              <ul>
                <li><strong>Patient:</strong> ${patientName} (${patient.patient_number})</li>
                <li><strong>Emergency Type:</strong> ${emergencyTypeLabel}</li>
                <li><strong>Justification:</strong> ${accessLog.justification}</li>
                <li><strong>Time:</strong> ${new Date(accessLog.access_granted_at).toLocaleString()}</li>
              </ul>
            `
          })
          results.admins.count++
        } catch (error) {
          console.error(`Failed to notify admin ${admin.id}:`, error)
        }
      }

      results.admins.sent = true
      results.admins.success = results.admins.count > 0

      // Update notification flag
      await supabase
        .from('emergency_access_logs')
        .update({ admin_notified: true })
        .eq('id', accessLog.id)
    }
  } catch (error) {
    console.error('Failed to notify admins:', error)
  }

  return results
}

/**
 * Generate compliance report for emergency access events
 * 
 * @param {Object} dateRange - Date range for report
 * @param {Date} dateRange.startDate - Start date
 * @param {Date} dateRange.endDate - End date
 * @returns {Promise<Blob>} PDF blob
 */
export const generateComplianceReport = async (dateRange) => {
  const { startDate, endDate } = dateRange

  // Fetch emergency access logs for date range
  const logs = await getEmergencyAccessHistory({
    startDate,
    endDate,
    includeRevoked: true,
    limit: 1000
  })

  // Create PDF
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Emergency Access Compliance Report', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Report Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' })
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 34, { align: 'center' })

  // Summary statistics
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary Statistics', 14, 45)

  const totalEvents = logs.length
  const revokedEvents = logs.filter(log => log.access_revoked_at).length
  const activeEvents = logs.filter(log => !log.access_revoked_at && new Date(log.access_expires_at) > new Date()).length
  const expiredEvents = logs.filter(log => !log.access_revoked_at && new Date(log.access_expires_at) <= new Date()).length

  const emergencyTypes = logs.reduce((acc, log) => {
    acc[log.emergency_type] = (acc[log.emergency_type] || 0) + 1
    return acc
  }, {})

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  let yPos = 52
  doc.text(`Total Emergency Access Events: ${totalEvents}`, 14, yPos)
  yPos += 6
  doc.text(`Active Sessions: ${activeEvents}`, 14, yPos)
  yPos += 6
  doc.text(`Expired Sessions: ${expiredEvents}`, 14, yPos)
  yPos += 6
  doc.text(`Manually Revoked: ${revokedEvents}`, 14, yPos)
  yPos += 10

  doc.setFont('helvetica', 'bold')
  doc.text('Emergency Types:', 14, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')
  Object.entries(emergencyTypes).forEach(([type, count]) => {
    doc.text(`  ${type.replace(/_/g, ' ')}: ${count}`, 14, yPos)
    yPos += 6
  })

  // Detailed event log table
  yPos += 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Detailed Event Log', 14, yPos)
  yPos += 8

  // Draw table manually
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  
  // Table headers
  const headers = ['Date', 'User', 'Patient', 'Type', 'Status']
  const colWidths = [30, 35, 35, 35, 25]
  let xPos = 14
  
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPos)
    xPos += colWidths[i]
  })
  
  yPos += 2
  doc.line(14, yPos, pageWidth - 14, yPos) // Header underline
  yPos += 5

  // Table rows
  doc.setFont('helvetica', 'normal')
  let rowCount = 0
  const maxRowsPerPage = 25

  logs.forEach((log, index) => {
    // Check if we need a new page
    if (rowCount >= maxRowsPerPage) {
      doc.addPage()
      yPos = 20
      rowCount = 0
      
      // Redraw headers on new page
      doc.setFont('helvetica', 'bold')
      xPos = 14
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos)
        xPos += colWidths[i]
      })
      yPos += 2
      doc.line(14, yPos, pageWidth - 14, yPos)
      yPos += 5
      doc.setFont('helvetica', 'normal')
    }

    const patientName = log.patient ? `${log.patient.first_name} ${log.patient.last_name}` : 'Unknown'
    const userName = log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Unknown'
    const grantedDate = new Date(log.access_granted_at).toLocaleDateString()
    const status = log.access_revoked_at ? 'Revoked' : 
                   new Date(log.access_expires_at) > new Date() ? 'Active' : 'Expired'
    const emergencyType = log.emergency_type.replace(/_/g, ' ')

    xPos = 14
    doc.text(grantedDate, xPos, yPos)
    xPos += colWidths[0]
    doc.text(userName.substring(0, 15), xPos, yPos)
    xPos += colWidths[1]
    doc.text(patientName.substring(0, 15), xPos, yPos)
    xPos += colWidths[2]
    doc.text(emergencyType.substring(0, 15), xPos, yPos)
    xPos += colWidths[3]
    doc.text(status, xPos, yPos)

    yPos += 5
    rowCount++
  })

  // Footer on last page
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  // Compliance statement
  yPos += 10
  if (yPos < pageHeight - 40) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('This report contains all emergency access events for the specified period.', 14, yPos)
    yPos += 6
    doc.text('All events are logged for compliance with Data Privacy Act requirements.', 14, yPos)
    yPos += 6
    doc.text('Unauthorized access or misuse of emergency access is subject to disciplinary action.', 14, yPos)
  }

  // Return PDF as blob
  return doc.output('blob')
}

/**
 * Get emergency access statistics for dashboard
 * 
 * @param {Object} dateRange - Date range for statistics
 * @param {Date} dateRange.startDate - Start date
 * @param {Date} dateRange.endDate - End date
 * @returns {Promise<Object>} Statistics object
 */
export const getEmergencyAccessStatistics = async (dateRange) => {
  const { startDate, endDate } = dateRange

  const logs = await getEmergencyAccessHistory({
    startDate,
    endDate,
    includeRevoked: true,
    limit: 1000
  })

  const stats = {
    totalEvents: logs.length,
    activeEvents: logs.filter(log => !log.access_revoked_at && new Date(log.access_expires_at) > new Date()).length,
    expiredEvents: logs.filter(log => !log.access_revoked_at && new Date(log.access_expires_at) <= new Date()).length,
    revokedEvents: logs.filter(log => log.access_revoked_at).length,
    byEmergencyType: {},
    byUser: {},
    averageDuration: 0
  }

  // Group by emergency type
  logs.forEach(log => {
    stats.byEmergencyType[log.emergency_type] = (stats.byEmergencyType[log.emergency_type] || 0) + 1
  })

  // Group by user
  logs.forEach(log => {
    const userName = log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Unknown'
    stats.byUser[userName] = (stats.byUser[userName] || 0) + 1
  })

  // Calculate average duration for completed sessions
  const completedSessions = logs.filter(log => log.access_duration_seconds)
  if (completedSessions.length > 0) {
    const totalDuration = completedSessions.reduce((sum, log) => sum + log.access_duration_seconds, 0)
    stats.averageDuration = Math.round(totalDuration / completedSessions.length)
  }

  return stats
}
