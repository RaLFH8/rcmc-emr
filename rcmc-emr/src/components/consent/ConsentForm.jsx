/**
 * Consent Form Component
 * 
 * Multi-language consent form with signature capture
 * for the Clinical Safety Trio feature.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.11, 2.12
 */

import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { createConsent } from '../../services/consentService';
import { useAuth } from '../../context/AuthContext';

const CONSENT_TEXTS = {
  general_treatment: {
    en: `I hereby consent to receive medical treatment at RCMC Medical Clinic. I understand that this consent includes examination, diagnostic procedures, and treatment as deemed necessary by the healthcare providers. I acknowledge that I have been informed of the nature of my condition, proposed treatment, potential risks, and alternative options. I understand that no guarantees have been made regarding the outcome of treatment. I consent to the use and disclosure of my health information for treatment, payment, and healthcare operations as permitted by law.`,
    fil: `Ako ay pumapayag na makatanggap ng medikal na paggamot sa RCMC Medical Clinic. Nauunawaan ko na ang pahintulot na ito ay kinabibilangan ng pagsusuri, mga proseso ng diagnosis, at paggamot na itinuturing na kinakailangan ng mga tagapagbigay ng kalusugan. Kinikilala ko na ako ay napagsabihan tungkol sa kalikasan ng aking kondisyon, iminungkahing paggamot, mga potensyal na panganib, at mga alternatibong opsyon. Nauunawaan ko na walang garantiya tungkol sa resulta ng paggamot. Pumapayag ako sa paggamit at pagsisiwalat ng aking impormasyon sa kalusugan para sa paggamot, pagbabayad, at mga operasyon ng pangangalaga sa kalusugan ayon sa batas.`
  },
  data_sharing: {
    en: `I consent to the sharing of my health information with other healthcare providers, insurance companies, and authorized third parties as necessary for my care and treatment. I understand that this information may include medical history, test results, diagnoses, and treatment plans. I acknowledge that I have the right to revoke this consent at any time in writing, except where disclosure has already been made. I understand that my information will be protected according to applicable privacy laws.`,
    fil: `Pumapayag ako sa pagbabahagi ng aking impormasyon sa kalusugan sa iba pang mga tagapagbigay ng pangangalaga sa kalusugan, mga kumpanya ng insurance, at awtorisadong third parties kung kinakailangan para sa aking pangangalaga at paggamot. Nauunawaan ko na ang impormasyong ito ay maaaring magsama ng medikal na kasaysayan, mga resulta ng pagsusulit, mga diagnosis, at mga plano sa paggamot. Kinikilala ko na ako ay may karapatang bawiin ang pahintulot na ito anumang oras sa pamamagitan ng pagsusulat, maliban kung ang pagsisiwalat ay ginawa na. Nauunawaan ko na ang aking impormasyon ay poprotektahan ayon sa naaangkop na mga batas sa privacy.`
  },
  research_participation: {
    en: `I consent to the use of my de-identified health information for medical research and quality improvement purposes. I understand that my personal identifying information will be removed before any data is used for research. I acknowledge that participation in research is voluntary and that I may withdraw my consent at any time without affecting my medical care. I understand that research findings may be published but will not identify me personally.`,
    fil: `Pumapayag ako sa paggamit ng aking de-identified na impormasyon sa kalusugan para sa medikal na pananaliksik at mga layunin ng pagpapabuti ng kalidad. Nauunawaan ko na ang aking personal na impormasyon sa pagkakakilanlan ay aalisin bago gamitin ang anumang data para sa pananaliksik. Kinikilala ko na ang pakikilahok sa pananaliksik ay boluntaryo at maaari kong bawiin ang aking pahintulot anumang oras nang hindi nakakaapekto sa aking pangangalaga medikal. Nauunawaan ko na ang mga natuklasan sa pananaliksik ay maaaring ilathala ngunit hindi ako personal na kikilalanin.`
  },
  emergency_contact: {
    en: `I consent to RCMC Medical Clinic contacting my designated emergency contacts in case of a medical emergency or if I am unable to make decisions regarding my care. I authorize the clinic to share relevant medical information with my emergency contacts as necessary for my safety and well-being. I understand that I can update my emergency contact information at any time.`,
    fil: `Pumapayag ako sa RCMC Medical Clinic na makipag-ugnayan sa aking itinalagang mga emergency contact sa kaso ng medikal na emergency o kung hindi ako makagawa ng mga desisyon tungkol sa aking pangangalaga. Awtorisado ko ang klinika na magbahagi ng nauugnay na medikal na impormasyon sa aking mga emergency contact kung kinakailangan para sa aking kaligtasan at kaginhawahan. Nauunawaan ko na maaari kong i-update ang aking impormasyon sa emergency contact anumang oras.`
  }
};

const CONSENT_TYPE_LABELS = {
  general_treatment: {
    en: 'General Treatment Consent',
    fil: 'Pahintulot sa Pangkalahatang Paggamot'
  },
  data_sharing: {
    en: 'Data Sharing Consent',
    fil: 'Pahintulot sa Pagbabahagi ng Data'
  },
  research_participation: {
    en: 'Research Participation Consent',
    fil: 'Pahintulot sa Pakikilahok sa Pananaliksik'
  },
  emergency_contact: {
    en: 'Emergency Contact Authorization',
    fil: 'Awtorisasyon sa Emergency Contact'
  }
};

export default function ConsentForm({ patientId, patientName, onSuccess, onCancel, prefilledData = {} }) {
  const { user } = useAuth();
  const signatureRef = useRef(null);

  const [consentType, setConsentType] = useState(prefilledData.consentType || 'general_treatment');
  const [language, setLanguage] = useState(prefilledData.language || 'en');
  const [signatureData, setSignatureData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [signatureSize, setSignatureSize] = useState(0);

  const consentText = CONSENT_TEXTS[consentType][language];
  const consentLabel = CONSENT_TYPE_LABELS[consentType][language];

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignatureData(null);
      setSignatureSize(0);
    }
  };

  const handleSignatureEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataUrl = signatureRef.current.toDataURL('image/png');
      setSignatureData(dataUrl);
      
      // Calculate signature size
      const sizeInBytes = dataUrl.length;
      setSignatureSize(sizeInBytes);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate signature
    if (!signatureData) {
      setError('Please provide your signature');
      return;
    }

    // Validate signature size (max 50KB = ~68000 base64 chars)
    if (signatureSize > 68000) {
      setError('Signature is too large. Please provide a simpler signature.');
      return;
    }

    setIsSubmitting(true);

    try {
      const consent = await createConsent({
        patientId,
        consentType,
        consentText,
        language,
        signatureData,
        witnessUserId: user.id,
        consentDate: new Date()
      });

      if (onSuccess) {
        onSuccess(consent);
      }
    } catch (err) {
      console.error('Failed to create consent:', err);
      setError(err.message || 'Failed to create consent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Consent Form</h2>
        <p className="text-gray-600">Patient: <span className="font-semibold">{patientName}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Consent Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Consent Type
          </label>
          <select
            value={consentType}
            onChange={(e) => setConsentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="general_treatment">General Treatment</option>
            <option value="data_sharing">Data Sharing</option>
            <option value="research_participation">Research Participation</option>
            <option value="emergency_contact">Emergency Contact Authorization</option>
          </select>
        </div>

        {/* Language Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language / Wika
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="en"
                checked={language === 'en'}
                onChange={(e) => setLanguage(e.target.value)}
                className="mr-2"
                disabled={isSubmitting}
              />
              <span>English</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="fil"
                checked={language === 'fil'}
                onChange={(e) => setLanguage(e.target.value)}
                className="mr-2"
                disabled={isSubmitting}
              />
              <span>Filipino</span>
            </label>
          </div>
        </div>

        {/* Consent Text Display */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{consentLabel}</h3>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {consentText}
          </div>
        </div>

        {/* Signature Canvas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient Signature
          </label>
          <div className="border-2 border-gray-300 rounded-lg bg-white">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'w-full h-40 cursor-crosshair',
                style: { touchAction: 'none' }
              }}
              onEnd={handleSignatureEnd}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <button
              type="button"
              onClick={handleClearSignature}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={isSubmitting}
            >
              Clear Signature
            </button>
            {signatureSize > 0 && (
              <span className={`text-sm ${signatureSize > 68000 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                Size: {formatBytes(signatureSize)} {signatureSize > 68000 && '(Too large!)'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Please sign above using your mouse or touchscreen. Maximum size: 50KB.
          </p>
        </div>

        {/* Warning Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-yellow-800 mb-1">Important Notice</h4>
              <p className="text-sm text-yellow-700">
                By signing this consent form, you acknowledge that you have read and understood the consent statement above. 
                This consent will be recorded in your medical record and witnessed by {user?.first_name} {user?.last_name}.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !signatureData || signatureSize > 68000}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Consent'}
          </button>
        </div>
      </form>
    </div>
  );
}
