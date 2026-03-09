import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function EmergencyAccessDialog({ 
  patientId, 
  patientName, 
  onAccessGranted, 
  onAccessDenied 
}) {
  const [justification, setJustification] = useState('');
  const [emergencyType, setEmergencyType] = useState('life_threatening');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const characterCount = justification.length;
  const isValid = characterCount >= 30;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValid) {
      setError('Justification must be at least 30 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await onAccessGranted({
        patientId,
        justification,
        emergencyType,
        requestedAt: new Date()
      });
      
      // Dialog will close automatically on success
    } catch (err) {
      setError(err.message || 'Failed to grant emergency access');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Emergency Access Request</h2>
          </div>
          <button
            onClick={onAccessDenied}
            className="text-white hover:text-red-100 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Patient:</strong> {patientName}
            </p>
            <p className="text-sm text-yellow-800 mt-1">
              <strong>Patient ID:</strong> {patientId}
            </p>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 space-y-2">
                <p className="font-semibold">⚠️ BREAK-GLASS ACCESS WARNING</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>This action will be <strong>fully audited</strong></li>
                  <li>Primary physician and administrators will be <strong>immediately notified</strong></li>
                  <li>Access will expire after <strong>24 hours</strong></li>
                  <li>All actions will be <strong>logged and reviewed</strong></li>
                  <li>Misuse may result in <strong>disciplinary action</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Emergency Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Type <span className="text-red-500">*</span>
            </label>
            <select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isSubmitting}
              required
            >
              <option value="life_threatening">Life-Threatening Emergency</option>
              <option value="urgent_care">Urgent Care Required</option>
              <option value="critical_condition">Critical Condition</option>
            </select>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Provide detailed justification for emergency access (minimum 30 characters)..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                characterCount > 0 && !isValid ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={4}
              disabled={isSubmitting}
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className={`text-sm ${
                characterCount === 0 ? 'text-gray-500' :
                isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {characterCount} / 30 characters minimum
              </p>
              {isValid && (
                <span className="text-sm text-green-600 font-medium">✓ Valid</span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onAccessDenied}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Granting Access...' : 'Grant Emergency Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
