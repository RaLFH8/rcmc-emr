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
    services: null
  })

  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    console.log('🔄 Setting up real-time subscriptions...')

    // Create a single channel for all table changes
    const channel = supabase
      .channel('db-changes')
      
      // Patients table
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'patients' },
        (payload) => {
          console.log('👤 Patients changed:', payload.eventType)
          setLastUpdate(prev => ({ ...prev, patients: new Date() }))
        }
      )
      
      // Appointments table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('📅 Appointments changed:', payload.eventType)
          setLastUpdate(prev => ({ ...prev, appointments: new Date() }))
        }
      )
      
      // Consultations table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'consultations' },
        (payload) => {
          console.log('🩺 Consultations changed:', payload.eventType)
          setLastUpdate(prev => ({ ...prev, consultations: new Date() }))
        }
      )
      
      // Billing table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'billing' },
        (payload) => {
          console.log('💰 Billing changed:', payload.eventType)
          setLastUpdate(prev => ({ ...prev, billing: new Date() }))
        }
      )
      
      // Inventory table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          console.log('📦 Inventory changed:', payload.eventType)
          setLastUpdate(prev => ({ ...prev, inventory: new Date() }))
        }
      )
      
      // Prescriptions table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions' },
        (payload) => {
          console.log('💊 Prescriptions changed:', payload.eventType)
          setLastUpdate(prev => ({ ...prev, prescriptions: new Date() }))
        }
      )
      
      // Online bookings table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'online_bookings' },
        (payload) => {
          console.log('🌐 Online bookings changed:', payload.eventType)
          setLastUpdate(prev => ({ ...prev, online_bookings: new Date() }))
        }
      )
      
      // Doctors table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        (payload) => {
          console.log('👨‍⚕️ Doctors changed:', payload.eventType)
          setLastUpdate(prev => ({ ...prev, doctors: new Date() }))
        }
      )
      
      // Services table
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        (payload) => {
          console.log('🏥 Services changed:', payload.eventType)
          setLastUpdate(prev => ({ ...prev, services: new Date() }))
        }
      )
      
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscriptions active')
          setIsConnected(true)
        } else if (status === 'CLOSED') {
          console.log('❌ Real-time subscriptions closed')
          setIsConnected(false)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('⚠️ Real-time subscription error')
          setIsConnected(false)
        }
      })

    // Cleanup on unmount
    return () => {
      console.log('🔌 Unsubscribing from real-time changes')
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ lastUpdate, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}
