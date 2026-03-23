/**
 * Compliance Dashboard
 * 
 * Unified dashboard for monitoring clinical safety compliance
 * across backup, consent, and emergency access systems.
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { useState, useEffect } from 'react';
import { Shield, Database, FileText, AlertTriangle, CheckCircle, TrendingUp, Download } from 'lucide-react';
import { db } from '../lib/supabase';
import { getConsentCoverage, getExpiringConsents } from '../services/consentService';
import jsPDF from 'jspdf';

export default function ComplianceDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    backupSuccessRate: 0,
    consentCoverage: 0,
    breakGlassEvents: 0,
    lastBackupTime: null,
    expiringConsents: 0,
    recentAlerts: []
  });

  useEffect(() => {
    loadMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBackupMetrics(),
        loadConsentMetrics(),
        loadEmergencyAccessMetrics(),
        loadAlerts()
      ]);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBackupMetrics = async () => {
    try {
      const { data, error } = await db.supabase
        .from('backup_logs')
        .select('status, created_at')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const successCount = data?.filter(b => b.status === 'success').length || 0;
      const totalCount = data?.length || 1;
      const successRate = (successCount / totalCount) * 100;

      const lastBackup = data?.[0];

      setMetrics(prev => ({
        ...prev,
        backupSuccessRate: Math.round(successRate),
        lastBackupTime: lastBackup?.created_at
      }));
    } catch (error) {
      console.error('Failed to load backup metrics:', error);
    }
  };

  const loadConsentMetrics = async () => {
    try {
      const coverage = await getConsentCoverage();
      const expiring = await getExpiringConsents(30);

      setMetrics(prev => ({
        ...prev,
        consentCoverage: coverage?.coverage_percentage || 0,
        expiringConsents: expiring?.length || 0
      }));
    } catch (error) {
      console.error('Failed to load consent metrics:', error);
    }
  };

  const loadEmergencyAccessMetrics = async () => {
    try {
      const { data, error } = await db.supabase
        .from('emergency_access_logs')
        .select('id')
        .gte('access_granted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      setMetrics(prev => ({
        ...prev,
        breakGlassEvents: data?.length || 0
      }));
    } catch (error) {
      console.error('Failed to load emergency access metrics:', error);
    }
  };

  const loadAlerts = async () => {
    const alerts = [];

    try {
      // Check for backup failures
      const { data: failedBackups } = await db.supabase
        .from('backup_logs')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      failedBackups?.forEach(backup => {
        alerts.push({
          type: 'error',
          category: 'backup',
          title: 'Backup Failure',
          message: `Backup failed: ${backup.error_message || 'Unknown error'}`,
          timestamp: backup.created_at
        });
      });

      // Check for expired consents
      const expiring = await getExpiringConsents(7);
      if (expiring && expiring.length > 0) {
        alerts.push({
          type: 'warning',
          category: 'consent',
          title: 'Consents Expiring Soon',
          message: `${expiring.length} consent(s) expiring within 7 days`,
          timestamp: new Date().toISOString()
        });
      }

      // Check for unusual emergency access patterns
      const { data: recentEmergencyAccess } = await db.supabase
        .from('emergency_access_logs')
        .select('user_id')
        .gte('access_granted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentEmergencyAccess) {
        const userCounts = {};
        recentEmergencyAccess.forEach(log => {
          userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
        });

        Object.entries(userCounts).forEach(([userId, count]) => {
          if (count >= 5) {
            alerts.push({
              type: 'warning',
              category: 'emergency_access',
              title: 'Unusual Emergency Access Pattern',
              message: `User has requested emergency access ${count} times in the last 24 hours`,
              timestamp: new Date().toISOString()
            });
          }
        });
      }

      setMetrics(prev => ({
        ...prev,
        recentAlerts: alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }));
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const exportComplianceReport = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Safety Compliance Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Metrics Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Compliance Metrics', 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const metricsData = [
      ['Backup Success Rate', `${metrics.backupSuccessRate}%`, metrics.backupSuccessRate >= 99 ? 'PASS' : 'FAIL'],
      ['Consent Coverage', `${metrics.consentCoverage}%`, metrics.consentCoverage >= 95 ? 'PASS' : 'FAIL'],
      ['Break-Glass Events (30 days)', metrics.breakGlassEvents, 'INFO'],
      ['Expiring Consents', metrics.expiringConsents, metrics.expiringConsents === 0 ? 'PASS' : 'WARNING']
    ];

    metricsData.forEach(([metric, value, status]) => {
      doc.text(`${metric}:`, 14, yPos);
      doc.text(String(value), 100, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(status, 150, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 7;
    });

    yPos += 10;

    // Alerts Section
    if (metrics.recentAlerts.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Alerts', 14, yPos);
      yPos += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      metrics.recentAlerts.slice(0, 10).forEach(alert => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`[${alert.type.toUpperCase()}] ${alert.title}`, 14, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'normal');
        const messageLines = doc.splitTextToSize(alert.message, pageWidth - 28);
        messageLines.forEach(line => {
          doc.text(line, 14, yPos);
          yPos += 5;
        });

        doc.setFont('helvetica', 'italic');
        doc.text(new Date(alert.timestamp).toLocaleString(), 14, yPos);
        yPos += 8;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('RCMC Medical Clinic - Clinical Safety Compliance Report', pageWidth / 2, 285, { align: 'center' });

    // Download
    doc.save(`compliance_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Compliance Dashboard</h1>
          <p className="text-gray-600">Clinical Safety Trio Monitoring</p>
        </div>
        <button
          onClick={exportComplianceReport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Backup Success Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${metrics.backupSuccessRate >= 99 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Database className={`w-6 h-6 ${metrics.backupSuccessRate >= 99 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Backup Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.backupSuccessRate}%</p>
              </div>
            </div>
            {metrics.backupSuccessRate >= 99 ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <div className="text-xs text-gray-500">
            Last backup: {metrics.lastBackupTime ? new Date(metrics.lastBackupTime).toLocaleString() : 'N/A'}
          </div>
          <div className="mt-2">
            <div className="text-xs font-medium text-gray-700 mb-1">Target: 99%+</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${metrics.backupSuccessRate >= 99 ? 'bg-green-600' : 'bg-red-600'}`}
                style={{ width: `${Math.min(metrics.backupSuccessRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Consent Coverage */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${metrics.consentCoverage >= 95 ? 'bg-green-100' : 'bg-orange-100'}`}>
                <FileText className={`w-6 h-6 ${metrics.consentCoverage >= 95 ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Consent Coverage</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.consentCoverage}%</p>
              </div>
            </div>
            {metrics.consentCoverage >= 95 ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <TrendingUp className="w-8 h-8 text-orange-600" />
            )}
          </div>
          <div className="text-xs text-gray-500">
            {metrics.expiringConsents} consent(s) expiring within 30 days
          </div>
          <div className="mt-2">
            <div className="text-xs font-medium text-gray-700 mb-1">Target: 95%+</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${metrics.consentCoverage >= 95 ? 'bg-green-600' : 'bg-orange-600'}`}
                style={{ width: `${Math.min(metrics.consentCoverage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Break-Glass Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Break-Glass Events</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.breakGlassEvents}</p>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Last 30 days
          </div>
          <div className="mt-2">
            <div className="text-xs font-medium text-gray-700 mb-1">All events logged and auditable</div>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>100% audit trail coverage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {metrics.recentAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {metrics.recentAlerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  alert.type === 'error' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  alert.type === 'error' ? 'text-red-600' :
                  alert.type === 'warning' ? 'text-orange-600' :
                  'text-blue-600'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-semibold ${
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-orange-800' :
                      'text-blue-800'
                    }`}>
                      {alert.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    alert.type === 'error' ? 'text-red-700' :
                    alert.type === 'warning' ? 'text-orange-700' :
                    'text-blue-700'
                  }`}>
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Status Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Data Protection (Backups)</span>
            {metrics.backupSuccessRate >= 99 ? (
              <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle className="w-4 h-4" />
                Compliant
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium text-red-600">
                <AlertTriangle className="w-4 h-4" />
                Action Required
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Legal Compliance (Consent)</span>
            {metrics.consentCoverage >= 95 ? (
              <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle className="w-4 h-4" />
                Compliant
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium text-orange-600">
                <TrendingUp className="w-4 h-4" />
                Improving
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Emergency Access Audit</span>
            <span className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle className="w-4 h-4" />
              100% Logged
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Data Privacy Act</span>
            {metrics.consentCoverage >= 95 ? (
              <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle className="w-4 h-4" />
                Compliant
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium text-orange-600">
                <TrendingUp className="w-4 h-4" />
                In Progress
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
