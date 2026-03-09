// SMS Gateway Service - TextBee Integration
// Uses TextBee app on Android phone

const TEXTBEE_URL = import.meta.env.VITE_TEXTBEE_URL
const TEXTBEE_API_KEY = import.meta.env.VITE_TEXTBEE_API_KEY

/**
 * Send SMS via TextBee App
 * @param {string} phoneNumber - Phone number in format +639XXXXXXXXX
 * @param {string} message - SMS message content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendSMS = async (phoneNumber, message) => {
  // Check if SMS is configured
  if (!TEXTBEE_URL) {
    console.warn('⚠️ TextBee not configured. Set VITE_TEXTBEE_URL in .env')
    return { success: false, error: 'TextBee not configured' }
  }

  try {
    const response = await fetch(`${TEXTBEE_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneNumber,
        message: message,
        key: TEXTBEE_API_KEY || ''
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ SMS sent successfully via TextBee')
      return { success: true, messageId: data.id || 'textbee-' + Date.now() }
    } else {
      console.error('❌ SMS failed:', data)
      return { success: false, error: data.error || 'Failed to send SMS' }
    }
  } catch (error) {
    console.error('❌ SMS error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send appointment confirmation SMS
 */
export const sendAppointmentConfirmation = async (booking) => {
  const message = `RCMC Clinic: Your appointment is confirmed for ${booking.appointment_date} at ${booking.appointment_time} with Dr. ${booking.doctor?.last_name || 'our doctor'}. Please arrive 15 mins early.`
  
  return await sendSMS(booking.mobile_number, message)
}

/**
 * Send appointment reminder SMS (1 day before)
 */
export const sendAppointmentReminder = async (appointment) => {
  const message = `RCMC Clinic: Reminder - You have an appointment tomorrow at ${appointment.appointment_time} with Dr. ${appointment.doctor?.last_name}. See you soon!`
  
  return await sendSMS(appointment.patient?.mobile_number, message)
}

/**
 * Send billing notification to staff
 */
export const sendBillingNotification = async (patient, amount, staffNumber) => {
  const message = `RCMC Clinic: ${patient.first_name} ${patient.last_name} is ready for billing. Total: ₱${amount.toFixed(2)}`
  
  return await sendSMS(staffNumber, message)
}

/**
 * Send payment receipt SMS
 */
export const sendPaymentReceipt = async (payment) => {
  const message = `RCMC Clinic: Payment received. Receipt #${payment.receipt_number}. Amount: ₱${payment.amount_paid.toFixed(2)}. Thank you!`
  
  return await sendSMS(payment.patient?.mobile_number, message)
}

/**
 * Send prescription ready notification
 */
export const sendPrescriptionReady = async (prescription) => {
  const message = `RCMC Clinic: Your prescription is ready for pickup. Please bring your ID. Thank you!`
  
  return await sendSMS(prescription.patient?.mobile_number, message)
}

/**
 * Send lab results ready notification
 */
export const sendLabResultsReady = async (patient) => {
  const message = `RCMC Clinic: Your lab results are ready. Please visit the clinic to collect them. Thank you!`
  
  return await sendSMS(patient.mobile_number, message)
}
