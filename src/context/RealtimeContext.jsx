import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const RealtimeContext = createContext()

export const useRealtime = () => {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider')
  }
  return context
}

export const RealtimeProvider = ({ children }) => {
  const [lastUpdate, setLastUpdate] = useState({
    patients: null,
    appointments: null,
    consultations: null,
    billing: null,
    inventory: null,
    prescriptions: null,
    online_bookings: null,
    doctors: null,
    services: null,
    doctor_orders: null
  })

  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Create a single channel for all table changes
    const channel = supabase
      .channel('db-changes')
      
      // Patients table
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'patients' },
        (payload) => {
          setLastUpdate(prev => ({ ...prev, patients: new Date() }))
        }
      )
      
      // Appointments table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          setLastUpdate(prev => ({ ...prev, appointments: new Date() }))
        }
      )
      
      // Consultations table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'consultations' },
        (payload) => {
          setLastUpdate(prev => ({ ...prev, consultations: new Date() }))
        }
      )
      
      // Billing table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'billing' },
        (payload) => {
          setLastUpdate(prev => ({ ...prev, billing: new Date() }))
        }
      )
      
      // Inventory table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          setLastUpdate(prev => ({ ...prev, inventory: new Date() }))
        }
      )
      
      // Prescriptions table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions' },
        (payload) => {
          setLastUpdate(prev => ({ ...prev, prescriptions: new Date() }))
        }
      )
      
      // Online bookings table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'online_bookings' },
        (payload) => {
          setLastUpdate(prev => ({ ...prev, online_bookings: new Date() }))
        }
      )
      
      // Doctors table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        (payload) => {
          setLastUpdate(prev => ({ ...prev, doctors: new Date() }))
        }
      )
      
      // Services table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        (payload) => {
          setLastUpdate(prev => ({ ...prev, services: new Date() }))
        }
      )
      
      // Doctor Orders table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'doctor_orders' },
        (payload) => {
          setLastUpdate(prev => ({ ...prev, doctor_orders: new Date() }))
        }
      )
      
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error')
          setIsConnected(false)
        }
      })

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ lastUpdate, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}
