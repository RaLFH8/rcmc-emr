// Google Drive API Integration
// This file handles all Google Drive operations for lab results

import { supabase } from './supabase'

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'

/**
 * Upload file to Google Drive via backend API
 * Returns file ID and shareable URL
 */
export const uploadToGoogleDrive = async (file, metadata) => {
  try {
    console.log('📤 Uploading to Google Drive:', file.name)
    console.log('📋 Metadata:', metadata)
    
    // Create FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('patientId', metadata.patientId)
    formData.append('testName', metadata.testName)
    formData.append('testDate', metadata.testDate)
    
    // Upload to backend API
    const response = await fetch(`${API_URL}/api/upload/lab-result`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Upload failed')
    }
    
    const data = await response.json()
    
    console.log('✅ Upload successful!')
    console.log(`📦 Compression: ${data.compressionRatio}% reduction`)
    console.log(`📊 Original: ${(data.originalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📊 Compressed: ${(data.compressedSize / 1024 / 1024).toFixed(2)} MB`)
    
    return {
      fileId: data.fileId,
      url: data.url,
      size: data.compressedSize
    }
  } catch (error) {
    console.error('❌ Error uploading to Google Drive:', error)
    throw error
  }
}

/**
 * Delete file from Google Drive via backend API
 */
export const deleteFromGoogleDrive = async (fileId) => {
  try {
    console.log('🗑️ Deleting from Google Drive:', fileId)
    
    const response = await fetch(`${API_URL}/api/upload/lab-result/${fileId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Delete failed')
    }
    
    console.log('✅ Delete successful!')
    return true
  } catch (error) {
    console.error('❌ Error deleting from Google Drive:', error)
    throw error
  }
}

/**
 * Get file metadata from Google Drive
 */
export const getFileMetadata = async (fileId) => {
  try {
    // This would require a backend endpoint
    // For now, return basic info
    return {
      id: fileId,
      name: 'Lab Result',
      size: 0,
      mimeType: 'application/pdf'
    }
  } catch (error) {
    console.error('Error getting file metadata:', error)
    throw error
  }
}

/**
 * Create folder structure in Google Drive
 * Organizes files by year/month
 */
export const createFolderStructure = async (year, month) => {
  try {
    // This would require a backend endpoint
    console.log(`Creating folder structure: ${year}/${month}`)
    return null
  } catch (error) {
    console.error('Error creating folder structure:', error)
    throw error
  }
}

/**
 * Save lab result metadata to database
 */
export const saveLabResult = async (labResultData) => {
  try {
    const { data, error } = await supabase
      .from('lab_results')
      .insert([labResultData])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving lab result:', error)
    throw error
  }
}

/**
 * Get lab results for a patient
 */
export const getLabResults = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from('lab_results')
      .select(`
        *,
        patient:patients(id, first_name, last_name, patient_number),
        uploader:user_profiles(id, full_name, role)
      `)
      .eq('patient_id', patientId)
      .order('test_date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting lab results:', error)
    throw error
  }
}

/**
 * Delete lab result (both from database and Google Drive)
 */
export const deleteLabResult = async (labResultId, googleDriveFileId) => {
  try {
    // Delete from Google Drive first
    await deleteFromGoogleDrive(googleDriveFileId)
    
    // Then delete from database
    const { error } = await supabase
      .from('lab_results')
      .delete()
      .eq('id', labResultId)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting lab result:', error)
    throw error
  }
}

/**
 * Update lab result metadata
 */
export const updateLabResult = async (labResultId, updates) => {
  try {
    const { data, error } = await supabase
      .from('lab_results')
      .update(updates)
      .eq('id', labResultId)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating lab result:', error)
    throw error
  }
}

export default {
  uploadToGoogleDrive,
  deleteFromGoogleDrive,
  getFileMetadata,
  createFolderStructure,
  saveLabResult,
  getLabResults,
  deleteLabResult,
  updateLabResult
}
