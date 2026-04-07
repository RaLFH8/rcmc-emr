import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS = {
  success: <CheckCircle size={18} className="text-green-500 flex-shrink-0" />,
  error: <AlertCircle size={18} className="text-red-500 flex-shrink-0" />,
  info: <Info size={18} className="text-blue-500 flex-shrink-0" />,
}

const STYLES = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
}

function ToastItem({ id, message, type, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 4000)
    return () => clearTimeout(t)
  }, [id, onRemove])

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full ${STYLES[type]} animate-in slide-in-from-right-5`}>
      {ICONS[type]}
      <p className="text-sm text-slate-800 flex-1">{message}</p>
      <button onClick={() => onRemove(id)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  toast.success = (msg) => toast(msg, 'success')
  toast.error = (msg) => toast(msg, 'error')
  toast.info = (msg) => toast(msg, 'info')

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
