// Google Drive OAuth Client for Lab Results Upload
// Uses Google Identity Services (GIS) for OAuth authentication

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_DRIVE_FOLDER_ID = '1JBKtpUdImoQc1LPzyrmVpOsUCYeTky64'
const SCOPES = 'https://www.googleapis.com/auth/drive.file'

let tokenClient = null
let accessToken = null

// Initialize Google Identity Services
export const initGoogleDrive = () => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to .env file'))
      return
    }

    // Load Google Identity Services library
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log('✅ Google Identity Services loaded')
      resolve()
    }
    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services'))
    }
    document.head.appendChild(script)
  })
}

// Request access token
export const getAccessToken = () => {
  return new Promise((resolve, reject) => {
    if (accessToken) {
      resolve(accessToken)
      return
    }

    if (!window.google) {
      reject(new Error('Google Identity Services not loaded'))
      return
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error))
          return
        }
        accessToken = response.access_token
        console.log('✅ Access token obtained')
        resolve(accessToken)
      },
    })

    tokenClient.requestAccessToken()
  })
}

// Upload file to Google Drive
export const uploadToGoogleDrive = async (file, metadata) => {
  try {
    console.log('Starting Google Drive upload...')
    
    // Get access token
    const token = await getAccessToken()
    
    // Create file metadata
    const fileMetadata = {
      name: `${metadata.testName}_${metadata.patientId}_${metadata.testDate}.pdf`,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
      description: `Lab Result: ${metadata.testName} for Patient ${metadata.patientId} on ${metadata.testDate}`
    }

    // Create multipart form data
    const boundary = '-------314159265358979323846'
    const delimiter = "\r\n--" + boundary + "\r\n"
    const close_delim = "\r\n--" + boundary + "--"

    const reader = new FileReader()
    
    return new Promise((resolve, reject) => {
      reader.readAsArrayBuffer(file)
      reader.onload = async () => {
        const contentType = 'application/pdf'
        const metadata_part = delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(fileMetadata) + delimiter +
          'Content-Type: ' + contentType + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n\r\n'

        const base64Data = btoa(
          new Uint8Array(reader.result)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        )

        const multipart_request_body = metadata_part + base64Data + close_delim

        try {
          const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size',
            {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'multipart/related; boundary=' + boundary
              },
              body: multipart_request_body
            }
          )

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'Upload failed')
          }

          const result = await response.json()
          console.log('✅ File uploaded to Google Drive:', result)

          resolve({
            fileId: result.id,
            url: result.webViewLink,
            size: result.size || file.size
          })
        } catch (error) {
          console.error('❌ Upload error:', error)
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
    })
  } catch (error) {
    console.error('Error in uploadToGoogleDrive:', error)
    throw new Error('Failed to upload to Google Drive: ' + error.message)
  }
}

// Delete file from Google Drive
export const deleteFromGoogleDrive = async (fileId) => {
  try {
    const token = await getAccessToken()
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }
    )

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete file from Google Drive')
    }

    console.log('✅ File deleted from Google Drive')
  } catch (error) {
    console.error('Error deleting from Google Drive:', error)
    throw error
  }
}

// Revoke access token (logout)
export const revokeAccess = () => {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      console.log('Access token revoked')
      accessToken = null
    })
  }
}
