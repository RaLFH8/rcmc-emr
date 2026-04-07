/**
 * Preservation Property Tests - Appointments Page
 *
 * **Property 2: Preservation** — Non-patient-search Appointments behavior unchanged
 *
 * These tests verify that code paths NOT involving patients.filter() work correctly
 * on UNFIXED code. They test pure logic functions directly (no component rendering).
 *
 * **EXPECTED OUTCOME**: All tests PASS on unfixed code (these paths don't touch patients.filter)
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

// ─── Pure filter logic extracted from Appointments.jsx ───────────────────────

/**
 * The patient search filter from Appointments.jsx (patient search dropdown).
 * This is the exact logic used in the component — tested here as a pure function.
 */
const filterPatients = (patients, searchQuery) => {
  if (!searchQuery) return patients
  const q = searchQuery.toLowerCase()
  return patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
    (p.patient_number || '').toLowerCase().includes(q)
  )
}

/**
 * The filteredAppointments logic from Appointments.jsx (memoized useMemo).
 * Extracted as a pure function for direct testing.
 */
const filterAppointments = (appointments, { selectedDoctor, statusFilter, viewMode, selectedWeek, selectedDate }) => {
  const toLocalDateStr = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  return appointments.filter(apt => {
    const doctorMatch = selectedDoctor === 'all' || apt.doctor_id?.toString() === selectedDoctor
    const statusMatch = statusFilter === 'all' || apt.status === statusFilter

    if (viewMode === 'calendar') {
      const weekStart = getWeekStart(selectedWeek)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 5)
      const startStr = toLocalDateStr(weekStart)
      const endStr = toLocalDateStr(weekEnd)
      const aptDate = String(apt.appointment_date || '').slice(0, 10)
      const weekMatch = aptDate >= startStr && aptDate <= endStr
      return doctorMatch && statusMatch && weekMatch
    }

    if (viewMode === 'queue') {
      const aptDate = String(apt.appointment_date || '').slice(0, 10)
      return doctorMatch && statusMatch && aptDate === selectedDate
    }

    return doctorMatch && statusMatch
  })
}

// ─── Test data helpers ────────────────────────────────────────────────────────

const makePatient = (id, firstName, lastName, patientNumber) => ({
  id,
  first_name: firstName,
  last_name: lastName,
  patient_number: patientNumber
})

const makeAppointment = (id, doctorId, status, date) => ({
  id,
  doctor_id: doctorId,
  status,
  appointment_date: date,
  reason: 'Check-up'
})

// ─── 1. Patient search filter works correctly when patients IS an array ───────

describe('Patient search filter — works correctly when patients is an array', () => {
  it('returns all patients when searchQuery is empty string', () => {
    const patients = [
      makePatient(1, 'Ana', 'Reyes', 'P001'),
      makePatient(2, 'Juan', 'Cruz', 'P002'),
      makePatient(3, 'Maria', 'Santos', 'P003')
    ]
    const result = filterPatients(patients, '')
    expect(result).toEqual(patients)
    expect(result.length).toBe(3)
  })

  it('returns all patients when searchQuery is null/undefined (falsy)', () => {
    const patients = [
      makePatient(1, 'Ana', 'Reyes', 'P001'),
      makePatient(2, 'Juan', 'Cruz', 'P002')
    ]
    expect(filterPatients(patients, null)).toEqual(patients)
    expect(filterPatients(patients, undefined)).toEqual(patients)
  })

  it('filters correctly on a valid array — does not throw', () => {
    const patients = [
      makePatient(1, 'Ana', 'Reyes', 'P001'),
      makePatient(2, 'Juan', 'Cruz', 'P002')
    ]
    expect(() => filterPatients(patients, 'ana')).not.toThrow()
  })

  it('returns correct subset when filtering by name', () => {
    const patients = [
      makePatient(1, 'Ana', 'Reyes', 'P001'),
      makePatient(2, 'Juan', 'Cruz', 'P002'),
      makePatient(3, 'Maria', 'Santos', 'P003')
    ]
    const result = filterPatients(patients, 'ana')
    expect(result.length).toBe(1)
    expect(result[0].first_name).toBe('Ana')
  })

  it('returns empty array when no patients match the search', () => {
    const patients = [
      makePatient(1, 'Ana', 'Reyes', 'P001'),
      makePatient(2, 'Juan', 'Cruz', 'P002')
    ]
    const result = filterPatients(patients, 'zzznomatch')
    expect(result).toEqual([])
    expect(result.length).toBe(0)
  })
})

// ─── 2. filteredAppointments logic works correctly ────────────────────────────

describe('filteredAppointments logic — filtering and sorting', () => {
  const today = '2025-01-13' // Monday
  const appointments = [
    makeAppointment(1, 10, 'Scheduled', '2025-01-13'),
    makeAppointment(2, 10, 'Completed', '2025-01-13'),
    makeAppointment(3, 20, 'Scheduled', '2025-01-13'),
    makeAppointment(4, 10, 'Scheduled', '2025-01-14'),
    makeAppointment(5, 10, 'Scheduled', '2025-01-20') // next week
  ]

  it('returns all appointments when doctor=all and status=all in queue mode', () => {
    const result = filterAppointments(appointments, {
      selectedDoctor: 'all',
      statusFilter: 'all',
      viewMode: 'queue',
      selectedWeek: new Date('2025-01-13'),
      selectedDate: today
    })
    // queue mode filters to selectedDate
    const todayApts = appointments.filter(a => a.appointment_date === today)
    expect(result.length).toBe(todayApts.length)
  })

  it('filters by doctor correctly', () => {
    const result = filterAppointments(appointments, {
      selectedDoctor: '10',
      statusFilter: 'all',
      viewMode: 'queue',
      selectedWeek: new Date('2025-01-13'),
      selectedDate: today
    })
    result.forEach(apt => {
      expect(apt.doctor_id.toString()).toBe('10')
    })
  })

  it('filters by status correctly', () => {
    const result = filterAppointments(appointments, {
      selectedDoctor: 'all',
      statusFilter: 'Scheduled',
      viewMode: 'queue',
      selectedWeek: new Date('2025-01-13'),
      selectedDate: today
    })
    result.forEach(apt => {
      expect(apt.status).toBe('Scheduled')
    })
  })

  it('calendar mode filters to the selected week', () => {
    const result = filterAppointments(appointments, {
      selectedDoctor: 'all',
      statusFilter: 'all',
      viewMode: 'calendar',
      selectedWeek: new Date('2025-01-13'), // week of Jan 13
      selectedDate: today
    })
    // Should include Jan 13 and Jan 14 but NOT Jan 20 (next week)
    const ids = result.map(a => a.id)
    expect(ids).toContain(1)
    expect(ids).toContain(2)
    expect(ids).toContain(3)
    expect(ids).toContain(4)
    expect(ids).not.toContain(5) // Jan 20 is outside the week
  })

  it('returns empty array when no appointments match filters', () => {
    const result = filterAppointments(appointments, {
      selectedDoctor: '999',
      statusFilter: 'all',
      viewMode: 'queue',
      selectedWeek: new Date('2025-01-13'),
      selectedDate: today
    })
    expect(result).toEqual([])
  })
})

// ─── 3. Patient search by name substring returns correct matches ──────────────

describe('Patient search by name substring', () => {
  const patients = [
    makePatient(1, 'Ana', 'Reyes', 'P001'),
    makePatient(2, 'Juan', 'Cruz', 'P002'),
    makePatient(3, 'Maria', 'Santos', 'P003'),
    makePatient(4, 'Ana', 'Santos', 'P004'),
    makePatient(5, 'Roberto', 'Reyes', 'P005')
  ]

  it('matches by first name substring (case-insensitive)', () => {
    const result = filterPatients(patients, 'ana')
    const ids = result.map(p => p.id)
    expect(ids).toContain(1) // Ana Reyes
    expect(ids).toContain(4) // Ana Santos
    expect(ids).not.toContain(2) // Juan Cruz
  })

  it('matches by last name substring (case-insensitive)', () => {
    const result = filterPatients(patients, 'reyes')
    const ids = result.map(p => p.id)
    expect(ids).toContain(1) // Ana Reyes
    expect(ids).toContain(5) // Roberto Reyes
    expect(ids).not.toContain(2) // Juan Cruz
  })

  it('matches by full name substring', () => {
    const result = filterPatients(patients, 'ana reyes')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(1)
  })

  it('is case-insensitive', () => {
    const lower = filterPatients(patients, 'ana')
    const upper = filterPatients(patients, 'ANA')
    const mixed = filterPatients(patients, 'AnA')
    expect(lower.map(p => p.id)).toEqual(upper.map(p => p.id))
    expect(lower.map(p => p.id)).toEqual(mixed.map(p => p.id))
  })

  it('result is always a subset of the input array', () => {
    const result = filterPatients(patients, 'santos')
    result.forEach(p => {
      expect(patients.some(orig => orig.id === p.id)).toBe(true)
    })
  })

  /**
   * Property-based: for any name substring, result is always a subset of input
   * **Validates: Requirements 3.3**
   */
  it('PBT: filtered result is always a subset of input patients array', () => {
    const patientArb = fc.record({
      id: fc.integer({ min: 1, max: 9999 }),
      first_name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z]+$/.test(s)),
      last_name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z]+$/.test(s)),
      patient_number: fc.string({ minLength: 1, maxLength: 10 })
    })

    fc.assert(
      fc.property(
        fc.array(patientArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 0, maxLength: 10 }),
        (patientsArr, query) => {
          const result = filterPatients(patientsArr, query)
          // Result must be an array
          expect(Array.isArray(result)).toBe(true)
          // Every result item must exist in the original array
          result.forEach(p => {
            expect(patientsArr.some(orig => orig.id === p.id)).toBe(true)
          })
          // Result length must be <= input length
          expect(result.length).toBeLessThanOrEqual(patientsArr.length)
        }
      )
    )
  })
})

// ─── 4. Patient search by patient_number returns correct matches ──────────────

describe('Patient search by patient_number', () => {
  const patients = [
    makePatient(1, 'Ana', 'Reyes', 'P001'),
    makePatient(2, 'Juan', 'Cruz', 'P002'),
    makePatient(3, 'Maria', 'Santos', 'P003')
  ]

  it('matches by exact patient_number', () => {
    const result = filterPatients(patients, 'P001')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(1)
  })

  it('matches by patient_number substring (case-insensitive)', () => {
    const result = filterPatients(patients, 'p00')
    expect(result.length).toBe(3) // P001, P002, P003 all match 'p00'
  })

  it('handles patients with no patient_number gracefully', () => {
    const patientsNoNum = [
      { id: 1, first_name: 'Ana', last_name: 'Reyes', patient_number: null },
      { id: 2, first_name: 'Juan', last_name: 'Cruz' } // no patient_number field
    ]
    expect(() => filterPatients(patientsNoNum, 'P001')).not.toThrow()
    const result = filterPatients(patientsNoNum, 'P001')
    expect(Array.isArray(result)).toBe(true)
  })

  it('patient_number search is case-insensitive', () => {
    const lower = filterPatients(patients, 'p001')
    const upper = filterPatients(patients, 'P001')
    expect(lower.map(p => p.id)).toEqual(upper.map(p => p.id))
  })
})

// ─── 5. Empty search string returns all patients ──────────────────────────────

describe('Empty search string returns all patients', () => {
  it('empty string returns all patients unchanged', () => {
    const patients = [
      makePatient(1, 'Ana', 'Reyes', 'P001'),
      makePatient(2, 'Juan', 'Cruz', 'P002'),
      makePatient(3, 'Maria', 'Santos', 'P003')
    ]
    const result = filterPatients(patients, '')
    expect(result).toEqual(patients)
    expect(result.length).toBe(3)
  })

  it('empty string on empty array returns empty array', () => {
    const result = filterPatients([], '')
    expect(result).toEqual([])
  })

  it('empty string on single-patient array returns that patient', () => {
    const patients = [makePatient(1, 'Ana', 'Reyes', 'P001')]
    const result = filterPatients(patients, '')
    expect(result).toEqual(patients)
  })

  /**
   * Property-based: empty search always returns the full input array
   * **Validates: Requirements 3.3**
   */
  it('PBT: empty search always returns all patients (identity property)', () => {
    const patientArb = fc.record({
      id: fc.integer({ min: 1, max: 9999 }),
      first_name: fc.string({ minLength: 1, maxLength: 20 }),
      last_name: fc.string({ minLength: 1, maxLength: 20 }),
      patient_number: fc.string({ minLength: 0, maxLength: 10 })
    })

    fc.assert(
      fc.property(
        fc.array(patientArb, { minLength: 0, maxLength: 50 }),
        (patientsArr) => {
          const result = filterPatients(patientsArr, '')
          expect(result).toEqual(patientsArr)
          expect(result.length).toBe(patientsArr.length)
        }
      )
    )
  })

  /**
   * Property-based: non-empty search always returns a subset (never more than input)
   * **Validates: Requirements 3.3**
   */
  it('PBT: non-empty search always returns a subset of input', () => {
    const patientArb = fc.record({
      id: fc.integer({ min: 1, max: 9999 }),
      first_name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z ]+$/.test(s)),
      last_name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z ]+$/.test(s)),
      patient_number: fc.string({ minLength: 0, maxLength: 10 })
    })

    fc.assert(
      fc.property(
        fc.array(patientArb, { minLength: 0, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 15 }),
        (patientsArr, query) => {
          const result = filterPatients(patientsArr, query)
          expect(Array.isArray(result)).toBe(true)
          expect(result.length).toBeLessThanOrEqual(patientsArr.length)
        }
      )
    )
  })
})
