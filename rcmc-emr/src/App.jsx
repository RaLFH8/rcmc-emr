import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { InventoryProvider } from './context/InventoryContext'
import { NotificationProvider } from './context/NotificationContext'
import { BillingQueueProvider } from './context/BillingQueueContext'
import { RealtimeProvider } from './context/RealtimeContext'
import ErrorBoundary from './components/ErrorBoundary'
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
import Orders from './pages/Orders'
import Reports from './pages/Reports'
import LabResults from './pages/LabResults'
import UserManagement from './pages/UserManagement'
import OnlineBookings from './pages/OnlineBookings'
import PublicBooking from './pages/PublicBooking'
import PublicSurvey from './pages/PublicSurvey'
import Login from './pages/Login'

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [minLoadingTime, setMinLoadingTime] = useState(true)
  const { user, userProfile, loading } = useAuth()

  // Listen for navigation events from other components
  useEffect(() => {
    const handleNavigate = (event) => {
      setCurrentPage(event.detail)
    }
    window.addEventListener('navigateTo', handleNavigate)
    return () => window.removeEventListener('navigateTo', handleNavigate)
  }, [])

  // Check if current route is public booking page
  const isPublicBooking = window.location.pathname === '/book' || window.location.hash === '#/book'
  const isPublicSurvey = window.location.pathname === '/survey' || window.location.hash === '#/survey'

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

  // Show public survey page without authentication
  if (isPublicSurvey) {
    return (
      <ErrorBoundary>
        <PublicSurvey />
      </ErrorBoundary>
    )
  }

  // Show public booking page without authentication
  if (isPublicBooking) {
    return (
      <ErrorBoundary>
        <PublicBooking />
      </ErrorBoundary>
    )
  }

  // Show pulse loading while checking auth or during minimum display time
  if (loading || minLoadingTime) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          {/* ECG Heartbeat Line - Larger */}
          <div className="relative w-96 h-32 mx-auto mb-8 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="xMidYMid meet">
              {/* ECG waveform with P wave, QRS complex, and T wave */}
              <polyline
                className="heartbeat-line"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,50 40,50 45,48 50,52 55,50 65,50 70,45 75,50 80,30 85,70 90,50 95,48 100,50 110,50 115,52 120,48 125,50 180,50 185,48 190,52 195,50 205,50 210,45 215,50 220,30 225,70 230,50 235,48 240,50 250,50 255,52 260,48 265,50 320,50 325,48 330,52 335,50 345,50 350,45 355,50 360,30 365,70 370,50 375,48 380,50 390,50 395,52 400,48 405,50 500,50"
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
      return ['dashboard', 'appointments', 'online-bookings', 'rooms', 'payments', 'doctors', 'patients', 'inpatients', 'services', 'inventory', 'prescriptions', 'orders', 'lab-results', 'reports', 'users']
    } else if (role === 'doctor') {
      console.log('✅ Doctor role - showing prescriptions and reports')
      return ['dashboard', 'appointments', 'patients', 'inpatients', 'services', 'inventory', 'prescriptions', 'orders', 'lab-results', 'reports']
    } else if (role === 'receptionist') {
      console.log('✅ Receptionist role - showing prescriptions and reports')
      return ['dashboard', 'appointments', 'online-bookings', 'patients', 'payments', 'rooms', 'services', 'inventory', 'prescriptions', 'orders', 'lab-results', 'reports']
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
      return <Dashboard setCurrentPage={setCurrentPage} />
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />
      case 'appointments':
        return <Appointments />
      case 'online-bookings':
        return <OnlineBookings />
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
      case 'orders':
        return <Orders />
      case 'lab-results':
        return <LabResults />
      case 'reports':
        return <Reports />
      case 'users':
        return <UserManagement />
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />
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
      <RealtimeProvider>
        <NotificationProvider>
          <BillingQueueProvider>
            <InventoryProvider>
              <AppContent />
            </InventoryProvider>
          </BillingQueueProvider>
        </NotificationProvider>
      </RealtimeProvider>
    </AuthProvider>
  )
}

export default App

