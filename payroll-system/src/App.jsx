import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Payroll from './pages/Payroll'
import PayslipHistory from './pages/PayslipHistory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Keep Supabase connection alive (prevents free tier from pausing)
  useEffect(() => {
    const keepAlive = async () => {
      try {
        // Simple query to keep connection active
        await supabase.from('employees').select('count', { count: 'exact', head: true })
      } catch (error) {
        console.log('Keep-alive ping:', error.message)
      }
    }

    // Ping every 5 minutes
    const interval = setInterval(keepAlive, 5 * 60 * 1000)
    
    // Initial ping
    keepAlive()

    return () => clearInterval(interval)
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />
      case 'employees':
        return <Employees />
      case 'payroll':
        return <Payroll />
      case 'payslip-history':
        return <PayslipHistory />
      case 'reports':
        return <Reports />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <main className="flex-1 min-w-0 lg:ml-[280px] p-6 lg:p-8">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
