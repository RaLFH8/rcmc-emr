import { useState, useEffect, useCallback, useRef } from 'react';
import analyticsService, { clearCache } from '../services/analyticsService';

/**
 * Custom hook for analytics dashboard data management
 * 
 * Features:
 * - Automatic data fetching on mount and date range changes
 * - Automatic refresh every 5 minutes
 * - Pause refresh when browser tab is inactive
 * - Resume refresh when tab becomes active
 * - Manual refresh function
 * - Debouncing for date range changes (500ms)
 * - Loading and error state management
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 10.9
 */

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 500; // 500ms

export function useAnalytics(dateRange) {
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const refreshIntervalRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isActiveRef = useRef(true);

  /**
   * Fetch all analytics data
   */
  const fetchData = useCallback(async () => {
    if (!dateRange?.startDate || !dateRange?.endDate) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel for performance
      const [
        kpiMetrics,
        patientDistribution,
        revenueTrend,
        expenseBreakdown,
        performanceMetrics,
        baselineMetrics,
        revenueInsights
      ] = await Promise.all([
        analyticsService.getKPIMetrics(dateRange),
        analyticsService.getPatientDistribution(dateRange),
        analyticsService.getRevenueTrend(dateRange, 'monthly'),
        analyticsService.getExpenseBreakdown(dateRange),
        analyticsService.getPerformanceMetrics(dateRange),
        analyticsService.getBaselineMetrics(),
        analyticsService.getRevenueInsights(dateRange)
      ]);

      setMetrics(kpiMetrics);
      setChartData({
        patientDistribution,
        revenueTrend,
        expenseBreakdown,
        performanceComparison: {
          hospital: performanceMetrics,
          baseline: baselineMetrics
        },
        revenueInsights
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError({
        type: 'fetch_error',
        message: err.message || 'Failed to load analytics data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  /**
   * Manual refresh function - clears cache to ensure fresh data
   */
  const refresh = useCallback(() => {
    clearCache();
    fetchData();
  }, [fetchData]);

  /**
   * Debounced data fetch for date range changes
   */
  const debouncedFetch = useCallback(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchData();
    }, DEBOUNCE_DELAY);
  }, [fetchData]);

  /**
   * Handle visibility change (tab active/inactive)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became inactive - pause refresh
        isActiveRef.current = false;
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      } else {
        // Tab became active - resume refresh
        isActiveRef.current = true;
        
        // Immediately refresh data
        fetchData();
        
        // Restart refresh interval
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        refreshIntervalRef.current = setInterval(() => {
          if (isActiveRef.current) {
            fetchData();
          }
        }, REFRESH_INTERVAL);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  /**
   * Initial data fetch and automatic refresh setup
   */
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up automatic refresh interval (only if tab is active)
    if (isActiveRef.current) {
      refreshIntervalRef.current = setInterval(() => {
        if (isActiveRef.current) {
          fetchData();
        }
      }, REFRESH_INTERVAL);
    }

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []); // Only run on mount

  /**
   * Debounced fetch when date range changes
   */
  useEffect(() => {
    if (dateRange?.startDate && dateRange?.endDate) {
      debouncedFetch();
    }

    // Cleanup debounce timer
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [dateRange, debouncedFetch]);

  return {
    metrics,
    chartData,
    loading,
    error,
    lastUpdated,
    refresh
  };
}

export default useAnalytics;
