/**
 * Supabase Edge Function: Backup Scheduler
 * 
 * Automated backup system for RCMC EMR database
 * Executes daily backups with compression, encryption, and retention policy
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.10, 1.11
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { compress } from 'https://deno.land/x/compress@v0.4.5/mod.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

// Configuration
interface BackupConfig {
  scheduleTime: string; // "02:00:00+08" (2 AM Philippine Time)
  retentionPolicy: {
    daily: number;    // 30 days
    weekly: number;   // 90 days
    monthly: number;  // 365 days
  };
  compressionLevel: number; // gzip compression level (1-9)
  encryptionAlgorithm: string; // "AES-256-CBC"
}

interface BackupResult {
  backupId: string;
  filename: string;
  fileSize: number;
  startTime: Date;
  endTime: Date;
  status: 'success' | 'failed';
  errorMessage?: string;
}

const config: BackupConfig = {
  scheduleTime: '02:00:00+08',
  retentionPolicy: {
    daily: 30,
    weekly: 90,
    monthly: 365,
  },
  compressionLevel: 6,
  encryptionAlgorithm: 'AES-256-CBC',
};

/**
 * Main backup orchestration function
 * Coordinates the entire backup process
 */
async function executeBackup(backupType: 'daily' | 'weekly' | 'monthly' | 'manual' = 'daily'): Promise<BackupResult> {
  const startTime = new Date();
  const filename = generateBackupFilename(startTime);
  let backupId: string | null = null;

  try {
    console.log(`[${startTime.toISOString()}] Starting ${backupType} backup: ${filename}`);

    // Step 1: Dump database
    const dumpData = await dumpDatabase();
    console.log(`Database dump completed: ${dumpData.length} bytes`);

    // Step 2: Compress backup
    const compressedData = await compressBackup(dumpData);
    const compressionRatio = ((dumpData.length - compressedData.length) / dumpData.length) * 100;
    console.log(`Compression completed: ${compressedData.length} bytes (${compressionRatio.toFixed(2)}% reduction)`);

    // Step 3: Encrypt backup
    const encryptedData = await encryptBackup(compressedData);
    console.log(`Encryption completed: ${encryptedData.length} bytes`);

    // Step 4: Upload to storage
    const storagePath = await uploadToStorage(filename, encryptedData);
    console.log(`Upload completed: ${storagePath}`);

    // Step 5: Log backup operation
    const endTime = new Date();
    backupId = await logBackupOperation({
      filename,
      backupType,
      fileSize: encryptedData.length,
      startTime,
      endTime,
      status: 'success',
      storagePath,
      compressionRatio,
      encrypted: true,
    });

    console.log(`[${endTime.toISOString()}] Backup completed successfully: ${backupId}`);

    // Step 6: Cleanup old backups
    await cleanupOldBackups(backupType);

    return {
      backupId,
      filename,
      fileSize: encryptedData.length,
      startTime,
      endTime,
      status: 'success',
    };
  } catch (error) {
    const endTime = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`[${endTime.toISOString()}] Backup failed:`, errorMessage);

    // Log failure
    if (backupId) {
      await logBackupOperation({
        filename,
        backupType,
        fileSize: 0,
        startTime,
        endTime,
        status: 'failed',
        errorMessage,
        storagePath: '',
        compressionRatio: 0,
        encrypted: false,
      });
    }

    // Send failure alert
    await sendFailureAlert(filename, errorMessage);

    return {
      backupId: backupId || '',
      filename,
      fileSize: 0,
      startTime,
      endTime,
      status: 'failed',
      errorMessage,
    };
  }
}

/**
 * Generate backup filename with timestamp
 * Format: rcmc_emr_backup_YYYY-MM-DD_HH-MM-SS.sql
 * 
 * Validates: Property 1 (Backup Filename Format Consistency)
 */
function generateBackupFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `rcmc_emr_backup_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.sql`;
}

/**
 * Execute pg_dump to create database snapshot
 * Uses transaction snapshot isolation for consistency
 */
async function dumpDatabase(): Promise<Uint8Array> {
  const dbUrl = Deno.env.get('DATABASE_URL');
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  // Parse database URL to extract connection parameters
  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = url.port || '5432';
  const database = url.pathname.slice(1);
  const username = url.username;
  const password = url.password;

  // Execute pg_dump command
  const command = new Deno.Command('pg_dump', {
    args: [
      '--host', host,
      '--port', port,
      '--username', username,
      '--dbname', database,
      '--format', 'plain',
      '--no-owner',
      '--no-acl',
      '--serializable-deferrable', // Transaction snapshot isolation
      '--verbose',
    ],
    env: {
      PGPASSWORD: password,
    },
    stdout: 'piped',
    stderr: 'piped',
  });

  const process = command.spawn();
  const { code, stdout, stderr } = await process.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`pg_dump failed with code ${code}: ${errorText}`);
  }

  return stdout;
}

/**
 * Compress backup data using gzip
 * 
 * Validates: Property 3 (Backup Compression Application)
 */
async function compressBackup(data: Uint8Array): Promise<Uint8Array> {
  // Create temporary file for compression
  const tempInputPath = await Deno.makeTempFile({ suffix: '.sql' });
  const tempOutputPath = await Deno.makeTempFile({ suffix: '.sql.gz' });

  try {
    // Write data to temp file
    await Deno.writeFile(tempInputPath, data);

    // Compress using gzip
    const command = new Deno.Command('gzip', {
      args: [
        `-${config.compressionLevel}`,
        '--stdout',
        tempInputPath,
      ],
      stdout: 'piped',
      stderr: 'piped',
    });

    const process = command.spawn();
    const { code, stdout, stderr } = await process.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      throw new Error(`gzip compression failed with code ${code}: ${errorText}`);
    }

    return stdout;
  } finally {
    // Cleanup temp files
    try {
      await Deno.remove(tempInputPath);
      await Deno.remove(tempOutputPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Encrypt backup data using AES-256-CBC
 * 
 * Validates: Property 5 (Backup File Encryption)
 */
async function encryptBackup(data: Uint8Array): Promise<Uint8Array> {
  const encryptionKey = Deno.env.get('BACKUP_ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('BACKUP_ENCRYPTION_KEY environment variable not set');
  }

  // Derive key from passphrase using PBKDF2
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt']
  );

  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(16));

  // Encrypt data
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    data
  );

  // Combine salt + iv + encrypted data
  const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encryptedData), salt.length + iv.length);

  return result;
}

/**
 * Upload encrypted backup to Supabase Storage
 */
async function uploadToStorage(filename: string, data: Uint8Array): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const storagePath = `backups/${filename}.gz.enc`;

  const { error } = await supabase.storage
    .from('database-backups')
    .upload(storagePath, data, {
      contentType: 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return storagePath;
}

/**
 * Log backup operation to backup_logs table
 * 
 * Validates: Property 4 (Backup Operation Logging Completeness)
 */
async function logBackupOperation(params: {
  filename: string;
  backupType: string;
  fileSize: number;
  startTime: Date;
  endTime: Date;
  status: 'success' | 'failed';
  storagePath: string;
  compressionRatio: number;
  encrypted: boolean;
  errorMessage?: string;
}): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Calculate duration in seconds
  const durationSeconds = Math.floor((params.endTime.getTime() - params.startTime.getTime()) / 1000);

  // Calculate retention date based on backup type
  const retentionUntil = calculateRetentionDate(params.backupType, params.startTime);

  const { data, error } = await supabase
    .from('backup_logs')
    .insert({
      backup_filename: params.filename,
      backup_type: params.backupType,
      file_size_bytes: params.fileSize,
      start_time: params.startTime.toISOString(),
      end_time: params.endTime.toISOString(),
      duration_seconds: durationSeconds,
      status: params.status,
      error_message: params.errorMessage || null,
      storage_path: params.storagePath,
      compression_ratio: params.compressionRatio,
      encrypted: params.encrypted,
      verified: false,
      retention_until: retentionUntil.toISOString().split('T')[0],
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to log backup operation: ${error.message}`);
  }

  return data.id;
}

/**
 * Calculate retention date based on backup type
 * 
 * Validates: Property 2 (Backup Retention Policy Calculation)
 */
function calculateRetentionDate(backupType: string, createdAt: Date): Date {
  const retentionDate = new Date(createdAt);

  switch (backupType) {
    case 'daily':
      retentionDate.setDate(retentionDate.getDate() + config.retentionPolicy.daily);
      break;
    case 'weekly':
      retentionDate.setDate(retentionDate.getDate() + config.retentionPolicy.weekly);
      break;
    case 'monthly':
      retentionDate.setDate(retentionDate.getDate() + config.retentionPolicy.monthly);
      break;
    case 'manual':
      // Manual backups use daily retention by default
      retentionDate.setDate(retentionDate.getDate() + config.retentionPolicy.daily);
      break;
    default:
      throw new Error(`Unknown backup type: ${backupType}`);
  }

  return retentionDate;
}

/**
 * Send failure alert to administrators
 */
async function sendFailureAlert(filename: string, errorMessage: string): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Cannot send failure alert: Supabase credentials not configured');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get admin users
  const { data: admins, error: adminError } = await supabase
    .from('user_profiles')
    .select('id, email, full_name')
    .eq('role', 'admin');

  if (adminError || !admins || admins.length === 0) {
    console.error('Cannot send failure alert: No admin users found');
    return;
  }

  // Create notifications for each admin
  const notifications = admins.map(admin => ({
    user_id: admin.id,
    title: 'Backup Failed',
    message: `Database backup "${filename}" failed: ${errorMessage}`,
    type: 'error',
    priority: 'high',
    read: false,
  }));

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert(notifications);

  if (notificationError) {
    console.error('Failed to create failure notifications:', notificationError.message);
  } else {
    console.log(`Failure alerts sent to ${admins.length} administrators`);
  }
}

/**
 * Cleanup old backups based on retention policy
 */
async function cleanupOldBackups(backupType: string): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find expired backups
  const today = new Date().toISOString().split('T')[0];
  const { data: expiredBackups, error: queryError } = await supabase
    .from('backup_logs')
    .select('id, backup_filename, storage_path')
    .eq('backup_type', backupType)
    .lt('retention_until', today)
    .eq('status', 'success');

  if (queryError) {
    console.error('Failed to query expired backups:', queryError.message);
    return;
  }

  if (!expiredBackups || expiredBackups.length === 0) {
    console.log('No expired backups to cleanup');
    return;
  }

  console.log(`Found ${expiredBackups.length} expired backups to cleanup`);

  // Delete from storage and database
  for (const backup of expiredBackups) {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('database-backups')
        .remove([backup.storage_path]);

      if (storageError) {
        console.error(`Failed to delete backup from storage: ${backup.storage_path}`, storageError.message);
        continue;
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('backup_logs')
        .delete()
        .eq('id', backup.id);

      if (deleteError) {
        console.error(`Failed to delete backup log: ${backup.id}`, deleteError.message);
      } else {
        console.log(`Deleted expired backup: ${backup.backup_filename}`);
      }
    } catch (error) {
      console.error(`Error cleaning up backup ${backup.backup_filename}:`, error);
    }
  }
}

/**
 * Edge Function handler
 */
serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Parse request body
    const { backupType = 'daily' } = await req.json().catch(() => ({}));

    // Validate backup type
    if (!['daily', 'weekly', 'monthly', 'manual'].includes(backupType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid backup type. Must be: daily, weekly, monthly, or manual' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Execute backup
    const result = await executeBackup(backupType);

    return new Response(
      JSON.stringify(result),
      {
        status: result.status === 'success' ? 200 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
