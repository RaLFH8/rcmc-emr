import { createClient } from '@supabase/supabase-js'
import { computeStatus } from '../utils/inventoryBatchUtils'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'rcmc-emr-auth-token',
  },
})

/**
 * Returns true if the doctor works on the given date based on their schedule.
 * When schedule is null/undefined, falls back to Mon–Fri (day index 1–5).
 * @param {Object|null} schedule - JSONB schedule object keyed by day-of-week string
 * @param {string} date - ISO date string "YYYY-MM-DD"
 */
export function isDoctorWorkingDay(schedule, date) {
  if (!date) return false
  const [y, m, d] = date.split('-').map(Number)
  const dayIndex = new Date(y, m - 1, d).getDay()
  if (!schedule) {
    // Fallback: Mon–Fri only
    return dayIndex >= 1 && dayIndex <= 5
  }
  return Object.prototype.hasOwnProperty.call(schedule, String(dayIndex))
}

// Database helper functions
export const db = {
  // ==================== PATIENTS ====================
  async getPatients(limit = 20, offset = 0, searchTerm = '', genderFilter = '', bloodTypeFilter = '') {
    let query = supabase
      .from('patients')
      .select(`
        *,
        appointments(appointment_date),
        consultations(consultation_date)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,patient_number.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%`)
    }
    if (genderFilter) {
      query = query.eq('gender', genderFilter)
    }
    if (bloodTypeFilter) {
      query = query.eq('blood_type', bloodTypeFilter)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) throw error

    // Compute last_visit client-side from joined appointment/consultation dates
    const patients = (data || []).map(p => {
      const apptDates = (p.appointments || []).map(a => a.appointment_date)
      const consultDates = (p.consultations || []).map(c => c.consultation_date?.split('T')[0])
      const allDates = [...apptDates, ...consultDates].filter(Boolean).sort().reverse()
      return { ...p, last_visit: allDates[0] || null }
    })

    return { data: patients, count: count || 0 }
  },

  async getPatientsForExport(searchTerm = '', genderFilter = '', bloodTypeFilter = '') {
    let query = supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,patient_number.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%`)
    }
    if (genderFilter) {
      query = query.eq('gender', genderFilter)
    }
    if (bloodTypeFilter) {
      query = query.eq('blood_type', bloodTypeFilter)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getPatientById(id) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async addPatient(patient) {
    // Generate patient number
    const patientNumber = await this.generatePatientNumber()
    
    // Handle medical_history - convert empty string to empty array for JSONB
    let medicalHistory = patient.medical_history
    if (typeof medicalHistory === 'string') {
      medicalHistory = medicalHistory.trim() === '' ? [] : [medicalHistory.trim()]
    } else if (!Array.isArray(medicalHistory)) {
      medicalHistory = []
    }
    
    // Handle allergies - convert empty string to empty array for TEXT[]
    let allergies = patient.allergies
    if (typeof allergies === 'string') {
      allergies = allergies.trim() === '' ? [] : [allergies.trim()]
    } else if (!Array.isArray(allergies)) {
      allergies = []
    }
    
    // Clean up numeric fields - convert empty strings to null
    const cleanedPatient = {
      ...patient,
      patient_number: patientNumber,
      medical_history: medicalHistory,
      allergies: allergies,
      height: patient.height === '' ? null : parseFloat(patient.height),
      weight: patient.weight === '' ? null : parseFloat(patient.weight),
      temperature: patient.temperature === '' ? null : parseFloat(patient.temperature),
      heart_rate: patient.heart_rate === '' ? null : parseInt(patient.heart_rate),
      respiratory_rate: patient.respiratory_rate === '' ? null : parseInt(patient.respiratory_rate),
      oxygen_saturation: patient.oxygen_saturation === '' ? null : parseInt(patient.oxygen_saturation)
    }
    
    const { data, error } = await supabase
      .from('patients')
      .insert([cleanedPatient])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updatePatient(id, updates) {
    // Handle medical_history - convert empty string to empty array for JSONB
    let medicalHistory = updates.medical_history
    if (typeof medicalHistory === 'string') {
      medicalHistory = medicalHistory.trim() === '' ? [] : [medicalHistory.trim()]
    } else if (!Array.isArray(medicalHistory)) {
      medicalHistory = []
    }
    
    // Handle allergies - convert empty string to empty array for TEXT[]
    let allergies = updates.allergies
    if (typeof allergies === 'string') {
      allergies = allergies.trim() === '' ? [] : [allergies.trim()]
    } else if (!Array.isArray(allergies)) {
      allergies = []
    }
    
    // Clean up numeric fields - convert empty strings to null
    const cleanedUpdates = {
      ...updates,
      medical_history: medicalHistory,
      allergies: allergies,
      height: updates.height === '' ? null : parseFloat(updates.height),
      weight: updates.weight === '' ? null : parseFloat(updates.weight),
      temperature: updates.temperature === '' ? null : parseFloat(updates.temperature),
      heart_rate: updates.heart_rate === '' ? null : parseInt(updates.heart_rate),
      respiratory_rate: updates.respiratory_rate === '' ? null : parseInt(updates.respiratory_rate),
      oxygen_saturation: updates.oxygen_saturation === '' ? null : parseInt(updates.oxygen_saturation)
    }
    
    const { data, error } = await supabase
      .from('patients')
      .update(cleanedUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deletePatient(id) {
    const { error} = await supabase
      .from('patients')
      .update({ status: 'Inactive' })
      .eq('id', id)
    
    if (error) throw error
  },

  async generatePatientNumber() {
    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
    return `P${String((count || 0) + 1).padStart(6, '0')}`
  },

  // ==================== DOCTORS ====================
  async getDoctors() {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, user_id, first_name, last_name, specialization, license_number, contact_number, email, schedule, consultation_fee, ptr_number, s2_number, status, satisfaction_score, total_reviews')
      .eq('status', 'Active')
      .order('satisfaction_score', { ascending: false, nullsLast: true })
      .order('last_name')
    
    if (error) throw error
    return data || []
  },

  // ==================== APPOINTMENTS ====================
  async getAppointments(date = null) {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        doctor:doctors(*)
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    if (date) {
      query = query.eq('appointment_date', date)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async addAppointment(appointment) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointment])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateAppointment(id, updates) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getAppointmentsByPatient(patientId) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(id, first_name, last_name, specialization)
      `)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getAppointmentById(id) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        doctor:doctors(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // ==================== CONSULTATIONS ====================
  async getConsultations(patientId = null) {
    let query = supabase
      .from('consultations')
      .select(`
        *,
        patient:patients(*),
        doctor:doctors(*)
      `)
      .order('consultation_date', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async addConsultation(consultation) {
    const { data, error } = await supabase
      .from('consultations')
      .insert([consultation])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateConsultation(id, updates) {
    const { data, error } = await supabase
      .from('consultations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ==================== STATISTICS ====================
  async getStats() {
    const today = new Date().toISOString().split('T')[0]
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    // Total patients
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')

    // Total doctors
    const { count: totalDoctors } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')

    // Monthly appointments
    const { count: monthlyAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', firstDayOfMonth)

    // Today's appointments
    const { count: todayAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today)

    return {
      totalPatients: totalPatients || 0,
      totalDoctors: totalDoctors || 0,
      monthlyAppointments: monthlyAppointments || 0,
      todayAppointments: todayAppointments || 0
    }
  },

  // Returns the count of distinct patients seen by a specific doctor
  // (via appointments OR consultations). Uses a Set to deduplicate.
  async getDoctorPatientCount(doctorId) {
    try {
      const [apptResult, consultResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('patient_id')
          .eq('doctor_id', doctorId),
        supabase
          .from('consultations')
          .select('patient_id')
          .eq('doctor_id', doctorId)
      ])

      const patientIds = new Set()
      ;(apptResult.data || []).forEach(r => r.patient_id && patientIds.add(r.patient_id))
      ;(consultResult.data || []).forEach(r => r.patient_id && patientIds.add(r.patient_id))

      return patientIds.size
    } catch {
      return 0
    }
  },

  async getPatientStats(months = 6) {
    const { data, error } = await supabase
      .from('patients')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at')

    if (error) throw error
    return data || []
  },

  // ==================== DASHBOARD ANALYTICS ====================
  async getPatientGrowthData(months = 6) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    
    const { data, error } = await supabase
      .from('patients')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at')
    
    if (error) throw error
    
    // Group by month
    const monthlyData = {}
    data.forEach(patient => {
      const date = new Date(patient.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
    })
    
    return monthlyData
  },

  async getAppointmentsByDate(days = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_date')
      .gte('appointment_date', startDate.toISOString().split('T')[0])
      .order('appointment_date')
    
    if (error) throw error
    
    // Group by date
    const dailyData = {}
    data.forEach(apt => {
      dailyData[apt.appointment_date] = (dailyData[apt.appointment_date] || 0) + 1
    })
    
    return dailyData
  },

  async getTodayAppointments() {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        doctor:doctors(*)
      `)
      .eq('appointment_date', today)
      .order('appointment_time')
    
    if (error) throw error
    return data || []
  },

  // ==================== REVENUE & BILLING ====================
  async getRevenueStats() {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    // Get total revenue from billing — sum amount_paid (not total_amount) to exclude unpaid balances
    const { data: billingData, error } = await supabase
      .from('billing')
      .select('amount_paid, payment_status, created_at')
      .not('payment_status', 'eq', 'Cancelled')
      .gte('created_at', firstDayOfMonth)

    if (error) throw error

    const totalRevenue = billingData.reduce((sum, bill) => sum + (parseFloat(bill.amount_paid) || 0), 0)

    return {
      totalRevenue,
      transactionCount: billingData.length,
      averageTransaction: billingData.length > 0 ? totalRevenue / billingData.length : 0
    }
  },

  async getMonthlyRevenueTrend(months = 7) {
    const { data, error } = await supabase
      .from('billing')
      .select('items, payment_status, created_at')
      .eq('payment_status', 'Paid')
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by month and calculate actual revenue by category
    const monthlyData = {}
    data.forEach(bill => {
      const date = new Date(bill.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthName, services: 0, medicines: 0, rooms: 0 }
      }
      
      // Calculate actual revenue by category from billing items
      const items = bill.items || []
      items.forEach(item => {
        const amount = parseFloat(item.amount || item.price || 0)
        const itemType = (item.type || item.category || '').toLowerCase()
        
        if (itemType.includes('room') || itemType.includes('bed')) {
          monthlyData[monthKey].rooms += amount
        } else if (itemType.includes('medicine') || itemType.includes('medication') || itemType.includes('drug')) {
          monthlyData[monthKey].medicines += amount
        } else {
          // Default to services for everything else
          monthlyData[monthKey].services += amount
        }
      })
    })

    return Object.values(monthlyData).slice(-months)
  },

  async getRevenueByCategory() {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('billing')
      .select('items, payment_status')
      .eq('payment_status', 'Paid')
      .gte('created_at', firstDayOfMonth)

    if (error) throw error

    // Calculate actual revenue by category from billing items
    let servicesRevenue = 0
    let medicinesRevenue = 0
    let roomsRevenue = 0

    data.forEach(bill => {
      const items = bill.items || []
      items.forEach(item => {
        const amount = parseFloat(item.amount || item.price || 0)
        const itemType = (item.type || item.category || '').toLowerCase()
        
        if (itemType.includes('room') || itemType.includes('bed')) {
          roomsRevenue += amount
        } else if (itemType.includes('medicine') || itemType.includes('medication') || itemType.includes('drug')) {
          medicinesRevenue += amount
        } else {
          // Default to services for everything else (consultations, procedures, etc.)
          servicesRevenue += amount
        }
      })
    })

    return [
      { name: 'Services', value: Math.round(servicesRevenue), color: '#14b8a6' },
      { name: 'Medicines', value: Math.round(medicinesRevenue), color: '#8b5cf6' },
      { name: 'Rooms', value: Math.round(roomsRevenue), color: '#f59e0b' }
    ]
  },

  // ==================== ROOM AVAILABILITY ====================
  async getRoomAvailability() {
    const { data, error } = await supabase
      .from('rooms')
      .select('status')
    
    if (error) {
      console.error('Error fetching rooms:', error)
      return { available: 0, total: 0 }
    }

    const total = data?.length || 0
    const available = data?.filter(room => room.status === 'Available').length || 0
    
    return { available, total }
  },

  // ==================== PATIENT STATISTICS ====================
  async getPatientStatistics() {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthStr = lastMonth.toISOString()

    const { data, error } = await supabase
      .from('patients')
      .select('created_at')
      .gte('created_at', lastMonthStr)
      .eq('status', 'Active')
    
    if (error) {
      console.error('Error fetching patient statistics:', error)
      return 0
    }

    return data?.length || 0
  },

  // ==================== TOP SERVICES ====================
  async getTopServices(limit = 5) {
    // Get billing data with items
    const { data, error } = await supabase
      .from('billing')
      .select('items, created_at')
      .eq('payment_status', 'Paid')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    if (error) {
      console.error('Error fetching top services:', error)
      return []
    }

    // Aggregate services from billing items
    const serviceStats = {}
    data.forEach(bill => {
      const items = bill.items || []
      items.forEach(item => {
        if (item.type === 'service' || !item.type) {
          const name = item.name || item.description || 'Unknown Service'
          if (!serviceStats[name]) {
            serviceStats[name] = { name, sales: 0, count: 0 }
          }
          serviceStats[name].sales += parseFloat(item.amount || item.price || 0)
          serviceStats[name].count += parseInt(item.quantity || 1)
        }
      })
    })

    // Convert to array and sort by sales
    return Object.values(serviceStats)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit)
  },

  // ==================== TOP MEDICINES ====================
  async getTopMedicines(limit = 5) {
    // Get from inventory or billing
    const { data, error } = await supabase
      .from('billing')
      .select('items, created_at')
      .eq('payment_status', 'Paid')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    if (error) {
      console.error('Error fetching top medicines:', error)
      return []
    }

    // Aggregate medicines from billing items
    const medicineStats = {}
    data.forEach(bill => {
      const items = bill.items || []
      items.forEach(item => {
        if (item.type === 'medicine' || item.category === 'Medicine') {
          const name = item.name || item.description || 'Unknown Medicine'
          if (!medicineStats[name]) {
            medicineStats[name] = { name, sales: 0, count: 0 }
          }
          medicineStats[name].sales += parseFloat(item.amount || item.price || 0)
          medicineStats[name].count += parseInt(item.quantity || 1)
        }
      })
    })

    // Convert to array and sort by sales
    return Object.values(medicineStats)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit)
  },

  // ==================== PRESCRIPTIONS ====================
  async getPrescriptions() {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching prescriptions:', error)
      return []
    }
    
    // Fetch related data separately to avoid join issues
    if (data && data.length > 0) {
      const patientIds = [...new Set(data.map(p => p.patient_id))]
      const doctorIds = [...new Set(data.map(p => p.doctor_id))]
      
      const { data: patients } = await supabase
        .from('patients')
        .select('id, first_name, last_name, date_of_birth, gender, age')
        .in('id', patientIds)
      
      const { data: doctors } = await supabase
        .from('doctors')
        .select('id, first_name, last_name, license_number, ptr_number, s2_number')
        .in('id', doctorIds)
      
      // Map patients and doctors to prescriptions
      return data.map(prescription => ({
        ...prescription,
        patient: patients?.find(p => p.id === prescription.patient_id),
        doctor: doctors?.find(d => d.id === prescription.doctor_id)
      }))
    }
    
    return data || []
  },

  async addPrescription(prescription) {
    const { data, error } = await supabase
      .from('prescriptions')
      .insert([{
        patient_id: prescription.patient_id,
        doctor_id: prescription.doctor_id,
        prescription_date: prescription.prescription_date,
        medications: prescription.medications,
        instructions: prescription.instructions || '',
        status: prescription.status || 'Active'
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updatePrescription(id, updates) {
    const { data, error } = await supabase
      .from('prescriptions')
      .update({
        patient_id: updates.patient_id,
        doctor_id: updates.doctor_id,
        prescription_date: updates.prescription_date,
        medications: updates.medications,
        instructions: updates.instructions,
        status: updates.status
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deletePrescription(id) {
    const { error } = await supabase
      .from('prescriptions')
      .update({ status: 'Cancelled' })
      .eq('id', id)
    
    if (error) throw error
  },

  // ==================== ROOMS ====================
  async getRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number')
    
    if (error) throw error
    return data || []
  },

  async addRoom(room) {
    const { data, error } = await supabase
      .from('rooms')
      .insert([room])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateRoom(id, updates) {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteRoom(id) {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // ==================== SERVICES ====================
  async getServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'Active')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async addService(service) {
    const { data, error } = await supabase
      .from('services')
      .insert([service])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateService(id, updates) {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteService(id) {
    const { error } = await supabase
      .from('services')
      .update({ status: 'Inactive' })
      .eq('id', id)
    
    if (error) throw error
  },

  async getServicesByCodePrefix(prefix) {
    const { data, error } = await supabase
      .from('services')
      .select('code')
      .like('code', `${prefix}%`)
      .order('code', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getServiceByCode(code) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('code', code)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return data
  },

  // ==================== INPATIENTS ====================
  async getInpatients() {
    const { data, error } = await supabase
      .from('inpatients')
      .select(`
        *,
        patient:patients(id, first_name, last_name, patient_number),
        doctor:doctors(id, first_name, last_name),
        room:rooms(room_number, room_type)
      `)
      .is('discharge_date', null)
      .order('admission_date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getInpatientsByPatient(patientId) {
    const { data, error } = await supabase
      .from('inpatients')
      .select(`
        *,
        doctor:doctors(id, first_name, last_name),
        room:rooms(room_number, room_type)
      `)
      .eq('patient_id', patientId)
      .order('admission_date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async addInpatient(inpatient) {
    const { data, error } = await supabase
      .from('inpatients')
      .insert([inpatient])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateInpatient(id, updates) {
    const { data, error } = await supabase
      .from('inpatients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async dischargeInpatient(id, dischargeDate) {
    const { data, error } = await supabase
      .from('inpatients')
      .update({ discharge_date: dischargeDate })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ==================== INVENTORY ====================
  async getInventory() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async addInventoryItem(item) {
    const { data, error } = await supabase
      .from('inventory')
      .insert([item])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateInventoryItem(id, updates) {
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteInventoryItem(id) {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async deductStock(id, quantity) {
    // Get current stock
    const { data: item, error: fetchError } = await supabase
      .from('inventory')
      .select('stock, reorder_level, expiration_date')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError

    const newStock = Math.max(0, item.stock - quantity)
    const status = computeStatus(newStock, item.reorder_level, item.expiration_date)

    const { data, error } = await supabase
      .from('inventory')
      .update({ stock: newStock, status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async addStock(id, quantity) {
    // Get current stock
    const { data: item, error: fetchError } = await supabase
      .from('inventory')
      .select('stock, reorder_level, expiration_date')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError

    const newStock = item.stock + quantity
    const status = computeStatus(newStock, item.reorder_level, item.expiration_date)

    const { data, error } = await supabase
      .from('inventory')
      .update({ stock: newStock, status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getInventorySummary() {
    const { data, error } = await supabase
      .from('inventory_summary')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async getExpiringInventory() {
    const { data, error } = await supabase
      .from('expiring_inventory')
      .select('*')
      .order('days_until_expiry')
    if (error) throw error
    return data || []
  },

  async getExpiredInventory() {
    const { data, error } = await supabase
      .from('expired_inventory')
      .select('*')
      .order('expiration_date')
    if (error) throw error
    return data || []
  },

  // ==================== BILLING/PAYMENTS ====================
  async getBilling(limit = 100, offset = 0, searchTerm = '', statusFilter = 'All', dateFrom = '', dateTo = '') {
    let query = supabase
      .from('billing')
      .select(`
        *,
        patient:patients(id, first_name, last_name, patient_number)
      `)
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.or(`patient_name.ilike.%${searchTerm}%,invoice_number.ilike.%${searchTerm}%`)
    }

    if (statusFilter !== 'All') {
      query = query.eq('payment_status', statusFilter)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59')
    }

    const { data, error } = await query.range(offset, offset + limit - 1)
    
    if (error) throw error
    return data || []
  },

  async getBillingById(id) {
    const { data, error } = await supabase
      .from('billing')
      .select(`
        *,
        patient:patients(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getBillingByPatient(patientId) {
    const { data, error } = await supabase
      .from('billing')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async addBilling(billing) {
    // Generate acknowledgment receipt number
    const receiptNumber = await this.generateReceiptNumber()
    
    const billingData = {
      ...billing,
      invoice_number: receiptNumber,  // Database column still named invoice_number
      created_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('billing')
      .insert([billingData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateBilling(id, updates) {
    const { data, error } = await supabase
      .from('billing')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteBilling(id) {
    const { error } = await supabase
      .from('billing')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async generateReceiptNumber() {
    const { count } = await supabase
      .from('billing')
      .select('*', { count: 'exact', head: true })
    
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `AR-${year}${month}-${String((count || 0) + 1).padStart(4, '0')}`
  },

  // ==================== ONLINE BOOKING ====================
  async getAvailableTimeSlots(doctorId, date, schedule) {
    // Determine working hours from schedule
    // Parse date parts directly to avoid timezone/DST off-by-one issues
    const [y, m, d] = date.split('-').map(Number)
    const dayIndexNum = new Date(y, m - 1, d).getDay()
    const dayIndex = String(dayIndexNum)
    // Defensive: if schedule came back as a JSON string (TEXT column), parse it
    const parsedSchedule = typeof schedule === 'string' ? (() => { try { return JSON.parse(schedule) } catch { return null } })() : schedule

    console.log('[TimeSlots] doctorId:', doctorId, 'date:', date, 'dayIndex:', dayIndex)
    console.log('[TimeSlots] raw schedule:', schedule)
    console.log('[TimeSlots] parsedSchedule:', parsedSchedule)

    // If schedule is null, fetch it fresh from DB (in case caller passed stale/null value)
    let effectiveSchedule = parsedSchedule
    if (!effectiveSchedule) {
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('schedule')
        .eq('id', doctorId)
        .single()
      if (doctorData?.schedule) {
        effectiveSchedule = typeof doctorData.schedule === 'string'
          ? (() => { try { return JSON.parse(doctorData.schedule) } catch { return null } })()
          : doctorData.schedule
        console.log('[TimeSlots] fetched schedule from DB:', effectiveSchedule)
      }
    }

    const daySchedule = effectiveSchedule?.[dayIndex]
    console.log('[TimeSlots] daySchedule for day', dayIndex, ':', daySchedule)

    // If no schedule set, fall back to Mon–Fri 8–17
    let start, end
    if (!daySchedule) {
      // Schedule exists but this day is not a working day (or no schedule at all)
      console.log('[TimeSlots] No schedule for this day, returning empty')
      return []
    } else {
      start = daySchedule.start ?? daySchedule.startTime ?? daySchedule.from
      end = daySchedule.end ?? daySchedule.endTime ?? daySchedule.to
      if (start == null || end == null) return []
      start = Number(start)
      end = Number(end)
    }

    // Get existing appointments for this doctor and date
    const { data: appointments, error} = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .neq('status', 'Cancelled')

    if (error) throw error

    // Normalize to HH:MM — DB may store as HH:MM:SS
    const bookedTimes = appointments.map(a =>
      a.appointment_time ? a.appointment_time.substring(0, 5) : ''
    )
    
    // Check if selected date is today
    const today = new Date().toISOString().split('T')[0]
    const isToday = date === today
    
    // Get current time in minutes for comparison
    const now = new Date()
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes()

    // Generate 20-min slots within [start, end) working hours
    const slots = []
    for (let hour = start; hour < end; hour++) {
      for (const minute of [0, 20, 40]) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        const slotTimeInMinutes = hour * 60 + minute
        const isPast = isToday && (slotTimeInMinutes + 20 <= currentTimeInMinutes)
        const isAvailable = !bookedTimes.includes(timeStr) && !isPast
        slots.push({
          slot: this.formatTime12Hour(timeStr),
          time: timeStr,
          is_available: isAvailable
        })
      }
    }

    return slots
  },

  formatTime12Hour(time24) {
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  },

  async checkSlotAvailability(doctorId, date, time) {
    // Check for existing appointments (excluding cancelled/no-show/rejected)
    const { data, error } = await supabase
      .from('appointments')
      .select('id, status, booking_status')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .eq('appointment_time', time)

    if (error) throw error
    
    // Slot is available if:
    // 1. No appointments exist, OR
    // 2. All existing appointments are cancelled, no-show, or rejected
    if (!data || data.length === 0) return true
    
    const activeAppointments = data.filter(apt => {
      const isCancelled = apt.status === 'Cancelled' || apt.status === 'No Show'
      const isRejected = apt.booking_status === 'rejected'
      return !isCancelled && !isRejected
    })
    
    return activeAppointments.length === 0
  },

  async createOnlineBooking(bookingData) {
    // COMPREHENSIVE CACHE WORKAROUND: Accept ALL possible field name variations
    // The cached code might be sending any of these combinations
    const contactNumber = bookingData.patient_contact || bookingData.phone || bookingData.contact_number || bookingData.contact;
    const emailAddress = bookingData.patient_email || bookingData.email;
    
    try {
      // STEP 1: Validate required booking data
      const doctorId = bookingData.doctor_id;
      const appointmentDate = bookingData.appointment_date || bookingData.date;
      const appointmentTime = bookingData.appointment_time || bookingData.time;
      
      if (!doctorId || !appointmentDate || !appointmentTime) {
        throw new Error('Missing required appointment information (doctor, date, or time)')
      }

      if (!contactNumber) {
        throw new Error('Patient contact number is required')
      }

      // STEP 2: Check if slot is still available
      const isAvailable = await this.checkSlotAvailability(
        doctorId,
        appointmentDate,
        appointmentTime
      )

      if (!isAvailable) {
        throw new Error('This time slot is no longer available')
      }

      // STEP 3: Find or create patient
      let patientId = bookingData.patient_id; // Check if patient_id was provided (existing patient)
      let patientRecord = null;

      if (patientId) {
        // Existing patient - fetch their record
        const { data: existingPatient, error: fetchError } = await supabase
          .from('patients')
          .select('id, patient_number, first_name, last_name, email, contact_number')
          .eq('id', patientId)
          .single()

        if (fetchError) {
          throw new Error(`Failed to fetch patient record: ${fetchError.message}`)
        }

        patientRecord = existingPatient
      } else {
        // No patient_id provided - try to find existing patient by contact number OR email
        const { data: existingPatients, error: searchError } = await supabase
          .from('patients')
          .select('id, patient_number, first_name, last_name, email, contact_number')
          .or(`contact_number.eq.${contactNumber},email.eq.${emailAddress || 'none'}`)
          .limit(1)

        if (searchError) {
          throw new Error(`Patient lookup failed: ${searchError.message}`)
        }

        if (existingPatients && existingPatients.length > 0) {
          // Patient found
          patientRecord = existingPatients[0]
          patientId = patientRecord.id
        } else {
          // Patient not found - create new patient
          // COMPREHENSIVE CACHE WORKAROUND: Accept ALL possible field name variations
          const firstName = bookingData.patient_first_name || bookingData.firstName || bookingData.first_name;
          const lastName = bookingData.patient_last_name || bookingData.lastName || bookingData.last_name;
          const dateOfBirth = bookingData.patient_dob || bookingData.dateOfBirth || bookingData.date_of_birth;
          const gender = bookingData.patient_gender || bookingData.gender;
          const address = bookingData.patient_address || bookingData.address;
          
          // Validate required fields for new patient
          const requiredFields = {
            patient_first_name: firstName,
            patient_last_name: lastName,
            patient_dob: dateOfBirth,
            patient_gender: gender,
            patient_contact: contactNumber,
            patient_address: address
          }

          const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value)
            .map(([key]) => key)

          if (missingFields.length > 0) {
            throw new Error(`Missing required patient information: ${missingFields.join(', ')}`)
          }

          // Generate patient number
          const patientNumber = await this.generatePatientNumber()

          // Prepare patient data with all required fields
          const newPatientData = {
            patient_number: patientNumber,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            date_of_birth: dateOfBirth,
            gender: gender,
            contact_number: contactNumber.trim(),
            email: emailAddress?.trim() || null,
            address: address?.trim() || 'Not provided',
            // For online bookings, use contact as emergency contact if not provided
            emergency_contact_name: bookingData.emergency_contact_name?.trim() || 'To be updated',
            emergency_contact_number: bookingData.emergency_contact_number?.trim() || contactNumber.trim(),
            status: 'Active',
            medical_history: 'Online booking - history to be collected during visit',
            allergies: [],
            blood_type: null
          }

          // Insert new patient
          const { data: newPatient, error: patientError } = await supabase
            .from('patients')
            .insert([newPatientData])
            .select('id, patient_number, first_name, last_name')
            .single()

          if (patientError) {
            throw new Error(`Failed to create patient record: ${patientError.message}`)
          }

          if (!newPatient || !newPatient.id) {
            throw new Error('Patient record created but ID not returned')
          }

          patientRecord = newPatient
          patientId = newPatient.id
        }
      }

      // STEP 4: Verify we have a valid patient ID
      if (!patientId) {
        throw new Error('Failed to obtain patient ID')
      }

      // STEP 5: Create appointment
      const appointmentData = {
        patient_id: patientId,
        doctor_id: bookingData.doctor_id,
        appointment_date: bookingData.appointment_date,
        appointment_time: bookingData.appointment_time,
        reason: bookingData.reason?.trim() || 'Online Booking',
        status: 'Scheduled',
        booking_source: 'online',
        booking_status: 'pending'
      }

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single()

      if (appointmentError) {
        throw new Error(`Failed to create appointment: ${appointmentError.message}`)
      }

      // STEP 6: Send notifications (email and SMS)
      try {
        // Import notification service dynamically
        const { sendAppointmentConfirmation } = await import('../utils/appointmentNotifications')
        
        // Send confirmation notification
        await sendAppointmentConfirmation({
          appointmentId: appointment.id,
          patientId: patientId,
          doctorId: bookingData.doctor_id,
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time,
          patientEmail: emailAddress,
          patientPhone: contactNumber,
          patientName: `${patientRecord.first_name} ${patientRecord.last_name}`
        })
      } catch (notificationError) {
        // Don't fail the booking if notifications fail
        console.error('Failed to send notifications (booking still successful):', notificationError)
      }

      return {
        success: true,
        appointment: appointment,
        patient: patientRecord,
        message: 'Booking created successfully'
      }

    } catch (error) {
      throw error
    }
  }
,

  async getOnlineBookings(status = 'pending') {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        doctor:doctors(*)
      `)
      .eq('booking_source', 'online')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    if (status !== 'all') {
      query = query.eq('booking_status', status)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async updateBookingStatus(appointmentId, status) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ 
        booking_status: status,
        status: status === 'confirmed' ? 'Scheduled' : 'Cancelled'
      })
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getActiveDoctors() {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, first_name, last_name, specialization, license_number, schedule')
      .eq('status', 'Active')
      .order('last_name')
    
    if (error) throw error
    return data || []
  },

  async verifyPatientByPhoneAndDOB(phone, dateOfBirth) {
    const { data, error } = await supabase
      .from('patients')
      .select('id, patient_number, first_name, last_name, date_of_birth, gender, contact_number, email, address')
      .eq('contact_number', phone)
      .eq('date_of_irth', dateOfBirth)
      .eq('status', 'Active')
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - patient not found
        return null
      }
      throw error
    }
    
    return data
  },

  // ==================== DOCTOR PERFORMANCE METRICS ====================
  async getDoctorPerformanceMetrics(doctorId) {
    // Get consultations for this doctor
    const { data, error } = await supabase
      .from('consultations')
      .select('consultation_duration_minutes, patient_rating')
      .eq('doctor_id', doctorId)
      .not('consultation_duration_minutes', 'is', null)
      .not('patient_rating', 'is', null)
    
    if (error) {
      console.error('Error fetching doctor performance:', error)
      return { avgConsultTime: null, avgRating: null }
    }

    if (!data || data.length === 0) {
      return { avgConsultTime: null, avgRating: null }
    }

    // Calculate averages
    const totalDuration = data.reduce((sum, c) => sum + (c.consultation_duration_minutes || 0), 0)
    const totalRating = data.reduce((sum, c) => sum + (c.patient_rating || 0), 0)
    
    const avgDuration = Math.round(totalDuration / data.length)
    const avgRating = (totalRating / data.length).toFixed(1)

    return {
      avgConsultTime: avgDuration > 0 ? `${avgDuration} min` : null,
      avgRating: parseFloat(avgRating)
    }
  },

  async getAllDoctorsPerformanceMetrics() {
    // Get all completed appointments with timestamps and ratings
    const { data, error } = await supabase
      .from('appointments')
      .select('doctor_id, started_at, completed_at, patient_rating')
      .eq('status', 'Completed')
      .not('started_at', 'is', null)
      .not('completed_at', 'is', null)
    
    if (error) {
      console.error('Error fetching all doctors performance:', error)
      return {}
    }

    if (!data || data.length === 0) {
      return {}
    }

    // Group by doctor_id and calculate averages
    const doctorMetrics = {}
    
    data.forEach(appointment => {
      const doctorId = appointment.doctor_id
      
      if (!doctorMetrics[doctorId]) {
        doctorMetrics[doctorId] = {
          durations: [],
          ratings: []
        }
      }
      
      // Calculate duration in minutes from timestamps
      if (appointment.started_at && appointment.completed_at) {
        const startTime = new Date(appointment.started_at)
        const endTime = new Date(appointment.completed_at)
        const durationMinutes = Math.round((endTime - startTime) / (1000 * 60))
        
        // Only include positive durations (sanity check)
        if (durationMinutes > 0) {
          doctorMetrics[doctorId].durations.push(durationMinutes)
        }
      }
      
      if (appointment.patient_rating) {
        doctorMetrics[doctorId].ratings.push(appointment.patient_rating)
      }
    })

    // Calculate averages for each doctor
    const result = {}
    Object.keys(doctorMetrics).forEach(doctorId => {
      const metrics = doctorMetrics[doctorId]
      
      const avgDuration = metrics.durations.length > 0
        ? Math.round(metrics.durations.reduce((a, b) => a + b, 0) / metrics.durations.length)
        : null
      
      const avgRating = metrics.ratings.length > 0
        ? parseFloat((metrics.ratings.reduce((a, b) => a + b, 0) / metrics.ratings.length).toFixed(1))
        : null
      
      result[doctorId] = {
        avgConsultTime: avgDuration ? `${avgDuration} min` : null,
        avgRating: avgRating
      }
    })

    return result
  },

  // ==================== SATISFACTION SURVEYS ====================
  async submitSurvey(surveyData) {
    try {
      const { data, error } = await supabase
        .from('satisfaction_ratings')
        .insert([{
          doctor_id: surveyData.doctorId,
          overall_care_rating: surveyData.overallCareRating,
          listening_rating: surveyData.listeningRating,
          explanation_rating: surveyData.explanationRating,
          respect_rating: surveyData.respectRating,
          recommendation_rating: surveyData.recommendationRating,
          comments: surveyData.comments?.trim() || null,
          submitter_fingerprint: surveyData.fingerprint,
          submitter_ip: surveyData.ipAddress
        }])
        .select()
        .single()
      
      if (error) throw error
      
      // Analyze sentiment if comments provided
      if (surveyData.comments?.trim()) {
        await this.analyzeSentiment(data.id, surveyData.comments)
      }
      
      return data
    } catch (error) {
      console.error('Survey submission error:', error)
      throw error
    }
  },
  
  async analyzeSentiment(ratingId, commentText) {
    try {
      const { data, error } = await supabase
        .rpc('analyze_sentiment', { comment_text: commentText })
      
      if (error) {
        console.error('Sentiment analysis error:', error)
        return
      }
      
      // Update rating with sentiment
      await supabase
        .from('satisfaction_ratings')
        .update({
          sentiment_score: data[0].score,
          sentiment_classification: data[0].classification
        })
        .eq('id', ratingId)
    } catch (error) {
      console.error('Sentiment analysis failed:', error)
      // Don't throw - sentiment analysis is optional
    }
  },
  
  async getDoctorFeedback(doctorId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('satisfaction_ratings')
        .select('professionalism_rating, waiting_time_rating, cleanliness_rating, comments, sentiment_classification, submission_timestamp')
        .eq('doctor_id', doctorId)
        .order('submission_timestamp', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get doctor feedback error:', error)
      throw error
    }
  },
  
  async exportSurveyResponses(doctorId = null) {
    try {
      let query = supabase
        .from('satisfaction_ratings')
        .select(`
          *,
          doctor:doctors(first_name, last_name)
        `)
        .order('submission_timestamp', { ascending: false })
      
      if (doctorId) {
        query = query.eq('doctor_id', doctorId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Export survey responses error:', error)
      throw error
    }
  },

  // ==================== DOCTOR ORDERS ====================
  
  /**
   * Validate status transition for orders
   * Enforces: pending → in_progress → completed
   * Allows: pending → cancelled, in_progress → cancelled
   * Prevents: completed → any, cancelled → any
   */
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'pending': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // No transitions allowed from completed
      'cancelled': []  // No transitions allowed from cancelled
    }

    if (!validTransitions[currentStatus]) {
      throw new Error(`Invalid current status: ${currentStatus}`)
    }

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(
        `Invalid status transition: Cannot change from ${currentStatus} to ${newStatus}`
      )
    }

    return true
  },

  /**
   * Create orders in batch
   * @param {Array} orders - Array of order objects
   * @returns {Promise<Array>} Created orders
   */
  async createOrders(orders) {
    try {
      if (!Array.isArray(orders) || orders.length === 0) {
        throw new Error('Orders must be a non-empty array')
      }

      // Validate and prepare orders
      const preparedOrders = orders.map(order => {
        if (!order.patient_id) {
          throw new Error('patient_id is required for each order')
        }
        if (!order.order_type) {
          throw new Error('order_type is required for each order')
        }
        if (!order.order_details) {
          throw new Error('order_details is required for each order')
        }
        if (!order.created_by) {
          throw new Error('created_by is required for each order')
        }

        return {
          appointment_id: order.appointment_id || null,
          patient_id: order.patient_id,
          order_type: order.order_type,
          order_details: order.order_details,
          status: order.status || 'pending',
          priority: order.priority || 'routine',
          created_by: order.created_by,
          notes: order.notes || null
        }
      })

      const { data, error } = await supabase
        .from('doctor_orders')
        .insert(preparedOrders)
        .select()

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Create orders error:', error)
      throw error
    }
  },

  /**
   * Get orders for a specific patient with optional filters
   * @param {string} patientId - Patient UUID
   * @param {Object} filters - Optional filters (status, type, priority, dateRange)
   * @returns {Promise<Array>} Orders
   */
  async getOrdersByPatient(patientId, filters = {}) {
    try {
      let query = supabase
        .from('doctor_orders')
        .select(`
          *,
          patient:patients(id, first_name, last_name, patient_number),
          created_by_user:user_profiles(id, first_name, last_name),
          appointment:appointments(id, appointment_date, appointment_time)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }

      // Apply order type filter
      if (filters.type) {
        if (Array.isArray(filters.type)) {
          query = query.in('order_type', filters.type)
        } else {
          query = query.eq('order_type', filters.type)
        }
      }

      // Apply priority filter
      if (filters.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority)
        } else {
          query = query.eq('priority', filters.priority)
        }
      }

      // Apply date range filter
      if (filters.dateRange) {
        if (filters.dateRange.start) {
          query = query.gte('created_at', filters.dateRange.start)
        }
        if (filters.dateRange.end) {
          query = query.lte('created_at', filters.dateRange.end)
        }
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get orders by patient error:', error)
      throw error
    }
  },

  /**
   * Get orders for a specific appointment
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise<Array>} Orders
   */
  async getOrdersByAppointment(appointmentId) {
    try {
      const { data, error } = await supabase
        .from('doctor_orders')
        .select(`
          *,
          patient:patients(id, first_name, last_name, patient_number),
          created_by_user:user_profiles(id, first_name, last_name)
        `)
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get orders by appointment error:', error)
      throw error
    }
  },

  /**
   * Get all orders with optional filters and pagination
   * @param {Object} filters - Optional filters (status, type, priority, dateRange, limit, offset)
   * @returns {Promise<Array>} Orders
   */
  async getAllOrders(filters = {}) {
    try {
      const limit = filters.limit || 100
      const offset = filters.offset || 0

      let query = supabase
        .from('doctor_orders')
        .select(`
          *,
          patient:patients(id, first_name, last_name, patient_number),
          created_by_user:user_profiles!created_by(id, full_name),
          completed_by_user:user_profiles!completed_by(id, full_name),
          cancelled_by_user:user_profiles!cancelled_by(id, full_name),
          appointment:appointments(id, appointment_date, appointment_time)
        `)
        .order('priority', { ascending: true }) // stat first (alphabetically)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }

      // Apply order type filter
      if (filters.type) {
        if (Array.isArray(filters.type)) {
          query = query.in('order_type', filters.type)
        } else {
          query = query.eq('order_type', filters.type)
        }
      }

      // Apply priority filter
      if (filters.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority)
        } else {
          query = query.eq('priority', filters.priority)
        }
      }

      // Apply date range filter
      if (filters.dateRange) {
        if (filters.dateRange.start) {
          query = query.gte('created_at', filters.dateRange.start)
        }
        if (filters.dateRange.end) {
          query = query.lte('created_at', filters.dateRange.end)
        }
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get all orders error:', error)
      throw error
    }
  },

  /**
   * Update order status with validation and audit trail
   * @param {string} orderId - Order UUID
   * @param {string} status - New status
   * @param {string} userId - User making the change
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status, userId) {
    try {
      if (!orderId || !status || !userId) {
        throw new Error('orderId, status, and userId are required')
      }

      // Get current order to validate transition
      const { data: currentOrder, error: fetchError } = await supabase
        .from('doctor_orders')
        .select('status')
        .eq('id', orderId)
        .single()

      if (fetchError) throw fetchError
      if (!currentOrder) {
        throw new Error('Order not found')
      }

      // Validate status transition
      this.validateStatusTransition(currentOrder.status, status)

      // Prepare update data
      const updateData = { status }

      // Record completion or cancellation details
      if (status === 'completed') {
        updateData.completed_by = userId
        updateData.completed_at = new Date().toISOString()
      } else if (status === 'cancelled') {
        updateData.cancelled_by = userId
        updateData.cancelled_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('doctor_orders')
        .update(updateData)
        .eq('id', orderId)
        .select(`
          *,
          patient:patients(id, first_name, last_name, patient_number),
          created_by_user:user_profiles!created_by(id, full_name),
          completed_by_user:user_profiles!completed_by(id, full_name),
          cancelled_by_user:user_profiles!cancelled_by(id, full_name),
          appointment:appointments(id, appointment_date, appointment_time)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Update order status error:', error)
      throw error
    }
  },

  /**
   * Search orders by text in order_details
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Optional filters (status, type, priority)
   * @returns {Promise<Array>} Matching orders
   */
  async searchOrders(searchTerm, filters = {}) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return this.getAllOrders(filters)
      }

      let query = supabase
        .from('doctor_orders')
        .select(`
          *,
          patient:patients(id, first_name, last_name, patient_number),
          created_by_user:user_profiles!created_by(id, full_name),
          completed_by_user:user_profiles!completed_by(id, full_name),
          cancelled_by_user:user_profiles!cancelled_by(id, full_name),
          appointment:appointments(id, appointment_date, appointment_time)
        `)
        .ilike('order_details', `%${searchTerm}%`)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })

      // Apply status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }

      // Apply order type filter
      if (filters.type) {
        if (Array.isArray(filters.type)) {
          query = query.in('order_type', filters.type)
        } else {
          query = query.eq('order_type', filters.type)
        }
      }

      // Apply priority filter
      if (filters.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority)
        } else {
          query = query.eq('priority', filters.priority)
        }
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Search orders error:', error)
      throw error
    }
  },

  /**
   * Subscribe to real-time order updates
   * @param {Function} callback - Callback function to handle changes
   * @returns {Object} Subscription object
   */
  subscribeToOrders(callback) {
    const subscription = supabase
      .channel('doctor_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctor_orders'
        },
        callback
      )
      .subscribe()

    return subscription
  }
}
