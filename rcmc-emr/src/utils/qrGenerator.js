import QRCode from 'qrcode';

/**
 * Generate a QR code for a doctor's satisfaction survey
 * 
 * @param {string} doctorId - The doctor's UUID
 * @param {string} doctorName - The doctor's full name (for filename)
 * @param {Object} options - Optional configuration
 * @param {number} options.width - QR code width in pixels (default: 400)
 * @param {number} options.margin - QR code margin (default: 2)
 * @param {string} options.darkColor - Dark color hex (default: #000000)
 * @param {string} options.lightColor - Light color hex (default: #FFFFFF)
 * @param {string} options.room - Optional room parameter
 * @returns {Promise<Object>} Object with success status, dataUrl, and url
 */
export const generateDoctorQR = async (doctorId, doctorName, options = {}) => {
  try {
    const baseUrl = window.location.origin;
    let surveyUrl = `${baseUrl}/survey?doc=${doctorId}`;
    
    // Add room parameter if provided
    if (options.room) {
      surveyUrl += `&room=${options.room}`;
    }
    
    const qrOptions = {
      width: options.width || 400,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };
    
    const dataUrl = await QRCode.toDataURL(surveyUrl, qrOptions);
    
    return {
      success: true,
      dataUrl,
      url: surveyUrl
    };
  } catch (error) {
    console.error('QR code generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate QR codes for multiple doctors in batch
 * 
 * @param {Array} doctors - Array of doctor objects with id, first_name, last_name
 * @returns {Promise<Array>} Array of QR code generation results
 */
export const generateBatchQRCodes = async (doctors) => {
  const results = await Promise.all(
    doctors.map(doctor => 
      generateDoctorQR(
        doctor.id, 
        `${doctor.first_name} ${doctor.last_name}`
      )
    )
  );
  
  return results;
};

/**
 * Download a QR code as a PNG file
 * 
 * @param {string} dataUrl - The QR code data URL
 * @param {string} filename - The filename for the download
 */
export const downloadQRCode = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
