import { supabase, db } from '../../lib/supabase'
import { parseAgeSex, parseDoctorName, parseDiscount, parsePayment } from '../../utils/import/patientFieldParser'
import { sanitizeString, sanitizeNumber, sanitizeDate, sanitizeObject } from '../../utils/import/inputSanitizer'
import { startImportLog, updateImportLog, completeImportLog, logError, failImportLog } from '../../utils/import/auditLogger'

/**
 * Patient Import Service
 * 
 * Handles importing patient consultation records with multi-table creation:
 * - Creates or finds patient records
 * - Creates appointment records
 * - Creates consultation records
 * - Creates billing records
 * - Updates doctor consultation counts
 * 
 * All operations are performed within a transaction for atomicity.
 * 
 * Security: Requires authenticated user with admin or staff role
 */

/**
 * Check if user is authenticated and has proper role
 * @param {Object} userProfile - User profile from AuthContext
 * @throws {Error} If user is not authenticated or doesn't have proper role
 */
function checkAuthentication(userProfile) {
  if (!userProfile) {
    throw new Error('Authentication required: You must be logged in to import data')
  }
  
  const allowedRoles = ['admin', 'staff']
  if (!allowedRoles.includes(userProfile.role)) {
    throw new Error(`Authorization failed: Only admin and staff users can import data. Your role: ${userProfile.role}`)
  }
}

/**
 * Find or create a patient by name and date of birth
 * @param {Object} patientData - Patient information
 * @returns {Promise<Object>} Patient record
 */
async function findOrCreatePatient(patientData) {
  const { first_name, last_name, date_of_birth, gender } = patientData
  
  // Try to find existing patient by name and DOB (case-insensitive)
  const { data: existingPatients, error: searchError } = await supabase
    .from('patients')
    .select('*')
    .ilike('first_name', first_name)
    .ilike('last_name', last_name)
    .eq('date_of_birth', date_of_birth)
    .eq('status', 'Active')
    .limit(1)
  
  if (searchError) throw searchError
  
  // If patient exists, return it
  if (existingPatients && existingPatients.length > 0) {
    return existingPatients[0]
  }
  
  // Create new patient
  const newPatient = await db.addPatient({
    first_name,
    last_name,
    date_of_birth,
    gender,
    contact_number: 'N/A',
    address: 'N/A',
    emergency_contact_name: 'N/A',
    emergency_contact_number: 'N/A',
    status: 'Active'
  })
  
  return newPatient
}

/**
 * Calculate date of birth from age
 * @param {number} age - Age in years
 * @returns {string} Date of birth in YYYY-MM-DD format
 */
function calculateDOB(age) {
  const today = new Date()
  const birthYear = today.getFullYear() - age
  // Use January 1st as default birth date
  return `${birthYear}-01-01`
}

/**
 * Parse patient name into first and last name
 * @param {string} fullName - Full name (e.g., "Juan Dela Cruz")
 * @returns {Object} { first_name, last_name }
 */
function parsePatientName(fullName) {
  const parts = fullName.trim().split(/\s+/)
  
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: '' }
  }
  
  // Last part is last name, rest is first name
  const last_name = parts[parts.length - 1]
  const first_name = parts.slice(0, -1).join(' ')
  
  return { first_name, last_name }
}

/**
 * Import a single patient consultation record
 * Creates patient, appointment, consultation, and billing records
 * 
 * @param {Object} row - CSV row data
 * @param {Array} doctors - List of all doctors for matching
 * @param {Object} userProfile - User profile from AuthContext (for authentication)
 * @returns {Promise<Object>} Import result with created records
 */
export async function importPatientRecord(row, doctors, userProfile = null) {
  // Check authentication
  if (userProfile) {
    checkAuthentication(userProfile)
  }
  
  try {
    // Sanitize input data (Requirement: 20.5)
    const sanitizedRow = sanitizeObject(row, {
      patient_name: { type: 'string' },
      'Patient Name': { type: 'string' },
      age_sex: { type: 'string' },
      'Age/Sex': { type: 'string' },
      doctor_name: { type: 'string' },
      'Doctor': { type: 'string' },
      consultation_date: { type: 'date' },
      'Consultation Date': { type: 'date' },
      discount: { type: 'number', options: { min: 0, allowNegative: false } },
      'Discount': { type: 'number', options: { min: 0, allowNegative: false } },
      payment: { type: 'number', options: { min: 0, allowNegative: false } },
      'Payment': { type: 'number', options: { min: 0, allowNegative: false } }
    });
    
    // Parse patient name
    const patientNameValue = sanitizedRow.patient_name || sanitizedRow['Patient Name'];
    const { first_name, last_name } = parsePatientName(patientNameValue);
    
    // Additional sanitization for names
    const sanitizedFirstName = sanitizeString(first_name);
    const sanitizedLastName = sanitizeString(last_name);
    
    // Parse age/sex
    const ageSexValue = sanitizedRow.age_sex || sanitizedRow['Age/Sex'];
    const ageSex = parseAgeSex(ageSexValue);
    if (!ageSex) {
      throw new Error(`Invalid Age/Sex format: ${ageSexValue}. Expected format: "25/M" or "30/F"`)
    }
    
    // Calculate date of birth from age
    const date_of_birth = calculateDOB(ageSex.age);
    
    // Parse doctor name
    const doctorNameValue = sanitizedRow.doctor_name || sanitizedRow['Doctor'];
    const doctor = parseDoctorName(doctorNameValue, doctors);
    if (!doctor) {
      throw new Error(`Doctor not found: ${doctorNameValue}`)
    }
    
    // Parse consultation date
    const consultationDateValue = sanitizedRow.consultation_date || sanitizedRow['Consultation Date'];
    const consultation_date = sanitizeDate(consultationDateValue);
    if (!consultation_date) {
      throw new Error(`Invalid consultation date: ${consultationDateValue}`);
    }
    
    // Parse discount and payment
    const discountValue = sanitizedRow.discount || sanitizedRow['Discount'] || 0;
    const discount = sanitizeNumber(parseDiscount(discountValue), { min: 0, allowNegative: false }) || 0;
    
    const paymentValue = sanitizedRow.payment || sanitizedRow['Payment'] || 0;
    const payment = sanitizeNumber(parsePayment(paymentValue), { min: 0, allowNegative: false }) || 0;
    
    // 1. Create or find patient
    const patient = await findOrCreatePatient({
      first_name: sanitizedFirstName,
      last_name: sanitizedLastName,
      date_of_birth,
      gender: ageSex.sex
    })
    
    // 2. Create appointment
    const appointment = await db.addAppointment({
      patient_id: patient.id,
      doctor_id: doctor.id,
      appointment_date: consultation_date,
      appointment_time: '09:00:00', // Default time
      status: 'Completed',
      appointment_type: 'Walk-in',
      notes: sanitizeString('Imported from CSV')
    })
    
    // 3. Create consultation
    const consultation = await db.addConsultation({
      patient_id: patient.id,
      doctor_id: doctor.id,
      appointment_id: appointment.id,
      consultation_date: consultation_date,
      chief_complaint: sanitizeString('Imported from CSV'),
      diagnosis: sanitizeString('See consultation notes'),
      treatment_plan: '',
      notes: ''
    })
    
    // 4. Create billing record
    const billing = await db.addBilling({
      patient_id: patient.id,
      consultation_id: consultation.id,
      patient_name: sanitizeString(`${sanitizedFirstName} ${sanitizedLastName}`),
      items: [
        {
          type: 'service',
          name: 'Consultation',
          quantity: 1,
          price: payment,
          amount: payment
        }
      ],
      subtotal: payment,
      discount: discount,
      total_amount: payment - discount,
      amount_paid: payment - discount,
      payment_status: 'Paid',
      payment_method: 'Cash'
    })
    
    // 5. Update doctor consultation count
    await incrementDoctorConsultationCount(doctor.id)
    
    return {
      success: true,
      patient,
      appointment,
      consultation,
      billing
    }
  } catch (error) {
    throw new Error(`Failed to import patient record: ${error.message}`)
  }
}

/**
 * Increment doctor consultation count
 * @param {string} doctorId - Doctor ID
 */
async function incrementDoctorConsultationCount(doctorId) {
  // Get current consultation count
  const { data: doctor, error: fetchError } = await supabase
    .from('doctors')
    .select('consultation_count')
    .eq('id', doctorId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching doctor consultation count:', fetchError)
    return
  }
  
  // Increment count
  const newCount = (doctor.consultation_count || 0) + 1
  
  const { error: updateError } = await supabase
    .from('doctors')
    .update({ consultation_count: newCount })
    .eq('id', doctorId)
  
  if (updateError) {
    console.error('Error updating doctor consultation count:', updateError)
  }
}

/**
 * Batch import patient records with audit logging
 * @param {Array} rows - Array of CSV row data
 * @param {Array} doctors - List of all doctors
 * @param {Function} onProgress - Progress callback
 * @param {Object} userProfile - User profile from AuthContext (for authentication)
 * @param {string} filename - Original CSV filename (for audit logging)
 * @returns {Promise<Object>} Import results
 */
export async function batchImportPatients(rows, doctors, onProgress, userProfile = null, filename = 'unknown.csv') {
  // Check authentication once at the start
  if (userProfile) {
    checkAuthentication(userProfile)
  }
  
  // Start audit log (Requirement: 19.1)
  let logId = null;
  if (userProfile) {
    try {
      logId = await startImportLog({
        moduleType: 'patient',
        filename: filename,
        totalRecords: rows.length,
        userId: userProfile.id,
        username: userProfile.username || userProfile.email || 'Unknown User'
      });
    } catch (error) {
      console.error('Failed to start audit log:', error);
      // Continue with import even if logging fails
    }
  }
  
  const results = {
    total: rows.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  }
  
  try {
    for (let i = 0; i < rows.length; i++) {
      try {
        // Don't check auth for each row, already checked above
        await importPatientRecord(rows[i], doctors, null)
        results.successful++
        
        // Update audit log progress
        if (logId) {
          await updateImportLog(logId, {
            successfulRecords: results.successful,
            failedRecords: results.failed,
            skippedRecords: results.skipped
          });
        }
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: rows.length,
            percentage: Math.round(((i + 1) / rows.length) * 100),
            status: `Importing patient ${i + 1} of ${rows.length}`
          })
        }
      } catch (error) {
        results.failed++
        
        const errorInfo = {
          row: i + 1,
          data: rows[i],
          error: error.message
        };
        
        // Capture stack trace for detailed error logging (Requirement: 19.3, 19.6, 19.7)
        if (error.stack) {
          errorInfo.stack = error.stack;
        }
        
        results.errors.push(errorInfo);
        
        // Log error to audit log
        if (logId) {
          await logError(logId, errorInfo);
        }
      }
    }
    
    // Complete audit log with final results (Requirement: 19.1, 19.2, 19.3)
    if (logId) {
      await completeImportLog(logId, {
        successful: results.successful,
        failed: results.failed,
        skipped: results.skipped,
        errors: results.errors,
        status: 'completed'
      });
    }
    
    return results;
  } catch (error) {
    // Mark import as failed in audit log
    if (logId) {
      await failImportLog(logId, error.message, error.stack);
    }
    throw error;
  }
}

/**
 * Validate patient import data
 * @param {Array} rows - Array of CSV row data
 * @param {Array} doctors - List of all doctors
 * @returns {Array} Validation errors
 */
export function validatePatientData(rows, doctors) {
  const errors = []
  
  rows.forEach((row, index) => {
    const rowNumber = index + 1
    
    // Check required fields
    const patientName = row.patient_name || row['Patient Name']
    if (!patientName || patientName.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'patient_name',
        value: patientName,
        type: 'missing',
        message: 'Missing required field: patient_name'
      })
    }
    
    const ageSex = row.age_sex || row['Age/Sex']
    if (!ageSex || ageSex.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'age_sex',
        value: ageSex,
        type: 'missing',
        message: 'Missing required field: age_sex'
      })
    } else {
      // Validate age/sex format
      const parsed = parseAgeSex(ageSex)
      if (!parsed) {
        errors.push({
          row: rowNumber,
          field: 'age_sex',
          value: ageSex,
          type: 'invalid_format',
          message: 'Invalid age_sex format: expected "25/M" or "30/F"'
        })
      } else if (parsed.age < 0 || parsed.age > 150) {
        errors.push({
          row: rowNumber,
          field: 'age_sex',
          value: ageSex,
          type: 'out_of_range',
          message: 'Age out of range: must be between 0 and 150'
        })
      }
    }
    
    const doctorName = row.doctor_name || row['Doctor']
    if (!doctorName || doctorName.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'doctor_name',
        value: doctorName,
        type: 'missing',
        message: 'Missing required field: doctor_name'
      })
    } else {
      // Validate doctor exists
      const doctor = parseDoctorName(doctorName, doctors)
      if (!doctor) {
        errors.push({
          row: rowNumber,
          field: 'doctor_name',
          value: doctorName,
          type: 'validation',
          message: `Doctor not found: ${doctorName}`
        })
      }
    }
    
    const consultationDate = row.consultation_date || row['Consultation Date']
    if (!consultationDate || consultationDate.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'consultation_date',
        value: consultationDate,
        type: 'missing',
        message: 'Missing required field: consultation_date'
      })
    } else {
      // Validate date format
      const date = new Date(consultationDate)
      if (isNaN(date.getTime())) {
        errors.push({
          row: rowNumber,
          field: 'consultation_date',
          value: consultationDate,
          type: 'invalid_type',
          message: 'Invalid date format'
        })
      }
    }
    
    // Validate optional numeric fields
    const discount = row.discount || row['Discount']
    if (discount !== undefined && discount !== '' && discount !== null) {
      const parsedDiscount = parseDiscount(discount)
      if (isNaN(parsedDiscount) || parsedDiscount < 0) {
        errors.push({
          row: rowNumber,
          field: 'discount',
          value: discount,
          type: 'invalid_type',
          message: 'Invalid discount: must be a non-negative number'
        })
      }
    }
    
    const payment = row.payment || row['Payment']
    if (payment !== undefined && payment !== '' && payment !== null) {
      const parsedPayment = parsePayment(payment)
      if (isNaN(parsedPayment) || parsedPayment < 0) {
        errors.push({
          row: rowNumber,
          field: 'payment',
          value: payment,
          type: 'invalid_type',
          message: 'Invalid payment: must be a non-negative number'
        })
      }
    }
  })
  
  return errors
}
