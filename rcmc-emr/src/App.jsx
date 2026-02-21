import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import Rooms from './pages/Rooms'
import Payments from './pages/Payments'
import Doctors from './pages/Doctors'
import Inpatients from './pages/Inpatients'
import UserManagement from './pages/UserManagement'
import Login from './pages/Login'

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, userProfile, loading } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
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
      return ['dashboard', 'appointments', 'rooms', 'payments', 'doctors', 'patients', 'inpatients', 'users']
    } else if (role === 'doctor') {
      return ['dashboard', 'appointments', 'patients', 'inpatients']
    } else if (role === 'receptionist') {
      return ['dashboard', 'appointments', 'patients', 'payments', 'rooms']
    }
    
    return ['dashboard']
  }

  const availablePages = getAvailablePages()

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
      case 'users':
        return <UserManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        availablePages={availablePages}
        userProfile={userProfile}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userProfile={userProfile} />
        
        <main className="flex-1 overflow-y-auto p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

