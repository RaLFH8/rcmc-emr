import { useState } from 'react'
import { LayoutDashboard, Calendar, Bed, CreditCard, Stethoscope, Users, UserPlus, LogOut, Settings, Package, Pill, FileText, Menu, X, BarChart3, FlaskConical, CalendarCheck, ClipboardList } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = ({ currentPage, setCurrentPage, collapsed, availablePages, userProfile }) => {
  const { signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointment', icon: Calendar },
    { id: 'online-bookings', label: 'Online Bookings', icon: CalendarCheck },
    { id: 'rooms', label: 'Room', icon: Bed },
    { id: 'payments', label: 'Payment', icon: CreditCard },
    { id: 'doctors', label: 'Doctor', icon: Stethoscope },
    { id: 'patients', label: 'Patient', icon: Users },
    { id: 'inpatients', label: 'Inpatient', icon: UserPlus },
    { id: 'services', label: 'Services', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Pill },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'orders', label: "Doctor's Orders", icon: ClipboardList },
    { id: 'lab-results', label: 'Lab Results', icon: FlaskConical },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Settings },
  ]

  // Filter menu items based on available pages
  const menuItems = allMenuItems.filter(item => availablePages.includes(item.id))

  const handleSignOut = async () => {
    await signOut()
  }

  const handleMenuItemClick = (itemId) => {
    setCurrentPage(itemId)
    setIsMobileMenuOpen(false) // Close mobile menu after selection
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-teal-500 text-white rounded-xl shadow-lg hover:bg-teal-600 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        bg-white border-r border-slate-200 flex flex-col
        transition-all duration-300
        ${collapsed ? 'w-20' : 'w-60'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/RCMC_LOGO-removebg-preview.png" 
                alt="Rizalcare Medical Clinic Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-slate-900 leading-tight">Rizalcare</span>
              <span className="text-sm text-slate-600 leading-tight">Medical Clinic</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden mx-auto">
            <img 
              src="/RCMC_LOGO-removebg-preview.png" 
              alt="Rizalcare Medical Clinic Logo"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto">
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
                onClick={() => handleMenuItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] ${
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
    </>
  )
}

export default Sidebar
