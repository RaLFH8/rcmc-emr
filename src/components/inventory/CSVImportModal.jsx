import { useState, useRef } from 'react'
import { X, Upload, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { buildExistingKeySet, isDuplicate } from '../../utils/inventoryBatchUtils'
import { parseCSVLine } from '../../utils/csvParser'

const REQUIRED_COLS = ['item_name', 'price', 'stock', 'unit']

const TEMPLATE_ROWS = [
  'item_name,price,stock,unit,category,supplier,reorder_level,batch_number,lot_number,expiration_date,manufacture_date',
  'Amoxicillin 500mg,12.50,100,capsule,Anti-Infectives,PharmaCorp,20,BATCH-001,LOT-001,2026-12-31,2024-01-01',
  'Paracetamol 500mg,5.00,200,tablet,Analgesics,MedSupply,30,BATCH-002,LOT-002,2027-06-30,2024-03-01',
]

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_ROWS.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'inventory_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function parseDate(val) {
  if (!val || val.trim() === '') return null
  const d = new Date(val.trim())
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim() !== '')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line).map(v => v.trim())
    const row = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

const CSVImportModal = ({ inventory, onImportComplete, onClose }) => {
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
    const keySet = buildExistingKeySet(inventory)
    let inserted = 0, skipped = 0, failed = 0
    const total = rows.length

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        if (isDuplicate(row, keySet)) { skipped++; continue }
        // Use index to guarantee uniqueness when batch_number is auto-generated
        const batchNum = row.batch_number?.trim() || `BATCH-${Date.now()}-${i.toString().padStart(4, '0')}`
        // Pre-register this row's keys so later rows in the same CSV don't collide
        const name = (row.item_name ?? '').toLowerCase()
        keySet.batchKeys.add(`${name}|${batchNum}`)
        keySet.naturalKeys.add(`${name}|${row.lot_number ?? ''}|${row.expiration_date ?? ''}|${row.manufacture_date ?? ''}`)
        const stockQty = parseInt(row.stock) || 0
        const reorderLevel = parseInt(row.reorder_level) || 10
        let status = 'In Stock'
        if (stockQty === 0) status = 'Out of Stock'
        else if (stockQty <= reorderLevel * 0.3) status = 'Critical'
        else if (stockQty <= reorderLevel) status = 'Low Stock'

        const item = {
          name: row.item_name,
          category: row.category || 'Anti-Infectives',
          unit: row.unit,
          price: parseFloat(row.price) || 0,
          supplier: row.supplier || '',
          stock: stockQty,
          reorder_level: reorderLevel,
          status,
          batch_number: batchNum,
          lot_number: row.lot_number || null,
          expiration_date: parseDate(row.expiration_date),
          manufacture_date: parseDate(row.manufacture_date),
        }
        const { error } = await supabase.from('inventory').insert([item])

        if (error) {
          // 23505 = unique_violation — treat as skipped duplicate
          if (error.code === '23505') {
            skipped++
          } else {
            failed++
            console.error('Row failed:', error.message, item)
          }
        } else {
          inserted++
        }
      } catch {
        failed++
      }
    }

    setResult({ inserted, skipped, failed, total })
    setImporting(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Import Inventory CSV</h2>
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

          {/* Template hint */}
          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600">
            <p className="font-semibold mb-1">Required columns:</p>
            <code className="text-teal-700">item_name, price, stock, unit</code>
            <p className="mt-2 font-semibold">Optional columns:</p>
            <code className="text-slate-500">category, supplier, reorder_level, batch_number, lot_number, expiration_date, manufacture_date</code>
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
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <CheckCircle size={20} />
                Import complete
              </div>
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
              <p className="text-xs text-center text-slate-500">
                Total: {result.total} rows — {result.inserted + result.skipped + result.failed === result.total ? '✓ Accounted' : '⚠ Count mismatch'}
              </p>
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

export default CSVImportModal
