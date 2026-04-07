import { useState } from 'react'
import { supabase, db } from '../lib/supabase'

// Validation ranges (min/max allowed input)
const VALIDATION_RANGES = {
  blood_pressure_systolic:  { min: 60,   max: 250,  label: 'BP Systolic',   unit: 'mmHg' },
  blood_pressure_diastolic: { min: 40,   max: 150,  label: 'BP Diastolic',  unit: 'mmHg' },
  heart_rate:               { min: 30,   max: 250,  label: 'Heart Rate',    unit: 'bpm'  },
  temperature:              { min: 34.0, max: 42.0, label: 'Temperature',   unit: '°C'   },
  respiratory_rate:         { min: 8,    max: 40,   label: 'Resp. Rate',    unit: '/min' },
  oxygen_saturation:        { min: 70,   max: 100,  label: 'O₂ Saturation', unit: '%'    },
  weight:                   { min: 1,    max: 300,  label: 'Weight',        unit: 'kg'   },
}

// All measurement fields (BP counts as one logical entry but two DB columns)
const MEASUREMENT_FIELDS = ['blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation', 'weight']
// Non-BP fields rendered individually in the grid
const GRID_FIELDS = ['heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation', 'weight']

// Parse "120/80" → { systolic: 120, diastolic: 80 } or null if invalid format
function parseBP(str) {
  if (!str || !str.trim()) return { systolic: null, diastolic: null }
  const match = str.trim().match(/^(\d+)\s*\/\s*(\d+)$/)
  if (!match) return null
  return { systolic: parseInt(match[1], 10), diastolic: parseInt(match[2], 10) }
}

function validateBP(str) {
  if (!str || !str.trim()) return ''
  const parsed = parseBP(str)
  if (!parsed) return 'Enter as systolic/diastolic e.g. 120/80'
  const { systolic, diastolic } = parsed
  const sRange = VALIDATION_RANGES.blood_pressure_systolic
  const dRange = VALIDATION_RANGES.blood_pressure_diastolic
  if (systolic < sRange.min || systolic > sRange.max)
    return `Systolic must be ${sRange.min}–${sRange.max} mmHg`
  if (diastolic < dRange.min || diastolic > dRange.max)
    return `Diastolic must be ${dRange.min}–${dRange.max} mmHg`
  return ''
}

function toLocalDatetimeValue(date) {
  const d = date ? new Date(date) : new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Shared vital signs form used by both entry points.
 *
 * Props:
 *   patientId        {string}   required
 *   appointmentId    {string}   pre-set when opened from Appointments page; null from Patients tab
 *   patientAppointments {array} required when appointmentId is null
 *   initialValues    {object}   pre-populated values when editing
 *   onSuccess        {function} called after successful save
 *   onCancel         {function} called when user cancels
 *   mode             {'appointments'|'patients'}
 */
export default function VitalSignsForm({
  patientId,
  appointmentId: propAppointmentId,
  patientAppointments = [],
  initialValues = {},
  onSuccess,
  onCancel,
  mode = 'appointments',
}) {
  const emptyFields = {
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    weight: '',
    notes: '',
  }

  // Derive initial combined BP string from initialValues
  const initBP = initialValues.blood_pressure_systolic && initialValues.blood_pressure_diastolic
    ? `${initialValues.blood_pressure_systolic}/${initialValues.blood_pressure_diastolic}`
    : ''

  const [bloodPressure, setBloodPressure] = useState(initBP)
  const [bpError, setBpError] = useState('')

  const [fields, setFields] = useState({
    ...emptyFields,
    ...Object.fromEntries(
      Object.entries(initialValues).map(([k, v]) => [k, v ?? ''])
    ),
  })
  const [recordedAt, setRecordedAt] = useState(
    initialValues.recorded_at
      ? toLocalDatetimeValue(initialValues.recorded_at)
      : toLocalDatetimeValue()
  )
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(
    propAppointmentId || initialValues.appointment_id || ''
  )
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  // Validate a single field value; returns error string or ''
  function validateField(name, value) {
    if (value === '' || value === null || value === undefined) return ''
    const range = VALIDATION_RANGES[name]
    if (!range) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return `Must be a number`
    if (num < range.min || num > range.max)
      return `Must be ${range.min}–${range.max} ${range.unit}`
    return ''
  }

  function handleChange(name, value) {
    setFields(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
  }

  function handleBlur(name) {
    setErrors(prev => ({ ...prev, [name]: validateField(name, fields[name]) }))
  }

  // Check if at least one measurement field has a value
  const hasAtLeastOneMeasurement = bloodPressure.trim() !== '' || GRID_FIELDS.some(
    f => fields[f] !== '' && fields[f] !== null && fields[f] !== undefined
  )

  const hasRangeErrors = Object.values(errors).some(e => e !== '' && e !== undefined)
  const missingTimestamp = !recordedAt

  const canSubmit = hasAtLeastOneMeasurement && !hasRangeErrors && !bpError && !missingTimestamp

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    // Validate BP on submit
    const bpErr = validateBP(bloodPressure)
    if (bpErr) { setBpError(bpErr); return }

    // Re-validate all non-BP fields before submit
    const newErrors = {}
    GRID_FIELDS.forEach(f => {
      newErrors[f] = validateField(f, fields[f])
    })
    setErrors(newErrors)
    if (Object.values(newErrors).some(e => e)) return

    setSaving(true)
    setSubmitError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const bpParsed = parseBP(bloodPressure)

      const record = {
        patient_id: patientId,
        appointment_id: selectedAppointmentId || null,
        recorded_at: new Date(recordedAt).toISOString(),
        recorded_by: user?.id || null,
        notes: fields.notes || null,
        blood_pressure_systolic: bpParsed?.systolic ?? null,
        blood_pressure_diastolic: bpParsed?.diastolic ?? null,
      }

      // Only include non-BP measurement fields that have values
      GRID_FIELDS.forEach(f => {
        record[f] = (fields[f] !== '' && fields[f] !== null && fields[f] !== undefined)
          ? parseFloat(fields[f])
          : null
      })

      // If editing an existing record (has id), update; otherwise upsert
      if (initialValues.id) {
        await db.updateVitals(initialValues.id, record)
      } else {
        await db.upsertVitals(record)
      }

      onSuccess?.()
    } catch (err) {
      setSubmitError(err.message || 'Failed to save vital signs. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Recorded At */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Date &amp; Time Recorded <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={recordedAt}
          onChange={e => setRecordedAt(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        />
        {missingTimestamp && (
          <p className="text-xs text-red-500 mt-1">Date and time is required</p>
        )}
      </div>

      {/* Measurement fields grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Blood Pressure — single combined text input */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Blood Pressure <span className="text-slate-400 font-normal">(mmHg)</span>
          </label>
          <input
            type="text"
            value={bloodPressure}
            onChange={e => { setBloodPressure(e.target.value); setBpError('') }}
            onBlur={() => setBpError(validateBP(bloodPressure))}
            placeholder="e.g. 120/80"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              bpError ? 'border-red-400 bg-red-50' : 'border-slate-200'
            }`}
          />
          {bpError && <p className="text-xs text-red-500 mt-0.5">{bpError}</p>}
        </div>

        {/* Remaining measurement fields */}
        {GRID_FIELDS.map(field => {
          const meta = VALIDATION_RANGES[field]
          return (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {meta.label} <span className="text-slate-400 font-normal">({meta.unit})</span>
              </label>
              <input
                type="number"
                step={field === 'temperature' ? '0.1' : '1'}
                min={meta.min}
                max={meta.max}
                value={fields[field]}
                onChange={e => handleChange(field, e.target.value)}
                onBlur={() => handleBlur(field)}
                placeholder={`${meta.min}–${meta.max}`}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors[field] && (
                <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
        <textarea
          value={fields.notes}
          onChange={e => setFields(prev => ({ ...prev, notes: e.target.value }))}
          rows={2}
          placeholder="Additional observations..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      </div>

      {/* Validation summary */}
      {!hasAtLeastOneMeasurement && (
        <p className="text-xs text-amber-600">At least one measurement field is required.</p>
      )}

      {submitError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{submitError}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Vitals'}
        </button>
      </div>
    </form>
  )
}
