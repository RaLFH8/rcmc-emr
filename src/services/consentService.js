/**
 * Consent Service
 * 
 * Implements patient consent management functionality
 * for the Clinical Safety Trio feature.
 * 
 * Requirements: 2.1, 2.4, 2.5, 2.7, 2.8, 2.9, 2.10
 * 
 * Features:
 * - Create consent with signature validation
 * - Withdraw consent with reason capture
 * - Check consent status for access control
 * - Get patient consent history
 * - Renew expired consents
 * - Generate consent PDF documents
 * - Get expiring consents for warnings
 */

import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';

/**
 * Create a new consent record
 * 
 * @param {Object} formData - Consent form data
 * @param {string} formData.patientId - Patient UUID
 * @param {string} formData.consentType - Type: general_treatment, data_sharing, research_participation, emergency_contact
 * @param {string} formData.consentText - Full consent text
 * @param {string} formData.language - Language: 'en' or 'fil'
 * @param {string} formData.signatureData - Base64-encoded PNG signature
 * @param {string} formData.witnessUserId - Witness user UUID
 * @param {Date} formData.consentDate - Date of consent (default: now)
 * @param {Date} formData.expirationDate - Expiration date (default: 1 year from consent date)
 * @returns {Promise<Object>} Created consent record
 * @throws {Error} If validation fails
 */
export const createConsent = async (formData) => {
  const {
    patientId,
    consentType,
    consentText,
    language,
    signatureData,
    witnessUserId,
    consentDate = new Date(),
    expirationDate
  } = formData;

  // Validate required fields
  if (!patientId || !consentType || !consentText || !language || !signatureData || !witnessUserId) {
    throw new Error('All consent fields are required');
  }

  // Validate consent type
  const validTypes = ['general_treatment', 'data_sharing', 'research_participation', 'emergency_contact'];
  if (!validTypes.includes(consentType)) {
    throw new Error('Invalid consent type');
  }

  // Validate language
  if (!['en', 'fil'].includes(language)) {
    throw new Error('Language must be "en" or "fil"');
  }

  // Validate signature data format
  if (!signatureData.startsWith('data:image/png;base64,')) {
    throw new Error('Signature must be a base64-encoded PNG image');
  }

  // Validate signature size (max 50KB)
  const signatureSize = signatureData.length;
  if (signatureSize > 68000) { // ~50KB base64
    throw new Error('Signature data exceeds maximum size of 50KB');
  }

  // Check if patient already has active consent of this type
  const { data: existingConsent, error: checkError } = await supabase
    .from('consent_records')
    .select('id, consent_status')
    .eq('patient_id', patientId)
    .eq('consent_type', consentType)
    .eq('consent_status', 'active')
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw checkError;
  }

  if (existingConsent) {
    throw new Error(`Patient already has an active ${consentType} consent`);
  }

  // Calculate expiration date if not provided (1 year default)
  const finalExpirationDate = expirationDate || new Date(new Date(consentDate).setFullYear(new Date(consentDate).getFullYear() + 1));

  // Create consent record
  const { data: consent, error: insertError } = await supabase
    .from('consent_records')
    .insert([{
      patient_id: patientId,
      consent_type: consentType,
      consent_text: consentText,
      language,
      signature_data: signatureData,
      witness_user_id: witnessUserId,
      consent_date: consentDate.toISOString(),
      expiration_date: finalExpirationDate.toISOString().split('T')[0], // Date only
      consent_status: 'active'
    }])
    .select()
    .single();

  if (insertError) throw insertError;

  // Create audit log entry
  try {
    await supabase
      .from('audit_log')
      .insert([{
        operation_type: 'consent_granted',
        user_id: witnessUserId,
        consent_record_id: consent.id,
        table_name: 'consent_records',
        record_id: consent.id,
        action: 'insert',
        new_data: {
          patient_id: patientId,
          consent_type: consentType,
          language,
          expiration_date: finalExpirationDate.toISOString().split('T')[0]
        }
      }]);
  } catch (auditError) {
    console.error('Failed to create audit log:', auditError);
  }

  return consent;
};

/**
 * Withdraw a consent record
 * 
 * @param {string} consentId - Consent record UUID
 * @param {string} reason - Reason for withdrawal
 * @param {string} userId - User performing withdrawal
 * @returns {Promise<Object>} Updated consent record
 * @throws {Error} If consent not found or already withdrawn
 */
export const withdrawConsent = async (consentId, reason, userId) => {
  if (!reason || reason.trim().length < 10) {
    throw new Error('Withdrawal reason must be at least 10 characters');
  }

  // Update consent status to withdrawn
  const { data: consent, error: updateError } = await supabase
    .from('consent_records')
    .update({
      consent_status: 'withdrawn',
      withdrawal_date: new Date().toISOString(),
      withdrawal_reason: reason.trim()
    })
    .eq('id', consentId)
    .eq('consent_status', 'active') // Only withdraw active consents
    .select()
    .single();

  if (updateError) throw updateError;
  if (!consent) throw new Error('Consent not found or already withdrawn');

  // Create audit log entry
  try {
    await supabase
      .from('audit_log')
      .insert([{
        operation_type: 'consent_withdrawn',
        user_id: userId,
        consent_record_id: consentId,
        table_name: 'consent_records',
        record_id: consentId,
        action: 'update',
        new_data: {
          consent_status: 'withdrawn',
          withdrawal_reason: reason.trim(),
          withdrawal_date: new Date().toISOString()
        }
      }]);
  } catch (auditError) {
    console.error('Failed to create audit log:', auditError);
  }

  return consent;
};

/**
 * Check consent status for a patient
 * 
 * @param {string} patientId - Patient UUID
 * @param {string} consentType - Consent type to check
 * @returns {Promise<Object>} Consent status result
 */
export const checkConsentStatus = async (patientId, consentType) => {
  const { data, error } = await supabase
    .rpc('check_patient_consent', {
      p_patient_id: patientId,
      p_consent_type: consentType
    });

  if (error) {
    console.error('Error checking consent status:', error);
    return {
      hasValidConsent: false,
      error: error.message
    };
  }

  return {
    hasValidConsent: data === true,
    consentType
  };
};

/**
 * Get all consent records for a patient
 * 
 * @param {string} patientId - Patient UUID
 * @param {Object} options - Query options
 * @param {boolean} options.includeExpired - Include expired consents (default: true)
 * @param {boolean} options.includeWithdrawn - Include withdrawn consents (default: true)
 * @returns {Promise<Array>} Array of consent records
 */
export const getPatientConsents = async (patientId, options = {}) => {
  const {
    includeExpired = true,
    includeWithdrawn = true
  } = options;

  let query = supabase
    .from('consent_records')
    .select(`
      *,
      witness:user_profiles!consent_records_witness_user_id_fkey(id, first_name, last_name, role)
    `)
    .eq('patient_id', patientId)
    .order('consent_date', { ascending: false });

  // Filter by status if needed
  if (!includeExpired && !includeWithdrawn) {
    query = query.eq('consent_status', 'active');
  } else if (!includeExpired) {
    query = query.in('consent_status', ['active', 'withdrawn']);
  } else if (!includeWithdrawn) {
    query = query.in('consent_status', ['active', 'expired']);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Renew an expired consent
 * 
 * @param {string} consentId - Expired consent UUID
 * @param {string} newSignature - New base64-encoded signature
 * @param {string} witnessUserId - Witness user UUID
 * @returns {Promise<Object>} New consent record
 * @throws {Error} If consent not found or not expired
 */
export const renewConsent = async (consentId, newSignature, witnessUserId) => {
  // Get the expired consent
  const { data: oldConsent, error: fetchError } = await supabase
    .from('consent_records')
    .select('*')
    .eq('id', consentId)
    .single();

  if (fetchError) throw fetchError;
  if (!oldConsent) throw new Error('Consent not found');

  if (oldConsent.consent_status !== 'expired') {
    throw new Error('Only expired consents can be renewed');
  }

  // Create new consent with same details but new signature
  const newConsent = await createConsent({
    patientId: oldConsent.patient_id,
    consentType: oldConsent.consent_type,
    consentText: oldConsent.consent_text,
    language: oldConsent.language,
    signatureData: newSignature,
    witnessUserId,
    consentDate: new Date()
  });

  // Create audit log entry for renewal
  try {
    await supabase
      .from('audit_log')
      .insert([{
        operation_type: 'consent_renewed',
        user_id: witnessUserId,
        consent_record_id: newConsent.id,
        table_name: 'consent_records',
        record_id: newConsent.id,
        action: 'insert',
        new_data: {
          old_consent_id: consentId,
          new_consent_id: newConsent.id,
          patient_id: oldConsent.patient_id,
          consent_type: oldConsent.consent_type
        }
      }]);
  } catch (auditError) {
    console.error('Failed to create audit log:', auditError);
  }

  return newConsent;
};

/**
 * Generate consent PDF document
 * 
 * @param {string} consentId - Consent record UUID
 * @returns {Promise<Blob>} PDF blob
 */
export const generateConsentPDF = async (consentId) => {
  // Fetch consent record with related data
  const { data: consent, error } = await supabase
    .from('consent_records')
    .select(`
      *,
      patient:patients(id, first_name, last_name, patient_number, date_of_birth, contact_number),
      witness:user_profiles!consent_records_witness_user_id_fkey(id, first_name, last_name, role)
    `)
    .eq('id', consentId)
    .single();

  if (error) throw error;
  if (!consent) throw new Error('Consent not found');

  // Create PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RCMC Medical Clinic', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(14);
  doc.text('Patient Consent Form', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Consent Type
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const consentTypeLabel = consent.consent_type.replace(/_/g, ' ').toUpperCase();
  doc.text(`Consent Type: ${consentTypeLabel}`, 14, yPos);
  yPos += 10;

  // Patient Information
  doc.setFontSize(11);
  doc.text('Patient Information:', 14, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${consent.patient.first_name} ${consent.patient.last_name}`, 14, yPos);
  yPos += 6;
  doc.text(`Patient Number: ${consent.patient.patient_number}`, 14, yPos);
  yPos += 6;
  doc.text(`Date of Birth: ${new Date(consent.patient.date_of_birth).toLocaleDateString()}`, 14, yPos);
  yPos += 6;
  doc.text(`Contact: ${consent.patient.contact_number || 'N/A'}`, 14, yPos);
  yPos += 12;

  // Consent Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Consent Statement:', 14, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const consentTextLines = doc.splitTextToSize(consent.consent_text, pageWidth - 28);
  consentTextLines.forEach(line => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, 14, yPos);
    yPos += 5;
  });
  yPos += 10;

  // Signature
  if (consent.signature_data) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Patient Signature:', 14, yPos);
    yPos += 5;

    try {
      // Add signature image
      doc.addImage(consent.signature_data, 'PNG', 14, yPos, 60, 20);
      yPos += 25;
    } catch (error) {
      console.error('Failed to add signature image:', error);
      doc.setFont('helvetica', 'italic');
      doc.text('[Signature image not available]', 14, yPos);
      yPos += 10;
    }
  }

  // Consent Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Consent Date: ${new Date(consent.consent_date).toLocaleDateString()}`, 14, yPos);
  yPos += 6;
  doc.text(`Expiration Date: ${new Date(consent.expiration_date).toLocaleDateString()}`, 14, yPos);
  yPos += 6;
  doc.text(`Language: ${consent.language === 'en' ? 'English' : 'Filipino'}`, 14, yPos);
  yPos += 6;
  doc.text(`Status: ${consent.consent_status.toUpperCase()}`, 14, yPos);
  yPos += 12;

  // Witness Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Witnessed By:', 14, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${consent.witness.first_name} ${consent.witness.last_name}`, 14, yPos);
  yPos += 6;
  doc.text(`Role: ${consent.witness.role}`, 14, yPos);
  yPos += 12;

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text(`Consent ID: ${consent.id}`, 14, yPos);
  yPos += 5;
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Return PDF as blob
  return doc.output('blob');
};

/**
 * Get consents expiring within specified days
 * 
 * @param {number} daysUntilExpiration - Days until expiration (default: 30)
 * @returns {Promise<Array>} Array of expiring consents
 */
export const getExpiringConsents = async (daysUntilExpiration = 30) => {
  const { data, error } = await supabase
    .rpc('get_expiring_consents', {
      days_until_expiration: daysUntilExpiration
    });

  if (error) throw error;
  return data || [];
};

/**
 * Get consent coverage statistics
 * 
 * @returns {Promise<Object>} Coverage statistics
 */
export const getConsentCoverage = async () => {
  const { data, error } = await supabase
    .rpc('get_consent_coverage');

  if (error) throw error;

  if (data && data.length > 0) {
    return data[0];
  }

  return {
    total_patients: 0,
    patients_with_consent: 0,
    coverage_percentage: 0
  };
};

/**
 * Validate patient access based on consent
 * 
 * @param {string} patientId - Patient UUID
 * @param {string} accessType - Type of access: 'read' or 'write'
 * @param {string} userId - User requesting access
 * @returns {Promise<Object>} Validation result
 */
export const validatePatientAccess = async (patientId, accessType, userId) => {
  // Check for active general_treatment consent (required for all access)
  const generalConsent = await checkConsentStatus(patientId, 'general_treatment');

  // Check for emergency access override
  const { data: hasEmergencyAccess } = await supabase
    .rpc('check_emergency_access', {
      p_user_id: userId,
      p_patient_id: patientId
    });

  const result = {
    canProceed: false,
    hasValidConsent: generalConsent.hasValidConsent,
    requiredConsentTypes: ['general_treatment'],
    missingConsents: [],
    expiringConsents: [],
    emergencyOverride: hasEmergencyAccess === true
  };

  // If emergency override is active, allow access
  if (result.emergencyOverride) {
    result.canProceed = true;
    return result;
  }

  // Check if general treatment consent is valid
  if (!generalConsent.hasValidConsent) {
    result.missingConsents.push('general_treatment');
  } else {
    result.canProceed = true;
  }

  // Check for expiring consents (within 30 days)
  const expiringConsents = await getExpiringConsents(30);
  result.expiringConsents = expiringConsents.filter(c => c.patient_id === patientId);

  // Log consent check to audit trail
  try {
    await supabase
      .from('audit_log')
      .insert([{
        operation_type: 'consent_check',
        user_id: userId,
        table_name: 'consent_records',
        action: 'select',
        new_data: {
          patient_id: patientId,
          access_type: accessType,
          has_valid_consent: result.hasValidConsent,
          can_proceed: result.canProceed,
          emergency_override: result.emergencyOverride
        }
      }]);
  } catch (auditError) {
    console.error('Failed to create audit log:', auditError);
  }

  return result;
};
