// Appointment Notification Wrapper Utility
// Handles email and SMS notifications for appointment creation
// Non-blocking: appointment creation succeeds even if notifications fail

import { sendAppointmentConfirmationEmail } from '../services/emailService'
import { sendAppointmentConfirmation } from '../services/smsGateway'

/**
 * Send appointment notifications based on appointment source
 * @param {Object} appointmentData - The created appointment data
 * @param {string} source - 'online' or 'walk-in'
 * @returns {Promise<{emailSent: boolean, smsSent: boolean, warnings: string[]}>}
 */
export async function sendAppointmentNotifications(appointmentData, source) {
  const results = {
    emailSent: false,
    smsSent: false,
    warnings: []
  }
  
  // Validate contact information
  const hasEmail = appointmentData.email && appointmentData.email.trim() && isValidEmail(appointmentData.email)
  const hasPhone = (appointmentData.phone || appointmentData.mobile_number) && 
                   (appointmentData.phone?.trim() || appointmentData.mobile_number?.trim())
  
  // Online appointments: Send both email and SMS
  if (source === 'online') {
    // Send email notification
    if (hasEmail) {
      try {
        const emailResult = await sendAppointmentConfirmationEmail(appointmentData)
        results.emailSent = emailResult.success
        if (!emailResult.success) {
          results.warnings.push('Email notification failed')
          console.error('[Appointment Notification Error]', {
            timestamp: new Date().toISOString(),
            appointmentId: appointmentData.id,
            patientName: `${appointmentData.first_name} ${appointmentData.last_name}`,
            notificationType: 'email',
            error: emailResult.error,
            contactInfo: {
              email: appointmentData.email || 'not provided',
              phone: appointmentData.phone || appointmentData.mobile_number || 'not provided'
            }
          })
        } else {
          console.log('✅ Email notification sent successfully')
        }
      } catch (error) {
        results.warnings.push('Email notification error')
        console.error('[Appointment Notification Error]', {
          timestamp: new Date().toISOString(),
          appointmentId: appointmentData.id,
          patientName: `${appointmentData.first_name} ${appointmentData.last_name}`,
          notificationType: 'email',
          error: error.message,
          contactInfo: {
            email: appointmentData.email || 'not provided',
            phone: appointmentData.phone || appointmentData.mobile_number || 'not provided'
          }
        })
      }
    } else {
      results.warnings.push('No valid email address provided')
      console.warn('[Appointment Notification Warning]', {
        timestamp: new Date().toISOString(),
        patientName: `${appointmentData.first_name} ${appointmentData.last_name}`,
        message: 'Skipping email notification: No valid email address',
        providedEmail: appointmentData.email || 'not provided'
      })
    }
    
    // Send SMS notification
    if (hasPhone) {
      try {
        // Ensure mobile_number field is set for SMS service
        const smsData = {
          ...appointmentData,
          mobile_number: appointmentData.mobile_number || appointmentData.phone
        }
        const smsResult = await sendAppointmentConfirmation(smsData)
        results.smsSent = smsResult.success
        if (!smsResult.success) {
          results.warnings.push('SMS notification failed')
          console.error('[Appointment Notification Error]', {
            timestamp: new Date().toISOString(),
            appointmentId: appointmentData.id,
            patientName: `${appointmentData.first_name} ${appointmentData.last_name}`,
            notificationType: 'sms',
            error: smsResult.error,
            contactInfo: {
              email: appointmentData.email || 'not provided',
              phone: appointmentData.phone || appointmentData.mobile_number || 'not provided'
            }
          })
        } else {
          console.log('✅ SMS notification sent successfully')
        }
      } catch (error) {
        results.warnings.push('SMS notification error')
        console.error('[Appointment Notification Error]', {
          timestamp: new Date().toISOString(),
          appointmentId: appointmentData.id,
          patientName: `${appointmentData.first_name} ${appointmentData.last_name}`,
          notificationType: 'sms',
          error: error.message,
          contactInfo: {
            email: appointmentData.email || 'not provided',
            phone: appointmentData.phone || appointmentData.mobile_number || 'not provided'
          }
        })
      }
    } else {
      results.warnings.push('No phone number provided')
      console.warn('[Appointment Notification Warning]', {
        timestamp: new Date().toISOString(),
        patientName: `${appointmentData.first_name} ${appointmentData.last_name}`,
        message: 'Skipping SMS notification: No phone number',
        providedPhone: appointmentData.phone || appointmentData.mobile_number || 'not provided'
      })
    }
  }
  
  // Walk-in appointments: Send SMS only
  if (source === 'walk-in') {
    if (hasPhone) {
      try {
        // Ensure mobile_number field is set for SMS service
        const smsData = {
          ...appointmentData,
          mobile_number: appointmentData.mobile_number || appointmentData.phone
        }
        const smsResult = await sendAppointmentConfirmation(smsData)
        results.smsSent = smsResult.success
        if (!smsResult.success) {
          results.warnings.push('SMS notification failed')
          console.error('[Appointment Notification Error]', {
            timestamp: new Date().toISOString(),
            appointmentId: appointmentData.id,
            patientName: `${appointmentData.first_name} ${appointmentData.last_name}`,
            notificationType: 'sms',
            error: smsResult.error,
            contactInfo: {
              email: appointmentData.email || 'not provided',
              phone: appointmentData.phone || appointmentData.mobile_number || 'not provided'
            }
          })
        } else {
          console.log('✅ SMS notification sent successfully')
        }
      } catch (error) {
        results.warnings.push('SMS notification error')
        console.error('[Appointment Notification Error]', {
          timestamp: new Date().toISOString(),
          appointmentId: appointmentData.id,
          patientName: `${appointmentData.first_name} ${appointmentData.last_name}`,
          notificationType: 'sms',
          error: error.message,
          contactInfo: {
            email: appointmentData.email || 'not provided',
            phone: appointmentData.phone || appointmentData.mobile_number || 'not provided'
          }
        })
      }
    } else {
      results.warnings.push('No phone number provided')
      console.warn('[Appointment Notification Warning]', {
        timestamp: new Date().toISOString(),
        patientName: `${appointmentData.first_name} ${appointmentData.last_name}`,
        message: 'Skipping SMS notification: No phone number',
        providedPhone: appointmentData.phone || appointmentData.mobile_number || 'not provided'
      })
    }
  }
  
  return results
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email.trim())
}
