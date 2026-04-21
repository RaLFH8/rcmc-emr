import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, DollarSign, Download, Eye, X, CreditCard, Calendar, Printer, ChevronLeft, ChevronRight, Edit2, AlertTriangle, RefreshCw } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBillingQueue } from '../context/BillingQueueContext'
import { BillingQueue } from '../components/BillingQueue'
import jsPDF from 'jspdf'
import SkeletonLoader from '../components/SkeletonLoader'
import PatientProfileModal from '../components/PatientProfileModal'

const PAGE_SIZE = 20

const CLINIC_NAME = import.meta.env.VITE_CLINIC_NAME || 'RIZALCARE MEDICAL CLINIC'
const CLINIC_ADDRESS = import.meta.env.VITE_CLINIC_ADDRESS || 'IPDL8 Bldg. GF #25G Dikit St. Brgy Bagumbayan Pililla, Rizal'
const CLINIC_PHONE = import.meta.env.VITE_CLINIC_PHONE || '0938-775-1504 / 0976-273-9445'

const emptyForm = {
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
  discount_amount: 0,
  manual_discount_label: '',
  manual_discount_percentage: 0,
}

const Payments = () => {
  const { userProfile } = useAuth()
  const { lockPatient, unlockPatient, removeFromQueue } = useBillingQueue()
  const [activeTab, setActiveTab] = useState('transactions')
  const [payments, setPayments] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [patients, setPatients] = useState([])
  const [profilePatient, setProfilePatient] = useState(null)
  const [services, setServices] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [viewingPayment, setViewingPayment] = useState(null)
  const [selectedQueueItem, setSelectedQueueItem] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [currentItem, setCurrentItem] = useState({ type: 'service', id: '', name: '', price: '', quantity: 1 })
  const [itemSearchTerm, setItemSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false)
  // Stats from DB (not from loaded slice)
  const [dbStats, setDbStats] = useState({ total: 0, paid: 0, unpaid: 0, count: 0 })
  // Status change confirmation
  const [pendingStatusChange, setPendingStatusChange] = useState(null) // { id, newStatus }
  // Refund workflow
  const [refundingPayment, setRefundingPayment] = useState(null)
  const [refundNotes, setRefundNotes] = useState('')

  // ── Discount calculation ──────────────────────────────────────────────────
  const calculateDiscount = (subtotal, patientId, isPwd, manualPct = 0) => {
    const patient = patients.find(p => p.id === patientId)
    let isSenior = false
    if (patient?.date_of_birth) {
      const birthDate = new Date(patient.date_of_birth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const md = today.getMonth() - birthDate.getMonth()
      if (md < 0 || (md === 0 && today.getDate() < birthDate.getDate())) age--
      isSenior = age >= 60
    }

    const isEligible = isSenior || isPwd
    let discountType = ''
    let discountPercentage = 0

    if (isEligible) {
      discountPercentage = 20
      discountType = isSenior && isPwd ? 'Senior Citizen & PWD' : isSenior ? 'Senior Citizen' : 'PWD'
    }

    // Manual discount stacks on top (or replaces if higher)
    if (manualPct > 0 && manualPct > discountPercentage) {
      discountPercentage = manualPct
      discountType = discountType ? `${discountType} + Manual` : 'Manual Discount'
    }

    const discountAmount = subtotal * (discountPercentage / 100)
    const finalTotal = subtotal - discountAmount
    return { discountType, discountPercentage, discountAmount, finalTotal }
  }

  const recalcWithDiscount = (items, patientId, isPwd, manualPct = 0) => {
    const subtotal = items.reduce((s, i) => s + i.total, 0)
    return calculateDiscount(subtotal, patientId, isPwd, manualPct)
  }

  // ── Item helpers ──────────────────────────────────────────────────────────
  const addItem = () => {
    if (!currentItem.id || !currentItem.name || !currentItem.price || !currentItem.quantity) return
    const itemTotal = parseFloat(currentItem.price) * parseInt(currentItem.quantity)
    const newItems = [...formData.items, {
      type: currentItem.type, id: currentItem.id, name: currentItem.name,
      price: parseFloat(currentItem.price), quantity: parseInt(currentItem.quantity), total: itemTotal
    }]
    const discount = recalcWithDiscount(newItems, formData.patient_id, formData.is_pwd, formData.manual_discount_percentage)
    setFormData(prev => ({
      ...prev, items: newItems,
      total_amount: discount.finalTotal.toFixed(2),
      discount_type: discount.discountType,
      discount_percentage: discount.discountPercentage,
      discount_amount: discount.discountAmount
    }))
    setCurrentItem({ type: currentItem.type, id: '', name: '', price: '', quantity: 1 })
    setItemSearchTerm('')
    setShowSuggestions(false)
  }

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    const discount = recalcWithDiscount(newItems, formData.patient_id, formData.is_pwd, formData.manual_discount_percentage)
    setFormData(prev => ({
      ...prev, items: newItems,
      total_amount: discount.finalTotal.toFixed(2),
      discount_type: discount.discountType,
      discount_percentage: discount.discountPercentage,
      discount_amount: discount.discountAmount
    }))
  }

  const handleItemSelect = (selectedItem) => {
    setCurrentItem({ ...currentItem, id: selectedItem.id, name: selectedItem.name, price: selectedItem.price })
    setItemSearchTerm(selectedItem.name)
    setShowSuggestions(false)
  }

  const handleSearchChange = (value) => {
    setItemSearchTerm(value)
    setShowSuggestions(value.length > 0)
    if (value === '') setCurrentItem({ ...currentItem, id: '', name: '', price: '' })
  }

  const getFilteredItems = () => {
    const items = currentItem.type === 'service' ? services : inventory
    if (!itemSearchTerm) return items
    return items.filter(i => i.name.toLowerCase().includes(itemSearchTerm.toLowerCase()))
  }

  // ── Patient helpers ───────────────────────────────────────────────────────
  const getFilteredPatients = () => {
    if (!patientSearchTerm) return patients
    const s = patientSearchTerm.toLowerCase()
    return patients.filter(p => {
      const full = `${p.first_name} ${p.last_name}`.toLowerCase()
      return full.includes(s) || p.patient_number.toLowerCase().includes(s)
    })
  }

  const handlePatientSelect = (patient) => {
    setPatientSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_number})`)
    setShowPatientSuggestions(false)
    const discount = recalcWithDiscount(formData.items, patient.id, formData.is_pwd, formData.manual_discount_percentage)
    setFormData(prev => ({
      ...prev, patient_id: patient.id,
      total_amount: formData.items.length > 0 ? discount.finalTotal.toFixed(2) : prev.total_amount,
      discount_type: discount.discountType,
      discount_percentage: discount.discountPercentage,
      discount_amount: discount.discountAmount
    }))
  }

  const handlePatientSearchChange = (value) => {
    setPatientSearchTerm(value)
    setShowPatientSuggestions(value.length > 0)
    if (value === '') setFormData(prev => ({ ...prev, patient_id: '' }))
  }

  // ── Amount paid ───────────────────────────────────────────────────────────
  const getAutoStatus = (total, paid) => {
    const t = parseFloat(total) || 0
    const p = parseFloat(paid) || 0
    if (p === 0) return 'Pending'
    if (p >= t) return 'Paid'
    return 'Partial'
  }

  const handleAmountPaidChange = (value) => {
    const received = parseFloat(value) || 0
    const total = parseFloat(formData.total_amount) || 0
    const capped = received > total ? total : received
    const change = received > total ? received - total : 0
    setFormData(prev => ({
      ...prev,
      cash_tendered: value,
      amount_paid: capped > 0 ? capped.toString() : '',
      change_given: change,
      payment_status: getAutoStatus(total, capped)
    }))
  }

  // ── Manual discount ───────────────────────────────────────────────────────
  const handleManualDiscountChange = (pct) => {
    const manualPct = parseFloat(pct) || 0
    const discount = recalcWithDiscount(formData.items, formData.patient_id, formData.is_pwd, manualPct)
    setFormData(prev => ({
      ...prev,
      manual_discount_percentage: manualPct,
      total_amount: formData.items.length > 0 ? discount.finalTotal.toFixed(2) : prev.total_amount,
      discount_type: discount.discountType,
      discount_percentage: discount.discountPercentage,
      discount_amount: discount.discountAmount
    }))
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const { supabase } = await import('../lib/supabase')
      // Stats always show TODAY only (daily sales)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      let q = supabase.from('billing').select('amount_paid, total_amount, remaining_balance, payment_status', { count: 'exact' })
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
      if (filterStatus !== 'All') q = q.eq('payment_status', filterStatus)
      const { data, count } = await q
      if (data) {
        const total = data.reduce((s, r) => s + (parseFloat(r.amount_paid) || 0), 0)
        const paid = data.filter(r => r.payment_status === 'Paid').reduce((s, r) => s + (parseFloat(r.amount_paid) || 0), 0)
        const unpaid = data.filter(r => r.payment_status === 'Partial' || r.payment_status === 'Pending')
          .reduce((s, r) => s + (parseFloat(r.remaining_balance) || 0), 0)
        setDbStats({ total, paid, unpaid, count: count || data.length })
      }
    } catch (err) {
      console.error('Stats error:', err)
    }
  }, [filterStatus])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * PAGE_SIZE
      const [billingData, patientsData, servicesData, inventoryData] = await Promise.all([
        db.getBilling(PAGE_SIZE, offset, searchTerm, filterStatus, dateFrom, dateTo),
        db.getPatients(1000),
        db.getServices(),
        db.getInventory()
      ])

      const transformedPayments = billingData.data.map(bill => ({
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
        notes: bill.notes || '',
        discount_type: bill.discount_type || '',
        discount_percentage: bill.discount_percentage || 0,
        discount_amount: bill.discount_amount || 0,
      }))

      setPayments(transformedPayments)
      setTotalCount(billingData.count || 0)
      setPatients(patientsData.data || patientsData || [])
      setServices(servicesData.filter(s => s.status === 'Active'))
      setInventory(inventoryData.filter(i => i.status === 'In Stock' || i.status === 'Low Stock'))
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, filterStatus, dateFrom, dateTo])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { loadStats() }, [loadStats])

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1) }, [searchTerm, filterStatus, dateFrom, dateTo])

  // ── Submit (create or edit) ───────────────────────────────────────────────
  const buildBillingPayload = () => {
    const totalAmount = parseFloat(formData.total_amount)
    const cashTendered = parseFloat(formData.cash_tendered || formData.amount_paid || formData.total_amount)
    const amountPaid = Math.min(cashTendered, totalAmount)
    const remainingBalance = Math.max(0, totalAmount - amountPaid)
    let status = amountPaid >= totalAmount ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending'
    return {
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
      discount_amount: formData.discount_amount || 0,
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const payload = buildBillingPayload()
      if (editingPayment) {
        await db.updateBilling(editingPayment.id, payload)
      } else if (selectedQueueItem) {
        await db.addBilling({ ...payload, consultation_id: selectedQueueItem.consultation_id, billed_at: new Date().toISOString(), billed_by: userProfile?.id })
        await db.updateConsultation(selectedQueueItem.consultation_id, { status: 'billed' })
        await removeFromQueue(selectedQueueItem.consultation_id)
      } else {
        await db.addBilling(payload)
      }
      await loadData()
      await loadStats()
      closeModal()
      if (selectedQueueItem) alert('Payment completed successfully!')
    } catch (error) {
      console.error('Error saving payment:', error)
      alert('Failed to save payment: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Edit existing payment ─────────────────────────────────────────────────
  const handleEdit = (payment) => {
    const patient = patients.find(p => p.id === payment.patient_id)
    if (patient) setPatientSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_number})`)
    setEditingPayment(payment)
    setFormData({
      patient_id: payment.patient_id,
      total_amount: payment.total_amount.toString(),
      amount_paid: payment.amount_paid.toString(),
      cash_tendered: payment.amount_paid.toString(),
      change_given: 0,
      payment_method: payment.payment_method,
      payment_status: payment.status,
      items: payment.items || [],
      notes: payment.notes || '',
      is_pwd: false,
      discount_type: payment.discount_type || '',
      discount_percentage: payment.discount_percentage || 0,
      discount_amount: payment.discount_amount || 0,
      manual_discount_label: '',
      manual_discount_percentage: 0,
    })
    setShowModal(true)
  }

  // ── Status change with confirmation ──────────────────────────────────────
  const handleStatusChange = (id, newStatus) => {
    setPendingStatusChange({ id, newStatus })
  }

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return
    try {
      const { id, newStatus } = pendingStatusChange
      const payment = payments.find(p => p.id === id)
      const updates = { payment_status: newStatus }
      if (newStatus === 'Paid' && payment) {
        updates.amount_paid = payment.total_amount
        updates.remaining_balance = 0
      }
      await db.updateBilling(id, updates)
      await loadData()
      await loadStats()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status: ' + error.message)
    } finally {
      setPendingStatusChange(null)
    }
  }

  // ── Refund workflow ───────────────────────────────────────────────────────
  const handleRefund = async () => {
    if (!refundingPayment) return
    try {
      await db.updateBilling(refundingPayment.id, {
        payment_status: 'Refunded',
        notes: (refundingPayment.notes ? refundingPayment.notes + '\n' : '') + `REFUNDED: ${refundNotes}`
      })
      await loadData()
      await loadStats()
      setRefundingPayment(null)
      setRefundNotes('')
    } catch (error) {
      console.error('Error processing refund:', error)
      alert('Failed to process refund: ' + error.message)
    }
  }

  // ── Queue helpers ─────────────────────────────────────────────────────────
  const handleSelectPatient = async (queueItem) => {
    try {
      const locked = await lockPatient(queueItem.id)
      if (!locked) { alert('This patient is currently being processed by another receptionist.'); return }
      setSelectedQueueItem(queueItem)
      const patient = patients.find(p => p.id === queueItem.patient_id)
      if (patient) setPatientSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_number})`)
      setFormData({
        ...emptyForm,
        patient_id: queueItem.patient_id,
        notes: `Consultation with Dr. ${queueItem.doctor?.first_name} ${queueItem.doctor?.last_name}\nChief Complaint: ${queueItem.consultation?.chief_complaint || 'N/A'}\nDiagnosis: ${queueItem.consultation?.diagnosis || 'N/A'}`,
      })
      setShowModal(true)
    } catch (error) {
      console.error('Error selecting patient from queue:', error)
      alert('Failed to select patient: ' + error.message)
    }
  }

  const handleCancelBilling = async () => {
    if (selectedQueueItem) { await unlockPatient(selectedQueueItem.id); setSelectedQueueItem(null) }
    closeModal()
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPayment(null)
    setSelectedQueueItem(null)
    setFormData(emptyForm)
    setCurrentItem({ type: 'service', id: '', name: '', price: '', quantity: 1 })
    setItemSearchTerm('')
    setShowSuggestions(false)
    setPatientSearchTerm('')
    setShowPatientSuggestions(false)
  }

  // ── PDF / Print helpers ───────────────────────────────────────────────────
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const cvt = (n) => {
      if (n === 0) return ''
      if (n < 10) return ones[n]
      if (n < 20) return teens[n - 10]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + cvt(n % 100) : '')
    }
    if (num === 0) return 'Zero Pesos Only'
    let pesos = Math.floor(num)
    const centavos = Math.round((num - Math.floor(num)) * 100)
    let result = ''
    if (pesos >= 1000000) { result += cvt(Math.floor(pesos / 1000000)) + ' Million '; pesos %= 1000000 }
    if (pesos >= 1000) { result += cvt(Math.floor(pesos / 1000)) + ' Thousand '; pesos %= 1000 }
    if (pesos > 0) result += cvt(pesos)
    result += ' Pesos'
    if (centavos > 0) result += ' and ' + cvt(centavos) + ' Centavos'
    return result.trim() + ' Only'
  }

  const formatAmt = (amount) => parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  const buildReceiptData = (payment) => {
    const totalAmount = parseFloat(payment.total_amount || payment.amount || 0)
    const discountAmount = parseFloat(payment.discount_amount || 0)
    const amountPaid = parseFloat(payment.amount_paid ?? totalAmount)
    const remainingBalance = parseFloat(payment.remaining_balance || 0)
    const change = amountPaid > totalAmount ? amountPaid - totalAmount : 0
    const dateStr = new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    const items = (payment.items || []).map(item => ({
      name: item.name || item.description || 'Item',
      qty: item.quantity || 1,
      price: parseFloat(item.price || 0),
      total: parseFloat(item.total ?? (item.price * (item.quantity || 1)) ?? item.amount ?? 0)
    }))
    return { totalAmount, discountAmount, amountPaid, remainingBalance, change, dateStr, items }
  }

  const handleDownload = (payment) => {
    try {
      const { totalAmount, discountAmount, amountPaid, remainingBalance, change, dateStr, items } = buildReceiptData(payment)
      const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })
      const pw = doc.internal.pageSize.getWidth()
      const ph = doc.internal.pageSize.getHeight()
      const m = 10

      doc.setDrawColor(20, 184, 166); doc.setLineWidth(0.5); doc.rect(5, 5, pw - 10, ph - 10)
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 184, 166)
      doc.text(CLINIC_NAME, pw / 2, 14, { align: 'center' })
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
      doc.text(CLINIC_ADDRESS, pw / 2, 20, { align: 'center' })
      doc.text('Tel: ' + CLINIC_PHONE, pw / 2, 24, { align: 'center' })
      doc.setDrawColor(20, 184, 166); doc.setLineWidth(0.4); doc.line(m, 28, pw - m, 28)
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0)
      doc.text('ACKNOWLEDGEMENT RECEIPT', pw / 2, 36, { align: 'center' })

      let y = 44
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
      doc.text('Receipt No: ' + String(payment.receipt_number || 'N/A'), m, y)
      doc.text('Date: ' + dateStr, pw - m, y, { align: 'right' })
      y += 8
      doc.text('Patient: ' + String(payment.patient_name || 'N/A'), m, y)
      doc.text('ID: ' + String(payment.patient_number || 'N/A'), pw - m, y, { align: 'right' })
      y += 5
      doc.text('Payment: ' + String(payment.payment_method || 'Cash'), m, y)
      doc.text('Status: ' + String(payment.status || 'Pending'), pw - m, y, { align: 'right' })

      y += 10
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0)
      doc.text('ITEMS / SERVICES', m, y)
      y += 1; doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.line(m, y, pw - m, y)
      y += 5; doc.setFont('helvetica', 'normal'); doc.setFontSize(8)

      if (items.length > 0) {
        items.forEach((item, i) => {
          doc.text(`${i + 1}. ${item.name} (x${item.qty})`, m, y)
          doc.text('PHP ' + formatAmt(item.total), pw - m, y, { align: 'right' })
          y += 5
        })
      } else {
        doc.setFont('helvetica', 'italic'); doc.setTextColor(120, 120, 120)
        doc.text('No items listed', m, y); y += 5
      }

      y += 3; doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.4); doc.line(m, y, pw - m, y)
      y += 8; doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      if (discountAmount > 0) {
        const subtotal = totalAmount + discountAmount
        doc.text('SUBTOTAL:', m, y); doc.setFontSize(12); doc.text('PHP ' + formatAmt(subtotal), pw - m, y, { align: 'right' })
        y += 7; doc.setFontSize(9); doc.setTextColor(16, 185, 129)
        const discountLabel = payment.discount_type ? `DISCOUNT (${payment.discount_type}):` : 'DISCOUNT:'
        doc.text(discountLabel, m, y); doc.setFontSize(12); doc.text('-PHP ' + formatAmt(discountAmount), pw - m, y, { align: 'right' })
        y += 7; doc.setFontSize(9); doc.setTextColor(0, 0, 0)
        doc.text('TOTAL TO PAY:', m, y); doc.setFontSize(12); doc.text('PHP ' + formatAmt(totalAmount), pw - m, y, { align: 'right' })
      } else {
        doc.text('TOTAL AMOUNT:', m, y); doc.setFontSize(12); doc.text('PHP ' + formatAmt(totalAmount), pw - m, y, { align: 'right' })
      }
      y += 7; doc.setFontSize(9); doc.setTextColor(34, 197, 94)
      doc.text('AMOUNT PAID:', m, y); doc.setFontSize(12); doc.text('PHP ' + formatAmt(amountPaid), pw - m, y, { align: 'right' })
      if (change > 0) {
        y += 7; doc.setFontSize(9); doc.setTextColor(59, 130, 246)
        doc.text('CHANGE:', m, y); doc.setFontSize(12); doc.text('PHP ' + formatAmt(change), pw - m, y, { align: 'right' })
      }
      if (remainingBalance > 0) {
        y += 7; doc.setFontSize(9); doc.setTextColor(239, 68, 68)
        doc.text('BALANCE DUE:', m, y); doc.setFontSize(12); doc.text('PHP ' + formatAmt(remainingBalance), pw - m, y, { align: 'right' })
      }
      y += 10; doc.setTextColor(60, 60, 60); doc.setFontSize(7); doc.setFont('helvetica', 'italic')
      doc.text('Amount Paid: ' + numberToWords(amountPaid), m, y)
      if (payment.notes) {
        y += 8; doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0)
        doc.text('Notes:', m, y); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
        const split = doc.splitTextToSize(String(payment.notes), pw - 2 * m)
        doc.text(split, m, y + 3); y += 3 + split.length * 3
      }
      const sigY = ph - 22
      doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.2)
      doc.line(m, sigY, m + 50, sigY); doc.line(pw - m - 50, sigY, pw - m, sigY)
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
      doc.text('Received By', m + 25, sigY + 4, { align: 'center' })
      doc.text('Authorized Signature', pw - m - 25, sigY + 4, { align: 'center' })
      doc.setFontSize(6); doc.setFont('helvetica', 'italic'); doc.setTextColor(120, 120, 120)
      doc.text('This is a computer-generated receipt. Thank you!', pw / 2, ph - 8, { align: 'center' })
      doc.save(`Receipt_${payment.receipt_number}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF: ' + error.message)
    }
  }

  const handlePrint = (payment) => {
    try {
      const { totalAmount, amountPaid, remainingBalance, change, dateStr, items } = buildReceiptData(payment)
      const itemsHtml = items.length > 0
        ? items.map((item, i) => `<tr><td>${i + 1}. ${item.name} (x${item.qty})</td><td style="text-align:right">PHP ${formatAmt(item.total)}</td></tr>`).join('')
        : `<tr><td colspan="2" style="color:#888;font-style:italic">No items listed</td></tr>`

      const html = `<!DOCTYPE html><html><head><title>Receipt ${payment.receipt_number}</title>
<style>@media print{body{margin:0}}body{font-family:Arial,sans-serif;font-size:12px;color:#333;max-width:400px;margin:0 auto;padding:16px}
.cn{font-size:16px;font-weight:bold;color:#14b8a6;text-align:center}.cs{font-size:10px;color:#555;text-align:center;margin:2px 0}
.div{border-top:1px solid #14b8a6;margin:8px 0}.ttl{font-size:14px;font-weight:bold;text-align:center;margin:8px 0}
.row{display:flex;justify-content:space-between;margin:3px 0}table{width:100%;border-collapse:collapse}
.sl{font-weight:bold;font-size:11px;margin:10px 0 4px}.tr td{font-weight:bold;padding:4px 0}
.pr td{color:#16a34a;font-weight:bold;padding:4px 0}.br td{color:#dc2626;font-weight:bold;padding:4px 0}
.cr td{color:#2563eb;font-weight:bold;padding:4px 0}.ft{font-size:10px;color:#888;text-align:center;margin-top:16px;font-style:italic}
.sr{display:flex;justify-content:space-between;margin-top:24px}.sl2{border-top:1px solid #333;width:120px;text-align:center;padding-top:4px;font-size:10px}</style>
</head><body>
<div class="cn">${CLINIC_NAME}</div>
<div class="cs">${CLINIC_ADDRESS}</div>
<div class="cs">Tel: ${CLINIC_PHONE}</div>
<div class="div"></div><div class="ttl">ACKNOWLEDGEMENT RECEIPT</div>
<div class="row"><span>Receipt No: <b>${payment.receipt_number || 'N/A'}</b></span><span>Date: ${dateStr}</span></div>
<div class="row"><span>Patient: <b>${payment.patient_name || 'N/A'}</b></span><span>ID: ${payment.patient_number || 'N/A'}</span></div>
<div class="row"><span>Payment: ${payment.payment_method || 'Cash'}</span><span>Status: ${payment.status || 'Pending'}</span></div>
<div class="sl">ITEMS / SERVICES</div><div class="div" style="margin:0 0 4px"></div>
<table>${itemsHtml}</table><div class="div"></div>
<table>
<tr class="tr"><td>TOTAL AMOUNT:</td><td style="text-align:right">PHP ${formatAmt(totalAmount)}</td></tr>
<tr class="pr"><td>AMOUNT PAID:</td><td style="text-align:right">PHP ${formatAmt(amountPaid)}</td></tr>
${change > 0 ? `<tr class="cr"><td>CHANGE:</td><td style="text-align:right">PHP ${formatAmt(change)}</td></tr>` : ''}
${remainingBalance > 0 ? `<tr class="br"><td>BALANCE DUE:</td><td style="text-align:right">PHP ${formatAmt(remainingBalance)}</td></tr>` : ''}
</table>
<div style="font-size:10px;color:#555;font-style:italic;margin-top:6px">Amount Paid: ${numberToWords(amountPaid)}</div>
${payment.notes ? `<div class="sl">Notes:</div><div style="font-size:11px;color:#555">${payment.notes}</div>` : ''}
<div class="sr"><div class="sl2">Received By</div><div class="sl2">Authorized Signature</div></div>
<div class="ft">This is a computer-generated receipt. Thank you!</div>
</body></html>`

      const w = window.open('', '_blank', 'width=500,height=700')
      w.document.write(html); w.document.close(); w.focus(); w.print(); w.close()
    } catch (error) {
      console.error('Error printing receipt:', error)
      alert('Failed to print receipt: ' + error.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700'
      case 'Partial': return 'bg-blue-100 text-blue-700'
      case 'Pending': return 'bg-yellow-100 text-yellow-700'
      case 'Cancelled': return 'bg-red-100 text-red-700'
      case 'Refunded': return 'bg-purple-100 text-purple-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // ── Render ────────────────────────────────────────────────────────────────
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
          <Plus size={20} /> New Payment
        </button>
      </div>

      {/* Billing Queue */}
      <BillingQueue onSelectPatient={handleSelectPatient} />

      {/* Stats Cards — from real DB totals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Total Collected</p>
            <DollarSign size={20} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">₱{dbStats.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-slate-400 mt-1">Today only</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Paid</p>
            <DollarSign size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">₱{dbStats.paid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Unpaid Balance</p>
            <DollarSign size={20} className="text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">₱{dbStats.unpaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-slate-400 mt-1">Partial &amp; pending</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Transactions</p>
            <CreditCard size={20} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{dbStats.count}</p>
        </div>
      </div>

      {/* Search, Filter, Date Range */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by patient name, receipt number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['All', 'Paid', 'Partial', 'Pending', 'Cancelled', 'Refunded'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${filterStatus === status ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          {/* Date range filter */}
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <Calendar size={16} className="text-slate-400 hidden md:block" />
            <div className="flex gap-2 items-center">
              <label className="text-sm text-slate-600 whitespace-nowrap">From:</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-sm text-slate-600 whitespace-nowrap">To:</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-sm text-slate-500 hover:text-slate-700 underline">Clear dates</button>
            )}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><SkeletonLoader variant="table" message="Loading payments..." /></div>
        ) : payments.length === 0 ? (
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
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Balance</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Method</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6"><span className="font-mono text-sm font-semibold text-slate-900">{payment.receipt_number}</span></td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => {
                          const p = patients.find(pt => pt.id === payment.patient_id)
                          if (p) setProfilePatient(p)
                        }}
                        className="font-semibold text-slate-900 hover:text-teal-600 hover:underline text-left transition-colors block"
                      >
                        {payment.patient_name}
                      </button>
                      <p className="text-xs text-slate-500">{payment.patient_number}</p>
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
                      {payment.remaining_balance > 0
                        ? <p className="text-sm font-semibold text-red-600">₱{payment.remaining_balance.toLocaleString()}</p>
                        : <p className="text-sm text-slate-400">—</p>}
                    </td>
                    <td className="py-4 px-6"><p className="text-sm text-slate-700">{payment.payment_method}</p></td>
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
                      <div className="flex items-center gap-1">
                        {payment.status === 'Partial' && (
                          <button onClick={() => handleStatusChange(payment.id, 'Paid')}
                            className="px-2 py-1 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                            Mark Paid
                          </button>
                        )}
                        {payment.status === 'Paid' && (
                          <button onClick={() => setRefundingPayment(payment)}
                            className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1">
                            <RefreshCw size={12} /> Refund
                          </button>
                        )}
                        <button onClick={() => handleEdit(payment)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Payment">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => setViewingPayment(payment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handleDownload(payment)}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Download Receipt">
                          <Download size={18} />
                        </button>
                        <button onClick={() => handlePrint(payment)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Print Receipt">
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

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Page {currentPage} of {totalPages} ({totalCount} total)
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Change Confirmation Dialog */}
      {pendingStatusChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-full"><AlertTriangle size={24} className="text-amber-600" /></div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Status Change</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Change status to <span className="font-semibold text-slate-900">{pendingStatusChange.newStatus}</span>?
              {pendingStatusChange.newStatus === 'Paid' && ' This will mark the full amount as paid and clear any remaining balance.'}
            </p>
            <div className="flex gap-3">
              <button onClick={confirmStatusChange}
                className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors">
                Confirm
              </button>
              <button onClick={() => setPendingStatusChange(null)}
                className="flex-1 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Dialog */}
      {refundingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-full"><RefreshCw size={24} className="text-purple-600" /></div>
              <h3 className="text-lg font-bold text-slate-900">Process Refund</h3>
            </div>
            <p className="text-slate-600 mb-2">
              Refund <span className="font-semibold">₱{refundingPayment.amount_paid.toLocaleString()}</span> for{' '}
              <span className="font-semibold">{refundingPayment.patient_name}</span>?
            </p>
            <p className="text-xs text-slate-500 mb-4">Receipt: {refundingPayment.receipt_number}</p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for Refund *</label>
              <textarea
                value={refundNotes}
                onChange={e => setRefundNotes(e.target.value)}
                rows="3"
                placeholder="Enter reason for refund..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleRefund} disabled={!refundNotes.trim()}
                className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                Process Refund
              </button>
              <button onClick={() => { setRefundingPayment(null); setRefundNotes('') }}
                className="flex-1 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingPayment ? 'Edit Payment' : 'New Payment'}
              </h2>
              <button onClick={handleCancelBilling} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Patient */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Patient *</label>
                <div className="relative">
                  <input type="text" required value={patientSearchTerm}
                    onChange={(e) => handlePatientSearchChange(e.target.value)}
                    onFocus={() => setShowPatientSuggestions(true)}
                    placeholder="Type patient name or ID to search..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    autoComplete="off" />
                  {showPatientSuggestions && getFilteredPatients().length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredPatients().map(patient => {
                        const bd = new Date(patient.date_of_birth)
                        const today = new Date()
                        let age = today.getFullYear() - bd.getFullYear()
                        const md = today.getMonth() - bd.getMonth()
                        if (md < 0 || (md === 0 && today.getDate() < bd.getDate())) age--
                        return (
                          <div key={patient.id} onClick={() => handlePatientSelect(patient)}
                            className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-slate-100 last:border-b-0">
                            <div className="font-semibold text-slate-900">
                              {patient.first_name} {patient.last_name}
                              {age >= 60 && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Senior</span>}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">ID: {patient.patient_number} • Age: {age}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {showPatientSuggestions && patientSearchTerm && getFilteredPatients().length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center">
                      <p className="text-sm text-slate-500">No patients found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PWD Checkbox */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.is_pwd}
                    onChange={(e) => {
                      const isPwd = e.target.checked
                      const discount = recalcWithDiscount(formData.items, formData.patient_id, isPwd, formData.manual_discount_percentage)
                      setFormData(prev => ({
                        ...prev, is_pwd: isPwd,
                        total_amount: formData.items.length > 0 ? discount.finalTotal.toFixed(2) : prev.total_amount,
                        discount_type: discount.discountType,
                        discount_percentage: discount.discountPercentage,
                        discount_amount: discount.discountAmount
                      }))
                    }}
                    className="w-5 h-5 text-teal-500 rounded focus:ring-2 focus:ring-teal-500" />
                  <div>
                    <p className="font-semibold text-slate-900">Person with Disability (PWD)</p>
                    <p className="text-xs text-slate-600">20% discount applies</p>
                  </div>
                </label>
              </div>

              {/* Manual / Custom Discount */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Manual / Promo Discount</p>
                <div className="flex gap-3 items-center">
                  <input type="text" placeholder="Label (e.g. Staff, Promo)"
                    value={formData.manual_discount_label}
                    onChange={e => setFormData(prev => ({ ...prev, manual_discount_label: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  <div className="flex items-center gap-1">
                    <input type="number" min="0" max="100" placeholder="0"
                      value={formData.manual_discount_percentage || ''}
                      onChange={e => handleManualDiscountChange(e.target.value)}
                      className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    <span className="text-sm text-slate-600">%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Applied only if higher than Senior/PWD discount</p>
              </div>

              {/* Items Section */}
              <div className="border-2 border-teal-100 rounded-xl p-4 bg-teal-50/30">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Items / Services *</label>
                <div className="space-y-2 mb-3">
                  <div className="flex gap-2">
                    <select value={currentItem.type}
                      onChange={(e) => { setCurrentItem({ type: e.target.value, id: '', name: '', price: '', quantity: 1 }); setItemSearchTerm(''); setShowSuggestions(false) }}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm">
                      <option value="service">Service</option>
                      <option value="inventory">Medicine/Supply</option>
                    </select>
                    <div className="flex-1 relative">
                      <input type="text" value={itemSearchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder={`Search ${currentItem.type === 'service' ? 'service' : 'medicine/supply'}...`}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        autoComplete="off" />
                      {showSuggestions && getFilteredItems().length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {getFilteredItems().map(item => (
                            <div key={item.id} onClick={() => handleItemSelect(item)}
                              className="px-3 py-2 hover:bg-teal-50 cursor-pointer border-b border-slate-100 last:border-b-0">
                              <div className="font-semibold text-slate-900 text-sm">{item.name}</div>
                              <div className="text-xs text-slate-600">
                                {/suturing|burn care/i.test(item.name) ? 'Variable price — enter manually' : `₱${parseFloat(item.price).toLocaleString()}`}
                                {currentItem.type === 'inventory' && item.stock != null && ` (${item.stock} ${item.unit || ''} available)`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input type="number" placeholder="Qty" min="1" value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                      className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                    <button type="button" onClick={addItem} disabled={!currentItem.id}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed">
                      Add
                    </button>
                  </div>
                  {currentItem.id && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                      <span className="text-xs text-slate-600">Price (₱):</span>
                      <input type="number" min="0" step="0.01" value={currentItem.price}
                        onChange={(e) => setCurrentItem({ ...currentItem, price: e.target.value })}
                        className="w-28 px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                      <span className="text-xs text-slate-600">
                        × {currentItem.quantity} = ₱{(parseFloat(currentItem.price || 0) * parseInt(currentItem.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

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
                            <td className="py-2 px-3 text-slate-900">{item.name} <span className="text-xs text-slate-500">({item.type})</span></td>
                            <td className="py-2 px-3 text-center text-slate-700">{item.quantity}</td>
                            <td className="py-2 px-3 text-right text-slate-700">₱{item.price.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-900">₱{item.total.toLocaleString()}</td>
                            <td className="py-2 px-3 text-center">
                              <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1"><X size={16} /></button>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-300 bg-slate-50">
                          <td colSpan="3" className="py-2 px-3 font-semibold text-slate-700">SUBTOTAL</td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-900">
                            ₱{formData.items.reduce((s, i) => s + i.total, 0).toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                        {formData.discount_amount > 0 && (
                          <tr className="bg-green-50">
                            <td colSpan="3" className="py-2 px-3 text-sm text-green-700">
                              <span className="font-semibold">DISCOUNT</span>
                              <span className="ml-2 text-xs">({formData.discount_type} — {formData.discount_percentage}%)</span>
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-green-600">
                              -₱{parseFloat(formData.discount_amount).toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        )}
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

              {/* Amount Paid */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount Paid (₱)</label>
                <input type="number" min="0" step="0.01" value={formData.cash_tendered}
                  onChange={(e) => handleAmountPaidChange(e.target.value)}
                  placeholder="Enter amount paid (leave empty for full payment)"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <p className="text-xs text-slate-500 mt-1">Status auto-updates based on amount</p>
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
                  <p className="text-2xl font-bold text-blue-600">₱{parseFloat(formData.change_given).toLocaleString()}</p>
                </div>
              )}

              {/* Payment Method + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method *</label>
                  <select required value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
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

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3" placeholder="Additional notes..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              {/* Submit */}
              <div className="flex gap-3 mt-6">
                <button type="submit" disabled={formData.items.length === 0 || submitting}
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editingPayment ? 'Save Changes' : 'Create Payment'}
                </button>
                <button type="button" onClick={handleCancelBilling}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
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

              {viewingPayment.items && viewingPayment.items.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">Items & Services</p>
                  </div>
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
                          <td className="py-2 px-4 text-slate-900">{item.name} <span className="text-xs text-slate-500">({item.type})</span></td>
                          <td className="py-2 px-4 text-center text-slate-700">{item.quantity}</td>
                          <td className="py-2 px-4 text-right text-slate-700">₱{parseFloat(item.price).toLocaleString()}</td>
                          <td className="py-2 px-4 text-right font-semibold text-slate-900">
                            ₱{parseFloat(item.total ?? (item.price * (item.quantity || 1))).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">Payment Summary</p>
                </div>
                <div className="bg-white p-4 space-y-3">
                  {viewingPayment.discount_amount > 0 ? (
                    <>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">Subtotal</p>
                        <p className="text-lg font-bold text-slate-900">₱{(parseFloat(viewingPayment.total_amount) + parseFloat(viewingPayment.discount_amount)).toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-green-700">Discount ({viewingPayment.discount_type} — {viewingPayment.discount_percentage}%)</p>
                        <p className="text-sm font-semibold text-green-600">-₱{parseFloat(viewingPayment.discount_amount).toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                        <p className="text-sm font-semibold text-slate-700">Total to Pay</p>
                        <p className="text-lg font-bold text-slate-900">₱{parseFloat(viewingPayment.total_amount).toLocaleString()}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600">Total Amount</p>
                      <p className="text-lg font-bold text-slate-900">₱{viewingPayment.total_amount.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-600">Amount Paid</p>
                    <p className="text-lg font-bold text-green-600">₱{viewingPayment.amount_paid.toLocaleString()}</p>
                  </div>
                  {viewingPayment.remaining_balance > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t-2 border-amber-200">
                      <p className="text-sm font-semibold text-amber-900">Remaining Balance</p>
                      <p className="text-xl font-bold text-amber-600">₱{viewingPayment.remaining_balance.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-slate-600">Payment Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(viewingPayment.status)}`}>
                        {viewingPayment.status}
                      </span>
                    </div>
                    <div className={`mt-2 p-3 rounded-lg text-sm ${
                      viewingPayment.status === 'Paid' ? 'bg-green-50 text-green-800' :
                      viewingPayment.status === 'Partial' ? 'bg-blue-50 text-blue-800' :
                      viewingPayment.status === 'Pending' ? 'bg-yellow-50 text-yellow-800' :
                      viewingPayment.status === 'Refunded' ? 'bg-purple-50 text-purple-800' :
                      'bg-slate-50 text-slate-800'
                    }`}>
                      {viewingPayment.status === 'Paid' && '✓ Full payment received. No outstanding balance.'}
                      {viewingPayment.status === 'Partial' && `⚠ Partial payment. Balance of ₱${viewingPayment.remaining_balance.toLocaleString()} remaining.`}
                      {viewingPayment.status === 'Pending' && `⏳ No payment received. ₱${viewingPayment.total_amount.toLocaleString()} due.`}
                      {viewingPayment.status === 'Cancelled' && '✕ This payment has been cancelled.'}
                      {viewingPayment.status === 'Refunded' && '↩ This payment has been refunded.'}
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
                  <p className="text-sm text-slate-900 whitespace-pre-line">{viewingPayment.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button onClick={() => setViewingPayment(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                  <X size={20} /> Close
                </button>
                <button onClick={() => { setViewingPayment(null); handleEdit(viewingPayment) }}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
                  <Edit2 size={20} /> Edit
                </button>
                <button onClick={() => handleDownload(viewingPayment)}
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2">
                  <Download size={20} /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {profilePatient && (
        <PatientProfileModal
          patient={profilePatient}
          onClose={() => setProfilePatient(null)}
        />
      )}
    </div>
  )
}

export default Payments
