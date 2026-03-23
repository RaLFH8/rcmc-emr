import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'payroll-auth-token',
  },
})

// Database helper functions
export const db = {
  // Employees
  async getEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async addEmployee(employee) {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateEmployee(id, updates) {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteEmployee(id) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Payroll Records
  async getPayrollRecords() {
    const { data, error } = await supabase
      .from('payroll_records')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async addPayrollRecord(record) {
    const { data, error } = await supabase
      .from('payroll_records')
      .insert([record])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Payslip History
  async savePayslipHistory(payslip) {
    const { data, error } = await supabase
      .from('payslip_history')
      .insert([payslip])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getPayslipHistory(employeeId = null) {
    let query = supabase
      .from('payslip_history')
      .select('*')
      .order('generated_at', { ascending: false })
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async deletePayslipHistory(id) {
    const { error } = await supabase
      .from('payslip_history')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Initialize sample data (disabled - start with empty database)
  async initializeSampleData() {
    // No sample data - users will add their own employees
    return
  }
}
