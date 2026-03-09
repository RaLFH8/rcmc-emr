import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const NotificationContext = createContext({})

export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  // Load notifications when user logs in
  useEffect(() => {
    if (user) {
      loadNotifications()
      subscribeToNotifications()
    } else {
      setNotifications([])
      setLoading(false)
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      
      // Format notifications for TopBar
      const formattedNotifications = (data || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: formatTime(n.created_at),
        read: n.read,
        icon: getIconComponent(n.icon),
        color: n.color || 'bg-slate-50 text-slate-600',
        link: n.link,
        type: n.type
      }))
      
      setNotifications(formattedNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscription for new notifications
  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = {
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            time: formatTime(payload.new.created_at),
            read: payload.new.read,
            icon: getIconComponent(payload.new.icon),
            color: payload.new.color || 'bg-slate-50 text-slate-600',
            link: payload.new.link,
            type: payload.new.type
          }
          setNotifications(prev => [newNotification, ...prev])
          
          // Optional: Play sound or show browser notification
          playNotificationSound()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const createNotification = async (notification) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          icon: notification.icon,
          color: notification.color,
          link: notification.link
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  // Helper function to format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Helper function to get icon component
  const getIconComponent = (iconName) => {
    // Import icons dynamically based on name
    const icons = {
      'Calendar': 'Calendar',
      'Package': 'Package',
      'DollarSign': 'DollarSign',
      'UserPlus': 'UserPlus',
      'AlertCircle': 'AlertCircle',
      'Bell': 'Bell',
      'Clock': 'Clock',
      'Pill': 'Pill',
      'Home': 'Home',
      'Info': 'Info'
    }
    return icons[iconName] || 'Bell'
  }

  // Optional: Play notification sound
  const playNotificationSound = () => {
    // You can add a notification sound file to public folder
    // const audio = new Audio('/notification.mp3')
    // audio.volume = 0.3
    // audio.play().catch(e => console.log('Could not play sound:', e))
  }

  const value = {
    notifications,
    loading,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
