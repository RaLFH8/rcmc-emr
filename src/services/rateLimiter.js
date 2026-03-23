import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '../lib/supabase';

/**
 * Check if a user is allowed to submit a survey based on rate limiting rules
 * Uses browser fingerprint + IP address to prevent duplicate submissions within 24 hours
 * 
 * @returns {Promise<Object>} Object with allowed status, fingerprint, IP, and last submission time
 */
export const checkRateLimit = async () => {
  try {
    // Generate browser fingerprint
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const fingerprint = result.visitorId;
    
    // Get IP address (best effort - may fail due to CORS or network issues)
    let ipAddress = null;
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip;
    } catch (error) {
      console.warn('Could not fetch IP address:', error);
      // Continue without IP - fingerprint alone is sufficient
    }
    
    // Check for submissions in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('satisfaction_ratings')
      .select('id, submission_timestamp')
      .eq('submitter_fingerprint', fingerprint)
      .gte('submission_timestamp', twentyFourHoursAgo)
      .limit(1);
    
    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow submission if rate limit check fails
      return { allowed: true, fingerprint, ipAddress };
    }
    
    const allowed = !data || data.length === 0;
    
    return {
      allowed,
      fingerprint,
      ipAddress,
      lastSubmission: data && data.length > 0 ? data[0].submission_timestamp : null
    };
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Fail open - allow submission if rate limiter fails
    return { allowed: true, fingerprint: null, ipAddress: null };
  }
};
