/**
 * Consent Validation Middleware
 * 
 * Validates patient access based on consent status
 * for the Clinical Safety Trio feature.
 * 
 * Requirements: 2.6, 2.7
 */

import { validatePatientAccess as serviceValidatePatientAccess } from '../services/consentService';

/**
 * Validate patient access based on consent
 * 
 * This middleware checks if a user has valid consent to access patient data.
 * It enforces the requirement that all patient access requires active general_treatment consent,
 * unless emergency access override is active.
 * 
 * @param {string} patientId - Patient UUID
 * @param {string} accessType - Type of access: 'read' or 'write'
 * @param {string} userId - User requesting access
 * @returns {Promise<Object>} Validation result
 */
export const validatePatientAccess = async (patientId, accessType, userId) => {
  try {
    const result = await serviceValidatePatientAccess(patientId, accessType, userId);
    return result;
  } catch (error) {
    console.error('Consent validation error:', error);
    return {
      canProceed: false,
      hasValidConsent: false,
      requiredConsentTypes: ['general_treatment'],
      missingConsents: ['general_treatment'],
      expiringConsents: [],
      emergencyOverride: false,
      error: error.message
    };
  }
};

/**
 * React hook for consent validation
 * 
 * @param {string} patientId - Patient UUID
 * @param {string} accessType - Type of access: 'read' or 'write'
 * @returns {Object} Validation state and functions
 */
export const useConsentValidation = (patientId, accessType) => {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);

  const validate = async (userId) => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await validatePatientAccess(patientId, accessType, userId);
      setValidationResult(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validationResult,
    isValidating,
    error,
    validate
  };
};

/**
 * Higher-order component for consent-protected routes
 * 
 * Wraps a component and validates consent before rendering.
 * If consent is missing, displays a consent required message.
 * 
 * @param {React.Component} Component - Component to protect
 * @param {Object} options - Protection options
 * @returns {React.Component} Protected component
 */
export const withConsentProtection = (Component, options = {}) => {
  const {
    accessType = 'read',
    redirectOnMissingConsent = false,
    showConsentForm = true
  } = options;

  return function ConsentProtectedComponent(props) {
    const { patientId, userId } = props;
    const [validationResult, setValidationResult] = useState(null);
    const [isValidating, setIsValidating] = useState(true);
    const [showConsent, setShowConsent] = useState(false);

    useEffect(() => {
      if (patientId && userId) {
        validateAccess();
      }
    }, [patientId, userId]);

    const validateAccess = async () => {
      setIsValidating(true);
      try {
        const result = await validatePatientAccess(patientId, accessType, userId);
        setValidationResult(result);

        if (!result.canProceed && showConsentForm) {
          setShowConsent(true);
        }
      } catch (error) {
        console.error('Consent validation failed:', error);
      } finally {
        setIsValidating(false);
      }
    };

    if (isValidating) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating consent...</p>
          </div>
        </div>
      );
    }

    if (!validationResult || !validationResult.canProceed) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-4">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Consent Required</h3>
              <p className="text-sm text-yellow-700 mb-4">
                This patient has not provided the required consent for accessing their medical records.
                {validationResult?.missingConsents?.length > 0 && (
                  <span className="block mt-2">
                    Missing consent types: {validationResult.missingConsents.join(', ')}
                  </span>
                )}
              </p>
              {showConsent && (
                <button
                  onClick={() => setShowConsent(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  Obtain Consent
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Show expiring consent warning if applicable
    const expiringWarning = validationResult.expiringConsents?.length > 0 && (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 m-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-orange-800 mb-1">Consent Expiring Soon</h4>
            <p className="text-sm text-orange-700">
              This patient has {validationResult.expiringConsents.length} consent(s) expiring within 30 days.
              Please remind the patient to renew their consent.
            </p>
          </div>
        </div>
      </div>
    );

    // Show emergency override indicator if applicable
    const emergencyIndicator = validationResult.emergencyOverride && (
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 m-4 mb-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-red-800 mb-1">EMERGENCY ACCESS MODE</h4>
            <p className="text-sm text-red-700">
              You are accessing this patient's records under emergency override.
              All actions are being logged for compliance review.
            </p>
          </div>
        </div>
      </div>
    );

    return (
      <>
        {emergencyIndicator}
        {expiringWarning}
        <Component {...props} validationResult={validationResult} />
      </>
    );
  };
};

/**
 * Check if consent validation should be bypassed
 * 
 * @param {Object} validationResult - Validation result from validatePatientAccess
 * @returns {boolean} True if access should be allowed
 */
export const shouldAllowAccess = (validationResult) => {
  if (!validationResult) return false;
  return validationResult.canProceed === true;
};

/**
 * Get user-friendly consent status message
 * 
 * @param {Object} validationResult - Validation result from validatePatientAccess
 * @returns {string} Status message
 */
export const getConsentStatusMessage = (validationResult) => {
  if (!validationResult) {
    return 'Unable to validate consent';
  }

  if (validationResult.emergencyOverride) {
    return 'Emergency access override active';
  }

  if (validationResult.canProceed) {
    if (validationResult.expiringConsents?.length > 0) {
      return `Valid consent (${validationResult.expiringConsents.length} expiring soon)`;
    }
    return 'Valid consent';
  }

  if (validationResult.missingConsents?.length > 0) {
    return `Missing consent: ${validationResult.missingConsents.join(', ')}`;
  }

  return 'Consent validation failed';
};

// Import useState for the hook
import { useState, useEffect } from 'react';
