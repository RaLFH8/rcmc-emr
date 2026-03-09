import { useState, useEffect } from 'react'
import { Database, Download, RefreshCw, CheckCircle, XCircle, Clock, HardDrive, Shield, AlertTriangle, FileText, Calendar, Filter, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import HeartbeatLoader from '../components/HeartbeatLoader'
import { useAuth } from '../context/AuthContext'

const BackupManagement = () => {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [backups, setBackups] = useState([])
  const [dashboardStats, setDashboardStats] = useState({
    successRate: 0,
    lastBackupTime: null,
    totalBackupSize: 0,
    nextScheduledBackup: null
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [triggeringBackup, setTriggeringBackup] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    loadBackupData()
  }, [])

  const loadBackupData = async () => {
    try {
      setLoading(true)

      // Fetch backup logs from database
      const { data: backupLogs, error } = await supabase
        .from('backup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setBackups(backupLogs || [])

      // Calculate dashboard statistics
      if (backupLogs && backupLogs.length > 0) {
        const successfulBackups = backupLogs.filter(b => b.status === 'success')
        const successRate = (successfulBackups.length / backupLogs.length) * 100

        const lastBackup = backupLogs[0]
        const totalSize = backupLogs.reduce((sum, b) => sum + (b.file_size_bytes || 0), 0)

        // Calculate next scheduled backup (2:00 AM next day)
        const now = new Date()
        const nextBackup = new Date()
        nextBackup.setDate(now.getDate() + 1)
        nextBackup.setHours(2, 0, 0, 0)

        setDashboardStats({
          successRate: successRate.toFixed(1),
          lastBackupTime: lastBackup.end_time || lastBackup.start_time,
          totalBackupSize: totalSize,
          nextScheduledBackup: nextBackup
        })
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading backup data:', error)
      alert('Failed to load backup data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadBackupData()
  }

  const handleManualBackup = async () => {
    if (!confirm('Are you sure you want to trigger a manual backup? This may take several minutes.')) {
      return
    }

    try {
      setTriggeringBackup(true)

      // Call Supabase Edge Function to trigger backup
      const { data, error } = await supabase.functions.invoke('backup-scheduler', {
        body: { manual: true }
      })

      if (error) throw error

      alert('Manual backup initiated successfully. Check the backup history for status.')
      await loadBackupData()
    } catch (error) {
      console.error('Error triggering manual backup:', error)
      alert('Failed to trigger manual backup: ' + error.message)
    } finally {
      setTriggeringBackup(false)
    }
  }

  const handleDownloadBackup = async (backup) => {
    // Only admins can download backups
    if (userProfile?.role !== 'admin') {
      alert('Only administrators can download backup files.')
      return
    }

    try {
      // Download from Supabase Storage
      const { data, error } = await supabase.storage
        .from('backups')
        .download(backup.storage_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.backup_filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading backup:', error)
      alert('Failed to download backup: ' + error.message)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      in_progress: 'bg-blue-100 text-blue-700'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const getTypeBadge = (type) => {
    const styles = {
      daily: 'bg-teal-100 text-teal-700',
      weekly: 'bg-purple-100 text-purple-700',
      monthly: 'bg-blue-100 text-blue-700',
      manual: 'bg-amber-100 text-amber-700'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
        {type.toUpperCase()}
      </span>
    )
  }

  // Filter backups based on search and filters
  const filteredBackups = backups.filter(backup => {
    const matchesSearch = backup.backup_filename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || backup.status === statusFilter
    const matchesType = typeFilter === 'all' || backup.backup_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <HeartbeatLoader message="Loading backup data..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Backup Management</h1>
          <p className="text-sm text-slate-600">Monitor and manage automated database backups</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Last updated: {formatDate(lastUpdated)}</span>
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-100 rounded"
              aria-label="Refresh backup data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={handleManualBackup}
            disabled={triggeringBackup}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Trigger manual backup"
          >
            <Database className="w-4 h-4" />
            {triggeringBackup ? 'Triggering...' : 'Manual Backup'}
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Success Rate</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{dashboardStats.successRate}%</p>
          <p className="text-xs text-slate-500 mt-1">Last 100 backups</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Last Backup</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-slate-900">
            {dashboardStats.lastBackupTime ? formatDate(dashboardStats.lastBackupTime) : 'No backups yet'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Most recent completion</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Total Backup Size</h3>
            <HardDrive className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatBytes(dashboardStats.totalBackupSize)}</p>
          <p className="text-xs text-slate-500 mt-1">All stored backups</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">Next Scheduled</h3>
            <Calendar className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-lg font-bold text-slate-900">
            {dashboardStats.nextScheduledBackup ? formatDate(dashboardStats.nextScheduledBackup) : 'Not scheduled'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Daily at 2:00 AM PHT</p>
        </div>
      </div>

      {/* Retention Policy Information */}
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-teal-900 mb-2">Backup Retention Policy</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-teal-800">Daily Backups</p>
                <p className="text-teal-700">Retained for 30 days</p>
              </div>
              <div>
                <p className="font-semibold text-teal-800">Weekly Backups</p>
                <p className="text-teal-700">Retained for 90 days</p>
              </div>
              <div>
                <p className="font-semibold text-teal-800">Monthly Backups</p>
                <p className="text-teal-700">Retained for 1 year</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search backups by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Types</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Backup History Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Backup History</h2>
          <p className="text-sm text-slate-600 mt-1">
            Showing {filteredBackups.length} of {backups.length} backups
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Filename</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Verified</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-semibold">No backups found</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Backups will appear here once created'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBackups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(backup.status)}
                        {getStatusBadge(backup.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{backup.backup_filename}</p>
                      {backup.error_message && (
                        <p className="text-xs text-red-600 mt-1">{backup.error_message}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(backup.backup_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {formatBytes(backup.file_size_bytes)}
                      {backup.compression_ratio && (
                        <p className="text-xs text-slate-500">
                          {(backup.compression_ratio * 100).toFixed(1)}% compressed
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {formatDuration(backup.duration_seconds)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {formatDate(backup.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {backup.verified ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-semibold">Verified</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Not verified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userProfile?.role === 'admin' && backup.status === 'success' && (
                        <button
                          onClick={() => handleDownloadBackup(backup)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disaster Recovery Documentation */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <FileText className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Disaster Recovery Procedure</h3>
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Recovery Time Objective (RTO)</h4>
                <p>Full system restoration can be completed within 4 hours from backup initiation.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Recovery Steps</h4>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Identify the most recent successful backup from the table above</li>
                  <li>Download the backup file (admin access required)</li>
                  <li>Verify backup integrity by checking the "Verified" status</li>
                  <li>Contact system administrator to initiate database restoration</li>
                  <li>Administrator will restore the backup to a temporary database for validation</li>
                  <li>After validation, the backup will be restored to the production database</li>
                  <li>System services will be restarted and tested</li>
                  <li>Users will be notified when the system is fully operational</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Backup Encryption</h4>
                <p>All backup files are encrypted at rest using AES-256 encryption to ensure data security and compliance with Data Privacy Act requirements.</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Backup Verification</h4>
                <p>Backups are automatically verified weekly through test restoration to a temporary database. Verified backups are marked with a green checkmark in the table above.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Important Notes</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-amber-800">
                      <li>Only administrators can download backup files</li>
                      <li>Backup restoration requires database administrator credentials</li>
                      <li>Always verify backup integrity before restoration</li>
                      <li>Contact IT support immediately if backup failures are detected</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackupManagement
