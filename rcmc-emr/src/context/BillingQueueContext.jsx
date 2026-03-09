import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const BillingQueueContext = createContext()

export function BillingQueueProvider({ children }) {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const { user } = useAuth()

  // Fetch initial queue
  useEffect(() => {
    fetchQueue()
  }, [])

  // Polling fallback - refresh queue every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueue()
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('billing_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'billing_queue'
        },
        (payload) => {
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Release stale locks periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await supabase.rpc('release_stale_billing_locks')
        fetchQueue() // Refresh queue after releasing locks
      } catch (error) {
        console.error('Error releasing stale locks:', error)
      }
    }, 60000) // Every 60 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_queue')
        .select(`
          *,
          patient:patients(id, first_name, last_name, patient_number, contact_number),
          doctor:doctors(id, first_name, last_name),
          consultation:consultations(chief_complaint, diagnosis, prescription, notes)
        `)
        .order('completed_at', { ascending: false })

      if (error) throw error
      setQueue(data || [])
    } catch (error) {
      console.error('Error fetching billing queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRealtimeUpdate = async (payload) => {
    console.log('Billing queue real-time update:', payload.eventType)
    
    if (payload.eventType === 'INSERT') {
      // Fetch queue immediately when new item is added
      await fetchQueue()
      showNotification('New patient ready for billing')
    } else if (payload.eventType === 'UPDATE') {
      // Fetch queue for updates
      await fetchQueue()
    } else if (payload.eventType === 'DELETE') {
      // Remove item from local state immediately
      setQueue(prev => prev.filter(item => item.id !== payload.old.id))
    }
  }

  const showNotification = (message) => {
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('RCMC EMR - Billing Queue', { body: message })
    }
  }

  const lockPatient = async (queueId) => {
    try {
      const { data, error } = await supabase
        .from('billing_queue')
        .update({
          processing_by: user.id,
          processing_started_at: new Date().toISOString()
        })
        .eq('id', queueId)
        .is('processing_by', null) // Only lock if not already locked
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error locking patient:', error)
      return null
    }
  }

  const unlockPatient = async (queueId) => {
    try {
      const { error } = await supabase
        .from('billing_queue')
        .update({
          processing_by: null,
          processing_started_at: null
        })
        .eq('id', queueId)
        .eq('processing_by', user.id) // Only unlock if locked by current user

      if (error) throw error
    } catch (error) {
      console.error('Error unlocking patient:', error)
    }
  }

  const removeFromQueue = async (consultationId) => {
    try {
      const { error } = await supabase
        .from('billing_queue')
        .delete()
        .eq('consultation_id', consultationId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing from queue:', error)
      throw error
    }
  }

  return (
    <BillingQueueContext.Provider
      value={{
        queue,
        loading,
        connectionStatus,
        lockPatient,
        unlockPatient,
        removeFromQueue,
        refreshQueue: fetchQueue
      }}
    >
      {children}
    </BillingQueueContext.Provider>
  )
}

export const useBillingQueue = () => useContext(BillingQueueContext)
