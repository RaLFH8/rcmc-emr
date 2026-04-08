import { useState, useEffect } from 'react'
import { Upload, FileText, Calendar, User, Trash2, Eye, Download, Search, Filter, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { initGoogleDrive, uploadToGoogleDrive, deleteFromGoogleDrive } from '../lib/googleDriveOAuth'
import { useAuth } from '../context/AuthContext'
import SkeletonLoader from '../components/SkeletonLoader'

const LabResults = () => {
  const [labResults, setLabResults] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPatient, setFilterPatient] = useState('All')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [viewingResult, setViewingResult] = useState(null)
  const { userProfile } = useAuth()
  
  const [uploadForm, setUploadForm] = useState({
    patient_id: '',
    test_name: '',
    test_date: new Date().toISOString().split('T')[0],
    test_type: 'Blood Test',
    notes: '',
    file: null
  })
  const [patientSearch, setPatientSearch] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)

  useEffect(() => {
    loadData()
    // Initialize Google Drive OAuth
    initGoogleDrive().catch(error => {
      console.error('Failed to initialize Google Drive:', error)
    })
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Get patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('first_name')
        .limit(1000)
      
      if (patientsError) throw patientsError
      
      // Get lab results
      const labResultsData = await getAllLabResults()
      
      setPatients(patientsData || [])
      setLabResults(labResultsData)
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getAllLabResults = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .select(`
          *,
          patient:patients(id, first_name, last_name, patient_number),
          uploader:user_profiles(id, full_name, role)
        `)
        .order('test_date', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting all lab results:', error)
      return []
    }
  }


  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB')
        return
      }
      setUploadForm({ ...uploadForm, file })
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!uploadForm.file) {
      alert('Please select a file')
      return
    }

    try {
      setUploading(true)
      
      // Upload to Google Drive using OAuth
      const { fileId, url, size } = await uploadToGoogleDrive(uploadForm.file, {
        patientId: uploadForm.patient_id,
        testName: uploadForm.test_name,
        testDate: uploadForm.test_date
      })
      
      // Save metadata to Supabase database
      const { error } = await supabase
        .from('lab_results')
        .insert({
          patient_id: uploadForm.patient_id,
          test_name: uploadForm.test_name,
          test_date: uploadForm.test_date,
          test_type: uploadForm.test_type,
          uploaded_by: userProfile.id,
          google_drive_file_id: fileId,
          google_drive_url: url,
          file_size: uploadForm.file.size,
          compressed_size: size,
          original_filename: uploadForm.file.name,
          notes: uploadForm.notes
        })
      
      if (error) throw error
      
      alert('Lab result uploaded successfully!')
      closeUploadModal()
      await loadData()
    } catch (error) {
      console.error('Error uploading lab result:', error)
      alert('Failed to upload lab result: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (labResult) => {
    if (!confirm(`Are you sure you want to delete this lab result?\n\nTest: ${labResult.test_name}\nDate: ${labResult.test_date}`)) {
      return
    }

    try {
      // Delete from Google Drive
      await deleteFromGoogleDrive(labResult.google_drive_file_id)
      
      // Delete from database
      const { error } = await supabase
        .from('lab_results')
        .delete()
        .eq('id', labResult.id)
      
      if (error) throw error
      
      alert('Lab result deleted successfully')
      await loadData()
    } catch (error) {
      console.error('Error deleting lab result:', error)
      alert('Failed to delete lab result: ' + error.message)
    }
  }

  const closeUploadModal = () => {
    setShowUploadModal(false)
    setUploadForm({
      patient_id: '',
      test_name: '',
      test_date: new Date().toISOString().split('T')[0],
      test_type: 'Blood Test',
      notes: '',
      file: null
    })
    setPatientSearch('')
    setShowPatientDropdown(false)
  }

  const filteredResults = labResults.filter(result => {
    const matchesSearch = 
      result.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.patient?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.patient?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.patient?.patient_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterPatient === 'All' || result.patient_id === filterPatient
    
    return matchesSearch && matchesFilter
  })

  const testTypes = [
    'Blood Test',
    'Urinalysis',
    'X-Ray',
    'Ultrasound',
    'CT Scan',
    'MRI',
    'ECG',
    'Other'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SkeletonLoader variant="table" message="Loading lab results..." />
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lab Results</h1>
          <p className="text-slate-600 mt-1">Manage patient laboratory test results</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Upload size={20} />
          Upload Lab Result
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by test name, patient name, or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <select
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none"
            >
              <option value="All">All Patients</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} ({patient.patient_number})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResults.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-semibold">No lab results found</p>
            <p className="text-sm text-slate-500 mt-1">Upload lab results to get started</p>
          </div>
        ) : (
          filteredResults.map(result => (
            <div key={result.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="text-teal-600" size={24} />
                  <div>
                    <h3 className="font-semibold text-slate-800">{result.test_name}</h3>
                    <p className="text-sm text-slate-500">{result.test_type}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User size={16} />
                  <span>{result.patient?.first_name} {result.patient?.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={16} />
                  <span>{new Date(result.test_date).toLocaleDateString()}</span>
                </div>
                {result.notes && (
                  <p className="text-sm text-slate-500 line-clamp-2">{result.notes}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = result.google_drive_file_id
                      ? `https://drive.google.com/file/d/${result.google_drive_file_id}/preview`
                      : result.google_drive_url
                    window.open(url, '_blank')
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm"
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  onClick={() => handleDelete(result)}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>


      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Upload Lab Result</h2>
              <button
                onClick={closeUploadModal}
                className="text-slate-400 hover:text-slate-600"
                disabled={uploading}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Patient *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={e => {
                      setPatientSearch(e.target.value)
                      setUploadForm({ ...uploadForm, patient_id: '' })
                      setShowPatientDropdown(true)
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPatientDropdown(false), 150)}
                    placeholder="Search patient by name or number..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={uploading}
                    autoComplete="off"
                  />
                  {/* Hidden required input to enforce selection */}
                  <input type="text" required value={uploadForm.patient_id} onChange={() => {}} className="sr-only" tabIndex={-1} />
                  {showPatientDropdown && patientSearch.trim() !== '' && (
                    <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {patients
                        .filter(p => {
                          const q = patientSearch.toLowerCase()
                          return (
                            p.first_name?.toLowerCase().includes(q) ||
                            p.last_name?.toLowerCase().includes(q) ||
                            `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
                            p.patient_number?.toLowerCase().includes(q)
                          )
                        })
                        .slice(0, 10)
                        .map(p => (
                          <li
                            key={p.id}
                            onMouseDown={() => {
                              setUploadForm({ ...uploadForm, patient_id: p.id })
                              setPatientSearch(`${p.first_name} ${p.last_name} (${p.patient_number})`)
                              setShowPatientDropdown(false)
                            }}
                            className="px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 cursor-pointer"
                          >
                            {p.first_name} {p.last_name} <span className="text-slate-400 text-xs">#{p.patient_number}</span>
                          </li>
                        ))
                      }
                      {patients.filter(p => {
                        const q = patientSearch.toLowerCase()
                        return p.first_name?.toLowerCase().includes(q) || p.last_name?.toLowerCase().includes(q) || `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || p.patient_number?.toLowerCase().includes(q)
                      }).length === 0 && (
                        <li className="px-4 py-2 text-sm text-slate-400">No patients found</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Test Name *
                </label>
                <input
                  type="text"
                  value={uploadForm.test_name}
                  onChange={(e) => setUploadForm({ ...uploadForm, test_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., Complete Blood Count"
                  required
                  disabled={uploading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Test Date *
                  </label>
                  <input
                    type="date"
                    value={uploadForm.test_date}
                    onChange={(e) => setUploadForm({ ...uploadForm, test_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Test Type *
                  </label>
                  <select
                    value={uploadForm.test_type}
                    onChange={(e) => setUploadForm({ ...uploadForm, test_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                    disabled={uploading}
                  >
                    {testTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  PDF File * (Max 10MB)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  disabled={uploading}
                />
                {uploadForm.file && (
                  <p className="text-sm text-slate-600 mt-2">
                    Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows="3"
                  placeholder="Add any additional notes..."
                  disabled={uploading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LabResults
