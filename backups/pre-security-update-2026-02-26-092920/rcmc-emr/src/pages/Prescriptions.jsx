import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, X, Printer, Download, Mail, Phone } from 'lucide-react'
import { db } from '../lib/supabase'
import jsPDF from 'jspdf'
import HeartbeatLoader from '../components/HeartbeatLoader'

// Add print styles for A5 paper
const printStyles = `
  @media print {
    @page {
      size: A5 portrait;
      margin: 8mm;
    }
    
    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    
    /* Hide everything except the prescription print view */
    body * {
      visibility: hidden;
    }
    
    .no-print {
      display: none !important;
    }
    
    /* Show only the print view */
    #prescription-print-view,
    #prescription-print-view * {
      visibility: visible !important;
    }
    
    #prescription-print-view {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    
    /* Optimize prescription for A5 - fit in one page */
    .prescription-print-area {
      width: 132mm !important;
      max-height: 194mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      overflow: hidden !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
    }
    
    /* Compact header */
    .prescription-print-area .p-6 {
      padding: 8px !important;
    }
    
    .prescription-print-area .w-32.h-32 {
      width: 60px !important;
      height: 60px !important;
    }
    
    .prescription-print-area .gap-6 {
      gap: 8px !important;
    }
    
    /* Compact font sizes for A5 */
    .prescription-print-area h1 {
      font-size: 14px !important;
      line-height: 1.2 !important;
      margin-bottom: 2px !important;
    }
    
    .prescription-print-area .text-base {
      font-size: 9px !important;
      margin-bottom: 4px !important;
      letter-spacing: 0.1em !important;
    }
    
    .prescription-print-area .text-sm {
      font-size: 8px !important;
      line-height: 1.3 !important;
    }
    
    .prescription-print-area p,
    .prescription-print-area div,
    .prescription-print-area span {
      font-size: 9px !important;
      line-height: 1.3 !important;
    }
    
    /* Compact spacing */
    .prescription-print-area .space-y-1 > * + * {
      margin-top: 2px !important;
    }
    
    .prescription-print-area .space-y-2 > * + * {
      margin-top: 4px !important;
    }
    
    .prescription-print-area .space-y-3 > * + * {
      margin-top: 6px !important;
    }
    
    .prescription-print-area .space-y-6 > * + * {
      margin-top: 8px !important;
    }
    
    .prescription-print-area .gap-x-8 {
      column-gap: 12px !important;
    }
    
    .prescription-print-area .gap-y-3 {
      row-gap: 4px !important;
    }
    
    /* Compact Rx symbol */
    .prescription-print-area .text-7xl {
      font-size: 48px !important;
      line-height: 1 !important;
      margin-bottom: 8px !important;
    }
    
    /* Compact medications area */
    .prescription-print-area .min-h-\\[300px\\] {
      min-height: 120px !important;
      max-height: 120px !important;
      overflow: hidden !important;
    }
    
    /* Compact NO REFILL text */
    .prescription-print-area .text-3xl {
      font-size: 18px !important;
    }
    
    /* Remove extra borders */
    .prescription-print-area .border-2 {
      border-width: 1px !important;
    }
    
    /* Compact icons */
    .prescription-print-area svg {
      width: 10px !important;
      height: 10px !important;
    }
  }
`

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPrescription, setEditingPrescription] = useState(null)
  const [viewingPrescription, setViewingPrescription] = useState(null)
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    date: new Date().toISOString().split('T')[0],
    followUp: ''
  })
  const [medications, setMedications] = useState([''])

  // Load prescriptions, patients, and doctors from database
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [prescriptionsData, patientsData, doctorsData] = await Promise.all([
        db.getPrescriptions(),
        db.getPatients(1000),
        db.getDoctors()
      ])
      
      console.log('📋 Loaded prescriptions:', prescriptionsData)
      console.log('👥 Loaded patients:', patientsData)
      console.log('👨‍⚕️ Loaded doctors:', doctorsData)
      
      // Transform database format to component format
      const transformedData = prescriptionsData.map(p => {
        // Try to get patient from prescription object first, then search in patients array
        let patient = p.patient
        if (!patient) {
          patient = patientsData.find(pat => pat.id === p.patient_id)
        }
        
        // Try to get doctor from prescription object first, then search in doctors array
        let doctor = p.doctor
        if (!doctor) {
          doctor = doctorsData.find(doc => doc.id === p.doctor_id)
        }
        
        console.log('🔍 Prescription ID:', p.id)
        console.log('   Patient ID:', p.patient_id, '→ Found:', patient)
        console.log('   Doctor ID:', p.doctor_id, '→ Found:', doctor)
        
        return {
          id: p.id,
          patient_id: p.patient_id,
          doctor_id: p.doctor_id,
          patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient',
          age: patient?.age || '',
          sex: patient?.gender || '',
          dateOfBirth: patient?.date_of_birth || '',
          date: p.prescription_date || p.created_at?.split('T')[0] || '',
          medications: Array.isArray(p.medications) ? p.medications : [],
          followUp: p.instructions || '',
          doctorName: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor',
          licenseNo: doctor?.license_number || '',
          ptrNo: doctor?.ptr_number || '',
          s2No: doctor?.s2_number || ''
        }
      })
      
      console.log('✅ Transformed prescriptions:', transformedData)
      
      setPrescriptions(transformedData)
      setPatients(patientsData)
      setDoctors(doctorsData)
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadPrescriptions = async () => {
    try {
      const data = await db.getPrescriptions()
      
      // Transform database format to component format
      const transformedData = data.map(p => ({
        id: p.id,
        patient_id: p.patient_id,
        doctor_id: p.doctor_id,
        patientName: p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : 'Unknown Patient',
        age: p.patient?.age || '',
        sex: p.patient?.gender || '',
        dateOfBirth: p.patient?.date_of_birth || '',
        date: p.prescription_date || p.created_at?.split('T')[0] || '',
        medications: Array.isArray(p.medications) ? p.medications : [],
        followUp: p.instructions || '',
        doctorName: p.doctor ? `Dr. ${p.doctor.first_name} ${p.doctor.last_name}` : '',
        licenseNo: p.doctor?.license_number || '',
        ptrNo: p.doctor?.ptr_number || '',
        s2No: p.doctor?.s2_number || ''
      }))
      
      setPrescriptions(transformedData)
    } catch (error) {
      console.error('Error loading prescriptions:', error)
      alert('Failed to load prescriptions: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const prescriptionData = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        prescription_date: formData.date,
        medications: medications.filter(m => m.trim() !== ''),
        instructions: formData.followUp,
        status: 'Active'
      }

      if (editingPrescription) {
        await db.updatePrescription(editingPrescription.id, prescriptionData)
      } else {
        await db.addPrescription(prescriptionData)
      }
      
      await loadData()  // Changed from loadPrescriptions to loadData
      closeModal()
    } catch (error) {
      console.error('Error saving prescription:', error)
      alert('Failed to save prescription: ' + error.message)
    }
  }

  const handleEdit = (prescription) => {
    setEditingPrescription(prescription)
    setFormData({
      patient_id: prescription.patient_id,
      doctor_id: prescription.doctor_id,
      date: prescription.date,
      followUp: prescription.followUp
    })
    setMedications(prescription.medications.length > 0 ? prescription.medications : [''])
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this prescription?')) {
      try {
        await db.deletePrescription(id)
        await loadPrescriptions()
      } catch (error) {
        console.error('Error deleting prescription:', error)
        alert('Failed to delete prescription: ' + error.message)
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPrescription(null)
    setFormData({
      patient_id: '',
      doctor_id: '',
      date: new Date().toISOString().split('T')[0],
      followUp: ''
    })
    setMedications([''])
  }

  const handlePatientChange = (patientId) => {
    const patient = patients.find(p => p.id === patientId)
    setFormData({
      ...formData,
      patient_id: patientId
    })
  }

  const handleDoctorChange = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId)
    setFormData({
      ...formData,
      doctor_id: doctorId
    })
  }

  const getSelectedPatient = () => {
    if (editingPrescription) {
      return patients.find(p => p.id === formData.patient_id)
    }
    return patients.find(p => p.id === formData.patient_id)
  }

  const getSelectedDoctor = () => {
    if (editingPrescription) {
      return doctors.find(d => d.id === formData.doctor_id)
    }
    return doctors.find(d => d.id === formData.doctor_id)
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const addMedication = () => {
    setMedications([...medications, ''])
  }

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const updateMedication = (index, value) => {
    const updated = [...medications]
    updated[index] = value
    setMedications(updated)
  }

  const handlePrint = (prescription) => {
    setViewingPrescription(prescription)
    // Wait for state to update, then print
    setTimeout(() => {
      window.print()
      // Clear viewing state after print dialog closes
      setTimeout(() => setViewingPrescription(null), 100)
    }, 100)
  }

  const handleSavePDF = (prescription) => {
    try {
      // A5 size: 148mm x 210mm
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a5',
        orientation: 'portrait'
      })
      
      const pageWidth = 148
      const pageHeight = 210
      const margin = 10
      let yPos = margin
      
      // Outer border
      doc.setDrawColor(203, 213, 225) // slate-300
      doc.setLineWidth(0.5)
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10)
      
      // HEADER SECTION - Logo and Clinic Info
      yPos = 12
      
      // Logo on left side
      try {
        const logoImg = new Image()
        logoImg.src = '/RCMC_LOGO-removebg-preview.png'
        
        if (logoImg.complete && logoImg.naturalHeight !== 0) {
          doc.addImage(logoImg.src, 'PNG', margin + 2, yPos, 25, 25)
        } else {
          const domLogo = document.querySelector('img[src*="RCMC_LOGO"]')
          if (domLogo && domLogo.complete) {
            doc.addImage(domLogo.src, 'PNG', margin + 2, yPos, 25, 25)
          }
        }
      } catch (e) {
        console.log('Logo not added:', e)
      }
      
      // Clinic info next to logo
      const textStartX = margin + 30
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 58, 138) // #1e3a8a
      doc.text('RIZALCARE MEDICAL CLINIC', textStartX, yPos + 6)
      
      yPos += 11
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('YOUR HEALTHCARE PARTNER', textStartX, yPos)
      
      yPos += 5
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'normal')
      doc.text('IPDL8 Bldg. GF #25G Dikit St. Brgy Bagumbayan Pililla, Rizal', textStartX, yPos)
      
      yPos += 4
      doc.setFontSize(6)
      doc.text('rizalcaremedicalclinic@gmail.com', textStartX, yPos)
      yPos += 3
      doc.text('0938-775-1504 / 0976-273-9445', textStartX, yPos)
      
      // Bottom border of header
      yPos += 5
      doc.setDrawColor(30, 58, 138)
      doc.setLineWidth(0.5)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      
      // PATIENT INFORMATION SECTION
      yPos += 6
      const patientBoxY = yPos
      const patientBoxHeight = 28
      
      // Light gray background
      doc.setFillColor(248, 250, 252) // slate-50
      doc.rect(margin, patientBoxY, pageWidth - 2 * margin, patientBoxHeight, 'F')
      
      yPos += 5
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105) // slate-700
      doc.text('Name:', margin + 3, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      
      // Draw underline for name
      doc.setDrawColor(148, 163, 184) // slate-400
      doc.setLineWidth(0.5)
      doc.line(margin + 18, yPos + 1, pageWidth - margin - 3, yPos + 1)
      doc.text(prescription.patientName, margin + 20, yPos)
      
      yPos += 6
      // Age and Sex on same line
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text('Age:', margin + 3, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(String(prescription.age || calculateAge(prescription.dateOfBirth)), margin + 13, yPos)
      
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text('Sex:', margin + 45, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(String(prescription.sex || 'N/A'), margin + 55, yPos)
      
      yPos += 6
      // Date of Birth
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text('Date of Birth:', margin + 3, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(String(prescription.dateOfBirth || 'N/A'), margin + 25, yPos)
      
      // Date on same line
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text('Date:', pageWidth / 2 + 10, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(prescription.date, pageWidth / 2 + 20, yPos)
      
      // RX SYMBOL AND MEDICATIONS SECTION
      yPos = patientBoxY + patientBoxHeight + 8
      
      // Rx symbol - clean R with subscript x
      const rxX = margin + 3
      const rxY = yPos
      
      // Draw large "R" 
      doc.setFontSize(56)
      doc.setFont('times', 'bold')
      doc.setTextColor(15, 23, 42) // slate-900
      doc.text('R', rxX, rxY)
      
      // Draw subscript "x"
      doc.setFontSize(32)
      doc.text('x', rxX + 11, rxY + 3)
      
      // Medications
      yPos += 10
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      
      const medicationsStartY = yPos
      const maxMedicationsHeight = 70
      
      prescription.medications.forEach((med, index) => {
        if (yPos - medicationsStartY > maxMedicationsHeight) return
        
        const medText = `${index + 1}. ${med}`
        const lines = doc.splitTextToSize(medText, pageWidth - 2 * margin - 8)
        
        lines.forEach(line => {
          if (yPos - medicationsStartY <= maxMedicationsHeight) {
            doc.text(line, margin + 5, yPos)
            // Draw underline for each medication line
            doc.setDrawColor(203, 213, 225) // slate-300
            doc.setLineWidth(0.2)
            doc.line(margin + 5, yPos + 1, pageWidth - margin - 3, yPos + 1)
            yPos += 5
          }
        })
      })
      
      // FOOTER SECTION
      yPos = Math.max(yPos + 8, pageHeight - 50)
      
      // Follow up
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text('Next follow up:', margin + 3, yPos)
      
      yPos += 1
      doc.setDrawColor(148, 163, 184)
      doc.setLineWidth(0.5)
      doc.line(margin + 3, yPos, pageWidth - margin - 3, yPos)
      
      yPos += 4
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(prescription.followUp || 'N/A', margin + 5, yPos)
      
      // Separator line
      yPos += 6
      doc.setDrawColor(226, 232, 240) // slate-200
      doc.setLineWidth(0.3)
      doc.line(margin + 3, yPos, pageWidth - margin - 3, yPos)
      
      yPos += 7
      
      // NO REFILL (left side)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('NO REFILL', margin + 3, yPos)
      
      // Doctor info (right side)
      const doctorX = pageWidth / 2 + 5
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text('Doctor:', doctorX, yPos - 5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(prescription.doctorName, doctorX + 15, yPos - 5)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      doc.text('License No.', doctorX, yPos)
      doc.setTextColor(0, 0, 0)
      doc.text(prescription.licenseNo || 'N/A', doctorX + 20, yPos)
      doc.setFont('helvetica', 'bold')
      doc.text('MD', doctorX + 55, yPos)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      doc.text('PTR No.', doctorX, yPos + 4)
      doc.setTextColor(0, 0, 0)
      doc.text(prescription.ptrNo || 'N/A', doctorX + 20, yPos + 4)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      doc.text('S2 No.', doctorX, yPos + 8)
      doc.setTextColor(0, 0, 0)
      doc.text(prescription.s2No || 'N/A', doctorX + 20, yPos + 8)
      
      // Save
      const patientName = prescription.patientName.replace(/\s+/g, '_')
      const date = prescription.date.replace(/\-/g, '')
      doc.save(`Prescription_${patientName}_${date}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF: ' + error.message)
    }
  }

  const filteredPrescriptions = prescriptions.filter(p =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Inject print styles */}
      <style>{printStyles}</style>
      
      {/* Print-only prescription view */}
      {viewingPrescription && (
        <div id="prescription-print-view" className="hidden print:block">
          <div className="prescription-print-area">
            {/* Header with Logo and Clinic Info */}
            <div className="bg-white border-2 border-slate-300 rounded-t-lg overflow-hidden">
              <div className="bg-white p-6 border-b-2 border-[#1e3a8a]">
                <div className="flex items-center gap-6">
                  {/* Logo */}
                  <div className="w-32 h-32 flex-shrink-0">
                    <img 
                      src="/RCMC_LOGO-removebg-preview.png" 
                      alt="RIZALCARE Medical Clinic Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-[#1e3a8a] tracking-wider leading-tight mb-1">
                      RIZALCARE MEDICAL CLINIC
                    </h1>
                    <p className="text-base font-semibold text-[#1e3a8a] tracking-[0.3em] mb-3">
                      YOUR HEALTHCARE PARTNER
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-[#1e3a8a] font-medium">
                        IPDL8 Bldg. GF #25G Dikit St. Brgy Bagumbayan Pililla, Rizal
                      </p>
                      <div className="flex items-center gap-6 text-sm text-[#1e3a8a] font-medium">
                        <span className="flex items-center gap-2">
                          <Mail size={14} className="text-[#1e3a8a]" />
                          rizalcaremedicalclinic@gmail.com
                        </span>
                        <span className="flex items-center gap-2">
                          <Phone size={14} className="text-[#1e3a8a]" />
                          0938-775-1504 / 0976-273-9445
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Info Section */}
              <div className="p-6 bg-slate-50">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div className="col-span-2 flex items-center">
                    <span className="font-semibold text-slate-700 w-32">Name:</span>
                    <span className="flex-1 px-2 py-1 border-b-2 border-slate-400">{viewingPrescription.patientName}</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center flex-1">
                      <span className="font-semibold text-slate-700 w-16">Age:</span>
                      <span className="flex-1 px-2 py-1">{viewingPrescription.age || calculateAge(viewingPrescription.dateOfBirth)}</span>
                    </div>
                    <div className="flex items-center flex-1">
                      <span className="font-semibold text-slate-700 w-16">Sex:</span>
                      <span className="flex-1 px-2 py-1">{viewingPrescription.sex || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-700 w-32">Date of Birth:</span>
                    <span className="flex-1 px-2 py-1">{viewingPrescription.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-700 w-16">Date:</span>
                    <span className="flex-1 px-2 py-1">{viewingPrescription.date}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rx Symbol and Medications */}
            <div className="bg-white border-x-2 border-slate-300 p-6">
              <div className="text-7xl font-serif font-bold text-slate-900 leading-none mb-6">℞</div>
              
              <div className="space-y-3 min-h-[300px]">
                {viewingPrescription.medications.map((med, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-slate-600">{index + 1}.</span>
                    <div className="flex-1 border-b border-slate-300 px-2 py-1 whitespace-pre-wrap">
                      {med}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Section */}
            <div className="bg-white border-2 border-slate-300 border-t-0 rounded-b-lg p-6">
              <div className="space-y-6">
                {/* Next Follow Up */}
                <div>
                  <div className="flex items-center mb-2">
                    <span className="font-semibold text-slate-700">Next follow up:</span>
                  </div>
                  <div className="w-full border-b-2 border-slate-400 px-2 py-2">
                    {viewingPrescription.followUp || 'N/A'}
                  </div>
                </div>

                {/* NO REFILL and Doctor Info */}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200">
                  <div className="flex items-start">
                    <p className="text-3xl font-bold text-slate-900">NO REFILL</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center mb-3">
                      <span className="font-semibold text-slate-700 w-24">Doctor:</span>
                      <span className="flex-1 px-2 py-1">{viewingPrescription.doctorName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-slate-700">License No.</span>
                      <span className="flex-1 px-2 py-1">{viewingPrescription.licenseNo || 'N/A'}</span>
                      <span className="ml-2 font-semibold">MD</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-slate-700">PTR No.</span>
                      <span className="flex-1 px-2 py-1">{viewingPrescription.ptrNo || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-slate-700">S2 No.</span>
                      <span className="flex-1 px-2 py-1">{viewingPrescription.s2No || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Prescriptions</h1>
          <p className="text-sm text-slate-600 mt-1">Manage patient prescriptions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
        >
          <Plus size={20} />
          New Prescription
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 no-print">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 no-print">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <HeartbeatLoader message="Loading prescriptions..." />
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-600">
              {searchTerm ? 'No prescriptions found matching your search.' : 'No prescriptions yet. Click "New Prescription" to create one.'}
            </p>
          </div>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <div key={prescription.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{prescription.patientName}</h3>
                  <p className="text-sm text-slate-600">Date: {prescription.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrint(prescription)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Print Prescription"
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    onClick={() => handleSavePDF(prescription)}
                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Save as PDF"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(prescription)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Prescription"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(prescription.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Prescription"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                <p>Medications: {prescription.medications.length} item(s)</p>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingPrescription ? 'Edit Prescription' : 'New Prescription'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Prescription Form - Exact Layout */}
              <div className="space-y-0 prescription-print-area">
                {/* Header with Logo and Clinic Info */}
                <div className="bg-white border-2 border-slate-300 rounded-t-lg overflow-hidden">
                  <div className="bg-white p-6 border-b-2 border-[#1e3a8a]">
                    <div className="flex items-center gap-6">
                      {/* Logo */}
                      <div className="w-32 h-32 flex-shrink-0">
                        <img 
                          src="/RCMC_LOGO-removebg-preview.png" 
                          alt="RIZALCARE Medical Clinic Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold text-[#1e3a8a] tracking-wider leading-tight mb-1">
                          RIZALCARE MEDICAL CLINIC
                        </h1>
                        <p className="text-base font-semibold text-[#1e3a8a] tracking-[0.3em] mb-3">
                          YOUR HEALTHCARE PARTNER
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-[#1e3a8a] font-medium">
                            IPDL8 Bldg. GF #25G Dikit St. Brgy Bagumbayan Pililla, Rizal
                          </p>
                          <div className="flex items-center gap-6 text-sm text-[#1e3a8a] font-medium">
                            <span className="flex items-center gap-2">
                              <Mail size={14} className="text-[#1e3a8a]" />
                              rizalcaremedicalclinic@gmail.com
                            </span>
                            <span className="flex items-center gap-2">
                              <Phone size={14} className="text-[#1e3a8a]" />
                              0938-775-1504 / 0976-273-9445
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Info Section */}
                  <div className="p-6 bg-slate-50">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="col-span-2 flex items-center">
                        <span className="font-semibold text-slate-700 w-32">Patient:</span>
                        <select
                          required
                          value={formData.patient_id}
                          onChange={(e) => handlePatientChange(e.target.value)}
                          className="flex-1 border-b-2 border-slate-400 bg-transparent focus:outline-none focus:border-teal-500 px-2 py-1"
                        >
                          <option value="">Select Patient</option>
                          {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>
                              {patient.first_name} {patient.last_name} - {patient.patient_number}
                            </option>
                          ))}
                        </select>
                      </div>
                      {getSelectedPatient() && (
                        <>
                          <div className="flex items-center">
                            <span className="font-semibold text-slate-700 w-32">Name:</span>
                            <span className="flex-1 px-2 py-1">{getSelectedPatient().first_name} {getSelectedPatient().last_name}</span>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center flex-1">
                              <span className="font-semibold text-slate-700 w-16">Age:</span>
                              <span className="flex-1 px-2 py-1">{calculateAge(getSelectedPatient().date_of_birth)}</span>
                            </div>
                            <div className="flex items-center flex-1">
                              <span className="font-semibold text-slate-700 w-16">Sex:</span>
                              <span className="flex-1 px-2 py-1">{getSelectedPatient().gender || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="font-semibold text-slate-700 w-32">Date of Birth:</span>
                            <span className="flex-1 px-2 py-1">{getSelectedPatient().date_of_birth || 'N/A'}</span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center">
                        <span className="font-semibold text-slate-700 w-16">Date:</span>
                        <input
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className="flex-1 border-b-2 border-slate-400 bg-transparent focus:outline-none focus:border-teal-500 px-2 py-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rx Symbol and Medications */}
                <div className="bg-white border-x-2 border-slate-300 p-6">
                  <div className="text-7xl font-serif font-bold text-slate-900 leading-none mb-6">℞</div>
                  
                  <div className="space-y-3 min-h-[300px]">
                    {medications.map((med, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-slate-600 mt-2">{index + 1}.</span>
                        <textarea
                          required
                          value={med}
                          onChange={(e) => updateMedication(index, e.target.value)}
                          placeholder="e.g., Paracetamol 500mg - 1 tablet every 6 hours for 5 days"
                          rows="2"
                          className="flex-1 border-b border-slate-300 focus:outline-none focus:border-teal-500 resize-none px-2 py-1"
                        />
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors mt-1"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addMedication}
                      className="flex items-center gap-2 px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-sm font-semibold"
                    >
                      <Plus size={16} />
                      Add Medication
                    </button>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="bg-white border-2 border-slate-300 border-t-0 rounded-b-lg p-6">
                  <div className="space-y-6">
                    {/* Next Follow Up */}
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="font-semibold text-slate-700">Next follow up:</span>
                      </div>
                      <input
                        type="text"
                        value={formData.followUp}
                        onChange={(e) => setFormData({...formData, followUp: e.target.value})}
                        placeholder="e.g., 1 week"
                        className="w-full border-b-2 border-slate-400 focus:outline-none focus:border-teal-500 px-2 py-2"
                      />
                    </div>

                    {/* NO REFILL and Doctor Info */}
                    <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200">
                      <div className="flex items-start">
                        <p className="text-3xl font-bold text-slate-900">NO REFILL</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center mb-3">
                          <span className="font-semibold text-slate-700 w-24">Doctor:</span>
                          <select
                            required
                            value={formData.doctor_id}
                            onChange={(e) => handleDoctorChange(e.target.value)}
                            className="flex-1 border-b border-slate-400 focus:outline-none focus:border-teal-500 px-2 py-1"
                          >
                            <option value="">Select Doctor</option>
                            {doctors.map(doctor => (
                              <option key={doctor.id} value={doctor.id}>
                                Dr. {doctor.first_name} {doctor.last_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {getSelectedDoctor() && (
                          <>
                            <div className="flex items-center">
                              <span className="w-24 text-slate-700">License No.</span>
                              <span className="flex-1 px-2 py-1">{getSelectedDoctor().license_number || 'N/A'}</span>
                              <span className="ml-2 font-semibold">MD</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-24 text-slate-700">PTR No.</span>
                              <span className="flex-1 px-2 py-1">{getSelectedDoctor().ptr_number || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-24 text-slate-700">S2 No.</span>
                              <span className="flex-1 px-2 py-1">{getSelectedDoctor().s2_number || 'N/A'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 no-print">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  {editingPrescription ? 'Update Prescription' : 'Create Prescription'}
                </button>
                {editingPrescription && (
                  <>
                    <button
                      type="button"
                      onClick={() => handlePrint(editingPrescription)}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                    >
                      <Printer size={18} />
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePDF(editingPrescription)}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Download size={18} />
                      Save PDF
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Prescriptions
