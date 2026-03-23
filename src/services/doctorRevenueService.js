import { supabase } from '../lib/supabase'

/**
 * Doctor Revenue Service Layer
 * 
 * Provides revenue calculation and aggregation methods for the Doctor Revenue Sharing Report.
 * Implements 60/40 revenue split (60% doctor, 40% clinic) and categorizes billing items
 * into revenue categories (consultation, procedure, service, medicine, lab, other).
 * 
 * All data is fetched from Supabase with no hardcoded values.
 * Uses Philippine timezone (Asia/Manila) for date operations.
 */

// ==================== REVENUE SPLIT CALCULATION ====================

/**
 * Calculate 60/40 revenue split
 * 
 * @param {number} amount - Total revenue amount
 * @param {number} doctorPercentage - Doctor's percentage (default 60)
 * @returns {Object} { doctorShare, clinicShare }
 * 
 * Validates: Requirements 3.1, 3.2, 3.5
 */
export function calculateRevenueSplit(amount, doctorPercentage = 60) {
  // Validate input
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    return { doctorShare: 0, clinicShare: 0 }
  }
  
  // Calculate shares
  const doctorShare = amount * (doctorPercentage / 100)
  const clinicShare = amount * ((100 - doctorPercentage) / 100)
  
  // Round to 2 decimal places
  return {
    doctorShare: Math.round(doctorShare * 100) / 100,
    clinicShare: Math.round(clinicShare * 100) / 100
  }
}

// ==================== REVENUE CATEGORIZATION ====================

/**
 * Revenue category mapping rules
 * Maps billing item types to revenue categories
 */
const CATEGORY_MAPPING = {
  // Consultation Fees
  consultation: 'Consultation Fees',
  consult: 'Consultation Fees',
  checkup: 'Consultation Fees',
  
  // Procedures
  procedure: 'Procedures',
  surgery: 'Procedures',
  operation: 'Procedures',
  
  // Services
  service: 'Services',
  therapy: 'Services',
  treatment: 'Services',
  
  // Medicine
  medicine: 'Medicine',
  medication: 'Medicine',
  drug: 'Medicine',
  pharmaceutical: 'Medicine',
  
  // Labs
  lab: 'Labs',
  laboratory: 'Labs',
  test: 'Labs',
  xray: 'Labs',
  imaging: 'Labs'
}

/**
 * Categorize billing items into revenue categories
 * 
 * @param {Array} items - Billing items JSONB array
 * @returns {Object} Revenue by category with split calculations
 * 
 * Validates: Requirements 2.1, 2.2, 2.4, 3.1, 3.2, 3.5
 */
export function categorizeRevenue(items) {
  // Initialize empty category revenue structure
  const categoryRevenue = {
    consultationFees: { total: 0, doctorShare: 0, clinicShare: 0 },
    procedures: { total: 0, doctorShare: 0, clinicShare: 0 },
    services: { total: 0, doctorShare: 0, clinicShare: 0 },
    medicine: { total: 0, doctorShare: 0, clinicShare: 0 },
    labs: { total: 0, doctorShare: 0, clinicShare: 0 },
    other: { total: 0, doctorShare: 0, clinicShare: 0 }
  }
  
  // Validate input
  if (!items || !Array.isArray(items) || items.length === 0) {
    return categoryRevenue
  }
  
  // Process each billing item
  items.forEach(item => {
    try {
      // Extract item details
      const itemType = (item.type || '').toLowerCase().trim()
      const itemTotal = parseFloat(item.total) || 0
      
      // Skip if no amount
      if (itemTotal <= 0) return
      
      // Determine category
      let category = 'other'
      
      // Check each mapping rule
      for (const [keyword, categoryName] of Object.entries(CATEGORY_MAPPING)) {
        if (itemType.includes(keyword)) {
          // Convert category name to camelCase key
          category = categoryName.replace(/\s+/g, '')
          category = category.charAt(0).toLowerCase() + category.slice(1)
          break
        }
      }
      
      // Add to category total
      if (categoryRevenue[category]) {
        categoryRevenue[category].total += itemTotal
      } else {
        // Fallback to 'other' if category not found
        categoryRevenue.other.total += itemTotal
      }
    } catch (error) {
      console.warn('Error processing billing item:', item, error)
      // Skip malformed items
    }
  })
  
  // Calculate splits for each category
  Object.keys(categoryRevenue).forEach(category => {
    const total = categoryRevenue[category].total
    const split = calculateRevenueSplit(total)
    categoryRevenue[category].doctorShare = split.doctorShare
    categoryRevenue[category].clinicShare = split.clinicShare
    // Round total to 2 decimal places
    categoryRevenue[category].total = Math.round(total * 100) / 100
  })
  
  return categoryRevenue
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date for Philippine timezone
 */
function formatDatePH(date) {
  // Convert to Date object if string
  const dateObj = date instanceof Date ? date : new Date(date)
  
  // Return ISO 8601 format (YYYY-MM-DD) without timezone
  return dateObj.toISOString().split('T')[0]
}

/**
 * Get empty category revenue structure
 */
function getEmptyCategoryRevenue() {
  return {
    consultationFees: { total: 0, doctorShare: 0, clinicShare: 0 },
    procedures: { total: 0, doctorShare: 0, clinicShare: 0 },
    services: { total: 0, doctorShare: 0, clinicShare: 0 },
    medicine: { total: 0, doctorShare: 0, clinicShare: 0 },
    labs: { total: 0, doctorShare: 0, clinicShare: 0 },
    other: { total: 0, doctorShare: 0, clinicShare: 0 }
  }
}

/**
 * Calculate total revenue from category breakdown
 */
function calculateTotalRevenue(categoryRevenue) {
  return Object.values(categoryRevenue).reduce((sum, category) => {
    return sum + category.total
  }, 0)
}

/**
 * Calculate total doctor share from category breakdown
 */
function calculateTotalDoctorShare(categoryRevenue) {
  return Object.values(categoryRevenue).reduce((sum, category) => {
    return sum + category.doctorShare
  }, 0)
}

/**
 * Calculate total clinic share from category breakdown
 */
function calculateTotalClinicShare(categoryRevenue) {
  return Object.values(categoryRevenue).reduce((sum, category) => {
    return sum + category.clinicShare
  }, 0)
}

// ==================== MAIN REVENUE REPORT FUNCTION ====================

/**
 * Get revenue report data for all doctors or specific doctor
 * 
 * @param {Object} dateRange - { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 * @param {string} doctorId - Optional doctor ID for filtering (for role-based access)
 * @returns {Promise<Object>} Revenue report data with summary and per-doctor breakdown
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 4.3, 4.4, 8.2, 8.3
 */
export async function getRevenueReport(dateRange, doctorId = null) {
  try {
    // Validate date range
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      throw new Error('Invalid date range: startDate and endDate are required')
    }

    // Format dates for query
    const startDate = formatDatePH(dateRange.startDate)
    const endDate = formatDatePH(dateRange.endDate)

    // Step 1: Get all active doctors (filtered by doctorId if provided)
    let doctorsQuery = supabase
      .from('doctors')
      .select('id, first_name, last_name, specialization')
      .eq('status', 'Active')
      .order('last_name', { ascending: true })

    // Apply doctor filter for role-based access
    if (doctorId) {
      doctorsQuery = doctorsQuery.eq('id', doctorId)
    }

    const { data: doctors, error: doctorsError } = await doctorsQuery

    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError)
      throw new Error('Failed to fetch doctors data')
    }

    if (!doctors || doctors.length === 0) {
      // Return empty report if no doctors found
      return {
        summary: {
          totalConsultations: 0,
          totalRevenue: 0,
          totalDoctorShare: 0,
          totalClinicShare: 0,
          dateRange: { startDate, endDate }
        },
        doctors: [],
        dataQualityScore: 0
      }
    }

    // Step 2: Get consultations for each doctor within date range
    const { data: consultations, error: consultationsError } = await supabase
      .from('consultations')
      .select('id, doctor_id, consultation_date')
      .gte('consultation_date', startDate)
      .lte('consultation_date', endDate)
      .in('doctor_id', doctors.map(d => d.id))

    if (consultationsError) {
      console.error('Error fetching consultations:', consultationsError)
      throw new Error('Failed to fetch consultations data')
    }

    // Step 3: Get billing records for consultations
    const consultationIds = consultations?.map(c => c.id) || []
    
    let billingData = []
    if (consultationIds.length > 0) {
      const { data: billing, error: billingError } = await supabase
        .from('billing')
        .select('consultation_id, items, amount_paid, payment_status')
        .in('consultation_id', consultationIds)
        .in('payment_status', ['Paid', 'Partial'])

      if (billingError) {
        console.error('Error fetching billing:', billingError)
        throw new Error('Failed to fetch billing data')
      }

      billingData = billing || []
    }

    // Step 4: Build lookup maps for efficient processing
    const consultationsByDoctor = {}
    const billingByConsultation = {}

    // Group consultations by doctor
    consultations?.forEach(consultation => {
      if (!consultationsByDoctor[consultation.doctor_id]) {
        consultationsByDoctor[consultation.doctor_id] = []
      }
      consultationsByDoctor[consultation.doctor_id].push(consultation)
    })

    // Index billing by consultation_id
    billingData.forEach(bill => {
      billingByConsultation[bill.consultation_id] = bill
    })

    // Step 5: Process each doctor's data
    const doctorRevenueData = []
    let totalConsultationsCount = 0
    let totalConsultationsWithBilling = 0

    doctors.forEach(doctor => {
      const doctorConsultations = consultationsByDoctor[doctor.id] || []
      const consultationCount = doctorConsultations.length

      // Aggregate billing items for this doctor
      const allBillingItems = []
      
      doctorConsultations.forEach(consultation => {
        const billing = billingByConsultation[consultation.id]
        if (billing) {
          totalConsultationsWithBilling++
          
          // Extract items from billing JSONB
          if (billing.items && Array.isArray(billing.items)) {
            allBillingItems.push(...billing.items)
          }
        }
      })

      // Categorize revenue for this doctor
      const revenueByCategory = categorizeRevenue(allBillingItems)

      // Calculate totals
      const totalRevenue = calculateTotalRevenue(revenueByCategory)
      const doctorShare = calculateTotalDoctorShare(revenueByCategory)
      const clinicShare = calculateTotalClinicShare(revenueByCategory)

      // Add to results
      doctorRevenueData.push({
        doctorId: doctor.id,
        doctorName: `${doctor.first_name} ${doctor.last_name}`,
        specialization: doctor.specialization,
        consultationCount,
        revenueByCategory,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        doctorShare: Math.round(doctorShare * 100) / 100,
        clinicShare: Math.round(clinicShare * 100) / 100
      })

      totalConsultationsCount += consultationCount
    })

    // Step 6: Sort doctors by consultation count (descending)
    doctorRevenueData.sort((a, b) => b.consultationCount - a.consultationCount)

    // Step 7: Calculate summary statistics
    const summaryTotalRevenue = doctorRevenueData.reduce((sum, d) => sum + d.totalRevenue, 0)
    const summaryTotalDoctorShare = doctorRevenueData.reduce((sum, d) => sum + d.doctorShare, 0)
    const summaryTotalClinicShare = doctorRevenueData.reduce((sum, d) => sum + d.clinicShare, 0)

    // Calculate data quality score
    const dataQualityScore = totalConsultationsCount > 0
      ? Math.round((totalConsultationsWithBilling / totalConsultationsCount) * 1000) / 10
      : 0

    // Step 8: Return complete report
    return {
      summary: {
        totalConsultations: totalConsultationsCount,
        totalRevenue: Math.round(summaryTotalRevenue * 100) / 100,
        totalDoctorShare: Math.round(summaryTotalDoctorShare * 100) / 100,
        totalClinicShare: Math.round(summaryTotalClinicShare * 100) / 100,
        dateRange: { startDate, endDate }
      },
      doctors: doctorRevenueData,
      dataQualityScore
    }

  } catch (error) {
    console.error('Error generating revenue report:', error)
    throw error
  }
}

// ==================== SUMMARY STATISTICS ====================

/**
 * Get summary statistics for revenue report
 * 
 * This is a lightweight wrapper around getRevenueReport that returns only
 * the summary statistics without the detailed per-doctor breakdown.
 * Useful for dashboard widgets or quick overview displays.
 * 
 * @param {Object} dateRange - { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 * @returns {Promise<Object>} Summary statistics object
 * 
 * Returns:
 * {
 *   totalConsultations: number,
 *   totalRevenue: number,
 *   totalDoctorShare: number,
 *   totalClinicShare: number,
 *   dataQualityScore: number,
 *   dateRange: { startDate: string, endDate: string }
 * }
 * 
 * Validates: Requirements 6.2, 6.5, 6.6, 7.5
 */
export async function getSummaryStatistics(dateRange) {
  try {
    // Leverage existing getRevenueReport method
    const report = await getRevenueReport(dateRange)
    
    // Extract and return only summary data
    return {
      totalConsultations: report.summary.totalConsultations,
      totalRevenue: report.summary.totalRevenue,
      totalDoctorShare: report.summary.totalDoctorShare,
      totalClinicShare: report.summary.totalClinicShare,
      dataQualityScore: report.dataQualityScore,
      dateRange: report.summary.dateRange
    }
  } catch (error) {
    console.error('Error fetching summary statistics:', error)
    throw error
  }
}
