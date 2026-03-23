import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

console.log('='.repeat(50))
console.log('ENVIRONMENT VARIABLE TEST')
console.log('='.repeat(50))
console.log('')
console.log('PORT:', process.env.PORT || 'NOT SET')
console.log('GOOGLE_DRIVE_FOLDER_ID:', process.env.GOOGLE_DRIVE_FOLDER_ID || 'NOT SET')
console.log('GOOGLE_SERVICE_ACCOUNT_PATH:', process.env.GOOGLE_SERVICE_ACCOUNT_PATH || 'NOT SET')
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET')
console.log('')
console.log('='.repeat(50))
console.log('HARDCODED FALLBACK TEST')
console.log('='.repeat(50))
console.log('')
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1JBKtpUdImoQc1LPzyrmVpOsUCYeTky64'
console.log('FOLDER_ID (with fallback):', FOLDER_ID)
console.log('')
console.log('='.repeat(50))
