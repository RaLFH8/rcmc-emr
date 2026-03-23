import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2, Wifi, WifiOff, Database } from 'lucide-react'

const DEBOUNCE_MS = 300
const MAX_RESULTS = 10
const CSV_URL = 'https://raw.githubusercontent.com/niccoreyes/searchmedsfda/main/ALL_DrugProducts.csv'

// Module-level cache so the drug list is only fetched once per session
let drugCache = null        // Array of drug objects
let cacheStatus = 'idle'    // 'idle' | 'loading' | 'ready' | 'error'
const cacheListeners = []   // Callbacks waiting for the cache

function notifyListeners(status) {
  cacheListeners.forEach(fn => fn(status))
  cacheListeners.length = 0
}

/**
 * Load the full PH FDA drug list from the public CSV.
 * Falls back to the FHIR CodeSystem if the CSV is unavailable.
 */
async function loadDrugDatabase() {
  if (cacheStatus === 'ready') return
  if (cacheStatus === 'loading') {
    return new Promise(resolve => cacheListeners.push(resolve))
  }
  // Allow retry if previous attempt errored
  if (cacheStatus === 'error') {
    cacheStatus = 'idle'
  }

  cacheStatus = 'loading'

  // --- Primary: CSV from GitHub ---
  try {
    const res = await fetch(CSV_URL)
    if (!res.ok) throw new Error(`CSV HTTP ${res.status}`)
    const text = await res.text()

    const rows = parseCSV(text)
    if (!rows.length) throw new Error('Empty CSV')

    const headers = rows[0].map(h => h.trim())
    drugCache = rows.slice(1).map(row => {
      const obj = {}
      headers.forEach((h, i) => { obj[h] = (row[i] || '').trim() })
      const genericName = obj['Generic Name'] || ''
      const brandName = obj['Brand Name'] || ''
      if (!genericName && !brandName) return null
      return {
        code: obj['Registration Number'] || '',
        genericName,
        brandName,
        dosageStrength: obj['Dosage Strength'] || '',
        dosageForm: obj['Dosage Form'] || '',
        classification: obj['Classification'] || '',
        manufacturer: obj['Manufacturer'] || '',
        _search: [genericName, brandName, obj['Dosage Strength'], obj['Dosage Form']]
          .map(s => (s || '').toLowerCase())
          .join(' '),
      }
    }).filter(Boolean)

    cacheStatus = 'ready'
    notifyListeners('ready')
    return
  } catch (csvErr) {
    console.warn('CSV load failed, trying FHIR fallback:', csvErr.message)
  }

  // --- Fallback: FHIR CodeSystem ---
  try {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 15000) // 15s timeout

    const res = await fetch('https://tx.fhirlab.net/fhir/CodeSystem/TestPHFDACPRCS', {
      headers: { Accept: 'application/fhir+json' },
      signal: controller.signal,
      mode: 'cors',
    })
    clearTimeout(tid)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const cs = await res.json()
    if (cs.resourceType !== 'CodeSystem') throw new Error('Not a CodeSystem')

    const concepts = cs.concept || []
    drugCache = concepts
      .map(c => {
        const props = {}
        ;(c.property || []).forEach(p => {
          if (p.code && p.valueString !== undefined) props[p.code] = p.valueString
        })
        const genericName = props.genericName || c.display || ''
        const brandName = props.brandName || c.display || ''
        if (!genericName && !brandName) return null
        return {
          code: c.code || '',
          genericName,
          brandName,
          dosageStrength: props.dosageStrength || '',
          dosageForm: props.dosageForm || '',
          classification: props.classification || '',
          manufacturer: props.manufacturer || '',
          _search: [genericName, brandName, props.dosageStrength, props.dosageForm]
            .map(s => (s || '').toLowerCase())
            .join(' '),
        }
      })
      .filter(Boolean)

    cacheStatus = 'ready'
    notifyListeners('ready')
    return
  } catch (fhirErr) {
    console.warn('FHIR fallback also failed:', fhirErr.message)
  }

  cacheStatus = 'error'
  notifyListeners('error')
}

function parseCSV(text) {
  const pattern = /(,|\r?\n|\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^",\r\n]*))/gi
  const data = [[]]
  let m
  while ((m = pattern.exec(text))) {
    const delim = m[1]
    if (delim.length && delim !== ',') data.push([])
    data[data.length - 1].push(m[2] !== undefined ? m[2].replace(/""/g, '"') : m[3])
  }
  if (data.length && data[data.length - 1].length === 1 && data[data.length - 1][0] === '')
    data.pop()
  return data
}

function searchLocal(term) {
  if (!drugCache || !term || term.length < 2) return []
  const terms = term.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const results = []
  for (const drug of drugCache) {
    if (terms.every(t => drug._search.includes(t))) {
      results.push(drug)
      if (results.length >= MAX_RESULTS) break
    }
  }
  return results
}

/**
 * FDADrugSearch — inline drug search backed by PH FDA database.
 * Loads the full database once (FHIR → CSV fallback) and searches locally.
 */
const FDADrugSearch = ({ value, onChange, placeholder = 'Search PH FDA drug database...' }) => {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [dbStatus, setDbStatus] = useState(cacheStatus) // 'idle'|'loading'|'ready'|'error'
  const [selected, setSelected] = useState(!!value)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  // Sync external value
  useEffect(() => {
    if (value !== query) {
      setQuery(value || '')
      setSelected(!!value)
    }
  }, [value])

  // Kick off DB load on mount (no-op if already loading/ready)
  useEffect(() => {
    if (cacheStatus === 'idle' || cacheStatus === 'error') {
      setDbStatus('loading')
      loadDrugDatabase().then(() => setDbStatus(cacheStatus))
    } else if (cacheStatus === 'loading') {
      setDbStatus('loading')
      // Use the status argument passed by notifyListeners instead of re-reading module var
      cacheListeners.push((status) => setDbStatus(status))
    } else {
      // already 'ready' — sync local state
      setDbStatus(cacheStatus)
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = useCallback((term) => {
    if (!term || term.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    if (cacheStatus !== 'ready') {
      setOpen(true)
      return
    }
    setLoading(true)
    // searchLocal is synchronous but we yield to keep UI responsive
    setTimeout(() => {
      const hits = searchLocal(term)
      setResults(hits)
      setOpen(true)
      setLoading(false)
    }, 0)
  }, [])

  const handleInput = e => {
    const val = e.target.value
    setQuery(val)
    setSelected(false)
    onChange(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), DEBOUNCE_MS)
  }

  const handleSelect = drug => {
    const parts = [drug.genericName, drug.dosageStrength, drug.dosageForm].filter(Boolean)
    const label = parts.join(' ') + (drug.brandName && drug.brandName !== drug.genericName ? ` (${drug.brandName})` : '')
    setQuery(label)
    setSelected(true)
    setOpen(false)
    setResults([])
    onChange(label)
  }

  const handleClear = () => {
    setQuery('')
    setSelected(false)
    setResults([])
    setOpen(false)
    onChange('')
  }

  const isOffline = dbStatus === 'error'
  const isDbLoading = dbStatus === 'loading'

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => query.length >= 2 && !selected && doSearch(query)}
          placeholder={placeholder}
          className="w-full pl-8 pr-16 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent text-sm"
          autoComplete="off"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {(loading || isDbLoading) && (
            <Loader2 size={14} className="animate-spin text-slate-400" />
          )}
          {!loading && !isDbLoading && isOffline && (
            <WifiOff size={14} className="text-amber-400" title="Drug database unavailable — type manually" />
          )}
          {!loading && !isDbLoading && !isOffline && selected && (
            <Wifi size={14} className="text-teal-500" title="FDA verified" />
          )}
          {!loading && !isDbLoading && !isOffline && !selected && dbStatus === 'ready' && (
            <Database size={14} className="text-slate-300" title="FDA database loaded" />
          )}
          {query && (
            <button type="button" onClick={handleClear} className="p-0.5 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isDbLoading && (
            <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Loading PH FDA drug database…
            </div>
          )}

          {!isDbLoading && isOffline && (
            <div className="px-4 py-3 text-sm text-amber-600 flex items-center gap-2">
              <WifiOff size={14} />
              <span>Drug database unavailable — type drug name manually</span>
            </div>
          )}

          {!isDbLoading && !isOffline && loading && (
            <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Searching…
            </div>
          )}

          {!isDbLoading && !isOffline && !loading && results.length === 0 && query.length >= 2 && (
            <div className="px-4 py-3 text-sm text-slate-500">
              No results found. You can still type the drug name manually.
            </div>
          )}

          {!isDbLoading && !loading && results.map((drug, i) => {
            const parts = [drug.genericName, drug.dosageStrength, drug.dosageForm].filter(Boolean)
            const label = parts.join(' ') + (drug.brandName && drug.brandName !== drug.genericName ? ` (${drug.brandName})` : '')
            return (
              <button
                key={drug.code || i}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(drug)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <div className="text-sm font-medium text-slate-900 truncate">{label}</div>
                <div className="flex gap-3 mt-0.5">
                  {drug.classification && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      drug.classification.toLowerCase().includes('prescription')
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {drug.classification.toLowerCase().includes('prescription') ? 'Rx' : 'OTC'}
                    </span>
                  )}
                  {drug.dosageForm && (
                    <span className="text-xs text-slate-500">{drug.dosageForm}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FDADrugSearch
