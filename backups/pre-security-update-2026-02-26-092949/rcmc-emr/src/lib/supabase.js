import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database helper functions
export const db = {
  // ==================== PATIENTS ====================
  async getPatients(limit = 20, offset = 0, searchTerm = '') {
    let query = supabase
      .from('patients')
      .select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,patient_number.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query.range(offset, offset + limit - 1)
    
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
      .select('id, first_name, last_name, license_number, ptr_number, s2_number, status')
      .eq('status', 'Active')
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

    // Get total revenue from billing
    const { data: billingData, error } = await supabase
      .from('billing')
      .select('total_amount, payment_status, created_at')
      .eq('payment_status', 'Paid')
      .gte('created_at', firstDayOfMonth)

    if (error) throw error

    const totalRevenue = billingData.reduce((sum, bill) => sum + (parseFloat(bill.total_amount) || 0), 0)

    return {
      totalRevenue,
      transactionCount: billingData.length,
      averageTransaction: billingData.length > 0 ? totalRevenue / billingData.length : 0
    }
  },

  async getMonthlyRevenueTrend(months = 7) {
    const { data, error } = await supabase
      .from('billing')
      .select('total_amount, payment_status, created_at')
      .eq('payment_status', 'Paid')
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by month
    const monthlyData = {}
    data.forEach(bill => {
      const date = new Date(bill.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthName, services: 0, medicines: 0, rooms: 0 }
      }
      
      // Distribute revenue (you can categorize based on billing items later)
      const amount = parseFloat(bill.total_amount) || 0
      monthlyData[monthKey].services += amount * 0.58
      monthlyData[monthKey].medicines += amount * 0.33
      monthlyData[monthKey].rooms += amount * 0.09
    })

    return Object.values(monthlyData).slice(-months)
  },

  async getRevenueByCategory() {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('billing')
      .select('total_amount, payment_status')
      .eq('payment_status', 'Paid')
      .gte('created_at', firstDayOfMonth)

    if (error) throw error

    const totalRevenue = data.reduce((sum, bill) => sum + (parseFloat(bill.total_amount) || 0), 0)

    // Distribute by category (approximate - can be refined with billing items)
    return [
      { name: 'Services', value: Math.round(totalRevenue * 0.58), color: '#14b8a6' },
      { name: 'Medicines', value: Math.round(totalRevenue * 0.33), color: '#8b5cf6' },
      { name: 'Rooms', value: Math.round(totalRevenue * 0.09), color: '#f59e0b' }
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
      .select('stock, reorder_level')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError

    const newStock = Math.max(0, item.stock - quantity)
    let status = 'In Stock'
    if (newStock === 0) status = 'Out of Stock'
    else if (newStock <= item.reorder_level * 0.3) status = 'Critical'
    else if (newStock <= item.reorder_level) status = 'Low Stock'

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
      .select('stock, reorder_level')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError

    const newStock = item.stock + quantity
    let status = 'In Stock'
    if (newStock <= item.reorder_level * 0.3) status = 'Critical'
    else if (newStock <= item.reorder_level) status = 'Low Stock'

    const { data, error } = await supabase
      .from('inventory')
      .update({ stock: newStock, status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ==================== BILLING/PAYMENTS ====================
  async getBilling(limit = 100, offset = 0, searchTerm = '', statusFilter = 'All') {
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
  }
}
