/**
 * Consent Management Page
 * 
 * Dashboard for managing patient consents
 * for the Clinical Safety Trio feature.
 * 
 * Requirements: 2.5, 2.9, 2.10, 7.4
 */

import { useState, useEffect } from 'react';
import { FileText, AlertTriangle, CheckCircle, XCircle, Clock, Download, RefreshCw } from 'lucide-react';
import { 
  getPatientConsents, 
  withdrawConsent, 
  renewConsent,
  getExpiringConsents,
  getConsentCoverage,
  generateConsentPDF
} from '../services/consentService';
import { db } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ConsentForm from '../components/consent/ConsentForm';
import { ConsentStatusBadge, ConsentTypeBadge } from '../components/consent/ConsentStatusBadge';
import { generateConsentFilename, downloadConsentPDF } from '../utils/consentPdfGenerator';

export default function ConsentManagement() {
  const { user, userProfile } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, expired, withdrawn, missing
  const [searchTerm, setSearchTerm] = useState('');
  const [expiringConsents, setExpiringConsents] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawingConsent, setWithdrawingConsent] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPatients(),
        loadExpiringConsents(),
        loadCoverage()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const patientsData = await db.getPatients(1000, 0, searchTerm);
      
      // Load consent status for each patient
      const patientsWithConsents = await Promise.all(
        patientsData.map(async (patient) => {
          try {
            const consents = await getPatientConsents(patient.id);
            const activeConsent = consents.find(
              c => c.consent_type === 'general_treatment' && c.consent_status === 'active'
            );
            return {
              ...patient,
              consents,
              hasActiveConsent: !!activeConsent,
              activeConsent
            };
          } catch (error) {
            console.error(`Failed to load consents for patient ${patient.id}:`, error);
            return {
              ...patient,
              consents: [],
              hasActiveConsent: false
            };
          }
        })
      );

      setPatients(patientsWithConsents);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  const loadExpiringConsents = async () => {
    try {
      const expiring = await getExpiringConsents(30);
      setExpiringConsents(expiring);
    } catch (error) {
      console.error('Failed to load expiring consents:', error);
    }
  };

  const loadCoverage = async () => {
    try {
      const coverageData = await getConsentCoverage();
      setCoverage(coverageData);
    } catch (error) {
      console.error('Failed to load coverage:', error);
    }
  };

  const handleWithdrawConsent = async () => {
    if (!withdrawingConsent || !withdrawReason.trim()) {
      alert('Please provide a reason for withdrawal');
      return;
    }

    try {
      await withdrawConsent(withdrawingConsent.id, withdrawReason, user.id);
      setShowWithdrawModal(false);
      setWithdrawingConsent(null);
      setWithdrawReason('');
      await loadData();
      alert('Consent withdrawn successfully');
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      alert('Failed to withdraw consent: ' + error.message);
    }
  };

  const handleDownloadPDF = async (consent, patient) => {
    try {
      const pdfBlob = await generateConsentPDF({
        consentRecord: consent,
        patientInfo: patient,
        witnessInfo: consent.witness || userProfile,
        includeSignature: true
      });

      const filename = generateConsentFilename(consent, patient);
      downloadConsentPDF(pdfBlob, filename);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF: ' + error.message);
    }
  };

  const filteredPatients = patients.filter(patient => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Apply status filter
    switch (filter) {
      case 'active':
        return patient.hasActiveConsent;
      case 'expired':
        return patient.consents.some(c => c.consent_status === 'expired');
      case 'withdrawn':
        return patient.consents.some(c => c.consent_status === 'withdrawn');
      case 'missing':
        return !patient.hasActiveConsent;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consent data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Consent Management</h1>
        <p className="text-gray-600">Manage patient consent records and compliance</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consent Coverage</p>
              <p className="text-2xl font-bold text-green-600">
                {coverage ? `${coverage.coverage_percentage}%` : 'N/A'}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-600">{expiringConsents.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Missing Consent</p>
              <p className="text-2xl font-bold text-red-600">
                {patients.filter(p => !p.hasActiveConsent).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Expiring Consents Warning */}
      {expiringConsents.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-800 mb-2">
                {expiringConsents.length} Consent(s) Expiring Within 30 Days
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                Please remind patients to renew their consent before expiration.
              </p>
              <div className="space-y-2">
                {expiringConsents.slice(0, 5).map(consent => {
                  const patient = patients.find(p => p.id === consent.patient_id);
                  const daysRemaining = Math.ceil(
                    (new Date(consent.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={consent.id} className="flex items-center justify-between text-sm">
                      <span className="text-orange-800">
                        {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
                      </span>
                      <span className="text-orange-600 font-medium">
                        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('missing')}
              className={`px-4 py-2 rounded-md ${filter === 'missing' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Missing
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-md ${filter === 'expired' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Expired
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consent Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiration Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPatients.map(patient => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {patient.first_name} {patient.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.patient_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ConsentStatusBadge patientId={patient.id} consentType="general_treatment" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.activeConsent ? 
                    new Date(patient.activeConsent.expiration_date).toLocaleDateString() : 
                    'N/A'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    {!patient.hasActiveConsent && (
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowConsentForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Obtain Consent
                      </button>
                    )}
                    {patient.activeConsent && (
                      <>
                        <button
                          onClick={() => handleDownloadPDF(patient.activeConsent, patient)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setWithdrawingConsent(patient.activeConsent);
                            setShowWithdrawModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Withdraw
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Consent Form Modal */}
      {showConsentForm && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="my-8">
            <ConsentForm
              patientId={selectedPatient.id}
              patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
              onSuccess={() => {
                setShowConsentForm(false);
                setSelectedPatient(null);
                loadData();
              }}
              onCancel={() => {
                setShowConsentForm(false);
                setSelectedPatient(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Withdraw Consent Modal */}
      {showWithdrawModal && withdrawingConsent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Withdraw Consent</h3>
            <p className="text-sm text-gray-700 mb-4">
              Please provide a reason for withdrawing this consent. This action will be logged in the audit trail.
            </p>
            <textarea
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder="Reason for withdrawal (minimum 10 characters)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawingConsent(null);
                  setWithdrawReason('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawConsent}
                disabled={withdrawReason.trim().length < 10}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Withdraw Consent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
