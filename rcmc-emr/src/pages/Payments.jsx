import { useState, useEffect } from 'react'
import { Plus, Search, DollarSign, Download, Eye, X, CreditCard, Calendar, Printer } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBillingQueue } from '../context/BillingQueueContext'
import { BillingQueue } from '../components/BillingQueue'
import jsPDF from 'jspdf'
import SkeletonLoader from '../components/SkeletonLoader'

const Payments = () => {
  const { userProfile } = useAuth()
  const { lockPatient, unlockPatient, removeFromQueue } = useBillingQueue()
  const [activeTab, setActiveTab] = useState('transactions')
  const [payments, setPayments] = useState([])
  const [patients, setPatients] = useState([])
  const [services, setServices] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [viewingPayment, setViewingPayment] = useState(null)
  const [selectedQueueItem, setSelectedQueueItem] = useState(null)
  const [formData, setFormData] = useState({
    patient_id: '',
    total_amount: '',
    amount_paid: '',
    cash_tendered: '',
    change_given: 0,
    payment_method: 'Cash',
    payment_status: 'Pending',
    items: [],
    notes: '',
    is_pwd: false,
    discount_type: '',
    discount_percentage: 0,
    discount_amount: 0
  })
  const [currentItem, setCurrentItem] = useState({
    type: 'service', // 'service' or 'inventory'
    id: '',
    name: '',
    price: '',
    quantity: 1
  })
  const [itemSearchTerm, setItemSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false)

  // Calculate discount based on patient age and PWD status
  const calculateDiscount = (subtotal, patientId, isPwd) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return { discountType: '', discountPercentage: 0, discountAmount: 0, finalTotal: subtotal }
    
    // Calculate age from date_of_birth
    const birthDate = new Date(patient.date_of_birth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    // Check if eligible for discount (Senior Citizen OR PWD)
    const isSenior = age >= 60
    const isEligible = isSenior || isPwd
    
    if (isEligible) {
      const discountPercentage = 20
      const discountAmount = subtotal * (discountPercentage / 100)
      const finalTotal = subtotal - discountAmount
      const discountType = isSenior && isPwd ? 'Senior Citizen & PWD' : isSenior ? 'Senior Citizen' : 'PWD'
      
      return {
        discountType,
        discountPercentage,
        discountAmount,
        finalTotal
      }
    }
    
    return { discountType: '', discountPercentage: 0, discountAmount: 0, finalTotal: subtotal }
  }

  // Add item to list
  const addItem = () => {
    if (currentItem.id && currentItem.name && currentItem.price && currentItem.quantity) {
      const itemTotal = parseFloat(currentItem.price) * parseInt(currentItem.quantity)
      const newItem = {
        type: currentItem.type,
        id: currentItem.id,
        name: currentItem.name,
        price: parseFloat(currentItem.price),
        quantity: parseInt(currentItem.quantity),
        total: itemTotal
      }
      
      const newItems = [...formData.items, newItem]
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0)
      
      // Apply discount if applicable
      const discount = calculateDiscount(subtotal, formData.patient_id, formData.is_pwd)
      
      setFormData({
        ...formData,
        items: newItems,
        total_amount: discount.finalTotal.toFixed(2),
        discount_type: discount.discountType,
        discount_percentage: discount.discountPercentage,
        discount_amount: discount.discountAmount
      })
      
      setCurrentItem({ type: currentItem.type, id: '', name: '', price: '', quantity: 1 })
      setItemSearchTerm('')
      setShowSuggestions(false)
    }
  }

  // Remove item from list
  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0)
    
    // Recalculate discount
    const discount = calculateDiscount(subtotal, formData.patient_id, formData.is_pwd)
    
    setFormData({
      ...formData,
      items: newItems,
      total_amount: discount.finalTotal.toFixed(2),
      discount_type: discount.discountType,
      discount_percentage: discount.discountPercentage,
      discount_amount: discount.discountAmount
    })
  }

  // Handle item selection from suggestions
  const handleItemSelect = (selectedItem) => {
    setCurrentItem({
      ...currentItem,
      id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price
    })
    setItemSearchTerm(selectedItem.name)
    setShowSuggestions(false)
  }

  // Handle search input change
  const handleSearchChange = (value) => {
    setItemSearchTerm(value)
    setShowSuggestions(value.length > 0)
    
    // Clear selection if search is cleared
    if (value === '') {
      setCurrentItem({ ...currentItem, id: '', name: '', price: '' })
    }
  }

  // Filter items based on search
  const getFilteredItems = () => {
    const items = currentItem.type === 'service' ? services : inventory
    if (!itemSearchTerm) return items
    
    return items.filter(item =>
      item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
    )
  }

  // Filter patients based on search
  const getFilteredPatients = () => {
    if (!patientSearchTerm) return patients
    
    return patients.filter(patient => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase()
      const patientNumber = patient.patient_number.toLowerCase()
      const search = patientSearchTerm.toLowerCase()
      
      return fullName.includes(search) || patientNumber.includes(search)
    })
  }

  // Handle patient selection from suggestions
  const handlePatientSelect = (patient) => {
    const newPatientId = patient.id
    setPatientSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_number})`)
    setShowPatientSuggestions(false)
    
    setFormData({...formData, patient_id: newPatientId})
    
    // Recalculate discount when patient changes
    if (formData.items.length > 0) {
      const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0)
      const discount = calculateDiscount(subtotal, newPatientId, formData.is_pwd)
      setFormData(prev => ({
        ...prev,
        patient_id: newPatientId,
        total_amount: discount.finalTotal.toFixed(2),
        discount_type: discount.discountType,
        discount_percentage: discount.discountPercentage,
        discount_amount: discount.discountAmount
      }))
    }
  }

  // Handle patient search input change
  const handlePatientSearchChange = (value) => {
    setPatientSearchTerm(value)
    setShowPatientSuggestions(value.length > 0)
    
    // Clear selection if search is cleared
    if (value === '') {
      setFormData({...formData, patient_id: ''})
    }
  }

  // Auto-calculate status based on amounts
  const getAutoStatus = (total, paid) => {
    const totalAmt = parseFloat(total) || 0
    const paidAmt = parseFloat(paid) || 0
    
    if (paidAmt === 0) return 'Pending'
    if (paidAmt >= totalAmt) return 'Paid'
    if (paidAmt > 0 && paidAmt < totalAmt) return 'Partial'
    return 'Pending'
  }

  // Update amount paid and auto-set status
  const handleAmountPaidChange = (value) => {
    const val_received = parseFloat(value) || 0
    const val_total    = parseFloat(formData.total_amount) || 0
    let capped_paid, change_given

    if (val_received > val_total) {
      capped_paid  = val_total
      change_given = val_received - val_total
    } else {
      capped_paid  = val_received
      change_given = 0
    }

    const newStatus = getAutoStatus(formData.total_amount, capped_paid)
    setFormData({
      ...formData,
      cash_tendered: value,
      amount_paid: capped_paid > 0 ? capped_paid.toString() : '',
      change_given,
      payment_status: newStatus
    })
  }

  useEffect(() => {
    loadData()
  }, [filterStatus])

  const loadData = async () => {
    try {
      setLoading(true)
      const [billingData, patientsData, servicesData, inventoryData] = await Promise.all([
        db.getBilling(100, 0, searchTerm, filterStatus),
        db.getPatients(1000),
        db.getServices(),
        db.getInventory()
      ])
      
      // Transform billing data
      const transformedPayments = billingData.map(bill => ({
        id: bill.id,
        patient_id: bill.patient_id,
        patient_name: bill.patient ? `${bill.patient.first_name} ${bill.patient.last_name}` : 'Unknown',
        patient_number: bill.patient?.patient_number || 'N/A',
        receipt_number: bill.invoice_number,
        amount: parseFloat(bill.total_amount || 0),
        total_amount: parseFloat(bill.total_amount || 0),
        amount_paid: parseFloat(bill.amount_paid || bill.total_amount || 0),
        remaining_balance: parseFloat(bill.remaining_balance || 0),
        payment_method: bill.payment_method || 'Cash',
        status: bill.payment_status || 'Pending',
        date: bill.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        items: bill.items || [],
        notes: bill.notes || ''
      }))
      
      setPayments(transformedPayments)
      setPatients(patientsData)
      setServices(servicesData.filter(s => s.status === 'Active'))
      setInventory(inventoryData.filter(i => i.status === 'In Stock' || i.status === 'Low Stock'))
      
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const totalAmount      = parseFloat(formData.total_amount)
      const cashTendered     = parseFloat(formData.cash_tendered || formData.amount_paid || formData.total_amount)
      const amountPaid       = Math.min(cashTendered, totalAmount)
      const remainingBalance = Math.max(0, totalAmount - amountPaid)
      
      // Auto-set status based on payment
      let status = formData.payment_status
      if (amountPaid >= totalAmount) {
        status = 'Paid'
      } else if (amountPaid > 0) {
        status = 'Partial'
      }
      
      const billingData = {
        patient_id: formData.patient_id,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        remaining_balance: remainingBalance,
        payment_method: formData.payment_method,
        payment_status: status,
        items: formData.items,
        notes: formData.notes,
        discount_type: formData.discount_type || null,
        discount_percentage: formData.discount_percentage || 0,
        discount_amount: formData.discount_amount || 0
      }

      if (viewingPayment) {
        await db.updateBilling(viewingPayment.id, billingData)
      } else {
        await db.addBilling(billingData)
      }
      
      await loadData()
      closeModal()
    } catch (error) {
      console.error('Error saving payment:', error)
      alert('Failed to save payment: ' + error.message)
    }
  }

  const handleView = (payment) => {
    setViewingPayment(payment)
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const payment = payments.find(p => p.id === id)
      const updates = { payment_status: newStatus }
      // When marking as Paid, clear the remaining balance and set amount_paid = total_amount
      if (newStatus === 'Paid' && payment) {
        updates.amount_paid = payment.total_amount
        updates.remaining_balance = 0
      }
      await db.updateBilling(id, updates)
      await loadData()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status: ' + error.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setViewingPayment(null)
    setFormData({
      patient_id: '',
      total_amount: '',
      amount_paid: '',
      cash_tendered: '',
      change_given: 0,
      payment_method: 'Cash',
      payment_status: 'Pending',
      items: [],
      notes: '',
      is_pwd: false,
      discount_type: '',
      discount_percentage: 0,
      discount_amount: 0
    })
    setCurrentItem({ type: 'service', id: '', name: '', price: '', quantity: 1 })
    setItemSearchTerm('')
    setShowSuggestions(false)
    setPatientSearchTerm('')
    setShowPatientSuggestions(false)
  }

  // Handle selecting patient from billing queue
  const handleSelectPatient = async (queueItem) => {
    try {
      // Try to lock the patient
      const locked = await lockPatient(queueItem.id)
      
      if (!locked) {
        alert('This patient is currently being processed by another receptionist.')
        return
      }

      // Set selected queue item
      setSelectedQueueItem(queueItem)
      
      // Find the patient and set search term
      const patient = patients.find(p => p.id === queueItem.patient_id)
      if (patient) {
        setPatientSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_number})`)
      }
      
      // Pre-populate form with patient and consultation data
      setFormData({
        patient_id: queueItem.patient_id,
        total_amount: '',
        amount_paid: '',
        payment_method: 'Cash',
        payment_status: 'Pending',
        items: [],
        notes: `Consultation with Dr. ${queueItem.doctor?.first_name} ${queueItem.doctor?.last_name}\nChief Complaint: ${queueItem.consultation?.chief_complaint || 'N/A'}\nDiagnosis: ${queueItem.consultation?.diagnosis || 'N/A'}`,
        is_pwd: false,
        discount_type: '',
        discount_percentage: 0,
        discount_amount: 0
      })
      
      setShowModal(true)
    } catch (error) {
      console.error('Error selecting patient from queue:', error)
      alert('Failed to select patient: ' + error.message)
    }
  }

  // Handle canceling billing (unlock patient)
  const handleCancelBilling = async () => {
    if (selectedQueueItem) {
      await unlockPatient(selectedQueueItem.id)
      setSelectedQueueItem(null)
    }
    closeModal()
  }

  // Handle completing billing (create payment and update consultation)
  const handleCompleteBilling = async (e) => {
    e.preventDefault()
    
    if (!selectedQueueItem) {
      // Regular payment flow (not from queue)
      return handleSubmit(e)
    }

    try {
      const totalAmount      = parseFloat(formData.total_amount)
      const cashTendered     = parseFloat(formData.cash_tendered || formData.amount_paid || formData.total_amount)
      const amountPaid       = Math.min(cashTendered, totalAmount)
      const remainingBalance = Math.max(0, totalAmount - amountPaid)
      
      // Auto-set status based on payment
      let status = formData.payment_status
      if (amountPaid >= totalAmount) {
        status = 'Paid'
      } else if (amountPaid > 0) {
        status = 'Partial'
      }
      
      // Create billing record with consultation reference
      const billingData = {
        patient_id: formData.patient_id,
        consultation_id: selectedQueueItem.consultation_id,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        remaining_balance: remainingBalance,
        payment_method: formData.payment_method,
        payment_status: status,
        items: formData.items,
        notes: formData.notes,
        discount_type: formData.discount_type || null,
        discount_percentage: formData.discount_percentage || 0,
        discount_amount: formData.discount_amount || 0,
        billed_at: new Date().toISOString(),
        billed_by: userProfile.id
      }

      await db.addBilling(billingData)
      
      // Update consultation status to 'billed'
      await db.updateConsultation(selectedQueueItem.consultation_id, {
        status: 'billed'
      })
      
      // Remove from billing queue
      await removeFromQueue(selectedQueueItem.consultation_id)
      
      // Reload data
      await loadData()
      
      // Reset and close
      setSelectedQueueItem(null)
      closeModal()
      
      alert('Payment completed successfully!')
    } catch (error) {
      console.error('Error completing billing:', error)
      alert('Failed to complete billing: ' + error.message)
    }
  }

  // Helper function to convert number to words (for Philippine Peso)
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    
    const convertLessThanThousand = (n) => {
      if (n === 0) return ''
      if (n < 10) return ones[n]
      if (n < 20) return teens[n - 10]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '')
    }
    
    if (num === 0) return 'Zero Pesos Only'
    
    let pesos = Math.floor(num)
    const centavos = Math.round((num - Math.floor(num)) * 100)
    
    let result = ''
    
    if (pesos >= 1000000) {
      result += convertLessThanThousand(Math.floor(pesos / 1000000)) + ' Million '
      pesos = pesos % 1000000
    }
    if (pesos >= 1000) {
      result += convertLessThanThousand(Math.floor(pesos / 1000)) + ' Thousand '
      pesos = pesos % 1000
    }
    if (pesos > 0) {
      result += convertLessThanThousand(pesos)
    }
    
    result += ' Pesos'
    
    if (centavos > 0) {
      result += ' and ' + convertLessThanThousand(centavos) + ' Centavos'
    }
    
    return result.trim() + ' Only'
  }

  const handleDownload = (payment) => {
    try {
      // A5 size: 148mm x 210mm
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a5',
        orientation: 'portrait'
      })
      
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10
      
      // Get real payment data - fix hardcoded issue
      const totalAmount = parseFloat(payment.total_amount || payment.amount || 0)
      const amountPaid = parseFloat(payment.amount_paid !== undefined && payment.amount_paid !== null ? payment.amount_paid : totalAmount)
      const remainingBalance = parseFloat(payment.remaining_balance || 0)
      
      // Format numbers properly
      const formatAmount = (amount) => {
        const num = parseFloat(amount)
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      }
      
      // Simple border
      doc.setDrawColor(20, 184, 166)
      doc.setLineWidth(0.5)
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10)
      
      // Header - Minimal
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(20, 184, 166)
      doc.text('RIZALCARE MEDICAL CLINIC', pageWidth / 2, 14, { align: 'center' })
      
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text('IPDL8 Bldg. GF #25G Dikit St. Brgy Bagumbayan Pililla, Rizal', pageWidth / 2, 20, { align: 'center' })
      doc.text('Tel: 0938-775-1504 / 0976-273-9445', pageWidth / 2, 24, { align: 'center' })
      
      // Line separator
      doc.setDrawColor(20, 184, 166)
      doc.setLineWidth(0.4)
      doc.line(margin, 28, pageWidth - margin, 28)
      
      // Title
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('ACKNOWLEDGEMENT RECEIPT', pageWidth / 2, 36, { align: 'center' })
      
      // Receipt Info - Compact
      let yPos = 44
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text('Receipt No: ' + String(payment.receipt_number || 'N/A'), margin, yPos)
      
      const dateStr = new Date(payment.date).toLocaleDateString('en-US', { 
        month: 'short', day: '2-digit', year: 'numeric' 
      })
      doc.text('Date: ' + dateStr, pageWidth - margin, yPos, { align: 'right' })
      
      // Patient Info - Compact
      yPos += 8
      doc.setFontSize(8)
      doc.text('Patient: ' + String(payment.patient_name || 'N/A'), margin, yPos)
      doc.text('ID: ' + String(payment.patient_number || 'N/A'), pageWidth - margin, yPos, { align: 'right' })
      
      yPos += 5
      doc.text('Payment: ' + String(payment.payment_method || 'Cash'), margin, yPos)
      doc.text('Status: ' + String(payment.status || 'Pending'), pageWidth - margin, yPos, { align: 'right' })
      
      // Items Section - Clean
      yPos += 10
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('ITEMS / SERVICES', margin, yPos)
      
      yPos += 1
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.2)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      
      // Items list
      yPos += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      
      if (payment.items && payment.items.length > 0) {
        for (let i = 0; i < payment.items.length; i++) {
          const item = payment.items[i]
          const itemName = String(item.name || item.description || 'Item')
          const itemAmount = parseFloat(item.amount || item.price || 0)
          
          // Item number and name
          doc.text((i + 1) + '. ' + itemName, margin, yPos)
          
          // Item amount
          doc.text('PHP ' + formatAmount(itemAmount), pageWidth - margin, yPos, { align: 'right' })
          yPos += 5
        }
      } else {
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(120, 120, 120)
        doc.text('No items listed', margin, yPos)
        yPos += 5
      }
      
      // Separator line
      yPos += 3
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.4)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      
      // Payment Summary - Clear and Minimal
      yPos += 8
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      
      // Total Amount
      doc.text('TOTAL AMOUNT:', margin, yPos)
      doc.setFontSize(12)
      doc.text('PHP ' + formatAmount(totalAmount), pageWidth - margin, yPos, { align: 'right' })
      
      // Amount Paid
      yPos += 7
      doc.setFontSize(9)
      doc.setTextColor(34, 197, 94)
      doc.text('AMOUNT PAID:', margin, yPos)
      doc.setFontSize(12)
      doc.text('PHP ' + formatAmount(amountPaid), pageWidth - margin, yPos, { align: 'right' })
      
      // Change (if overpayment)
      const change = amountPaid > totalAmount ? amountPaid - totalAmount : 0
      if (change > 0) {
        yPos += 7
        doc.setFontSize(9)
        doc.setTextColor(59, 130, 246)
        doc.text('CHANGE:', margin, yPos)
        doc.setFontSize(12)
        doc.text('PHP ' + formatAmount(change), pageWidth - margin, yPos, { align: 'right' })
      }
      
      // Remaining Balance (if any)
      if (remainingBalance > 0) {
        yPos += 7
        doc.setFontSize(9)
        doc.setTextColor(239, 68, 68)
        doc.text('BALANCE DUE:', margin, yPos)
        doc.setFontSize(12)
        doc.text('PHP ' + formatAmount(remainingBalance), pageWidth - margin, yPos, { align: 'right' })
      }
      
      // Amount in Words - Minimal
      yPos += 10
      doc.setTextColor(60, 60, 60)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'italic')
      const amountWords = numberToWords(amountPaid)
      doc.text('Amount Paid: ' + amountWords, margin, yPos)
      
      // Notes (if any)
      if (payment.notes) {
        yPos += 8
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text('Notes:', margin, yPos)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)
        const splitNotes = doc.splitTextToSize(String(payment.notes), pageWidth - 2 * margin)
        doc.text(splitNotes, margin, yPos + 3)
        yPos += 3 + (splitNotes.length * 3)
      }
      
      // Signature Section - Minimal
      yPos = pageHeight - 22
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.2)
      doc.line(margin, yPos, margin + 50, yPos)
      doc.line(pageWidth - margin - 50, yPos, pageWidth - margin, yPos)
      
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text('Received By', margin + 25, yPos + 4, { align: 'center' })
      doc.text('Authorized Signature', pageWidth - margin - 25, yPos + 4, { align: 'center' })
      
      // Footer - Minimal
      yPos = pageHeight - 8
      doc.setFontSize(6)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(120, 120, 120)
      doc.text('This is a computer-generated receipt. Thank you!', pageWidth / 2, yPos, { align: 'center' })
      
      // Save the PDF
      const fileName = `Receipt_${payment.receipt_number}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF: ' + error.message)
    }
  }

  const handlePrint = (payment) => {
    try {
      const totalAmount = parseFloat(payment.total_amount || payment.amount || 0)
      const amountPaid = parseFloat(payment.amount_paid !== undefined && payment.amount_paid !== null ? payment.amount_paid : totalAmount)
      const remainingBalance = parseFloat(payment.remaining_balance || 0)
      const change = amountPaid > totalAmount ? amountPaid - totalAmount : 0

      const formatAmount = (amount) =>
        parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

      const dateStr = new Date(payment.date).toLocaleDateString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric'
      })

      const itemsHtml = payment.items && payment.items.length > 0
        ? payment.items.map((item, i) => `
            <tr>
              <td style="padding:4px 0">${i + 1}. ${item.name || item.description || 'Item'}</td>
              <td style="padding:4px 0;text-align:right">PHP ${formatAmount(item.amount || item.price || 0)}</td>
            </tr>`).join('')
        : `<tr><td colspan="2" style="padding:4px 0;color:#888;font-style:italic">No items listed</td></tr>`

      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Receipt ${payment.receipt_number}</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; max-width: 400px; margin: 0 auto; padding: 16px; }
    .clinic-name { font-size: 16px; font-weight: bold; color: #14b8a6; text-align: center; }
    .clinic-sub { font-size: 10px; color: #555; text-align: center; margin: 2px 0; }
    .divider { border-top: 1px solid #14b8a6; margin: 8px 0; }
    .title { font-size: 14px; font-weight: bold; text-align: center; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; }
    .section-label { font-weight: bold; font-size: 11px; margin: 10px 0 4px; }
    .total-row td { font-weight: bold; padding: 4px 0; }
    .paid-row td { color: #16a34a; font-weight: bold; padding: 4px 0; }
    .balance-row td { color: #dc2626; font-weight: bold; padding: 4px 0; }
    .change-row td { color: #2563eb; font-weight: bold; padding: 4px 0; }
    .footer { font-size: 10px; color: #888; text-align: center; margin-top: 16px; font-style: italic; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 24px; }
    .sig-line { border-top: 1px solid #333; width: 120px; text-align: center; padding-top: 4px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="clinic-name">RIZALCARE MEDICAL CLINIC</div>
  <div class="clinic-sub">IPDL8 Bldg. GF #25G Dikit St. Brgy Bagumbayan Pililla, Rizal</div>
  <div class="clinic-sub">Tel: 0938-775-1504 / 0976-273-9445</div>
  <div class="divider"></div>
  <div class="title">ACKNOWLEDGEMENT RECEIPT</div>
  <div class="row"><span>Receipt No: <b>${payment.receipt_number || 'N/A'}</b></span><span>Date: ${dateStr}</span></div>
  <div class="row"><span>Patient: <b>${payment.patient_name || 'N/A'}</b></span><span>ID: ${payment.patient_number || 'N/A'}</span></div>
  <div class="row"><span>Payment: ${payment.payment_method || 'Cash'}</span><span>Status: ${payment.status || 'Pending'}</span></div>
  <div class="section-label">ITEMS / SERVICES</div>
  <div class="divider" style="margin:0 0 4px"></div>
  <table>${itemsHtml}</table>
  <div class="divider"></div>
  <table>
    <tr class="total-row"><td>TOTAL AMOUNT:</td><td style="text-align:right">PHP ${formatAmount(totalAmount)}</td></tr>
    <tr class="paid-row"><td>AMOUNT PAID:</td><td style="text-align:right">PHP ${formatAmount(amountPaid)}</td></tr>
    ${change > 0 ? `<tr class="change-row"><td>CHANGE:</td><td style="text-align:right">PHP ${formatAmount(change)}</td></tr>` : ''}
    ${remainingBalance > 0 ? `<tr class="balance-row"><td>BALANCE DUE:</td><td style="text-align:right">PHP ${formatAmount(remainingBalance)}</td></tr>` : ''}
  </table>
  <div style="font-size:10px;color:#555;font-style:italic;margin-top:6px">Amount Paid: ${numberToWords(amountPaid)}</div>
  ${payment.notes ? `<div class="section-label">Notes:</div><div style="font-size:11px;color:#555">${payment.notes}</div>` : ''}
  <div class="sig-row">
    <div class="sig-line">Received By</div>
    <div class="sig-line">Authorized Signature</div>
  </div>
  <div class="footer">This is a computer-generated receipt. Thank you!</div>
</body>
</html>`

      const printWindow = window.open('', '_blank', 'width=500,height=700')
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    } catch (error) {
      console.error('Error printing receipt:', error)
      alert('Failed to print receipt: ' + error.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700'
      case 'Partial':
        return 'bg-blue-100 text-blue-700'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'Cancelled':
        return 'bg-red-100 text-red-700'
      case 'Refunded':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.patient_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus
    return matchesSearch && matchesStatus
  })



  const stats = {
    total: payments.reduce((sum, p) => sum + p.amount_paid, 0),
    paid: payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount_paid, 0),
    pending: payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.total_amount, 0),
    unpaid: payments.filter(p => p.status === 'Partial' || p.status === 'Pending').reduce((sum, p) => sum + p.remaining_balance, 0),
    count: payments.length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Billing</h1>
          <p className="text-sm text-slate-600 mt-1">Manage patient payments and invoices</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
        >
          <Plus size={20} />
          New Payment
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { key: 'transactions', label: 'Transactions' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transactions Tab panel */}
      {activeTab === 'transactions' && (
        <>
      {/* Billing Queue Section */}
      <BillingQueue onSelectPatient={handleSelectPatient} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Total Revenue</p>
            <DollarSign size={20} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">₱{stats.total.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Amount collected</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Paid</p>
            <DollarSign size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">₱{stats.paid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Unpaid Balance</p>
            <DollarSign size={20} className="text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">₱{stats.unpaid.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Partial &amp; pending</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Transactions</p>
            <CreditCard size={20} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.count}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by patient name, receipt number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Paid', 'Partial', 'Pending', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  filterStatus === status
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <SkeletonLoader variant="table" message="Loading payments..." />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-semibold">No payments found</p>
            <p className="text-sm text-slate-500 mt-1">Create your first payment to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Receipt #</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Patient</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount Paid</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Unpaid Balance</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-semibold text-slate-900">{payment.receipt_number}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-slate-900">{payment.patient_name}</p>
                        <p className="text-xs text-slate-500">{payment.patient_number}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Calendar size={14} />
                        {new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-lg font-bold text-slate-900">₱{payment.amount_paid.toLocaleString()}</p>
                      {payment.status !== 'Paid' && payment.total_amount !== payment.amount_paid && (
                        <p className="text-xs text-slate-400">of ₱{payment.total_amount.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {payment.remaining_balance > 0 ? (
                        <p className="text-sm font-semibold text-red-600">₱{payment.remaining_balance.toLocaleString()}</p>
                      ) : (
                        <p className="text-sm text-slate-400">—</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-slate-700">{payment.payment_method}</p>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={payment.status}
                        onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)} border-0 cursor-pointer`}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Partial">Partial</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {payment.status === 'Partial' && (
                          <button
                            onClick={() => handleStatusChange(payment.id, 'Paid')}
                            className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            title="Clear partial — mark as fully paid"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => handleView(payment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(payment)}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Download Invoice"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handlePrint(payment)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Print Receipt"
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

        </> // end transactions tab
      )}

      {/* New Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">New Payment</h2>
              <button onClick={handleCancelBilling} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCompleteBilling} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Patient *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={patientSearchTerm}
                      onChange={(e) => handlePatientSearchChange(e.target.value)}
                      onFocus={() => setShowPatientSuggestions(true)}
                      placeholder="Type patient name or ID to search..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      autoComplete="off"
                    />
                    
                    {/* Patient Suggestions Dropdown */}
                    {showPatientSuggestions && getFilteredPatients().length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredPatients().map(patient => {
                          // Calculate age for display
                          const birthDate = new Date(patient.date_of_birth)
                          const today = new Date()
                          let age = today.getFullYear() - birthDate.getFullYear()
                          const monthDiff = today.getMonth() - birthDate.getMonth()
                          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--
                          }
                          const isSenior = age >= 60
                          
                          return (
                            <div
                              key={patient.id}
                              onClick={() => handlePatientSelect(patient)}
                              className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                            >
                              <div className="font-semibold text-slate-900">
                                {patient.first_name} {patient.last_name}
                                {isSenior && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Senior Citizen</span>}
                              </div>
                              <div className="text-xs text-slate-600 mt-0.5">
                                ID: {patient.patient_number} • Age: {age} • {patient.contact_number || 'No contact'}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    
                    {/* No results message */}
                    {showPatientSuggestions && patientSearchTerm && getFilteredPatients().length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center">
                        <p className="text-sm text-slate-500">No patients found matching "{patientSearchTerm}"</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Search by name or patient ID</p>
                </div>

                {/* PWD Checkbox */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_pwd}
                      onChange={(e) => {
                        const isPwd = e.target.checked
                        setFormData({...formData, is_pwd: isPwd})
                        
                        // Recalculate discount when PWD status changes
                        if (formData.items.length > 0 && formData.patient_id) {
                          const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0)
                          const discount = calculateDiscount(subtotal, formData.patient_id, isPwd)
                          setFormData(prev => ({
                            ...prev,
                            is_pwd: isPwd,
                            total_amount: discount.finalTotal.toFixed(2),
                            discount_type: discount.discountType,
                            discount_percentage: discount.discountPercentage,
                            discount_amount: discount.discountAmount
                          }))
                        }
                      }}
                      className="w-5 h-5 text-teal-500 rounded focus:ring-2 focus:ring-teal-500"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">Person with Disability (PWD)</p>
                      <p className="text-xs text-slate-600">Check if patient is a PWD (20% discount applies)</p>
                    </div>
                  </label>
                </div>

                {/* Items/Transactions Section with Dropdowns */}
                <div className="border-2 border-teal-100 rounded-xl p-4 bg-teal-50/30">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Items / Services *</label>
                  
                  {/* Add Item Form with Autocomplete */}
                  <div className="space-y-2 mb-3">
                    <div className="flex gap-2">
                      <select
                        value={currentItem.type}
                        onChange={(e) => {
                          setCurrentItem({ type: e.target.value, id: '', name: '', price: '', quantity: 1 })
                          setItemSearchTerm('')
                          setShowSuggestions(false)
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      >
                        <option value="service">Service</option>
                        <option value="inventory">Medicine/Supply</option>
                      </select>
                      
                      {/* Autocomplete Input */}
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={itemSearchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          onFocus={() => setShowSuggestions(true)}
                          placeholder={`Type to search ${currentItem.type === 'service' ? 'service' : 'medicine/supply'}...`}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          autoComplete="off"
                        />
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && getFilteredItems().length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {getFilteredItems().map(item => (
                              <div
                                key={item.id}
                                onClick={() => handleItemSelect(item)}
                                className="px-3 py-2 hover:bg-teal-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                              >
                                <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                  {item.name}
                                  {/suturing|burn care/i.test(item.name) && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-normal">Variable Price</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {/suturing|burn care/i.test(item.name) ? 'Price varies — enter manually' : `₱${parseFloat(item.price).toLocaleString()}`}
                                  {currentItem.type === 'inventory' && item.stock && (
                                    <span className="ml-2">({item.stock} {item.unit} available)</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                        className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      
                      <button
                        type="button"
                        onClick={addItem}
                        disabled={!currentItem.id}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                    {currentItem.id && (
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                        <span className="text-xs text-slate-600">Price (₱):</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentItem.price}
                          onChange={(e) => setCurrentItem({...currentItem, price: e.target.value})}
                          className="w-28 px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                        <span className="text-xs text-slate-600">
                          × {currentItem.quantity} = ₱{(parseFloat(currentItem.price || 0) * parseInt(currentItem.quantity || 1)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  {formData.items.length > 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600">Item</th>
                            <th className="text-center py-2 px-3 text-xs font-semibold text-slate-600">Qty</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-600">Price</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-600">Total</th>
                            <th className="w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, index) => (
                            <tr key={index} className="border-t border-slate-100">
                              <td className="py-2 px-3 text-slate-900">
                                {item.name}
                                <span className="ml-2 text-xs text-slate-500">({item.type})</span>
                              </td>
                              <td className="py-2 px-3 text-center text-slate-700">{item.quantity}</td>
                              <td className="py-2 px-3 text-right text-slate-700">₱{item.price.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right font-semibold text-slate-900">₱{item.total.toLocaleString()}</td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Remove"
                                >
                                  <X size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {/* Subtotal Row */}
                          <tr className="border-t-2 border-slate-300 bg-slate-50">
                            <td colSpan="3" className="py-2 px-3 font-semibold text-slate-700">SUBTOTAL</td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-900">
                              ₱{formData.items.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                          
                          {/* Discount Row (if applicable) */}
                          {formData.discount_amount > 0 && (
                            <tr className="bg-green-50">
                              <td colSpan="3" className="py-2 px-3 text-sm text-green-700">
                                <span className="font-semibold">DISCOUNT</span>
                                <span className="ml-2 text-xs">({formData.discount_type} - {formData.discount_percentage}%)</span>
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-green-600">
                                -₱{parseFloat(formData.discount_amount).toLocaleString()}
                              </td>
                              <td></td>
                            </tr>
                          )}
                          
                          {/* Total Row */}
                          <tr className="border-t-2 border-slate-400 bg-teal-50">
                            <td colSpan="3" className="py-2 px-3 font-bold text-slate-900">TOTAL AMOUNT</td>
                            <td className="py-2 px-3 text-right font-bold text-teal-600 text-lg">
                              ₱{parseFloat(formData.total_amount || 0).toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-6 text-center">
                      <p className="text-sm text-slate-500">No items added yet. Select items above.</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount Paid (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cash_tendered}
                    onChange={(e) => handleAmountPaidChange(e.target.value)}
                    placeholder="Enter amount paid (leave empty for full payment)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Status will auto-update based on payment amount</p>
                </div>

                {formData.total_amount && formData.cash_tendered && parseFloat(formData.cash_tendered) < parseFloat(formData.total_amount) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-900 mb-1">Remaining Balance</p>
                    <p className="text-2xl font-bold text-amber-600">
                      ₱{(parseFloat(formData.total_amount) - parseFloat(formData.cash_tendered || 0)).toLocaleString()}
                    </p>
                  </div>
                )}

                {formData.change_given > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Change to Return</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₱{parseFloat(formData.change_given).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method *</label>
                    <select
                      required
                      value={formData.payment_method}
                      onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="GCash">GCash</option>
                      <option value="Maya">Maya</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                    <div className="w-full px-4 py-3 border-2 border-teal-200 bg-teal-50 rounded-xl font-semibold text-teal-700">
                      {formData.payment_status}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Auto-calculated</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    placeholder="Additional notes..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={formData.items.length === 0}
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Create Payment
                </button>
                <button
                  type="button"
                  onClick={handleCancelBilling}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Payment Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-2xl font-bold text-slate-900">Payment Details</h2>
              <button onClick={() => setViewingPayment(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Acknowledgment Receipt</p>
                  <p className="font-mono font-semibold text-slate-900">{viewingPayment.receipt_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Date</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(viewingPayment.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Patient Name</p>
                  <p className="font-semibold text-slate-900">{viewingPayment.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Patient Number</p>
                  <p className="font-mono font-semibold text-slate-900">{viewingPayment.patient_number}</p>
                </div>
              </div>

              {/* Items/Services Breakdown */}
              {viewingPayment.items && viewingPayment.items.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">Items & Services</p>
                  </div>
                  <div className="bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left py-2 px-4 text-xs font-semibold text-slate-600">Item</th>
                          <th className="text-center py-2 px-4 text-xs font-semibold text-slate-600">Qty</th>
                          <th className="text-right py-2 px-4 text-xs font-semibold text-slate-600">Price</th>
                          <th className="text-right py-2 px-4 text-xs font-semibold text-slate-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingPayment.items.map((item, index) => (
                          <tr key={index} className="border-b border-slate-100 last:border-b-0">
                            <td className="py-2 px-4 text-slate-900">
                              {item.name}
                              <span className="ml-2 text-xs text-slate-500">({item.type})</span>
                            </td>
                            <td className="py-2 px-4 text-center text-slate-700">{item.quantity}</td>
                            <td className="py-2 px-4 text-right text-slate-700">₱{parseFloat(item.price).toLocaleString()}</td>
                            <td className="py-2 px-4 text-right font-semibold text-slate-900">₱{parseFloat(item.total).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Summary with Status Explanation */}
              <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">Payment Summary</p>
                </div>
                <div className="bg-white p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-600">Total Amount</p>
                    <p className="text-lg font-bold text-slate-900">₱{viewingPayment.amount.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-600">Amount Paid</p>
                    <p className="text-lg font-bold text-green-600">
                      ₱{(viewingPayment.amount_paid || viewingPayment.amount).toLocaleString()}
                    </p>
                  </div>

                  {viewingPayment.amount_paid && viewingPayment.amount_paid > viewingPayment.amount && (
                    <div className="flex justify-between items-center pt-2 border-t-2 border-blue-200">
                      <p className="text-sm font-semibold text-blue-900">Change</p>
                      <p className="text-xl font-bold text-blue-600">
                        ₱{(viewingPayment.amount_paid - viewingPayment.amount).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {viewingPayment.amount_paid && viewingPayment.amount_paid < viewingPayment.amount && (
                    <div className="flex justify-between items-center pt-2 border-t-2 border-amber-200">
                      <p className="text-sm font-semibold text-amber-900">Remaining Balance</p>
                      <p className="text-xl font-bold text-amber-600">
                        ₱{(viewingPayment.amount - viewingPayment.amount_paid).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-slate-600">Payment Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(viewingPayment.status)}`}>
                        {viewingPayment.status}
                      </span>
                    </div>
                    
                    {/* Status Explanation */}
                    <div className={`mt-2 p-3 rounded-lg text-sm ${
                      viewingPayment.status === 'Paid' ? 'bg-green-50 text-green-800' :
                      viewingPayment.status === 'Partial' ? 'bg-blue-50 text-blue-800' :
                      viewingPayment.status === 'Pending' ? 'bg-yellow-50 text-yellow-800' :
                      'bg-slate-50 text-slate-800'
                    }`}>
                      {viewingPayment.status === 'Paid' && (
                        <p>✓ Full payment received. No outstanding balance.</p>
                      )}
                      {viewingPayment.status === 'Partial' && (
                        <p>⚠ Partial payment received. Balance of ₱{(viewingPayment.amount - (viewingPayment.amount_paid || 0)).toLocaleString()} remaining.</p>
                      )}
                      {viewingPayment.status === 'Pending' && (
                        <p>⏳ No payment received yet. Full amount of ₱{viewingPayment.amount.toLocaleString()} is due.</p>
                      )}
                      {viewingPayment.status === 'Cancelled' && (
                        <p>✕ This payment has been cancelled.</p>
                      )}
                      {viewingPayment.status === 'Refunded' && (
                        <p>↩ This payment has been refunded.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-slate-600 mb-1">Payment Method</p>
                    <p className="font-semibold text-slate-900">{viewingPayment.payment_method}</p>
                  </div>
                </div>
              </div>

              {viewingPayment.notes && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Notes</p>
                  <p className="text-sm text-slate-900">{viewingPayment.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button 
                  onClick={() => setViewingPayment(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Close
                </button>
                <button 
                  onClick={() => handleDownload(viewingPayment)}
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments
