import { google } from 'googleapis'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const CREDENTIALS_PATH = './google-credentials.json'
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1JBKtpUdImoQc1LPzyrmVpOsUCYeTky64'

async function testDriveAccess() {
  try {
    console.log('========================================')
    console.log('TESTING GOOGLE DRIVE ACCESS')
    console.log('========================================\n')

    // Load credentials
    console.log('1. Loading credentials...')
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'))
    console.log('   ✅ Credentials loaded')
    console.log('   Service Account:', credentials.client_email)

    // Create auth client
    console.log('\n2. Creating auth client...')
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive']
    })
    console.log('   ✅ Auth client created with drive scope')

    // Create drive instance
    console.log('\n3. Creating Drive API instance...')
    const drive = google.drive({ version: 'v3', auth })
    console.log('   ✅ Drive API instance created')

    // Test folder access
    console.log('\n4. Testing folder access...')
    console.log('   Folder ID:', FOLDER_ID)
    
    const folderInfo = await drive.files.get({
      fileId: FOLDER_ID,
      fields: 'id, name, permissions'
    })

    console.log('   ✅ Folder accessed successfully!')
    console.log('   Folder Name:', folderInfo.data.name)

    // List permissions
    console.log('\n5. Checking folder permissions...')
    const permissions = await drive.permissions.list({
      fileId: FOLDER_ID,
      fields: 'permissions(id, type, role, emailAddress)'
    })

    console.log('   Permissions:')
    permissions.data.permissions.forEach(perm => {
      console.log(`   - ${perm.type}: ${perm.emailAddress || 'N/A'} (${perm.role})`)
    })

    // Check if service account has access
    const serviceAccountEmail = credentials.client_email
    const hasAccess = permissions.data.permissions.some(
      perm => perm.emailAddress === serviceAccountEmail
    )

    if (hasAccess) {
      console.log('\n   ✅ Service account HAS access to the folder!')
    } else {
      console.log('\n   ❌ Service account DOES NOT have access to the folder!')
      console.log('   You need to share the folder with:', serviceAccountEmail)
    }

    // Try to list files in folder
    console.log('\n6. Testing file listing...')
    const files = await drive.files.list({
      q: `'${FOLDER_ID}' in parents`,
      fields: 'files(id, name)',
      pageSize: 5
    })

    console.log(`   ✅ Can list files (${files.data.files.length} files found)`)

    console.log('\n========================================')
    console.log('TEST COMPLETED SUCCESSFULLY!')
    console.log('========================================')
    console.log('\nThe Google Drive integration is working correctly.')
    console.log('You can now upload lab results!')

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    
    if (error.code === 404) {
      console.error('\nThe folder was not found or the service account doesn\'t have access.')
      console.error('Make sure you shared the folder with the service account email.')
    } else if (error.code === 403) {
      console.error('\nPermission denied. The service account doesn\'t have access.')
      console.error('Make sure you shared the folder with "Editor" permission.')
    }
    
    console.error('\nService Account Email:', JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8')).client_email)
    console.error('Folder ID:', FOLDER_ID)
  }
}

testDriveAccess()
