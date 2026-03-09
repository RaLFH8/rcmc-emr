import { uploadToGoogleDrive } from './services/googleDrive.js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

async function testUpload() {
  try {
    console.log('========================================')
    console.log('TESTING FILE UPLOAD TO GOOGLE DRIVE')
    console.log('========================================\n')

    // Create a simple test PDF buffer
    const testPdfContent = '%PDF-1.4\nTest PDF content'
    const fileBuffer = Buffer.from(testPdfContent)

    const metadata = {
      testName: 'TEST_UPLOAD',
      patientId: 'TEST123',
      testDate: new Date().toISOString()
    }

    console.log('Uploading test file...')
    console.log('Metadata:', metadata)
    console.log('Buffer size:', fileBuffer.length, 'bytes\n')

    const result = await uploadToGoogleDrive(fileBuffer, metadata)

    console.log('✅ UPLOAD SUCCESSFUL!')
    console.log('File ID:', result.fileId)
    console.log('File Name:', result.name)
    console.log('URL:', result.url)

    console.log('\n========================================')
    console.log('TEST PASSED!')
    console.log('========================================')
    console.log('\nThe upload works! Check your Google Drive folder.')

  } catch (error) {
    console.error('\n❌ UPLOAD FAILED!')
    console.error('Error:', error.message)
    console.error('\nFull error:', error)
  }
}

testUpload()
