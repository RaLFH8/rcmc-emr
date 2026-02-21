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
    
    const { data, error } = await supabase
      .from('patients')
      .insert([{ ...patient, patient_number: patientNumber }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updatePatient(id, updates) {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
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
      .select('*')
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
  }
}
