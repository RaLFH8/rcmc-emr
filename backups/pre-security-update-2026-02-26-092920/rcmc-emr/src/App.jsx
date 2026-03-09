import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { InventoryProvider } from './context/InventoryContext'
import { NotificationProvider } from './context/NotificationContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import Rooms from './pages/Rooms'
import Payments from './pages/Payments'
import Doctors from './pages/Doctors'
import Inpatients from './pages/Inpatients'
import Services from './pages/Services'
import Inventory from './pages/Inventory'
import Prescriptions from './pages/Prescriptions'
import Reports from './pages/Reports'
import LabResults from './pages/LabResults'
import UserManagement from './pages/UserManagement'
import Login from './pages/Login'

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [minLoadingTime, setMinLoadingTime] = useState(true)
  const { user, userProfile, loading } = useAuth()

  // Minimum loading screen display time (1.5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Fade in content after loading
  useEffect(() => {
    if (!loading && !minLoadingTime && user && userProfile) {
      setTimeout(() => setShowContent(true), 100)
    }
  }, [loading, minLoadingTime, user, userProfile])

  // Show pulse loading while checking auth or during minimum display time
  if (loading || minLoadingTime) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          {/* Simple Heartbeat Line */}
          <div className="relative w-80 h-24 mx-auto mb-8">
            <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="xMidYMid meet">
              <polyline
                className="heartbeat-line"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,50 80,50 85,50 90,10 95,90 100,50 105,50 400,50"
              />
            </svg>
          </div>
          
          {/* Loading text */}
          <p className="text-slate-700 font-semibold text-xl mb-2 animate-fade-in">RIZALCARE MEDICAL CLINIC</p>
          <p className="text-slate-500 text-sm animate-fade-in-delay">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user || !userProfile) {
    return <Login />
  }

  // Role-based menu filtering
  const getAvailablePages = () => {
    const role = userProfile.role
    
    console.log('🔍 User Role:', role)
    console.log('🔍 User Profile:', userProfile)
    
    if (role === 'admin') {
      console.log('✅ Admin role - showing all pages including prescriptions and reports')
      return ['dashboard', 'appointments', 'rooms', 'payments', 'doctors', 'patients', 'inpatients', 'services', 'inventory', 'prescriptions', 'lab-results', 'reports', 'users']
    } else if (role === 'doctor') {
      console.log('✅ Doctor role - showing prescriptions and reports')
      return ['dashboard', 'appointments', 'patients', 'inpatients', 'services', 'inventory', 'prescriptions', 'lab-results', 'reports']
    } else if (role === 'receptionist') {
      console.log('✅ Receptionist role - showing prescriptions and reports')
      return ['dashboard', 'appointments', 'patients', 'payments', 'rooms', 'services', 'inventory', 'prescriptions', 'lab-results', 'reports']
    }
    
    console.log('⚠️ Unknown role - showing only dashboard')
    return ['dashboard']
  }

  const availablePages = getAvailablePages()
  console.log('📋 Available Pages:', availablePages)

  const renderPage = () => {
    // Check if user has access to current page
    if (!availablePages.includes(currentPage)) {
      setCurrentPage('dashboard')
      return <Dashboard />
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'appointments':
        return <Appointments />
      case 'rooms':
        return <Rooms />
      case 'payments':
        return <Payments />
      case 'doctors':
        return <Doctors />
      case 'patients':
        return <Patients />
      case 'inpatients':
        return <Inpatients />
      case 'services':
        return <Services />
      case 'inventory':
        return <Inventory />
      case 'prescriptions':
        return <Prescriptions />
      case 'lab-results':
        return <LabResults />
      case 'reports':
        return <Reports />
      case 'users':
        return <UserManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className={`flex h-screen bg-slate-50 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      <Sidebar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        availablePages={availablePages}
        userProfile={userProfile}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userProfile={userProfile} setCurrentPage={setCurrentPage} />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <InventoryProvider>
          <AppContent />
        </InventoryProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App

