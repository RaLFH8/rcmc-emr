import { useState, useEffect, Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { InventoryProvider } from './context/InventoryContext'
import { NotificationProvider } from './context/NotificationContext'
import { BillingQueueProvider } from './context/BillingQueueContext'
import { RealtimeProvider } from './context/RealtimeContext'
import ErrorBoundary from './components/ErrorBoundary'
import SkeletonLoader from './components/SkeletonLoader'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Login from './pages/Login'

// Lazy load all pages to enable code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Patients = lazy(() => import('./pages/Patients'))
const Appointments = lazy(() => import('./pages/Appointments'))
const Rooms = lazy(() => import('./pages/Rooms'))
const Payments = lazy(() => import('./pages/Payments'))
const Doctors = lazy(() => import('./pages/Doctors'))
const Inpatients = lazy(() => import('./pages/Inpatients'))
const Services = lazy(() => import('./pages/Services'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Prescriptions = lazy(() => import('./pages/Prescriptions'))
const Orders = lazy(() => import('./pages/Orders'))
const Reports = lazy(() => import('./pages/Reports'))
const LabResults = lazy(() => import('./pages/LabResults'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const OnlineBookings = lazy(() => import('./pages/OnlineBookings'))
const PublicBooking = lazy(() => import('./pages/PublicBooking_IMPROVED'))
const PublicSurvey = lazy(() => import('./pages/PublicSurvey'))
const UserProfile = lazy(() => import('./pages/UserProfile'))

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
    if (!loading && !minLoadingTime) {
      setTimeout(() => setShowContent(true), 100)
    }
  }, [loading, minLoadingTime])

  // Show public survey page without authentication
  if (isPublicSurvey) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-50"><SkeletonLoader variant="auth" message="Loading..." /></div>}>
          <PublicSurvey />
        </Suspense>
      </ErrorBoundary>
    )
  }

  // Show public booking page without authentication
  if (isPublicBooking) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-50"><SkeletonLoader variant="auth" message="Loading..." /></div>}>
          <PublicBooking />
        </Suspense>
      </ErrorBoundary>
    )
  }

  // Show skeleton loading while checking auth or during minimum display time
  if (loading || minLoadingTime) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center w-full">
          <p className="text-slate-700 font-semibold text-xl mb-6 animate-fade-in">RIZALCARE MEDICAL CLINIC</p>
          <SkeletonLoader variant="auth" message="Loading application..." />
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
    
    if (role === 'admin') {
      return ['dashboard', 'appointments', 'online-bookings', 'rooms', 'payments', 'doctors', 'patients', 'inpatients', 'services', 'inventory', 'prescriptions', 'orders', 'lab-results', 'reports', 'users']
    } else if (role === 'doctor') {
      return ['dashboard', 'appointments', 'patients', 'inpatients', 'services', 'inventory', 'prescriptions', 'orders', 'lab-results', 'reports']
    } else if (role === 'receptionist') {
      return ['dashboard', 'appointments', 'online-bookings', 'patients', 'payments', 'rooms', 'services', 'inventory', 'prescriptions', 'orders', 'lab-results', 'reports', 'profile']
    }
    
    return ['dashboard']
  }

  const availablePages = getAvailablePages()

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
          <Suspense fallback={<SkeletonLoader variant="auth" message="Loading..." />}>
            {renderPage()}
          </Suspense>
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

