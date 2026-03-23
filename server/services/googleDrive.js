import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

// Load service account credentials
const CREDENTIALS_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './google-credentials.json'
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1JBKtpUdImoQc1LPzyrmVpOsUCYeTky64'

// Initialize Google Drive API
let drive = null

function initializeDrive() {
  if (drive) return drive

  try {
    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Credentials file not found: ${CREDENTIALS_PATH}`)
    }

    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'))

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive']
    })

    // Create drive instance
    drive = google.drive({ version: 'v3', auth })
    
    console.log('✅ Google Drive API initialized')
    return drive
  } catch (error) {
    console.error('❌ Failed to initialize Google Drive API:', error.message)
    throw error
  }
}

/**
 * Upload file to Google Drive
 */
export async function uploadToGoogleDrive(fileBuffer, metadata) {
  try {
    const driveClient = initializeDrive()

    if (!FOLDER_ID) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID not set in environment variables')
    }

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `${metadata.testName}_${metadata.patientId}_${timestamp}.pdf`

    // Convert buffer to stream
    const bufferStream = new Readable()
    bufferStream.push(fileBuffer)
    bufferStream.push(null)

    // Upload file
    const response = await driveClient.files.create({
      requestBody: {
        name: fileName,
        parents: [FOLDER_ID],
        description: `Lab result for patient ${metadata.patientId} - ${metadata.testName} (${metadata.testDate})`
      },
      media: {
        mimeType: 'application/pdf',
        body: bufferStream
      },
      fields: 'id, name, webViewLink, webContentLink'
    })

    // Make file publicly readable so the stored URL works for anyone with the link
    await driveClient.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    })

    return {
      fileId: response.data.id,
      url: `https://drive.google.com/file/d/${response.data.id}/preview`,
      name: response.data.name
    }
  } catch (error) {
    console.error('Google Drive upload error:', error)
    throw new Error(`Failed to upload to Google Drive: ${error.message}`)
  }
}

/**
 * Delete file from Google Drive
 */
export async function deleteFromGoogleDrive(fileId) {
  try {
    const driveClient = initializeDrive()

    await driveClient.files.delete({
      fileId: fileId
    })

    return true
  } catch (error) {
    console.error('Google Drive delete error:', error)
    throw new Error(`Failed to delete from Google Drive: ${error.message}`)
  }
}

/**
 * Get file metadata from Google Drive
 */
export async function getFileMetadata(fileId) {
  try {
    const driveClient = initializeDrive()

    const response = await driveClient.files.get({
      fileId: fileId,
      fields: 'id, name, size, mimeType, createdTime, webViewLink'
    })

    return response.data
  } catch (error) {
    console.error('Google Drive metadata error:', error)
    throw new Error(`Failed to get file metadata: ${error.message}`)
  }
}

/**
 * Create folder structure (year/month)
 */
export async function createFolderStructure(year, month) {
  try {
    const driveClient = initializeDrive()

    // Check if year folder exists
    const yearFolderName = year.toString()
    let yearFolderId = await findFolder(yearFolderName, FOLDER_ID)

    if (!yearFolderId) {
      // Create year folder
      const yearFolder = await driveClient.files.create({
        requestBody: {
          name: yearFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [FOLDER_ID]
        },
        fields: 'id'
      })
      yearFolderId = yearFolder.data.id
    }

    // Check if month folder exists
    const monthFolderName = month.toString().padStart(2, '0')
    let monthFolderId = await findFolder(monthFolderName, yearFolderId)

    if (!monthFolderId) {
      // Create month folder
      const monthFolder = await driveClient.files.create({
        requestBody: {
          name: monthFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [yearFolderId]
        },
        fields: 'id'
      })
      monthFolderId = monthFolder.data.id
    }

    return monthFolderId
  } catch (error) {
    console.error('Folder creation error:', error)
    throw new Error(`Failed to create folder structure: ${error.message}`)
  }
}

/**
 * Find folder by name
 */
async function findFolder(folderName, parentId) {
  try {
    const driveClient = initializeDrive()

    const response = await driveClient.files.list({
      q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    })

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id
    }

    return null
  } catch (error) {
    console.error('Folder search error:', error)
    return null
  }
}
