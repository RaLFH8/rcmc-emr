import { useState } from 'react'
import { useBillingQueue } from '../context/BillingQueueContext'
import { Search, Clock, AlertCircle, RefreshCw } from 'lucide-react'

export function BillingQueue({ onSelectPatient }) {
  const { queue, loading, connectionStatus, refreshQueue } = useBillingQueue()
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const filteredQueue = queue.filter(item => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      item.patient?.first_name?.toLowerCase().includes(search) ||
      item.patient?.last_name?.toLowerCase().includes(search) ||
      item.patient?.patient_number?.toLowerCase().includes(search)
    )
  })

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshQueue()
    setTimeout(() => setRefreshing(false), 500)
  }

  if (loading) {
    return <div className="p-4">Loading billing queue...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Connection Status Warning */}
      {connectionStatus !== 'connected' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">
              Connection lost. Queue may not update automatically.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Billing Queue ({filteredQueue.length})
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
            title="Refresh billing queue"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or patient number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Queue List */}
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {filteredQueue.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No patients found' : 'No patients in billing queue'}
          </div>
        ) : (
          filteredQueue.map((item) => (
            <div
              key={item.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                item.processing_by ? 'opacity-50' : ''
              }`}
              onClick={() => !item.processing_by && onSelectPatient(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {item.patient?.first_name} {item.patient?.last_name}
                    </h3>
                    {item.processing_by && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {item.patient?.patient_number}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Dr. {item.doctor?.first_name} {item.doctor?.last_name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTime(item.completed_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
