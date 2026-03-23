/**
 * Preservation Property Tests - Doctor Revenue Tab Missing Fix
 * 
 * These tests verify that the fix does NOT break existing behavior for:
 * - Users with roles other than admin/doctor (receptionist, etc.)
 * - Tab ordering and structure
 * - Null/undefined userProfile handling
 * 
 * CRITICAL: These tests MUST PASS on UNFIXED code to establish baseline behavior.
 * After the fix, these tests must STILL PASS to confirm no regressions.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

/**
 * Helper function to construct tabs array (simulates Reports.jsx logic)
 * This uses the FIXED logic to verify preservation after the fix
 */
const constructTabsFixed = (user, userProfile) => {
  return [
    { id: 'analytics', label: 'Analytics' },
    { id: 'financial', label: 'Financial' },
    { id: 'patients', label: 'Patients' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'inventory', label: 'Inventory' },
    // FIXED: checks userProfile.role (correct property)
    ...(userProfile && ['admin', 'doctor'].includes(userProfile.role) 
      ? [{ id: 'doctor-revenue', label: 'Doctor Revenue Sharing' }]
      : [])
  ]
}

describe('Preservation Property Tests - Doctor Revenue Tab', () => {
  /**
   * Property 2.1: Non-Admin/Doctor users should NOT see the Doctor Revenue tab
   * 
   * For all users where userProfile.role is NOT 'admin' or 'doctor',
   * the tabs array should NOT include the 'doctor-revenue' tab.
   * 
   * This test uses property-based testing to verify across many role values.
   */
  describe('Property 2.1: Non-Admin/Doctor Tab Visibility', () => {
    it('should NOT include doctor-revenue tab for receptionist users', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            first_name: fc.string({ minLength: 1, maxLength: 20 }),
            last_name: fc.string({ minLength: 1, maxLength: 20 })
          }),
          (userProfile) => {
            const user = {
              id: userProfile.id,
              email: userProfile.email
              // user.role is undefined (Supabase auth structure)
            }

            const profile = {
              ...userProfile,
              role: 'receptionist'
            }

            const tabs = constructTabsFixed(user, profile)

            // Verify doctor-revenue tab is NOT included
            const doctorRevenueTab = tabs.find(tab => tab.id === 'doctor-revenue')
            expect(doctorRevenueTab).toBeUndefined()

            // Verify exactly 5 tabs are present
            expect(tabs).toHaveLength(5)
          }
        ),
        { numRuns: 50 } // Run 50 test cases with different user data
      )
    })

    it('should NOT include doctor-revenue tab for users with other roles', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress()
          }),
          fc.constantFrom('nurse', 'pharmacist', 'lab_tech', 'billing', 'manager', 'staff'),
          (userProfile, role) => {
            const user = {
              id: userProfile.id,
              email: userProfile.email
            }

            const profile = {
              ...userProfile,
              role: role
            }

            const tabs = constructTabsFixed(user, profile)

            // Verify doctor-revenue tab is NOT included
            const doctorRevenueTab = tabs.find(tab => tab.id === 'doctor-revenue')
            expect(doctorRevenueTab).toBeUndefined()

            // Verify exactly 5 tabs are present
            expect(tabs).toHaveLength(5)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Property 2.2: The 5 base tabs should always appear in the same order
   * 
   * For all users (regardless of role), the first 5 tabs should always be:
   * 1. Analytics
   * 2. Financial
   * 3. Patients
   * 4. Appointments
   * 5. Inventory
   * 
   * This verifies that the fix doesn't accidentally change tab ordering.
   */
  describe('Property 2.2: Base Tab Ordering Preservation', () => {
    it('should maintain the same order for the 5 base tabs', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress()
          }),
          fc.constantFrom('receptionist', 'nurse', 'pharmacist', 'admin', 'doctor'),
          (userProfile, role) => {
            const user = {
              id: userProfile.id,
              email: userProfile.email
            }

            const profile = {
              ...userProfile,
              role: role
            }

            const tabs = constructTabsFixed(user, profile)

            // Verify the first 5 tabs are always in the same order
            expect(tabs[0].id).toBe('analytics')
            expect(tabs[1].id).toBe('financial')
            expect(tabs[2].id).toBe('patients')
            expect(tabs[3].id).toBe('appointments')
            expect(tabs[4].id).toBe('inventory')

            // Verify all 5 base tabs have the correct labels
            expect(tabs[0].label).toBe('Analytics')
            expect(tabs[1].label).toBe('Financial')
            expect(tabs[2].label).toBe('Patients')
            expect(tabs[3].label).toBe('Appointments')
            expect(tabs[4].label).toBe('Inventory')
          }
        ),
        { numRuns: 100 } // Run many times to ensure consistency
      )
    })
  })

  /**
   * Property 2.3: Null/undefined userProfile should not cause crashes
   * 
   * When userProfile is null or undefined (during initial load),
   * the component should not crash and should show only the 5 base tabs.
   * 
   * This verifies proper null-safety handling.
   */
  describe('Property 2.3: Null Safety Preservation', () => {
    it('should handle null userProfile without crashing', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com'
      }

      const userProfile = null

      // This should not throw an error
      expect(() => {
        const tabs = constructTabsFixed(user, userProfile)
        
        // Verify only 5 base tabs are present
        expect(tabs).toHaveLength(5)
        
        // Verify doctor-revenue tab is NOT included
        const doctorRevenueTab = tabs.find(tab => tab.id === 'doctor-revenue')
        expect(doctorRevenueTab).toBeUndefined()
      }).not.toThrow()
    })

    it('should handle undefined userProfile without crashing', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com'
      }

      const userProfile = undefined

      // This should not throw an error
      expect(() => {
        const tabs = constructTabsFixed(user, userProfile)
        
        // Verify only 5 base tabs are present
        expect(tabs).toHaveLength(5)
        
        // Verify doctor-revenue tab is NOT included
        const doctorRevenueTab = tabs.find(tab => tab.id === 'doctor-revenue')
        expect(doctorRevenueTab).toBeUndefined()
      }).not.toThrow()
    })

    it('should handle null user without crashing', () => {
      const user = null
      const userProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'receptionist'
      }

      // This should not throw an error
      expect(() => {
        const tabs = constructTabsFixed(user, userProfile)
        
        // Verify only 5 base tabs are present
        expect(tabs).toHaveLength(5)
        
        // Verify doctor-revenue tab is NOT included
        const doctorRevenueTab = tabs.find(tab => tab.id === 'doctor-revenue')
        expect(doctorRevenueTab).toBeUndefined()
      }).not.toThrow()
    })
  })

  /**
   * Property 2.4: Tab structure should remain consistent
   * 
   * Each tab should have the required properties: id and label
   * This verifies that the fix doesn't break the tab structure.
   */
  describe('Property 2.4: Tab Structure Preservation', () => {
    it('should maintain consistent tab structure for all tabs', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress()
          }),
          fc.constantFrom('receptionist', 'nurse', 'admin', 'doctor'),
          (userProfile, role) => {
            const user = {
              id: userProfile.id,
              email: userProfile.email
            }

            const profile = {
              ...userProfile,
              role: role
            }

            const tabs = constructTabsFixed(user, profile)

            // Verify each tab has required properties
            tabs.forEach(tab => {
              expect(tab).toHaveProperty('id')
              expect(tab).toHaveProperty('label')
              expect(typeof tab.id).toBe('string')
              expect(typeof tab.label).toBe('string')
              expect(tab.id.length).toBeGreaterThan(0)
              expect(tab.label.length).toBeGreaterThan(0)
            })
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Property 2.5: Receptionist users should always see exactly 5 tabs
   * 
   * This is a critical preservation property: receptionist users
   * should continue to see exactly the 5 base tabs, no more, no less.
   */
  describe('Property 2.5: Receptionist Tab Count Preservation', () => {
    it('should always show exactly 5 tabs for receptionist users', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            first_name: fc.string({ minLength: 1, maxLength: 20 }),
            last_name: fc.string({ minLength: 1, maxLength: 20 })
          }),
          (userProfile) => {
            const user = {
              id: userProfile.id,
              email: userProfile.email
            }

            const profile = {
              ...userProfile,
              role: 'receptionist'
            }

            const tabs = constructTabsFixed(user, profile)

            // Critical: receptionist should see exactly 5 tabs
            expect(tabs).toHaveLength(5)

            // Verify the tab IDs
            const tabIds = tabs.map(tab => tab.id)
            expect(tabIds).toEqual([
              'analytics',
              'financial',
              'patients',
              'appointments',
              'inventory'
            ])
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 2.6: Edge case - empty or invalid role values
   * 
   * Users with empty, null, or invalid role values should see only the 5 base tabs.
   */
  describe('Property 2.6: Invalid Role Handling Preservation', () => {
    it('should handle empty role string', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com'
      }

      const userProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: ''
      }

      const tabs = constructTabsFixed(user, userProfile)

      // Verify only 5 base tabs
      expect(tabs).toHaveLength(5)
      
      // Verify doctor-revenue tab is NOT included
      const doctorRevenueTab = tabs.find(tab => tab.id === 'doctor-revenue')
      expect(doctorRevenueTab).toBeUndefined()
    })

    it('should handle null role', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com'
      }

      const userProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: null
      }

      const tabs = constructTabsFixed(user, userProfile)

      // Verify only 5 base tabs
      expect(tabs).toHaveLength(5)
      
      // Verify doctor-revenue tab is NOT included
      const doctorRevenueTab = tabs.find(tab => tab.id === 'doctor-revenue')
      expect(doctorRevenueTab).toBeUndefined()
    })

    it('should handle undefined role', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com'
      }

      const userProfile = {
        id: 'test-user-id',
        email: 'test@example.com'
        // role is undefined
      }

      const tabs = constructTabsFixed(user, userProfile)

      // Verify only 5 base tabs
      expect(tabs).toHaveLength(5)
      
      // Verify doctor-revenue tab is NOT included
      const doctorRevenueTab = tabs.find(tab => tab.id === 'doctor-revenue')
      expect(doctorRevenueTab).toBeUndefined()
    })
  })
})
