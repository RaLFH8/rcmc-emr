/**
 * Consent Expiration Notifier Edge Function
 * 
 * Scheduled function that checks for expiring consents and sends notifications
 * for the Clinical Safety Trio feature.
 * 
 * Requirements: 2.10
 * 
 * Schedule: Daily at 8:00 AM Philippine Time
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpiringConsent {
  id: string;
  patient_id: string;
  consent_type: string;
  expiration_date: string;
  days_remaining: number;
  patient_name: string;
  patient_number: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting consent expiration check...');

    // Get consents expiring within 30 days
    const { data: expiringConsents, error: queryError } = await supabase
      .rpc('get_expiring_consents', { days_until_expiration: 30 });

    if (queryError) {
      throw new Error(`Failed to query expiring consents: ${queryError.message}`);
    }

    console.log(`Found ${expiringConsents?.length || 0} expiring consents`);

    if (!expiringConsents || expiringConsents.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No expiring consents found',
          count: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Get patient information for each expiring consent
    const consentsWithPatients: ExpiringConsent[] = await Promise.all(
      expiringConsents.map(async (consent: any) => {
        const { data: patient } = await supabase
          .from('patients')
          .select('first_name, last_name, patient_number')
          .eq('id', consent.patient_id)
          .single();

        return {
          ...consent,
          patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
          patient_number: patient?.patient_number || 'N/A'
        };
      })
    );

    // Group consents by urgency
    const urgent = consentsWithPatients.filter(c => c.days_remaining <= 7);
    const warning = consentsWithPatients.filter(c => c.days_remaining > 7 && c.days_remaining <= 14);
    const notice = consentsWithPatients.filter(c => c.days_remaining > 14);

    // Get all staff users who should receive notifications
    const { data: staffUsers, error: staffError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, role')
      .in('role', ['admin', 'doctor', 'nurse']);

    if (staffError) {
      console.error('Failed to get staff users:', staffError);
    }

    // Create notifications for staff
    const notifications = [];

    if (urgent.length > 0) {
      const urgentMessage = `URGENT: ${urgent.length} consent(s) expiring within 7 days`;
      for (const staff of staffUsers || []) {
        notifications.push({
          user_id: staff.id,
          title: 'Urgent: Consents Expiring Soon',
          message: urgentMessage,
          type: 'warning',
          priority: 'high',
          action_url: '/consent-management',
          metadata: {
            consent_count: urgent.length,
            urgency: 'urgent',
            consents: urgent.map(c => ({
              patient_name: c.patient_name,
              patient_number: c.patient_number,
              days_remaining: c.days_remaining
            }))
          }
        });
      }
    }

    if (warning.length > 0) {
      const warningMessage = `${warning.length} consent(s) expiring within 14 days`;
      for (const staff of staffUsers || []) {
        notifications.push({
          user_id: staff.id,
          title: 'Consents Expiring Soon',
          message: warningMessage,
          type: 'info',
          priority: 'medium',
          action_url: '/consent-management',
          metadata: {
            consent_count: warning.length,
            urgency: 'warning'
          }
        });
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Failed to create notifications:', notificationError);
      } else {
        console.log(`Created ${notifications.length} notifications`);
      }
    }

    // Log the expiration check to audit trail
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        operation_type: 'consent_expiration_check',
        table_name: 'consent_records',
        action: 'select',
        new_data: {
          total_expiring: expiringConsents.length,
          urgent_count: urgent.length,
          warning_count: warning.length,
          notice_count: notice.length,
          notifications_sent: notifications.length
        }
      });

    if (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Consent expiration check completed',
        summary: {
          total_expiring: expiringConsents.length,
          urgent: urgent.length,
          warning: warning.length,
          notice: notice.length,
          notifications_sent: notifications.length
        },
        urgent_consents: urgent.map(c => ({
          patient_name: c.patient_name,
          patient_number: c.patient_number,
          consent_type: c.consent_type,
          days_remaining: c.days_remaining
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in consent expiration notifier:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
