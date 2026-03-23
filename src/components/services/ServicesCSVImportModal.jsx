import { useState, useRef } from 'react'
import { X, Upload, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { parseCSVLine } from '../../utils/csvParser'

const REQUIRED_COLS = ['name', 'price']

// Map free-text categories to the values the DB CHECK constraint accepts
const VALID_CATEGORIES = ['Consultation', 'Laboratory', 'Imaging', 'Procedure', 'Therapy', 'Other']
const CATEGORY_MAP = {
  hematology: 'Laboratory', 'lab': 'Laboratory', laboratory: 'Laboratory',
  'diagnostic services': 'Imaging', imaging: 'Imaging', radiology: 'Imaging', xray: 'Imaging',
  consultation: 'Consultation', consult: 'Consultation',
  procedure: 'Procedure', surgery: 'Procedure', nursing: 'Procedure',
  therapy: 'Therapy', rehabilitation: 'Therapy', rehab: 'Therapy',
}
function normalizeCategory(raw) {
  if (!raw) return 'Other'
  const lower = raw.trim().toLowerCase()
  if (VALID_CATEGORIES.map(v => v.toLowerCase()).includes(lower)) return raw.trim()
  return CATEGORY_MAP[lower] || 'Other'
}

const TEMPLATE_ROWS = [
  'name,category,price,description,code,status',
  'Complete Blood Count,Laboratory,350,Full blood panel test,LAB-001,Active',
  'Chest X-Ray,Imaging,500,Standard chest radiograph,DX-001,Active',
  'IV Insertion,Procedure,150,Peripheral IV line insertion,,Active',
]

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim() !== '')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line).map(v => v.trim())
    const row = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_ROWS.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'services_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const ServicesCSVImportModal = ({ onImportComplete, onClose }) => {
  const fileRef = useRef()
  const [rows, setRows] = useState(null)
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [parseError, setParseError] = useState('')

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setParseError('')
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target.result)
        if (parsed.length === 0) { setParseError('CSV is empty or has no data rows.'); return }
        const missing = REQUIRED_COLS.filter(c => !Object.keys(parsed[0]).includes(c))
        if (missing.length > 0) {
          setParseError(`Missing required columns: ${missing.join(', ')}`)
          return
        }
        setRows(parsed)
      } catch {
        setParseError('Failed to parse CSV file.')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!rows) return
    setImporting(true)
    let inserted = 0, skipped = 0, failed = 0

    // Wrap a supabase call with a hard timeout
    const withTimeout = (promise, ms = 5000) => {
      let timer
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), ms)
      })
      return Promise.race([
        promise.then(res => { clearTimeout(timer); return res }),
        timeout,
      ])
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const name = row.name?.trim()
        const price = parseFloat(row.price)
        if (!name || isNaN(price)) { skipped++; continue }

        // Generate unique code using index to avoid timestamp collisions in tight loop
        const code = row.code?.trim() ||
          `${normalizeCategory(row.category).substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}${i.toString().padStart(3, '0')}`

        const item = {
          name,
          category: normalizeCategory(row.category),
          price,
          description: row.description?.trim() || '',
          code,
          status: row.status?.trim() || 'Active',
        }

        const { error } = await withTimeout(
          supabase.from('services').insert(item).select('id').single()
        )

        if (error) {
          // 23505 = unique violation — treat as skip
          if (error.code === '23505') { skipped++ } else { failed++ }
        } else {
          inserted++
        }
      } catch (err) {
        if (err?.message === 'timeout') {
          // Stop early — RLS policy is likely blocking inserts silently
          setResult({
            inserted, skipped, failed: failed + (rows.length - i),
            total: rows.length,
            rlsWarning: true,
          })
          setImporting(false)
          return
        }
        failed++
      }
    }

    setResult({ inserted, skipped, failed, total: rows.length })
    setImporting(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Import Services CSV</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Export template button */}
          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-teal-400 text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-colors"
          >
            <Download size={18} />
            Export CSV Template
          </button>

          {/* Column info */}
          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600">
            <p className="font-semibold mb-1">Required columns:</p>
            <code className="text-teal-700">name, price</code>
            <p className="mt-2 font-semibold">Optional columns:</p>
            <code className="text-slate-500">category, description, code, status</code>
            <p className="mt-2">Valid categories: <code className="text-teal-700">Consultation, Laboratory, Imaging, Procedure, Therapy, Other</code> (other values are auto-mapped)</p>
          </div>

          {/* File picker */}
          {!result && (
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 transition-colors"
            >
              <Upload size={32} className="mx-auto mb-2 text-slate-400" />
              {fileName ? (
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-teal-700">
                  <FileText size={16} />
                  {fileName}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Click to select a CSV file</p>
              )}
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
          )}

          {parseError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
              <AlertTriangle size={16} />
              {parseError}
            </div>
          )}

          {rows && !result && (
            <p className="text-sm text-slate-600 text-center">
              {rows.length} row{rows.length !== 1 ? 's' : ''} ready to import
            </p>
          )}

          {/* Result */}
          {result && (
            <div className="bg-slate-50 rounded-xl p-5 space-y-3">
              <div className={`flex items-center gap-2 font-semibold ${result.rlsWarning ? 'text-amber-700' : 'text-green-700'}`}>
                {result.rlsWarning ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                {result.rlsWarning ? 'Import stopped — database permission issue' : 'Import complete'}
              </div>
              {result.rlsWarning && (
                <div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3">
                  The import timed out. This usually means the <strong>services</strong> table is missing an INSERT policy in Supabase. Run this in your SQL editor:
                  <pre className="mt-2 bg-white rounded p-2 text-xs overflow-x-auto whitespace-pre-wrap">{`CREATE POLICY "Allow authenticated insert on services"\nON services FOR INSERT TO authenticated WITH CHECK (true);\n\nCREATE POLICY "Allow authenticated select on services"\nON services FOR SELECT TO authenticated USING (true);`}</pre>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-700">{result.inserted}</p>
                  <p className="text-xs text-green-600 font-semibold">Inserted</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-amber-700">{result.skipped}</p>
                  <p className="text-xs text-amber-600 font-semibold">Skipped</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-red-700">{result.failed}</p>
                  <p className="text-xs text-red-600 font-semibold">Failed</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {result ? (
              <button
                onClick={onImportComplete}
                className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
              >
                Done
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={!rows || importing}
                className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicesCSVImportModal
