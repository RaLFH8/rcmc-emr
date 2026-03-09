import { useState, useRef, useEffect } from 'react'
import { Search, Bell, X, Clock, CheckCheck, AlertCircle, Calendar, Pill, UserPlus, Users, Stethoscope, Package, ArrowRight, DollarSign, Home, Info } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

const TopBar = ({ userProfile, setCurrentPage }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Use real notifications from context
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    loading: notificationsLoading
  } = useNotifications()
  
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)

  // Sample data for search
  const searchData = {
    patients: [
      { id: 1, name: 'John Doe', contact: '0912-345-6789', type: 'Patient' },
      { id: 2, name: 'Jane Smith', contact: '0923-456-7890', type: 'Patient' },
      { id: 3, name: 'Robert Johnson', contact: '0934-567-8901', type: 'Patient' },
      { id: 4, name: 'Maria Garcia', contact: '0945-678-9012', type: 'Patient' },
    ],
    doctors: [
      { id: 1, name: 'Dr. Sarah Johnson', specialization: 'General Medicine', type: 'Doctor' },
      { id: 2, name: 'Dr. Michael Chen', specialization: 'Cardiology', type: 'Doctor' },
      { id: 3, name: 'Dr. Emily Rodriguez', specialization: 'Pediatrics', type: 'Doctor' },
    ],
    appointments: [
      { id: 1, patient: 'John Doe', doctor: 'Dr. Sarah Johnson', date: '2026-02-23', type: 'Appointment' },
      { id: 2, patient: 'Jane Smith', doctor: 'Dr. Michael Chen', date: '2026-02-24', type: 'Appointment' },
    ],
    medicines: [
      { id: 1, name: 'Paracetamol 500mg', stock: 500, type: 'Medicine' },
      { id: 2, name: 'Amoxicillin 500mg', stock: 300, type: 'Medicine' },
      { id: 3, name: 'Ibuprofen 400mg', stock: 250, type: 'Medicine' },
    ],
    services: [
      { id: 1, name: 'General Consultation', price: 500, type: 'Service' },
      { id: 2, name: 'CBC Test', price: 250, type: 'Service' },
      { id: 3, name: 'X-Ray (Chest)', price: 400, type: 'Service' },
    ]
  }

  // Perform search
  const performSearch = (query) => {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase()
    const results = []

    // Search patients
    searchData.patients.forEach(patient => {
      if (patient.name.toLowerCase().includes(lowerQuery) || 
          patient.contact.includes(query)) {
        results.push({ ...patient, category: 'Patients', icon: Users, page: 'patients' })
      }
    })

    // Search doctors
    searchData.doctors.forEach(doctor => {
      if (doctor.name.toLowerCase().includes(lowerQuery) || 
          doctor.specialization.toLowerCase().includes(lowerQuery)) {
        results.push({ ...doctor, category: 'Doctors', icon: Stethoscope, page: 'doctors' })
      }
    })

    // Search appointments
    searchData.appointments.forEach(appointment => {
      if (appointment.patient.toLowerCase().includes(lowerQuery) || 
          appointment.doctor.toLowerCase().includes(lowerQuery)) {
        results.push({ ...appointment, category: 'Appointments', icon: Calendar, page: 'appointments' })
      }
    })

    // Search medicines
    searchData.medicines.forEach(medicine => {
      if (medicine.name.toLowerCase().includes(lowerQuery)) {
        results.push({ ...medicine, category: 'Inventory', icon: Pill, page: 'inventory' })
      }
    })

    // Search services
    searchData.services.forEach(service => {
      if (service.name.toLowerCase().includes(lowerQuery)) {
        results.push({ ...service, category: 'Services', icon: Package, page: 'services' })
      }
    })

    return results
  }

  const searchResults = performSearch(searchQuery)

  // Group results by category
  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = []
    }
    acc[result.category].push(result)
    return acc
  }, {})

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get icon component from icon name string
  const getIconComponent = (iconName) => {
    const iconMap = {
      'Calendar': Calendar,
      'Package': Package,
      'DollarSign': DollarSign,
      'UserPlus': UserPlus,
      'AlertCircle': AlertCircle,
      'Bell': Bell,
      'Clock': Clock,
      'Pill': Pill,
      'Home': Home,
      'Info': Info
    }
    return iconMap[iconName] || Bell
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowSearchResults(value.trim().length > 0)
  }

  const handleResultClick = (page) => {
    if (setCurrentPage) {
      setCurrentPage(page)
    }
    setSearchQuery('')
    setShowSearchResults(false)
  }

  return (
    <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div className="flex-1 max-w-xl relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients, appointments, doctors, medicines..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setShowSearchResults(false)
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <X size={16} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-semibold">No results found</p>
                <p className="text-sm text-slate-500 mt-1">Try searching for patients, doctors, or services</p>
              </div>
            ) : (
              <div className="overflow-y-auto">
                <div className="p-3 border-b border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-600 uppercase">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                
                {Object.entries(groupedResults).map(([category, items]) => (
                  <div key={category} className="border-b border-slate-100 last:border-0">
                    <div className="px-4 py-2 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-600 uppercase">{category}</p>
                    </div>
                    {items.map((result, index) => {
                      const Icon = result.icon
                      return (
                        <button
                          key={`${category}-${index}`}
                          onClick={() => handleResultClick(result.page)}
                          className="w-full px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                            <Icon size={20} className="text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{result.name || `${result.patient} - ${result.doctor}`}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {result.contact || result.specialization || result.date || `Stock: ${result.stock}` || `₱${result.price}`}
                            </p>
                          </div>
                          <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 hover:bg-gradient-to-br hover:from-teal-50 hover:to-blue-50 rounded-xl transition-all duration-200 group"
          >
            <Bell className={`w-5 h-5 text-slate-600 group-hover:text-teal-600 transition-colors ${unreadCount > 0 ? 'animate-wiggle' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-lg animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[500px] overflow-hidden flex flex-col animate-slideDown">
              {/* Header with gradient */}
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/50 transition-all"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {unreadCount > 0 ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                      {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    'All caught up!'
                  )}
                </p>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-teal-500" />
                    </div>
                    <p className="text-slate-700 font-semibold text-base mb-1">No notifications</p>
                    <p className="text-sm text-slate-500">You're all caught up! 🎉</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notification, index) => {
                      const Icon = getIconComponent(notification.icon)
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-200 cursor-pointer group relative ${
                            !notification.read ? 'bg-gradient-to-r from-teal-50/50 to-blue-50/30 border-l-2 border-teal-500' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex gap-3">
                            <div className={`w-11 h-11 rounded-xl ${notification.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                              <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                                  {notification.title}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                  className="p-1.5 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  title="Delete notification"
                                >
                                  <X size={14} className="text-red-500" />
                                </button>
                              </div>
                              <p className="text-xs text-slate-600 mb-2 leading-relaxed">{notification.message}</p>
                              <div className="flex items-center gap-2">
                                <Clock size={12} className="text-slate-400" />
                                <span className="text-xs text-slate-500 font-medium">{notification.time}</span>
                                {!notification.read && (
                                  <span className="flex items-center gap-1 ml-auto">
                                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-teal-600 font-semibold uppercase">New</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{userProfile?.full_name || 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">{userProfile?.role || 'Staff'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold">
            {userProfile?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
