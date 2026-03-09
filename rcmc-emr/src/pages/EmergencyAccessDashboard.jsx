import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Download, Filter, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export default function EmergencyAccessDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    averageDuration: 0,
    suspiciousCount: 0,
  });
  const [events, setEvents] = useState([]);
  const [userBreakdown, setUserBreakdown] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState([]);
  const [suspiciousPatterns, setSuspiciousPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    userId: '',
    emergencyType: '',
    status: 'all',
  });

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Build query with filters
      let query = supabase
        .from('emergency_access_logs')
        .select(`
          *,
          user:user_profiles!emergency_access_logs_user_id_fkey(full_name, role),
          patient:patients(first_name, last_name, patient_number)
        `)
        .order('access_granted_at', { ascending: false });

      if (filters.dateFrom) {
        query = query.gte('access_granted_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('access_granted_at', filters.dateTo);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.emergencyType) {
        query = query.eq('emergency_type', filters.emergencyType);
      }
      if (filters.status === 'active') {
        query = query.is('access_revoked_at', null).gt('access_expires_at', new Date().toISOString());
      } else if (filters.status === 'expired') {
        query = query.lt('access_expires_at', new Date().toISOString());
      } else if (filters.status === 'revoked') {
        query = query.not('access_revoked_at', 'is', null);
      }

      const { data: eventsData, error } = await query;

      if (error) throw error;

      setEvents(eventsData || []);

      // Calculate statistics
      const now = new Date();
      const activeCount = eventsData?.filter(
        e => !e.access_revoked_at && new Date(e.access_expires_at) > now
      ).length || 0;

      const completedEvents = eventsData?.filter(e => e.access_duration_seconds) || [];
      const avgDuration = completedEvents.length > 0
        ? completedEvents.reduce((sum, e) => sum + (e.access_duration_seconds || 0), 0) / completedEvents.length
        : 0;

      setStats({
        totalEvents: eventsData?.length || 0,
        activeEvents: activeCount,
        averageDuration: Math.round(avgDuration / 3600), // Convert to hours
        suspiciousCount: 0, // Will be calculated from patterns
      });

      // User breakdown
      const userMap = new Map();
      eventsData?.forEach(event => {
        const userId = event.user_id;
        const userName = event.user?.full_name || 'Unknown User';
        if (!userMap.has(userId)) {
          userMap.set(userId, { userId, userName, count: 0 });
        }
        userMap.get(userId).count++;
      });
      setUserBreakdown(Array.from(userMap.values()).sort((a, b) => b.count - a.count));

      // Emergency type breakdown
      const typeMap = new Map();
      eventsData?.forEach(event => {
        const type = event.emergency_type;
        if (!typeMap.has(type)) {
          typeMap.set(type, 0);
        }
        typeMap.set(type, typeMap.get(type) + 1);
      });
      setTypeBreakdown(
        Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }))
      );

      // Detect suspicious patterns
      detectSuspiciousPatterns(eventsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectSuspiciousPatterns = (eventsData) => {
    const patterns = [];
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Pattern 1: Multiple access requests in short time
    const userAccessCounts = new Map();
    eventsData.forEach(event => {
      const eventDate = new Date(event.access_granted_at);
      if (eventDate > last24Hours) {
        const userId = event.user_id;
        const userName = event.user?.full_name || 'Unknown User';
        if (!userAccessCounts.has(userId)) {
          userAccessCounts.set(userId, { userId, userName, count: 0 });
        }
        userAccessCounts.get(userId).count++;
      }
    });

    userAccessCounts.forEach((data) => {
      if (data.count >= 5) {
        patterns.push({
          userId: data.userId,
          userName: data.userName,
          eventCount: data.count,
          timeWindow: 'Last 24 hours',
          flagReason: 'High frequency access (5+ requests)',
        });
      }
    });

    // Pattern 2: Access outside normal hours (10 PM - 6 AM)
    const afterHoursAccess = eventsData.filter(event => {
      const hour = new Date(event.access_granted_at).getHours();
      return hour >= 22 || hour < 6;
    });

    const afterHoursUsers = new Map();
    afterHoursAccess.forEach(event => {
      const userId = event.user_id;
      const userName = event.user?.full_name || 'Unknown User';
      if (!afterHoursUsers.has(userId)) {
        afterHoursUsers.set(userId, { userId, userName, count: 0 });
      }
      afterHoursUsers.get(userId).count++;
    });

    afterHoursUsers.forEach((data) => {
      if (data.count >= 3) {
        patterns.push({
          userId: data.userId,
          userName: data.userName,
          eventCount: data.count,
          timeWindow: 'After hours (10 PM - 6 AM)',
          flagReason: 'Multiple after-hours access',
        });
      }
    });

    setSuspiciousPatterns(patterns);
    setStats(prev => ({ ...prev, suspiciousCount: patterns.length }));
  };

  const exportComplianceReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.text('Emergency Access Compliance Report', pageWidth / 2, 20, { align: 'center' });
    
    // Date range
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 30, { align: 'center' });
    
    // Statistics
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, 45);
    doc.setFontSize(10);
    doc.text(`Total Break-Glass Events: ${stats.totalEvents}`, 14, 55);
    doc.text(`Currently Active: ${stats.activeEvents}`, 14, 62);
    doc.text(`Average Duration: ${stats.averageDuration} hours`, 14, 69);
    doc.text(`Suspicious Patterns Detected: ${stats.suspiciousCount}`, 14, 76);
    
    // Event details
    let yPos = 90;
    doc.setFontSize(14);
    doc.text('Recent Events', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(8);
    events.slice(0, 20).forEach((event, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const patientName = event.patient 
        ? `${event.patient.first_name} ${event.patient.last_name}`
        : 'Unknown';
      const userName = event.user?.full_name || 'Unknown';
      const date = format(new Date(event.access_granted_at), 'PP p');
      
      doc.text(`${index + 1}. ${date} - ${userName} accessed ${patientName}`, 14, yPos);
      yPos += 5;
      doc.text(`   Type: ${event.emergency_type} | Justification: ${event.justification.substring(0, 60)}...`, 14, yPos);
      yPos += 8;
    });
    
    // Save PDF
    doc.save(`emergency-access-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const getStatusBadge = (event) => {
    const now = new Date();
    const expiresAt = new Date(event.access_expires_at);
    
    if (event.access_revoked_at) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Revoked</span>;
    } else if (expiresAt < now) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-200 text-yellow-800">Expired</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-200 text-green-800">Active</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-red-600" />
            Emergency Access Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Monitor and audit break-glass access events</p>
        </div>
        <button
          onClick={exportComplianceReport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Now</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.activeEvents}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageDuration}h</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suspicious</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.suspiciousCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Suspicious Patterns Alert */}
      {suspiciousPatterns.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Suspicious Activity Detected</h3>
              <div className="mt-2 space-y-2">
                {suspiciousPatterns.map((pattern, index) => (
                  <div key={index} className="text-sm text-red-800">
                    <strong>{pattern.userName}</strong>: {pattern.flagReason} ({pattern.eventCount} events in {pattern.timeWindow})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4">Access by User</h3>
          <div className="space-y-3">
            {userBreakdown.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{user.userName}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(user.count / stats.totalEvents) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{user.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Type Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4">Emergency Types</h3>
          <div className="space-y-3">
            {typeBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 capitalize">{item.type.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${(item.count / stats.totalEvents) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="From Date"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="To Date"
          />
          <select
            value={filters.emergencyType}
            onChange={(e) => setFilters({ ...filters, emergencyType: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Types</option>
            <option value="life_threatening">Life Threatening</option>
            <option value="urgent_care">Urgent Care</option>
            <option value="critical_condition">Critical Condition</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
          <button
            onClick={() => setFilters({ dateFrom: '', dateTo: '', userId: '', emergencyType: '', status: 'all' })}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Justification</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {format(new Date(event.access_granted_at), 'PP p')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {event.user?.full_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {event.patient 
                      ? `${event.patient.first_name} ${event.patient.last_name}`
                      : 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                    {event.emergency_type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {event.justification}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getStatusBadge(event)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {event.access_duration_seconds 
                      ? `${Math.round(event.access_duration_seconds / 3600)}h`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
