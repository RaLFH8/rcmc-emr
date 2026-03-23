/**
 * Supabase Edge Function: Backup Verifier
 * 
 * Weekly backup verification service for RCMC EMR database
 * Performs test restores to temporary databases to verify backup integrity
 * 
 * Requirements: 1.5
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

// Configuration
interface VerificationConfig {
  maxBackupAge: number; // Maximum age in days for backup selection (7 days)
  tempDatabasePrefix: string; // Prefix for temporary test databases
  verificationTimeout: number; // Timeout in seconds (3600 = 1 hour)
}

interface VerificationResult {
  verificationId: string;
  backupId: string;
  backupFilename: string;
  testDatabaseName: string;
  restoreSuccessful: boolean;
  dataIntegrityCheck: boolean;
  verificationTime: Date;
  errorDetails?: string;
  tablesVerified?: number;
  constraintsVerified?: number;
}

const config: VerificationConfig = {
  maxBackupAge: 7,
  tempDatabasePrefix: 'backup_verify_',
  verificationTimeout: 3600,
};

/**
 * Main verification orchestration function
 * Coordinates the entire backup verification process
 */
async function executeVerification(): Promise<VerificationResult> {
  const verificationTime = new Date();
  let testDatabaseName: string | null = null;

  try {
    console.log(`[${verificationTime.toISOString()}] Starting backup verification`);

    // Step 1: Select backup for verification
    const backup = await selectBackupForVerification();
    if (!backup) {
      throw new Error('No suitable backup found for verification');
    }
    console.log(`Selected backup for verification: ${backup.backup_filename} (ID: ${backup.id})`);

    // Step 2: Create temporary database
    testDatabaseName = await createTemporaryDatabase();
    console.log(`Created temporary database: ${testDatabaseName}`);

    // Step 3: Download and decrypt backup
    const backupData = await downloadAndDecryptBackup(backup.storage_path);
    console.log(`Downloaded and decrypted backup: ${backupData.length} bytes`);

    // Step 4: Decompress backup
    const decompressedData = await decompressBackup(backupData);
    console.log(`Decompressed backup: ${decompressedData.length} bytes`);

    // Step 5: Restore backup to temporary database
    await restoreBackup(testDatabaseName, decompressedData);
    console.log(`Restored backup to temporary database`);

    // Step 6: Verify data integrity
    const integrityResult = await verifyDataIntegrity(testDatabaseName);
    console.log(`Data integrity check: ${integrityResult.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`Tables verified: ${integrityResult.tablesCount}, Constraints verified: ${integrityResult.constraintsCount}`);

    // Step 7: Cleanup temporary database
    await cleanupTemporaryDatabase(testDatabaseName);
    console.log(`Cleaned up temporary database: ${testDatabaseName}`);

    // Step 8: Log verification result
    const verificationId = await logVerificationResult({
      backupId: backup.id,
      backupFilename: backup.backup_filename,
      testDatabaseName,
      restoreSuccessful: true,
      dataIntegrityCheck: integrityResult.passed,
      verificationTime,
      tablesVerified: integrityResult.tablesCount,
      constraintsVerified: integrityResult.constraintsCount,
    });

    console.log(`[${new Date().toISOString()}] Verification completed successfully: ${verificationId}`);

    return {
      verificationId,
      backupId: backup.id,
      backupFilename: backup.backup_filename,
      testDatabaseName,
      restoreSuccessful: true,
      dataIntegrityCheck: integrityResult.passed,
      verificationTime,
      tablesVerified: integrityResult.tablesCount,
      constraintsVerified: integrityResult.constraintsCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${new Date().toISOString()}] Verification failed:`, errorMessage);

    // Cleanup temporary database if it was created
    if (testDatabaseName) {
      try {
        await cleanupTemporaryDatabase(testDatabaseName);
        console.log(`Cleaned up temporary database after failure: ${testDatabaseName}`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup temporary database:`, cleanupError);
      }
    }

    // Log failure if we have a backup ID
    const backup = await selectBackupForVerification().catch(() => null);
    if (backup) {
      await logVerificationResult({
        backupId: backup.id,
        backupFilename: backup.backup_filename,
        testDatabaseName: testDatabaseName || 'N/A',
        restoreSuccessful: false,
        dataIntegrityCheck: false,
        verificationTime,
        errorDetails: errorMessage,
      });
    }

    return {
      verificationId: '',
      backupId: backup?.id || '',
      backupFilename: backup?.backup_filename || '',
      testDatabaseName: testDatabaseName || 'N/A',
      restoreSuccessful: false,
      dataIntegrityCheck: false,
      verificationTime,
      errorDetails: errorMessage,
    };
  }
}

/**
 * Select a backup for verification
 * Chooses the most recent successful backup from the past week that hasn't been verified
 */
async function selectBackupForVerification(): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Calculate date range (past week)
  const maxAge = new Date();
  maxAge.setDate(maxAge.getDate() - config.maxBackupAge);

  // Query for unverified successful backups from the past week
  const { data: backups, error } = await supabase
    .from('backup_logs')
    .select('id, backup_filename, storage_path, created_at')
    .eq('status', 'success')
    .eq('verified', false)
    .gte('created_at', maxAge.toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to query backups: ${error.message}`);
  }

  if (!backups || backups.length === 0) {
    // If no unverified backups, select the most recent verified one for re-verification
    const { data: verifiedBackups, error: verifiedError } = await supabase
      .from('backup_logs')
      .select('id, backup_filename, storage_path, created_at')
      .eq('status', 'success')
      .gte('created_at', maxAge.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (verifiedError) {
      throw new Error(`Failed to query verified backups: ${verifiedError.message}`);
    }

    if (!verifiedBackups || verifiedBackups.length === 0) {
      return null;
    }

    return verifiedBackups[0];
  }

  return backups[0];
}

/**
 * Create a temporary database for testing
 * Returns the name of the created database
 */
async function createTemporaryDatabase(): Promise<string> {
  const dbUrl = Deno.env.get('DATABASE_URL');
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  // Parse database URL
  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = url.port || '5432';
  const username = url.username;
  const password = url.password;

  // Generate unique database name
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const dbName = `${config.tempDatabasePrefix}${timestamp}_${randomSuffix}`;

  // Create database using psql
  const command = new Deno.Command('psql', {
    args: [
      '--host', host,
      '--port', port,
      '--username', username,
      '--dbname', 'postgres', // Connect to default postgres database
      '--command', `CREATE DATABASE ${dbName};`,
    ],
    env: {
      PGPASSWORD: password,
    },
    stdout: 'piped',
    stderr: 'piped',
  });

  const process = command.spawn();
  const { code, stderr } = await process.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to create temporary database: ${errorText}`);
  }

  return dbName;
}

/**
 * Download and decrypt backup from storage
 */
async function downloadAndDecryptBackup(storagePath: string): Promise<Uint8Array> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Download from storage
  const { data, error } = await supabase.storage
    .from('database-backups')
    .download(storagePath);

  if (error) {
    throw new Error(`Failed to download backup: ${error.message}`);
  }

  // Convert blob to Uint8Array
  const arrayBuffer = await data.arrayBuffer();
  const encryptedData = new Uint8Array(arrayBuffer);

  // Decrypt data
  const decryptedData = await decryptBackup(encryptedData);

  return decryptedData;
}

/**
 * Decrypt backup data using AES-256-CBC
 */
async function decryptBackup(encryptedData: Uint8Array): Promise<Uint8Array> {
  const encryptionKey = Deno.env.get('BACKUP_ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('BACKUP_ENCRYPTION_KEY environment variable not set');
  }

  // Extract salt, iv, and encrypted data
  const salt = encryptedData.slice(0, 16);
  const iv = encryptedData.slice(16, 32);
  const ciphertext = encryptedData.slice(32);

  // Derive key from passphrase using PBKDF2
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

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
    ['decrypt']
  );

  // Decrypt data
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    key,
    ciphertext
  );

  return new Uint8Array(decryptedData);
}

/**
 * Decompress backup data using gunzip
 */
async function decompressBackup(compressedData: Uint8Array): Promise<Uint8Array> {
  // Create temporary files for decompression
  const tempInputPath = await Deno.makeTempFile({ suffix: '.sql.gz' });
  const tempOutputPath = await Deno.makeTempFile({ suffix: '.sql' });

  try {
    // Write compressed data to temp file
    await Deno.writeFile(tempInputPath, compressedData);

    // Decompress using gunzip
    const command = new Deno.Command('gunzip', {
      args: [
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
      throw new Error(`gunzip decompression failed with code ${code}: ${errorText}`);
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
 * Restore backup to temporary database
 */
async function restoreBackup(dbName: string, backupData: Uint8Array): Promise<void> {
  const dbUrl = Deno.env.get('DATABASE_URL');
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  // Parse database URL
  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = url.port || '5432';
  const username = url.username;
  const password = url.password;

  // Create temporary file for SQL data
  const tempSqlPath = await Deno.makeTempFile({ suffix: '.sql' });

  try {
    // Write SQL data to temp file
    await Deno.writeFile(tempSqlPath, backupData);

    // Restore using psql
    const command = new Deno.Command('psql', {
      args: [
        '--host', host,
        '--port', port,
        '--username', username,
        '--dbname', dbName,
        '--file', tempSqlPath,
        '--quiet',
      ],
      env: {
        PGPASSWORD: password,
      },
      stdout: 'piped',
      stderr: 'piped',
    });

    const process = command.spawn();
    const { code, stderr } = await process.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      throw new Error(`psql restore failed with code ${code}: ${errorText}`);
    }
  } finally {
    // Cleanup temp file
    try {
      await Deno.remove(tempSqlPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Verify data integrity in the restored database
 * Checks table counts and constraint validity
 */
async function verifyDataIntegrity(dbName: string): Promise<{
  passed: boolean;
  tablesCount: number;
  constraintsCount: number;
  errors: string[];
}> {
  const dbUrl = Deno.env.get('DATABASE_URL');
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  // Parse database URL
  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = url.port || '5432';
  const username = url.username;
  const password = url.password;

  const errors: string[] = [];

  // Check 1: Verify tables exist
  const tablesQuery = `
    SELECT COUNT(*) as table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
  `;

  const tablesCommand = new Deno.Command('psql', {
    args: [
      '--host', host,
      '--port', port,
      '--username', username,
      '--dbname', dbName,
      '--tuples-only',
      '--no-align',
      '--command', tablesQuery,
    ],
    env: {
      PGPASSWORD: password,
    },
    stdout: 'piped',
    stderr: 'piped',
  });

  const tablesProcess = tablesCommand.spawn();
  const { code: tablesCode, stdout: tablesStdout, stderr: tablesStderr } = await tablesProcess.output();

  if (tablesCode !== 0) {
    const errorText = new TextDecoder().decode(tablesStderr);
    errors.push(`Failed to query tables: ${errorText}`);
    return { passed: false, tablesCount: 0, constraintsCount: 0, errors };
  }

  const tablesCount = parseInt(new TextDecoder().decode(tablesStdout).trim());
  if (tablesCount === 0) {
    errors.push('No tables found in restored database');
  }

  // Check 2: Verify constraints
  const constraintsQuery = `
    SELECT COUNT(*) as constraint_count
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK');
  `;

  const constraintsCommand = new Deno.Command('psql', {
    args: [
      '--host', host,
      '--port', port,
      '--username', username,
      '--dbname', dbName,
      '--tuples-only',
      '--no-align',
      '--command', constraintsQuery,
    ],
    env: {
      PGPASSWORD: password,
    },
    stdout: 'piped',
    stderr: 'piped',
  });

  const constraintsProcess = constraintsCommand.spawn();
  const { code: constraintsCode, stdout: constraintsStdout, stderr: constraintsStderr } = await constraintsProcess.output();

  if (constraintsCode !== 0) {
    const errorText = new TextDecoder().decode(constraintsStderr);
    errors.push(`Failed to query constraints: ${errorText}`);
    return { passed: false, tablesCount, constraintsCount: 0, errors };
  }

  const constraintsCount = parseInt(new TextDecoder().decode(constraintsStdout).trim());

  // Check 3: Verify key tables exist (patients, consultations, etc.)
  const keyTables = ['patients', 'consultations', 'prescriptions', 'appointments', 'billing'];
  for (const tableName of keyTables) {
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      );
    `;

    const tableExistsCommand = new Deno.Command('psql', {
      args: [
        '--host', host,
        '--port', port,
        '--username', username,
        '--dbname', dbName,
        '--tuples-only',
        '--no-align',
        '--command', tableExistsQuery,
      ],
      env: {
        PGPASSWORD: password,
      },
      stdout: 'piped',
      stderr: 'piped',
    });

    const tableExistsProcess = tableExistsCommand.spawn();
    const { code: tableExistsCode, stdout: tableExistsStdout } = await tableExistsProcess.output();

    if (tableExistsCode === 0) {
      const exists = new TextDecoder().decode(tableExistsStdout).trim() === 't';
      if (!exists) {
        errors.push(`Key table '${tableName}' not found in restored database`);
      }
    }
  }

  const passed = errors.length === 0 && tablesCount > 0;

  return {
    passed,
    tablesCount,
    constraintsCount,
    errors,
  };
}

/**
 * Cleanup temporary database
 */
async function cleanupTemporaryDatabase(dbName: string): Promise<void> {
  const dbUrl = Deno.env.get('DATABASE_URL');
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  // Parse database URL
  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = url.port || '5432';
  const username = url.username;
  const password = url.password;

  // Drop database using psql
  const command = new Deno.Command('psql', {
    args: [
      '--host', host,
      '--port', port,
      '--username', username,
      '--dbname', 'postgres', // Connect to default postgres database
      '--command', `DROP DATABASE IF EXISTS ${dbName};`,
    ],
    env: {
      PGPASSWORD: password,
    },
    stdout: 'piped',
    stderr: 'piped',
  });

  const process = command.spawn();
  const { code, stderr } = await process.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to drop temporary database: ${errorText}`);
  }
}

/**
 * Log verification result to backup_logs table
 */
async function logVerificationResult(params: {
  backupId: string;
  backupFilename: string;
  testDatabaseName: string;
  restoreSuccessful: boolean;
  dataIntegrityCheck: boolean;
  verificationTime: Date;
  errorDetails?: string;
  tablesVerified?: number;
  constraintsVerified?: number;
}): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Update backup_logs table with verification result
  const { error: updateError } = await supabase
    .from('backup_logs')
    .update({
      verified: params.restoreSuccessful && params.dataIntegrityCheck,
      verification_date: params.verificationTime.toISOString(),
    })
    .eq('id', params.backupId);

  if (updateError) {
    throw new Error(`Failed to update backup log: ${updateError.message}`);
  }

  // Create audit log entry
  const { data: auditData, error: auditError } = await supabase
    .from('audit_log')
    .insert({
      operation_type: params.restoreSuccessful && params.dataIntegrityCheck ? 'backup_verified' : 'backup_verification_failed',
      backup_log_id: params.backupId,
      old_data: null,
      new_data: {
        backup_filename: params.backupFilename,
        test_database_name: params.testDatabaseName,
        restore_successful: params.restoreSuccessful,
        data_integrity_check: params.dataIntegrityCheck,
        tables_verified: params.tablesVerified || 0,
        constraints_verified: params.constraintsVerified || 0,
        error_details: params.errorDetails || null,
      },
    })
    .select('id')
    .single();

  if (auditError) {
    console.error('Failed to create audit log entry:', auditError.message);
  }

  return auditData?.id || params.backupId;
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
    // Execute verification
    const result = await executeVerification();

    return new Response(
      JSON.stringify(result),
      {
        status: result.restoreSuccessful && result.dataIntegrityCheck ? 200 : 500,
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
