import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import uploadRouter from './routes/upload.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3003

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true
}))
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'RCMC EMR API Server is running',
    timestamp: new Date().toISOString()
  })
})

// Routes
app.use('/api/upload', uploadRouter)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RCMC EMR API Server running on http://localhost:${PORT}`)
  console.log(`📁 Google Drive Folder ID: ${process.env.GOOGLE_DRIVE_FOLDER_ID || 'NOT SET'}`)
  console.log(`🔐 Service Account: ${process.env.GOOGLE_SERVICE_ACCOUNT_PATH || 'NOT SET'}`)
})
