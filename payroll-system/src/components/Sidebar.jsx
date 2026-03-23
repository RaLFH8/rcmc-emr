import { LayoutDashboard, Users, DollarSign, FileText, Settings, Bell, MessageSquare, LogOut, Menu, X, History } from 'lucide-react'

const Sidebar = ({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen }) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'payslip-history', label: 'Payslip History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId)
    setSidebarOpen(false) // Close sidebar on mobile after selection
  }

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-workly-sidebar border-b border-workly-sidebar-hover flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-workly-coral flex items-center justify-center">
            <span className="text-white text-xl font-bold">R</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              RCMC
            </h1>
            <p className="text-xs text-white/60">
              Payroll System
            </p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-white/10 text-white"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-[280px] bg-workly-sidebar flex flex-col z-30 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* Logo - Hidden on mobile (shown in header instead) */}
        <div className="hidden lg:block p-6 border-b border-workly-sidebar-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-workly-coral flex items-center justify-center">
              <span className="text-white text-xl font-bold">R</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                RCMC
              </h1>
              <p className="text-xs text-white/60">
                Payroll System
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 mt-16 lg:mt-0">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-workly transition-all text-sm font-medium tracking-tight ${
                  isActive
                    ? 'bg-workly-sidebar-hover text-white border-l-4 border-workly-coral'
                    : 'text-white/70 hover:text-white hover:bg-workly-sidebar-hover'
                }`}
              >
                <Icon size={20} strokeWidth={2} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-workly-sidebar-hover space-y-3">
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button className="flex-1 h-10 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all">
              <Bell size={18} />
            </button>
            <button className="flex-1 h-10 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all">
              <MessageSquare size={18} />
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-workly-coral flex items-center justify-center">
              <span className="text-white font-semibold text-sm">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">
                Admin User
              </p>
              <p className="text-xs truncate text-white/60">
                rizalcaremedicalclinic@gmail.com
              </p>
            </div>
            <LogOut size={16} className="text-white/60" />
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
