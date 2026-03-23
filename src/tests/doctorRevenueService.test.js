/**
 * Doctor Revenue Service - Verification Tests
 * 
 * This test suite verifies the core functionality of the doctor revenue service layer
 * before proceeding to UI implementation.
 * 
 * Tests cover:
 * - Revenue split calculation (60/40)
 * - Revenue categorization
 * - Edge cases and error handling
 */

import { describe, test, expect } from 'vitest'
import { calculateRevenueSplit, categorizeRevenue } from '../services/doctorRevenueService'

describe('DoctorRevenueService - Checkpoint Verification', () => {
  
  // ==================== REVENUE SPLIT CALCULATION ====================
  
  describe('calculateRevenueSplit', () => {
    test('should calculate 60/40 split correctly for whole numbers', () => {
      const result = calculateRevenueSplit(1000)
      
      expect(result.doctorShare).toBe(600)
      expect(result.clinicShare).toBe(400)
      expect(result.doctorShare + result.clinicShare).toBe(1000)
    })
    
    test('should calculate 60/40 split correctly for decimal amounts', () => {
      const result = calculateRevenueSplit(1234.56)
      
      expect(result.doctorShare).toBe(740.74)
      expect(result.clinicShare).toBe(493.82)
      // Sum should be close to original (within rounding tolerance)
      expect(result.doctorShare + result.clinicShare).toBeCloseTo(1234.56, 2)
    })
    
    test('should round to 2 decimal places', () => {
      const result = calculateRevenueSplit(100.33)
      
      // Check that values have at most 2 decimal places
      expect(result.doctorShare.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
      expect(result.clinicShare.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
    })
    
    test('should handle zero amount', () => {
      const result = calculateRevenueSplit(0)
      
      expect(result.doctorShare).toBe(0)
      expect(result.clinicShare).toBe(0)
    })
    
    test('should handle negative amounts gracefully', () => {
      const result = calculateRevenueSplit(-100)
      
      expect(result.doctorShare).toBe(0)
      expect(result.clinicShare).toBe(0)
    })
    
    test('should handle invalid input (NaN)', () => {
      const result = calculateRevenueSplit(NaN)
      
      expect(result.doctorShare).toBe(0)
      expect(result.clinicShare).toBe(0)
    })
    
    test('should handle invalid input (non-number)', () => {
      const result = calculateRevenueSplit('invalid')
      
      expect(result.doctorShare).toBe(0)
      expect(result.clinicShare).toBe(0)
    })
    
    test('should support custom split percentage', () => {
      const result = calculateRevenueSplit(1000, 70)
      
      expect(result.doctorShare).toBe(700)
      expect(result.clinicShare).toBe(300)
    })
  })
  
  // ==================== REVENUE CATEGORIZATION ====================
  
  describe('categorizeRevenue', () => {
    test('should categorize consultation fees correctly', () => {
      const items = [
        { type: 'consultation', total: 500 },
        { type: 'consult', total: 300 },
        { type: 'checkup', total: 200 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.consultationFees.total).toBe(1000)
      expect(result.consultationFees.doctorShare).toBe(600)
      expect(result.consultationFees.clinicShare).toBe(400)
    })
    
    test('should categorize procedures correctly', () => {
      const items = [
        { type: 'procedure', total: 2000 },
        { type: 'surgery', total: 5000 },
        { type: 'operation', total: 3000 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.procedures.total).toBe(10000)
      expect(result.procedures.doctorShare).toBe(6000)
      expect(result.procedures.clinicShare).toBe(4000)
    })
    
    test('should categorize services correctly', () => {
      const items = [
        { type: 'service', total: 800 },
        { type: 'therapy', total: 1200 },
        { type: 'treatment', total: 600 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.services.total).toBe(2600)
      expect(result.services.doctorShare).toBe(1560)
      expect(result.services.clinicShare).toBe(1040)
    })
    
    test('should categorize medicine correctly', () => {
      const items = [
        { type: 'medicine', total: 150 },
        { type: 'medication', total: 200 },
        { type: 'drug', total: 100 },
        { type: 'pharmaceutical', total: 50 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.medicine.total).toBe(500)
      expect(result.medicine.doctorShare).toBe(300)
      expect(result.medicine.clinicShare).toBe(200)
    })
    
    test('should categorize labs correctly', () => {
      const items = [
        { type: 'lab', total: 350 },
        { type: 'laboratory', total: 400 },
        { type: 'test', total: 250 },
        { type: 'xray', total: 600 },
        { type: 'imaging', total: 800 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.labs.total).toBe(2400)
      expect(result.labs.doctorShare).toBe(1440)
      expect(result.labs.clinicShare).toBe(960)
    })
    
    test('should categorize unknown types as "other"', () => {
      const items = [
        { type: 'unknown', total: 100 },
        { type: 'miscellaneous', total: 200 },
        { type: '', total: 50 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.other.total).toBe(350)
      expect(result.other.doctorShare).toBe(210)
      expect(result.other.clinicShare).toBe(140)
    })
    
    test('should handle mixed categories', () => {
      const items = [
        { type: 'consultation', total: 500 },
        { type: 'medicine', total: 100 },
        { type: 'lab', total: 300 },
        { type: 'procedure', total: 2000 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.consultationFees.total).toBe(500)
      expect(result.medicine.total).toBe(100)
      expect(result.labs.total).toBe(300)
      expect(result.procedures.total).toBe(2000)
    })
    
    test('should handle empty items array', () => {
      const result = categorizeRevenue([])
      
      expect(result.consultationFees.total).toBe(0)
      expect(result.procedures.total).toBe(0)
      expect(result.services.total).toBe(0)
      expect(result.medicine.total).toBe(0)
      expect(result.labs.total).toBe(0)
      expect(result.other.total).toBe(0)
    })
    
    test('should handle null items', () => {
      const result = categorizeRevenue(null)
      
      expect(result.consultationFees.total).toBe(0)
      expect(result.procedures.total).toBe(0)
      expect(result.services.total).toBe(0)
      expect(result.medicine.total).toBe(0)
      expect(result.labs.total).toBe(0)
      expect(result.other.total).toBe(0)
    })
    
    test('should handle undefined items', () => {
      const result = categorizeRevenue(undefined)
      
      expect(result.consultationFees.total).toBe(0)
      expect(result.procedures.total).toBe(0)
      expect(result.services.total).toBe(0)
      expect(result.medicine.total).toBe(0)
      expect(result.labs.total).toBe(0)
      expect(result.other.total).toBe(0)
    })
    
    test('should skip items with zero or negative total', () => {
      const items = [
        { type: 'consultation', total: 500 },
        { type: 'medicine', total: 0 },
        { type: 'lab', total: -100 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.consultationFees.total).toBe(500)
      expect(result.medicine.total).toBe(0)
      expect(result.labs.total).toBe(0)
    })
    
    test('should handle malformed items gracefully', () => {
      const items = [
        { type: 'consultation', total: 500 },
        { type: null, total: 100 },
        { total: 200 }, // missing type
        { type: 'medicine' }, // missing total
        null, // null item
        undefined // undefined item
      ]
      
      const result = categorizeRevenue(items)
      
      // Should process valid items and skip malformed ones
      expect(result.consultationFees.total).toBe(500)
    })
    
    test('should handle case-insensitive type matching', () => {
      const items = [
        { type: 'CONSULTATION', total: 500 },
        { type: 'Medicine', total: 100 },
        { type: 'LAB', total: 300 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.consultationFees.total).toBe(500)
      expect(result.medicine.total).toBe(100)
      expect(result.labs.total).toBe(300)
    })
    
    test('should handle type with extra whitespace', () => {
      const items = [
        { type: '  consultation  ', total: 500 },
        { type: ' medicine ', total: 100 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.consultationFees.total).toBe(500)
      expect(result.medicine.total).toBe(100)
    })
    
    test('should handle partial keyword matches', () => {
      const items = [
        { type: 'consultation_fee', total: 500 },
        { type: 'medicine_dispensed', total: 100 },
        { type: 'laboratory_test', total: 300 }
      ]
      
      const result = categorizeRevenue(items)
      
      expect(result.consultationFees.total).toBe(500)
      expect(result.medicine.total).toBe(100)
      expect(result.labs.total).toBe(300)
    })
  })
  
  // ==================== INTEGRATION TESTS ====================
  
  describe('Integration - Revenue Calculation Flow', () => {
    test('should calculate complete revenue breakdown correctly', () => {
      const items = [
        { type: 'consultation', total: 500 },
        { type: 'medicine', total: 150 },
        { type: 'lab', total: 350 },
        { type: 'procedure', total: 2000 }
      ]
      
      const result = categorizeRevenue(items)
      
      // Calculate total revenue
      const totalRevenue = Object.values(result).reduce((sum, category) => {
        return sum + category.total
      }, 0)
      
      // Calculate total doctor share
      const totalDoctorShare = Object.values(result).reduce((sum, category) => {
        return sum + category.doctorShare
      }, 0)
      
      // Calculate total clinic share
      const totalClinicShare = Object.values(result).reduce((sum, category) => {
        return sum + category.clinicShare
      }, 0)
      
      expect(totalRevenue).toBe(3000)
      expect(totalDoctorShare).toBe(1800)
      expect(totalClinicShare).toBe(1200)
      expect(totalDoctorShare + totalClinicShare).toBe(totalRevenue)
    })
    
    test('should maintain 60/40 ratio across all categories', () => {
      const items = [
        { type: 'consultation', total: 1000 },
        { type: 'medicine', total: 500 },
        { type: 'lab', total: 750 }
      ]
      
      const result = categorizeRevenue(items)
      
      // Check each category maintains 60/40 ratio
      Object.values(result).forEach(category => {
        if (category.total > 0) {
          const doctorPercentage = (category.doctorShare / category.total) * 100
          const clinicPercentage = (category.clinicShare / category.total) * 100
          
          expect(doctorPercentage).toBeCloseTo(60, 1)
          expect(clinicPercentage).toBeCloseTo(40, 1)
        }
      })
    })
  })
})
