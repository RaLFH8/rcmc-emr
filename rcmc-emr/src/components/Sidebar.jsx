import { LayoutDashboard, Calendar, Bed, CreditCard, Stethoscope, Users, UserPlus, ChevronLeft, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = ({ currentPage, setCurrentPage, collapsed, setCollapsed, availablePages, userProfile }) => {
  const { signOut } = useAuth()
  
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointment', icon: Calendar },
    { id: 'rooms', label: 'Room', icon: Bed },
    { id: 'payments', label: 'Payment', icon: CreditCard },
    { id: 'doctors', label: 'Doctor', icon: Stethoscope },
    { id: 'patients', label: 'Patient', icon: Users },
    { id: 'inpatients', label: 'Inpatient', icon: UserPlus },
    { id: 'users', label: 'User Management', icon: Settings },
  ]

  // Filter menu items based on available pages
  const menuItems = allMenuItems.filter(item => availablePages.includes(item.id))

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-60'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-900">MediLens</span>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center shadow-sm mx-auto">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <div className="px-3 mb-2">
          {!collapsed && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">Navigation</p>}
        </div>
        <div className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            )
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold">
            {userProfile?.full_name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{userProfile?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{userProfile?.role || 'Staff'}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default Sidebar
