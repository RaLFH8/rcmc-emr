// Emergency Access Expiration Scheduler
// Runs hourly to revoke expired emergency access sessions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmergencyAccessLog {
  id: string;
  user_id: string;
  patient_id: string;
  access_granted_at: string;
  access_expires_at: string;
  access_revoked_at: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Checking for expired emergency access sessions...');

    // Find all expired access sessions that haven't been revoked
    const { data: expiredSessions, error: fetchError } = await supabase
      .from('emergency_access_logs')
      .select('*')
      .is('access_revoked_at', null)
      .lt('access_expires_at', new Date().toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch expired sessions: ${fetchError.message}`);
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      console.log('✅ No expired sessions found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No expired sessions to revoke',
          revokedCount: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`⏰ Found ${expiredSessions.length} expired session(s)`);

    // Revoke each expired session
    const revokedSessions: string[] = [];
    const errors: string[] = [];

    for (const session of expiredSessions) {
      try {
        // Update the session to mark as revoked
        const { error: updateError } = await supabase
          .from('emergency_access_logs')
          .update({
            access_revoked_at: new Date().toISOString(),
            revocation_reason: 'Automatic expiration after 24 hours',
          })
          .eq('id', session.id);

        if (updateError) {
          throw new Error(`Failed to revoke session ${session.id}: ${updateError.message}`);
        }

        // Log to audit trail
        const { error: auditError } = await supabase
          .from('audit_log')
          .insert({
            user_id: session.user_id,
            action: 'emergency_access_expired',
            table_name: 'emergency_access_logs',
            record_id: session.id,
            operation_type: 'emergency_access_expired',
            emergency_access_log_id: session.id,
            new_data: {
              patient_id: session.patient_id,
              access_granted_at: session.access_granted_at,
              access_expires_at: session.access_expires_at,
              access_revoked_at: new Date().toISOString(),
              revocation_reason: 'Automatic expiration after 24 hours',
            },
          });

        if (auditError) {
          console.error(`⚠️ Failed to log audit trail for session ${session.id}:`, auditError);
        }

        revokedSessions.push(session.id);
        console.log(`✅ Revoked session ${session.id} for user ${session.user_id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Session ${session.id}: ${errorMessage}`);
        console.error(`❌ Error revoking session ${session.id}:`, errorMessage);
      }
    }

    // Return summary
    const response = {
      success: errors.length === 0,
      message: `Revoked ${revokedSessions.length} of ${expiredSessions.length} expired session(s)`,
      revokedCount: revokedSessions.length,
      revokedSessions,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('📊 Expiration check complete:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: errors.length > 0 ? 207 : 200, // 207 Multi-Status if partial success
    });
  } catch (error) {
    console.error('❌ Emergency access expiration check failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
