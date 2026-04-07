// Normal clinical ranges for abnormal value flagging
const NORMAL_RANGES = {
  blood_pressure_systolic:  { min: 90,   max: 139  },
  blood_pressure_diastolic: { min: 60,   max: 89   },
  heart_rate:               { min: 60,   max: 100  },
  temperature:              { min: 36.1, max: 37.2 },
  respiratory_rate:         { min: 12,   max: 20   },
  oxygen_saturation:        { min: 95,   max: 100  },
  // weight is intentionally excluded — no flagging
}

/**
 * Displays a vital sign value with an amber/red badge when outside normal range.
 * Weight is never flagged regardless of value.
 *
 * @param {string} field - vital sign field name (e.g. 'heart_rate')
 * @param {number|null} value - the measured value
 * @param {string} [unit] - optional unit label (e.g. 'bpm')
 */
export default function VitalSignsBadge({ field, value, unit }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">—</span>
  }

  const range = NORMAL_RANGES[field]
  const numVal = parseFloat(value)
  const isAbnormal = range && (numVal < range.min || numVal > range.max)

  const display = unit ? `${value} ${unit}` : String(value)

  if (!isAbnormal) {
    return <span className="text-slate-700">{display}</span>
  }

  // High vs low for colour distinction
  const isHigh = range && numVal > range.max
  const badgeClass = isHigh
    ? 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700'
    : 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700'

  return (
    <span className={badgeClass} title={`Outside normal range (${range.min}–${range.max})`}>
      {display}
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    </span>
  )
}
