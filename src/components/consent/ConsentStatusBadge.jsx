/**
 * Consent Status Badge Component
 * 
 * Displays consent status indicators for patients
 * for the Clinical Safety Trio feature.
 * 
 * Requirements: 2.7, 2.10
 */

import { useState, useEffect } from 'react';
import { getPatientConsents } from '../../services/consentService';

/**
 * Consent Status Badge
 * 
 * Displays a visual indicator of patient consent status
 * with color-coded badges and expiration warnings.
 */
export default function ConsentStatusBadge({ patientId, consentType = 'general_treatment', showDetails = false }) {
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) {
      loadConsentStatus();
    }
  }, [patientId, consentType]);

  const loadConsentStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const consents = await getPatientConsents(patientId, {
        includeExpired: false,
        includeWithdrawn: false
      });

      // Find the specific consent type
      const matchingConsent = consents.find(c => c.consent_type === consentType && c.consent_status === 'active');
      setConsent(matchingConsent || null);
    } catch (err) {
      console.error('Failed to load consent status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!consent) {
      return {
        status: 'missing',
        label: 'No Consent',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
        icon: '⚠️'
      };
    }

    const expirationDate = new Date(consent.expiration_date);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration <= 0) {
      return {
        status: 'expired',
        label: 'Expired',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
        icon: '❌',
        daysUntilExpiration
      };
    }

    if (daysUntilExpiration <= 30) {
      return {
        status: 'expiring',
        label: 'Expiring Soon',
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300',
        icon: '⏰',
        daysUntilExpiration
      };
    }

    return {
      status: 'active',
      label: 'Active',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300',
      icon: '✓',
      daysUntilExpiration
    };
  };

  if (loading) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <span className="animate-pulse">Loading...</span>
      </span>
    );
  }

  if (error) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Error
      </span>
    );
  }

  const statusInfo = getStatusInfo();

  if (!showDetails) {
    // Simple badge
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
        <span className="mr-1">{statusInfo.icon}</span>
        {statusInfo.label}
      </span>
    );
  }

  // Detailed badge with expiration info
  return (
    <div className={`inline-flex items-center border ${statusInfo.borderColor} ${statusInfo.bgColor} rounded-lg px-3 py-2`}>
      <div className="flex items-center">
        <span className="text-lg mr-2">{statusInfo.icon}</span>
        <div>
          <div className={`text-sm font-semibold ${statusInfo.textColor}`}>
            {statusInfo.label}
          </div>
          {consent && statusInfo.daysUntilExpiration !== undefined && (
            <div className={`text-xs ${statusInfo.textColor}`}>
              {statusInfo.daysUntilExpiration > 0 ? (
                <>Expires in {statusInfo.daysUntilExpiration} day{statusInfo.daysUntilExpiration !== 1 ? 's' : ''}</>
              ) : (
                <>Expired {Math.abs(statusInfo.daysUntilExpiration)} day{Math.abs(statusInfo.daysUntilExpiration) !== 1 ? 's' : ''} ago</>
              )}
            </div>
          )}
          {!consent && (
            <div className={`text-xs ${statusInfo.textColor}`}>
              Consent required
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Consent Type Badge
 * 
 * Displays a badge for a specific consent type with label
 */
export function ConsentTypeBadge({ consentType }) {
  const typeLabels = {
    general_treatment: 'General Treatment',
    data_sharing: 'Data Sharing',
    research_participation: 'Research',
    emergency_contact: 'Emergency Contact'
  };

  const typeColors = {
    general_treatment: 'bg-blue-100 text-blue-800',
    data_sharing: 'bg-purple-100 text-purple-800',
    research_participation: 'bg-indigo-100 text-indigo-800',
    emergency_contact: 'bg-pink-100 text-pink-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[consentType] || 'bg-gray-100 text-gray-800'}`}>
      {typeLabels[consentType] || consentType}
    </span>
  );
}

/**
 * Consent Summary Panel
 * 
 * Displays all consent statuses for a patient in a compact panel
 */
export function ConsentSummaryPanel({ patientId, onRequestConsent }) {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const consentTypes = [
    { type: 'general_treatment', label: 'General Treatment', required: true },
    { type: 'data_sharing', label: 'Data Sharing', required: false },
    { type: 'research_participation', label: 'Research', required: false },
    { type: 'emergency_contact', label: 'Emergency Contact', required: false }
  ];

  useEffect(() => {
    if (patientId) {
      loadConsents();
    }
  }, [patientId]);

  const loadConsents = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPatientConsents(patientId, {
        includeExpired: true,
        includeWithdrawn: true
      });
      setConsents(data);
    } catch (err) {
      console.error('Failed to load consents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getConsentForType = (type) => {
    return consents.find(c => c.consent_type === type && c.consent_status === 'active');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">Failed to load consent information</p>
      </div>
    );
  }

  const missingRequired = consentTypes
    .filter(ct => ct.required && !getConsentForType(ct.type))
    .length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Consent Status</h3>
        {missingRequired && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Action Required
          </span>
        )}
      </div>

      <div className="space-y-3">
        {consentTypes.map(({ type, label, required }) => {
          const consent = getConsentForType(type);
          
          return (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{label}</span>
                {required && (
                  <span className="text-xs text-red-600 font-medium">*</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ConsentStatusBadge patientId={patientId} consentType={type} />
                {!consent && onRequestConsent && (
                  <button
                    onClick={() => onRequestConsent(type)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Request
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {missingRequired && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            * Required consents must be obtained before accessing patient records
          </p>
        </div>
      )}
    </div>
  );
}
