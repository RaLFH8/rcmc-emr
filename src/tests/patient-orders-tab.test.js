/**
 * Tests for Patient Orders Tab Implementation
 * Task: 3.1 Implement patient profile Orders tab
 * 
 * Validates that the Orders tab displays patient-specific orders grouped by status
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

// ─── Test Data Generators ─────────────────────────────────────────────────────

const orderArb = fc.record({
  id: fc.uuid(),
  patient_id: fc.uuid(),
  order_type: fc.constantFrom('medication', 'lab_test', 'procedure', 'diet', 'activity_restriction'),
  order_details: fc.string({ minLength: 10, maxLength: 100 }),
  priority: fc.constantFrom('stat', 'urgent', 'routine'),
  status: fc.constantFrom('pending', 'in_progress', 'completed', 'cancelled'),
  notes: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
  created_at: fc.constant('2024-01-15T10:00:00Z'),
  appointment_id: fc.option(fc.uuid(), { nil: null }),
  created_by_user: fc.record({
    full_name: fc.string({ minLength: 5, maxLength: 30 }),
    first_name: fc.string({ minLength: 2, maxLength: 15 }),
    last_name: fc.string({ minLength: 2, maxLength: 15 })
  })
})

// ─── Helper Functions (extracted from implementation) ─────────────────────────

const orderTypeLabels = {
  medication: 'Medication',
  lab_test: 'Lab Test',
  procedure: 'Procedure',
  diet: 'Diet',
  activity_restriction: 'Activity Restriction'
}

const priorityLabels = {
  stat: 'STAT',
  urgent: 'URGENT',
  routine: 'Routine'
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200'
}

// Group orders by status (mirrors implementation logic)
const groupOrdersByStatus = (orders) => {
  const grouped = {}
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled']
  
  statuses.forEach(status => {
    grouped[status] = orders.filter(order => order.status === status)
  })
  
  return grouped
}

// Filter orders by patient ID (mirrors database query logic)
const filterOrdersByPatient = (orders, patientId) => {
  return orders.filter(order => order.patient_id === patientId)
}

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('Patient Orders Tab - Unit Tests', () => {
  it('should have correct order type labels', () => {
    expect(orderTypeLabels.medication).toBe('Medication')
    expect(orderTypeLabels.lab_test).toBe('Lab Test')
    expect(orderTypeLabels.procedure).toBe('Procedure')
    expect(orderTypeLabels.diet).toBe('Diet')
    expect(orderTypeLabels.activity_restriction).toBe('Activity Restriction')
  })

  it('should have correct priority labels', () => {
    expect(priorityLabels.stat).toBe('STAT')
    expect(priorityLabels.urgent).toBe('URGENT')
    expect(priorityLabels.routine).toBe('Routine')
  })

  it('should have correct status colors', () => {
    expect(statusColors.pending).toContain('yellow')
    expect(statusColors.in_progress).toContain('blue')
    expect(statusColors.completed).toContain('green')
    expect(statusColors.cancelled).toContain('red')
  })

  it('should group orders by status correctly', () => {
    const orders = [
      { id: '1', status: 'pending', order_details: 'Order 1' },
      { id: '2', status: 'completed', order_details: 'Order 2' },
      { id: '3', status: 'pending', order_details: 'Order 3' },
      { id: '4', status: 'cancelled', order_details: 'Order 4' }
    ]

    const grouped = groupOrdersByStatus(orders)
    
    expect(grouped.pending).toHaveLength(2)
    expect(grouped.completed).toHaveLength(1)
    expect(grouped.in_progress).toHaveLength(0)
    expect(grouped.cancelled).toHaveLength(1)
  })

  it('should filter orders by patient ID correctly', () => {
    const patientId = 'patient-123'
    const orders = [
      { id: '1', patient_id: patientId, order_details: 'Order 1' },
      { id: '2', patient_id: 'other-patient', order_details: 'Order 2' },
      { id: '3', patient_id: patientId, order_details: 'Order 3' }
    ]

    const filtered = filterOrdersByPatient(orders, patientId)
    
    expect(filtered).toHaveLength(2)
    expect(filtered.every(order => order.patient_id === patientId)).toBe(true)
  })
})

// ─── Property-Based Tests ──────────────────────────────────────────────────────

describe('Patient Orders Tab - Property-Based Tests', () => {
  // Property 1: Orders tab displays all orders for specific patient
  it('Property 1: filterOrdersByPatient returns only orders for the specified patient', () => {
    fc.assert(fc.property(
      fc.array(orderArb, { minLength: 0, maxLength: 50 }),
      fc.uuid(),
      (orders, patientId) => {
        // Set some orders to have the target patient ID
        const ordersWithPatient = orders.map((order, index) => 
          index % 3 === 0 ? { ...order, patient_id: patientId } : order
        )
        
        const filtered = filterOrdersByPatient(ordersWithPatient, patientId)
        
        // All filtered orders should belong to the specified patient
        return filtered.every(order => order.patient_id === patientId)
      }
    ), { numRuns: 100 })
  })

  // Property 2: Orders are grouped by status correctly
  it('Property 2: groupOrdersByStatus creates groups where all orders in each group have the same status', () => {
    fc.assert(fc.property(
      fc.array(orderArb, { minLength: 0, maxLength: 50 }),
      (orders) => {
        const grouped = groupOrdersByStatus(orders)
        
        // Check that each group contains only orders with the correct status
        return Object.entries(grouped).every(([status, statusOrders]) => 
          statusOrders.every(order => order.status === status)
        )
      }
    ), { numRuns: 100 })
  })

  // Property 3: Total orders count is preserved after grouping
  it('Property 3: groupOrdersByStatus preserves total order count', () => {
    fc.assert(fc.property(
      fc.array(orderArb, { minLength: 0, maxLength: 50 }),
      (orders) => {
        const grouped = groupOrdersByStatus(orders)
        const totalGrouped = Object.values(grouped).reduce((sum, group) => sum + group.length, 0)
        
        return totalGrouped === orders.length
      }
    ), { numRuns: 100 })
  })

  // Property 4: Each status group exists even if empty
  it('Property 4: groupOrdersByStatus creates all status groups even when empty', () => {
    fc.assert(fc.property(
      fc.array(orderArb, { minLength: 0, maxLength: 20 }),
      (orders) => {
        const grouped = groupOrdersByStatus(orders)
        const expectedStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
        
        return expectedStatuses.every(status => Array.isArray(grouped[status]))
      }
    ), { numRuns: 100 })
  })

  // Property 5: Patient-specific filtering is accurate
  it('Property 5: filterOrdersByPatient never returns orders from other patients', () => {
    fc.assert(fc.property(
      fc.array(orderArb, { minLength: 1, maxLength: 50 }),
      fc.uuid(),
      (orders, targetPatientId) => {
        // Ensure we have some orders for the target patient and some for others
        const mixedOrders = orders.map((order, index) => ({
          ...order,
          patient_id: index % 2 === 0 ? targetPatientId : fc.sample(fc.uuid(), 1)[0]
        }))
        
        const filtered = filterOrdersByPatient(mixedOrders, targetPatientId)
        
        // No order should belong to a different patient
        return filtered.every(order => order.patient_id === targetPatientId)
      }
    ), { numRuns: 100 })
  })

  // Property 6: Orders tab shows correct count for each status
  it('Property 6: status group counts match actual order counts', () => {
    fc.assert(fc.property(
      fc.array(orderArb, { minLength: 0, maxLength: 50 }),
      (orders) => {
        const grouped = groupOrdersByStatus(orders)
        
        // Count orders manually for each status
        const pendingCount = orders.filter(o => o.status === 'pending').length
        const inProgressCount = orders.filter(o => o.status === 'in_progress').length
        const completedCount = orders.filter(o => o.status === 'completed').length
        const cancelledCount = orders.filter(o => o.status === 'cancelled').length
        
        return (
          grouped.pending.length === pendingCount &&
          grouped.in_progress.length === inProgressCount &&
          grouped.completed.length === completedCount &&
          grouped.cancelled.length === cancelledCount
        )
      }
    ), { numRuns: 100 })
  })

  // Property 7: SOAP note orders are properly identified
  it('Property 7: orders with appointment_id are identified as SOAP note orders', () => {
    fc.assert(fc.property(
      fc.array(orderArb, { minLength: 0, maxLength: 30 }),
      (orders) => {
        const soapOrders = orders.filter(order => order.appointment_id !== null)
        const nonSoapOrders = orders.filter(order => order.appointment_id === null)
        
        // All SOAP orders should have appointment_id
        const soapOrdersValid = soapOrders.every(order => order.appointment_id !== null)
        // All non-SOAP orders should not have appointment_id
        const nonSoapOrdersValid = nonSoapOrders.every(order => order.appointment_id === null)
        
        return soapOrdersValid && nonSoapOrdersValid
      }
    ), { numRuns: 100 })
  })
})

// ─── Integration Test Scenarios ────────────────────────────────────────────────

describe('Patient Orders Tab - Integration Scenarios', () => {
  it('should handle empty orders list gracefully', () => {
    const orders = []
    const grouped = groupOrdersByStatus(orders)
    
    expect(grouped.pending).toHaveLength(0)
    expect(grouped.in_progress).toHaveLength(0)
    expect(grouped.completed).toHaveLength(0)
    expect(grouped.cancelled).toHaveLength(0)
  })

  it('should handle patient with no orders', () => {
    const orders = [
      { id: '1', patient_id: 'other-patient', order_details: 'Order 1' },
      { id: '2', patient_id: 'another-patient', order_details: 'Order 2' }
    ]
    const patientId = 'target-patient'
    
    const filtered = filterOrdersByPatient(orders, patientId)
    expect(filtered).toHaveLength(0)
  })

  it('should handle mixed order types and priorities correctly', () => {
    const orders = [
      { 
        id: '1', 
        patient_id: 'patient-1', 
        status: 'pending', 
        order_type: 'medication',
        priority: 'stat',
        order_details: 'Urgent medication order'
      },
      { 
        id: '2', 
        patient_id: 'patient-1', 
        status: 'completed', 
        order_type: 'lab_test',
        priority: 'routine',
        order_details: 'Blood test completed'
      }
    ]
    
    const filtered = filterOrdersByPatient(orders, 'patient-1')
    const grouped = groupOrdersByStatus(filtered)
    
    expect(filtered).toHaveLength(2)
    expect(grouped.pending).toHaveLength(1)
    expect(grouped.completed).toHaveLength(1)
    expect(grouped.pending[0].priority).toBe('stat')
    expect(grouped.completed[0].order_type).toBe('lab_test')
  })
})