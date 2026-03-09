// Unified Notification Service - Combines SMS and Email
// Automatically sends both SMS and Email when available

import { 
  sendSMS,
  sendAppointmentConfirmation as sendAppointmentSMS,
  sendAppointmentReminder as sendAppointmentReminderSMS,
  sendPaymentReceipt as sendPaymentReceiptSMS,
  sendPrescriptionReady as sendPrescriptionReadySMS,
  sendLabResultsReady as sendLabResultsReadySMS
} from './smsGateway'

import {
  sendEmail,
  sendAppointmentConfirmationEmail,
  sendAppointmentReminderEmail,
  sendPaymentReceiptEmail,
  sendPrescriptionReadyEmail,
  sendLabResultsReadyEmail,
  sendWelcomeEmail
} from './emailService'

/**
 * Send notification via both SMS and Email
 * @param {Object} options - Notification options
 * @param {string} options.phone - Phone number for SMS
 * @param {string} options.email - Email address
 * @param {string} options.smsMessage - SMS text message
 * @param {string} options.emailSubject - Email subject
 * @param {string} options.emailHtml - Email HTML content
 * @returns {Promise<{sms: Object, email: Object}>}
 */
export const sendNotification = async ({ phone, email, smsMessage, emailSubject, emailHtml }) => {
  const results = {
    sms: { success: false, sent: false },
    email: { success: false, sent: false }
  }

  // Send SMS if phone number provided
  if (phone && smsMessage) {
    results.sms = await sendSMS(phone, smsMessage)
    results.sms.sent = true
  }

  // Send Email if email address provided
  if (email && emailSubject && emailHtml) {
    results.email = await sendEmail(email, emailSubject, emailHtml)
    results.email.sent = true
  }

  return results
}

/**
 * Send appointment confirmation via SMS and Email
 */
export const notifyAppointmentConfirmation = async (booking) => {
  const results = {
    sms: { success: false, sent: false },
    email: { success: false, sent: false }
  }

  // Send SMS
  if (booking.mobile_number) {
    results.sms = await sendAppointmentSMS(booking)
    results.sms.sent = true
  }

  // Send Email
  if (booking.email) {
    results.email = await sendAppointmentConfirmationEmail(booking)
    results.email.sent = true
  }

  return results
}

/**
 * Send appointment reminder via SMS and Email
 */
export const notifyAppointmentReminder = async (appointment) => {
  const results = {
    sms: { success: false, sent: false },
    email: { success: false, sent: false }
  }

  // Send SMS
  if (appointment.patient?.mobile_number) {
    results.sms = await sendAppointmentReminderSMS(appointment)
    results.sms.sent = true
  }

  // Send Email
  if (appointment.patient?.email) {
    results.email = await sendAppointmentReminderEmail(appointment)
    results.email.sent = true
  }

  return results
}

/**
 * Send payment receipt via SMS and Email
 */
export const notifyPaymentReceipt = async (payment) => {
  const results = {
    sms: { success: false, sent: false },
    email: { success: false, sent: false }
  }

  // Send SMS
  if (payment.patient?.mobile_number) {
    results.sms = await sendPaymentReceiptSMS(payment)
    results.sms.sent = true
  }

  // Send Email
  if (payment.patient?.email) {
    results.email = await sendPaymentReceiptEmail(payment)
    results.email.sent = true
  }

  return results
}

/**
 * Send prescription ready notification via SMS and Email
 */
export const notifyPrescriptionReady = async (prescription) => {
  const results = {
    sms: { success: false, sent: false },
    email: { success: false, sent: false }
  }

  // Send SMS
  if (prescription.patient?.mobile_number) {
    results.sms = await sendPrescriptionReadySMS(prescription)
    results.sms.sent = true
  }

  // Send Email
  if (prescription.patient?.email) {
    results.email = await sendPrescriptionReadyEmail(prescription)
    results.email.sent = true
  }

  return results
}

/**
 * Send lab results ready notification via SMS and Email
 */
export const notifyLabResultsReady = async (patient) => {
  const results = {
    sms: { success: false, sent: false },
    email: { success: false, sent: false }
  }

  // Send SMS
  if (patient.mobile_number) {
    results.sms = await sendLabResultsReadySMS(patient)
    results.sms.sent = true
  }

  // Send Email
  if (patient.email) {
    results.email = await sendLabResultsReadyEmail(patient)
    results.email.sent = true
  }

  return results
}

/**
 * Send welcome notification to new patients (Email only)
 */
export const notifyWelcome = async (patient) => {
  const results = {
    sms: { success: false, sent: false },
    email: { success: false, sent: false }
  }

  // Send Email only for welcome message
  if (patient.email) {
    results.email = await sendWelcomeEmail(patient)
    results.email.sent = true
  }

  return results
}

/**
 * Format notification results for display
 */
export const formatNotificationResults = (results) => {
  const messages = []
  
  if (results.sms.sent) {
    if (results.sms.success) {
      messages.push('SMS sent ✅')
    } else {
      messages.push('SMS failed ❌')
    }
  }
  
  if (results.email.sent) {
    if (results.email.success) {
      messages.push('Email sent ✅')
    } else {
      messages.push('Email failed ❌')
    }
  }
  
  if (messages.length === 0) {
    return 'No notifications sent (missing contact info)'
  }
  
  return messages.join(', ')
}

/**
 * Check if notifications are configured
 */
export const isNotificationConfigured = () => {
  const smsConfigured = !!(import.meta.env.VITE_SMS_GATEWAY_API_KEY && import.meta.env.VITE_SMS_GATEWAY_DEVICE_ID)
  const emailConfigured = !!import.meta.env.VITE_RESEND_API_KEY
  
  return {
    sms: smsConfigured,
    email: emailConfigured,
    any: smsConfigured || emailConfigured,
    both: smsConfigured && emailConfigured
  }
}
