import express from 'express'
import multer from 'multer'
import { uploadToGoogleDrive, deleteFromGoogleDrive } from '../services/googleDrive.js'
import { compressPDF } from '../services/pdfCompressor.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// Upload lab result to Google Drive
router.post('/lab-result', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { patientId, testName, testDate } = req.body
    
    if (!patientId || !testName || !testDate) {
      return res.status(400).json({ error: 'Missing required metadata' })
    }

    console.log(`📤 Uploading lab result: ${testName} for patient ${patientId}`)
    
    // Compress PDF
    console.log(`📦 Original size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`)
    const compressedBuffer = await compressPDF(req.file.buffer)
    console.log(`📦 Compressed size: ${(compressedBuffer.length / 1024 / 1024).toFixed(2)} MB`)
    
    // Upload to Google Drive
    const result = await uploadToGoogleDrive(compressedBuffer, {
      originalName: req.file.originalname,
      patientId,
      testName,
      testDate
    })

    console.log(`✅ Upload successful: ${result.fileId}`)

    res.json({
      success: true,
      fileId: result.fileId,
      url: result.url,
      originalSize: req.file.size,
      compressedSize: compressedBuffer.length,
      compressionRatio: ((1 - compressedBuffer.length / req.file.size) * 100).toFixed(1)
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    })
  }
})

// Delete lab result from Google Drive
router.delete('/lab-result/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' })
    }

    console.log(`🗑️ Deleting file: ${fileId}`)
    
    await deleteFromGoogleDrive(fileId)
    
    console.log(`✅ Delete successful: ${fileId}`)

    res.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ 
      error: 'Delete failed',
      message: error.message 
    })
  }
})

export default router
