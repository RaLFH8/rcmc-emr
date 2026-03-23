// Email Service using Resend API
// FREE tier: 100 emails/day, 3,000 emails/month

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'RCMC Clinic <noreply@yourdomain.com>'
const RESEND_API_URL = 'https://api.resend.com/emails'

/**
 * Send email via Resend
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const sendEmail = async (to, subject, html) => {
  // Check if Resend is configured
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: html
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      return { success: true, id: data.id }
    } else {
      console.error('❌ Email failed:', data)
      return { success: false, error: data.message || 'Failed to send email' }
    }
  } catch (error) {
    console.error('❌ Email error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send appointment confirmation email
 */
export const sendAppointmentConfirmationEmail = async (booking) => {
  const subject = 'Appointment Confirmed - RCMC Clinic'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #14b8a6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #6b7280; }
        .detail-value { color: #111827; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        .button { background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Appointment Confirmed</h1>
        </div>
        <div class="content">
          <p>Dear ${booking.first_name} ${booking.last_name},</p>
          <p>Your appointment at RCMC Clinic has been confirmed.</p>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${booking.appointment_date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${booking.appointment_time}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Doctor:</span>
              <span class="detail-value">Dr. ${booking.doctor?.last_name || 'TBA'}</span>
            </div>
            ${booking.reason ? `
            <div class="detail-row">
              <span class="detail-label">Reason:</span>
              <span class="detail-value">${booking.reason}</span>
            </div>
            ` : ''}
          </div>
          
          <p><strong>Important Reminders:</strong></p>
          <ul>
            <li>Please arrive 15 minutes early</li>
            <li>Bring a valid ID</li>
            <li>Bring your medical records (if any)</li>
          </ul>
          
          <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
          
          <div class="footer">
            <p>RCMC Clinic | Rizalcare Medical Clinic</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
  
  return await sendEmail(booking.email, subject, html)
}

/**
 * Send appointment reminder email (1 day before)
 */
export const sendAppointmentReminderEmail = async (appointment) => {
  const subject = 'Appointment Reminder - Tomorrow at RCMC Clinic'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Appointment Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${appointment.patient?.first_name},</p>
          
          <div class="highlight">
            <p><strong>You have an appointment tomorrow!</strong></p>
            <p>📅 ${appointment.appointment_date} at ${appointment.appointment_time}</p>
            <p>👨‍⚕️ Dr. ${appointment.doctor?.last_name}</p>
          </div>
          
          <p>Please arrive 15 minutes early. See you soon!</p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            RCMC Clinic | Rizalcare Medical Clinic
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return await sendEmail(appointment.patient?.email, subject, html)
}

/**
 * Send payment receipt email
 */
export const sendPaymentReceiptEmail = async (payment) => {
  const subject = `Payment Receipt #${payment.receipt_number} - RCMC Clinic`
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .total { background: #10b981; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Payment Received</h1>
        </div>
        <div class="content">
          <p>Dear ${payment.patient?.first_name} ${payment.patient?.last_name},</p>
          <p>Thank you for your payment. Here is your receipt:</p>
          
          <div class="receipt">
            <p><strong>Receipt Number:</strong> ${payment.receipt_number}</p>
            <p><strong>Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${payment.payment_method || 'Cash'}</p>
          </div>
          
          <div class="total">
            ₱${payment.amount_paid.toFixed(2)}
          </div>
          
          <p>Thank you for choosing RCMC Clinic!</p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            RCMC Clinic | Rizalcare Medical Clinic<br>
            Keep this email for your records.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return await sendEmail(payment.patient?.email, subject, html)
}

/**
 * Send prescription ready notification email
 */
export const sendPrescriptionReadyEmail = async (prescription) => {
  const subject = 'Your Prescription is Ready - RCMC Clinic'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💊 Prescription Ready</h1>
        </div>
        <div class="content">
          <p>Dear ${prescription.patient?.first_name},</p>
          <p>Your prescription is ready for pickup at RCMC Clinic.</p>
          <p><strong>Please bring:</strong></p>
          <ul>
            <li>Valid ID</li>
            <li>This email (printed or on your phone)</li>
          </ul>
          <p>Clinic hours: Monday-Saturday, 8:00 AM - 5:00 PM</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            RCMC Clinic | Rizalcare Medical Clinic
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return await sendEmail(prescription.patient?.email, subject, html)
}

/**
 * Send lab results ready notification email
 */
export const sendLabResultsReadyEmail = async (patient) => {
  const subject = 'Your Lab Results are Ready - RCMC Clinic'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔬 Lab Results Ready</h1>
        </div>
        <div class="content">
          <p>Dear ${patient.first_name} ${patient.last_name},</p>
          <p>Your laboratory results are now available.</p>
          <p>Please visit RCMC Clinic to collect your results and discuss them with your doctor.</p>
          <p><strong>Bring a valid ID for verification.</strong></p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            RCMC Clinic | Rizalcare Medical Clinic
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return await sendEmail(patient.email, subject, html)
}

/**
 * Send welcome email to new patients
 */
export const sendWelcomeEmail = async (patient) => {
  const subject = 'Welcome to RCMC Clinic!'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #14b8a6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Welcome to RCMC Clinic</h1>
        </div>
        <div class="content">
          <p>Dear ${patient.first_name} ${patient.last_name},</p>
          <p>Welcome to Rizalcare Medical Clinic! We're glad to have you as our patient.</p>
          <p><strong>Our Services:</strong></p>
          <ul>
            <li>General Consultation</li>
            <li>Laboratory Services</li>
            <li>Pharmacy</li>
            <li>Emergency Care</li>
          </ul>
          <p><strong>Clinic Hours:</strong><br>
          Monday - Saturday: 8:00 AM - 5:00 PM<br>
          Sunday: Closed</p>
          <p>You can now book appointments online through our website.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            RCMC Clinic | Rizalcare Medical Clinic<br>
            Your health is our priority.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return await sendEmail(patient.email, subject, html)
}
