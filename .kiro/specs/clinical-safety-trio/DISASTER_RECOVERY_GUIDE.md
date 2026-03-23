# RCMC EMR Disaster Recovery Guide

## Document Information

**Version:** 1.0  
**Last Updated:** January 2025  
**System:** RCMC EMR (Electronic Medical Records)  
**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 24 hours  

## Purpose

This guide provides step-by-step procedures for recovering the RCMC EMR system from catastrophic failures, including database corruption, hardware failure, accidental deletion, or complete system loss. This document is designed to be used by both technical and non-technical staff during emergency situations.

---

## Table of Contents

1. [Emergency Contacts](#emergency-contacts)
2. [Recovery Time and Point Objectives](#recovery-time-and-point-objectives)
3. [Backup System Overview](#backup-system-overview)
4. [Full System Restoration Procedure](#full-system-restoration-procedure)
5. [Backup Verification Process](#backup-verification-process)
6. [Manual Backup Procedure](#manual-backup-procedure)
7. [Retention Policy Details](#retention-policy-details)
8. [Testing Procedures](#testing-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Appendix: Technical Reference](#appendix-technical-reference)

---

## Emergency Contacts

### Primary Contacts

**System Administrator**
- Name: [TO BE FILLED]
- Phone: [TO BE FILLED]
- Email: [TO BE FILLED]
- Available: 24/7 for critical incidents

**Database Administrator**
- Name: [TO BE FILLED]
- Phone: [TO BE FILLED]
- Email: [TO BE FILLED]
- Available: Business hours + on-call

**IT Support Lead**
- Name: [TO BE FILLED]
- Phone: [TO BE FILLED]
- Email: [TO BE FILLED]
- Available: Business hours


### External Support

**Supabase Support**
- Support Portal: https://supabase.com/dashboard/support
- Email: support@supabase.com
- Emergency: Use dashboard support for critical issues
- Response Time: 24-48 hours (free tier), <4 hours (Pro tier)

**Cloudflare Pages Support**
- Dashboard: https://dash.cloudflare.com
- Documentation: https://developers.cloudflare.com/pages
- Community: https://community.cloudflare.com

### Escalation Path

1. **Level 1:** IT Support Lead (first contact)
2. **Level 2:** Database Administrator (if database-related)
3. **Level 3:** System Administrator (for critical decisions)
4. **Level 4:** External vendor support (Supabase/Cloudflare)

---

## Recovery Time and Point Objectives

### Recovery Time Objective (RTO): 4 Hours

**Definition:** Maximum acceptable time to restore the system to operational status after a disaster.

**Target Timeline:**
- **Hour 0-1:** Incident assessment and backup selection
- **Hour 1-2:** Database restoration
- **Hour 2-3:** System verification and testing
- **Hour 3-4:** User access restoration and communication

### Recovery Point Objective (RPO): 24 Hours

**Definition:** Maximum acceptable amount of data loss measured in time.

**What This Means:**
- Daily backups at 2:00 AM Philippine Time
- Maximum data loss: Up to 24 hours of patient records
- Most recent backup is always less than 24 hours old

**Data Loss Scenarios:**
- **Best Case:** 1 hour of data (disaster at 3:00 AM)
- **Worst Case:** 24 hours of data (disaster at 1:59 AM)
- **Average Case:** 12 hours of data

---

## Backup System Overview

### Backup Types

The RCMC EMR system maintains three types of backups:

#### 1. Daily Backups
- **Frequency:** Every day at 2:00 AM PHT
- **Retention:** 30 days
- **Purpose:** Recent data recovery
- **Use Case:** Recover from recent errors or corruption

#### 2. Weekly Backups
- **Frequency:** Every Sunday at 3:00 AM PHT
- **Retention:** 90 days (3 months)
- **Purpose:** Medium-term recovery
- **Use Case:** Recover from issues discovered after several days

#### 3. Monthly Backups
- **Frequency:** 1st of each month at 4:00 AM PHT
- **Retention:** 365 days (1 year)
- **Purpose:** Long-term recovery and compliance
- **Use Case:** Historical data recovery, audit requirements


### Backup Storage

**Location:** Supabase Storage bucket `database-backups`

**Security Features:**
- ✅ AES-256 encryption at rest
- ✅ Gzip compression (reduces size by ~70%)
- ✅ Separate storage from primary database
- ✅ Access restricted to service role key

**Storage Capacity:**
- Current database size: ~37 MB
- Compressed backup size: ~10-15 MB
- Available storage: 430 MB (Supabase free tier)
- Estimated capacity: 28+ daily backups

### Backup Verification

**Frequency:** Weekly (every Sunday after backup)

**Process:**
1. Automated test restore to temporary database
2. Data integrity checks (table counts, constraints)
3. Key table verification (patients, consultations, etc.)
4. Results logged to `backup_logs` table

**Verification Status:**
- Check `verified` column in `backup_logs` table
- Only use verified backups for critical restorations

---

## Full System Restoration Procedure

### ⚠️ CRITICAL: Read Before Starting

**STOP and assess:**
- [ ] Is this truly a disaster requiring full restoration?
- [ ] Have you contacted the System Administrator?
- [ ] Do you have the necessary credentials?
- [ ] Have you identified the correct backup to restore?

**Prerequisites:**
- Supabase dashboard access (admin credentials)
- Service role key (stored securely)
- This guide and a working computer
- Estimated time: 2-4 hours

---

### Step 1: Incident Assessment (15 minutes)

#### 1.1 Identify the Problem

**Common Disaster Scenarios:**
- Database corruption (cannot query data)
- Accidental data deletion (tables or records missing)
- Hardware failure (database server down)
- Ransomware or security breach
- Complete system loss

**Document the incident:**
```
Incident Date/Time: _______________
Discovered By: _______________
Problem Description: _______________
Last Known Good State: _______________
Estimated Data Loss: _______________
```

#### 1.2 Determine Recovery Point

**Question:** When was the last time the system was working correctly?

**Options:**
- **Today:** Use most recent daily backup
- **This week:** Use appropriate daily backup
- **This month:** Use weekly backup
- **Older:** Use monthly backup

**⚠️ Important:** Choosing a backup means losing all data created after that backup time.


---

### Step 2: Select Backup (15 minutes)

#### 2.1 Access Supabase Dashboard

1. Open browser and navigate to: https://supabase.com/dashboard
2. Log in with admin credentials
3. Select RCMC EMR project

#### 2.2 Query Available Backups

1. Go to **SQL Editor** in left sidebar
2. Run this query to see recent backups:

```sql
SELECT 
  backup_filename,
  backup_type,
  file_size_bytes / 1024 / 1024 as size_mb,
  created_at,
  status,
  verified,
  retention_until
FROM backup_logs
WHERE status = 'success'
ORDER BY created_at DESC
LIMIT 20;
```

#### 2.3 Choose the Right Backup

**Selection Criteria:**
1. ✅ Status = 'success'
2. ✅ Verified = true (preferred)
3. ✅ Created before the incident
4. ✅ Most recent that meets above criteria

**Example:**
```
Incident occurred: 2024-01-15 10:30 AM
Last known good: 2024-01-15 8:00 AM
Choose backup: rcmc_emr_backup_2024-01-15_02-00-00.sql (created at 2:00 AM)
Data loss: 8.5 hours (2:00 AM to 10:30 AM)
```

**Record your selection:**
```
Selected Backup: _______________
Backup Date/Time: _______________
Verified: Yes / No
Expected Data Loss: _______________
```

---

### Step 3: Download and Decrypt Backup (30 minutes)

#### 3.1 Download from Supabase Storage

**Option A: Using Supabase Dashboard**

1. Go to **Storage** in left sidebar
2. Click on `database-backups` bucket
3. Navigate to `backups/` folder
4. Find your selected backup file (e.g., `rcmc_emr_backup_2024-01-15_02-00-00.sql.gz.enc`)
5. Click the three dots (⋮) next to the file
6. Select **Download**
7. Save to a secure location on your computer

**Option B: Using Command Line (Advanced)**

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Download backup
supabase storage download \
  --project-ref YOUR_PROJECT_REF \
  database-backups/backups/rcmc_emr_backup_2024-01-15_02-00-00.sql.gz.enc \
  --output backup.sql.gz.enc
```


#### 3.2 Decrypt the Backup

**⚠️ Required:** Backup encryption key (stored securely by System Administrator)

**Using OpenSSL (Linux/macOS):**

```bash
# Set encryption key as environment variable
export BACKUP_ENCRYPTION_KEY="your-encryption-key-here"

# Decrypt the backup
openssl enc -d -aes-256-cbc \
  -in backup.sql.gz.enc \
  -out backup.sql.gz \
  -pass env:BACKUP_ENCRYPTION_KEY \
  -pbkdf2 -iter 100000
```

**Using PowerShell (Windows):**

```powershell
# Note: Windows decryption requires additional tools
# Contact System Administrator for Windows-specific instructions
```

**Verification:**
- Decrypted file should be smaller than encrypted file
- File extension should be `.sql.gz`
- File size should be 10-15 MB (compressed)

#### 3.3 Decompress the Backup

**Using gzip (Linux/macOS):**

```bash
gunzip backup.sql.gz
# This creates backup.sql
```

**Using 7-Zip (Windows):**

1. Right-click on `backup.sql.gz`
2. Select **7-Zip → Extract Here**
3. Result: `backup.sql` file

**Verification:**
- Decompressed file should be 30-50 MB
- File extension should be `.sql`
- Open in text editor - should see SQL commands

---

### Step 4: Prepare Database for Restoration (15 minutes)

#### 4.1 Create Backup of Current State (Optional but Recommended)

**Even if corrupted, backup current state for forensics:**

1. Go to Supabase Dashboard → SQL Editor
2. Run manual backup:

```sql
-- This creates a snapshot of current state
SELECT backup_scheduler('manual');
```

3. Wait 2-3 minutes for completion
4. Verify in `backup_logs` table

#### 4.2 Notify Users of Downtime

**⚠️ CRITICAL: Inform all users before proceeding**

**Communication Template:**

```
URGENT: System Maintenance in Progress

The RCMC EMR system is currently undergoing emergency restoration.

Expected Downtime: 2-3 hours
Estimated Completion: [TIME]

During this time:
- No access to patient records
- No new appointments can be created
- No billing operations available

For urgent patient care needs, contact: [EMERGENCY CONTACT]

We will notify you when the system is restored.

Thank you for your patience.
```

**Send via:**
- Email to all staff
- SMS to key personnel
- Posted notice in clinic


#### 4.3 Disable Scheduled Backups (Prevent Conflicts)

**If using pg_cron:**

```sql
-- Temporarily disable backup jobs
SELECT cron.unschedule('rcmc-emr-daily-backup');
SELECT cron.unschedule('rcmc-emr-weekly-backup');
SELECT cron.unschedule('rcmc-emr-monthly-backup');
```

**If using GitHub Actions:**
1. Go to repository → Actions
2. Disable workflow temporarily

**If using External Cron:**
1. SSH to server
2. Comment out cron jobs: `crontab -e`

---

### Step 5: Restore Database (60-90 minutes)

#### 5.1 Access Database Connection

**Get connection string:**
1. Supabase Dashboard → Settings → Database
2. Copy **Connection string** (URI format)
3. Replace `[YOUR-PASSWORD]` with actual password

**Example:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

#### 5.2 Connect to Database

**Using psql (Command Line):**

```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

**Using Supabase SQL Editor:**
- Already connected when logged into dashboard
- Can execute SQL directly

#### 5.3 Drop Existing Schema (⚠️ DESTRUCTIVE)

**⚠️ WARNING: This will delete all current data. Ensure you have a backup!**

```sql
-- Drop all tables in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all functions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes 
              FROM pg_proc INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
              WHERE pg_namespace.nspname = 'public') 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
    END LOOP;
END $$;

-- Verify clean state
SELECT COUNT(*) as remaining_tables FROM pg_tables WHERE schemaname = 'public';
-- Should return 0
```


#### 5.4 Restore from Backup File

**Using psql (Recommended):**

```bash
# Restore the backup
psql $DATABASE_URL < backup.sql

# This will take 5-15 minutes depending on database size
# You will see SQL commands being executed
```

**Using Supabase SQL Editor (Alternative):**

1. Open `backup.sql` in text editor
2. Copy contents (may be large)
3. Paste into SQL Editor
4. Click **Run**
5. Wait for completion (may take 10-20 minutes)

**⚠️ Note:** Large backups may timeout in SQL Editor. Use psql for reliability.

#### 5.5 Verify Restoration

**Check table counts:**

```sql
-- Count tables
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return 20+ tables

-- Check key tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('patients', 'consultations', 'prescriptions', 'appointments', 'billing')
ORDER BY table_name;
-- Should return all 5 tables

-- Check patient count
SELECT COUNT(*) as patient_count FROM patients;
-- Should return expected number of patients

-- Check recent records
SELECT COUNT(*) as recent_consultations 
FROM consultations 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
-- Should return recent consultation count
```

**Expected Results:**
- ✅ All tables restored
- ✅ Patient count matches expectations
- ✅ Recent records present (up to backup time)
- ✅ No error messages

---

### Step 6: Restore RLS Policies and Functions (30 minutes)

#### 6.1 Verify RLS Policies

**Check if RLS policies were restored:**

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**If policies are missing, re-run migration scripts:**

1. Go to project repository
2. Navigate to `rcmc-emr/.kiro/specs/clinical-safety-trio/migrations/`
3. Run each migration file in order:
   - `01-create-backup-logs.sql`
   - `02-create-consent-records.sql`
   - `03-create-emergency-access-logs.sql`
   - `04-enhance-audit-log.sql`
   - `05-create-triggers-and-functions.sql`
   - `06-update-rls-policies.sql`

#### 6.2 Verify Database Functions

**Check critical functions:**

```sql
-- List all functions
SELECT proname, prosrc 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

-- Test backup function (if using pg_cron)
SELECT backup_scheduler('manual');
```


#### 6.3 Re-enable Scheduled Backups

**If using pg_cron:**

```sql
-- Re-enable backup jobs
SELECT cron.schedule(
  'rcmc-emr-daily-backup',
  '0 18 * * *',  -- 2:00 AM PHT (18:00 UTC)
  $$SELECT backup_scheduler('daily')$$
);

SELECT cron.schedule(
  'rcmc-emr-weekly-backup',
  '0 19 * * 6',  -- 3:00 AM PHT Sunday (19:00 UTC Saturday)
  $$SELECT backup_scheduler('weekly')$$
);

SELECT cron.schedule(
  'rcmc-emr-monthly-backup',
  '0 20 L * *',  -- 4:00 AM PHT 1st of month (20:00 UTC last day)
  $$SELECT backup_scheduler('monthly')$$
);
```

**If using GitHub Actions:**
1. Go to repository → Actions
2. Re-enable workflow

**If using External Cron:**
1. SSH to server
2. Uncomment cron jobs: `crontab -e`

---

### Step 7: System Verification and Testing (45 minutes)

#### 7.1 Database Connectivity Test

**Test from application:**

1. Open RCMC EMR application: https://your-app.pages.dev
2. Attempt to log in with test account
3. Verify login successful

**If login fails:**
- Check Supabase connection string in environment variables
- Verify RLS policies are active
- Check user_profiles table exists

#### 7.2 Data Integrity Checks

**Run comprehensive checks:**

```sql
-- Check for orphaned records
SELECT 'consultations' as table_name, COUNT(*) as orphaned_count
FROM consultations c
LEFT JOIN patients p ON c.patient_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 'prescriptions', COUNT(*)
FROM prescriptions pr
LEFT JOIN consultations c ON pr.consultation_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 'billing', COUNT(*)
FROM billing b
LEFT JOIN patients p ON b.patient_id = p.id
WHERE p.id IS NULL;

-- Should return 0 for all tables
```

**Check constraints:**

```sql
-- Verify foreign key constraints
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Should return multiple foreign key constraints
```

#### 7.3 Functional Testing

**Test critical workflows:**

1. **Patient Search**
   - Search for existing patient
   - Verify patient details display correctly

2. **Consultation Access**
   - Open patient record
   - View consultation history
   - Verify SOAP notes visible

3. **Prescription Viewing**
   - Open consultation
   - View prescriptions
   - Verify medications listed

4. **Appointment Calendar**
   - Navigate to appointments
   - Verify appointments display
   - Check date ranges

5. **Billing Records**
   - Access billing page
   - Search for patient billing
   - Verify amounts and status


**Test Checklist:**
- [ ] User login successful
- [ ] Patient search works
- [ ] Patient details display
- [ ] Consultation history visible
- [ ] Prescriptions accessible
- [ ] Appointments display
- [ ] Billing records accessible
- [ ] No error messages in console
- [ ] Page load times normal (<3 seconds)

---

### Step 8: User Access Restoration (30 minutes)

#### 8.1 Verify User Accounts

**Check user_profiles table:**

```sql
-- List all users
SELECT id, email, full_name, role, created_at
FROM user_profiles
ORDER BY role, full_name;

-- Check for missing users
-- Compare with pre-disaster user list
```

**If users are missing:**
- They may have been created after the backup
- Recreate accounts manually or from user list

#### 8.2 Test User Permissions

**Test each role:**

1. **Admin:** Full access to all features
2. **Doctor:** Access to consultations, prescriptions
3. **Nurse:** Access to patient records, appointments
4. **Billing Staff:** Access to billing, payments
5. **Receptionist:** Access to appointments, patient registration

**Permission Test:**
```sql
-- Test RLS policies for each role
SET ROLE authenticated;
SET request.jwt.claims.role = 'doctor';

-- Try to access patients
SELECT COUNT(*) FROM patients;
-- Should return patient count

-- Try to access billing (should fail for doctor)
SELECT COUNT(*) FROM billing;
-- Should return 0 or error (depending on RLS policy)
```

#### 8.3 Notify Users of Restoration

**Communication Template:**

```
SYSTEM RESTORED: RCMC EMR Back Online

The RCMC EMR system has been successfully restored and is now available.

Restoration Details:
- Restored from backup: [BACKUP DATE/TIME]
- Data loss period: [START TIME] to [END TIME]
- Total downtime: [DURATION]

Important Notes:
- Any data entered between [BACKUP TIME] and [INCIDENT TIME] has been lost
- Please review your recent work and re-enter if necessary
- Report any issues immediately to IT Support

If you notice any missing or incorrect data, please contact:
[IT SUPPORT CONTACT]

Thank you for your patience during this restoration.
```

**Send via:**
- Email to all staff
- SMS to key personnel
- Posted notice in clinic
- Announcement in system (if notification feature available)

---

## Backup Verification Process

### Purpose

Weekly verification ensures backups are valid and can be restored successfully. This prevents discovering backup corruption during an actual disaster.


### Automated Verification (Recommended)

**Frequency:** Every Sunday at 4:00 AM PHT (after weekly backup)

**Process:**
1. Backup verifier Edge Function automatically runs
2. Selects most recent unverified backup
3. Creates temporary test database
4. Restores backup to test database
5. Verifies data integrity (table counts, constraints)
6. Cleans up test database
7. Logs results to `backup_logs` table

**Check verification status:**

```sql
SELECT 
  backup_filename,
  created_at,
  verified,
  verification_date,
  status
FROM backup_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;
```

**Expected Results:**
- ✅ `verified = true` for recent backups
- ✅ `verification_date` within 7 days
- ✅ `status = 'success'`

### Manual Verification (If Automated Fails)

**When to perform:**
- Automated verification failed
- Before critical system changes
- Monthly compliance check
- After backup system modifications

**Steps:**

1. **Trigger manual verification:**

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-verifier \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

2. **Monitor progress:**
   - Check Supabase Edge Functions logs
   - Verification takes 10-20 minutes

3. **Review results:**

```sql
SELECT * FROM backup_logs 
WHERE verification_date >= CURRENT_DATE 
ORDER BY verification_date DESC 
LIMIT 1;
```

4. **Interpret results:**
   - `verified = true`: Backup is good ✅
   - `verified = false`: Backup failed verification ❌
   - Check `error_message` for details

### Verification Failure Response

**If verification fails:**

1. **Immediate Actions:**
   - Alert System Administrator
   - Do NOT delete the failed backup (keep for analysis)
   - Trigger new manual backup immediately
   - Verify the new backup

2. **Investigation:**
   - Check backup file size (should be 10-15 MB compressed)
   - Verify encryption key is correct
   - Check storage bucket permissions
   - Review Edge Function logs for errors

3. **Resolution:**
   - Fix identified issues
   - Re-run verification on failed backup
   - If still fails, rely on previous verified backup
   - Document incident in backup log

---

## Manual Backup Procedure

### When to Create Manual Backups

**Before:**
- Major system upgrades or migrations
- Database schema changes
- Bulk data imports or deletions
- System configuration changes
- Disaster recovery testing

**After:**
- Successful major data entry (e.g., importing 100+ patients)
- Critical system repairs
- Regulatory audits (for compliance records)


### Method 1: Using Backup Management UI (Easiest)

**For non-technical staff:**

1. **Access Backup Management:**
   - Log in to RCMC EMR
   - Navigate to **Admin → Backup Management**
   - (Requires admin role)

2. **Trigger Manual Backup:**
   - Click **"Create Manual Backup"** button
   - Confirm action in dialog
   - Wait for completion (2-5 minutes)

3. **Verify Success:**
   - Backup appears in history table
   - Status shows "Success"
   - File size is reasonable (10-15 MB)

### Method 2: Using API Call (Technical Staff)

**Using curl (Command Line):**

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"backupType": "manual"}'
```

**Expected Response:**

```json
{
  "backupId": "uuid-here",
  "filename": "rcmc_emr_backup_2024-01-15_14-30-00.sql",
  "fileSize": 12345678,
  "startTime": "2024-01-15T14:30:00.000Z",
  "endTime": "2024-01-15T14:32:15.000Z",
  "status": "success"
}
```

### Method 3: Using SQL (Database Administrators)

**Using Supabase SQL Editor:**

```sql
-- Trigger manual backup
SELECT backup_scheduler('manual');

-- Wait 2-3 minutes, then check status
SELECT 
  backup_filename,
  status,
  file_size_bytes / 1024 / 1024 as size_mb,
  created_at
FROM backup_logs
WHERE backup_type = 'manual'
ORDER BY created_at DESC
LIMIT 1;
```

### Manual Backup Best Practices

**Naming Convention:**
- Automatic: `rcmc_emr_backup_YYYY-MM-DD_HH-MM-SS.sql`
- Manual backups use same format with actual timestamp

**Documentation:**
- Record why manual backup was created
- Note in change log or maintenance log
- Include in system documentation

**Retention:**
- Manual backups follow daily retention (30 days)
- For long-term storage, download and archive separately

**Verification:**
- Always verify manual backup after creation
- Check file size and status
- Consider running verification immediately for critical backups

---

## Retention Policy Details

### Overview

The retention policy balances data protection with storage capacity constraints. Different backup types have different retention periods based on their purpose.


### Retention Schedule

| Backup Type | Frequency | Retention Period | Purpose | Storage Impact |
|-------------|-----------|------------------|---------|----------------|
| **Daily** | Every day at 2:00 AM | 30 days | Recent recovery | ~450 MB (30 × 15 MB) |
| **Weekly** | Sunday at 3:00 AM | 90 days (3 months) | Medium-term recovery | ~180 MB (12 × 15 MB) |
| **Monthly** | 1st of month at 4:00 AM | 365 days (1 year) | Long-term recovery | ~180 MB (12 × 15 MB) |
| **Manual** | On-demand | 30 days | Pre-change snapshots | Variable |

**Total Estimated Storage:** ~810 MB (exceeds free tier 1 GB limit)

**⚠️ Note:** Actual storage usage depends on database size and compression ratio.

### Automatic Cleanup

**Process:**
- Runs after each backup creation
- Identifies backups past retention date
- Deletes from Supabase Storage
- Removes from `backup_logs` table
- Logs cleanup actions

**Cleanup Query:**

```sql
-- View backups scheduled for deletion
SELECT 
  backup_filename,
  backup_type,
  retention_until,
  CURRENT_DATE - retention_until as days_overdue
FROM backup_logs
WHERE retention_until < CURRENT_DATE
  AND status = 'success'
ORDER BY retention_until;
```

### Retention Policy Rationale

**Why 30 days for daily backups?**
- Covers typical error discovery window
- Most issues found within 1-2 weeks
- Balances storage with recovery needs

**Why 90 days for weekly backups?**
- Covers quarterly reporting periods
- Allows recovery from issues discovered after month-end
- Meets typical audit requirements

**Why 365 days for monthly backups?**
- Annual compliance requirements
- Historical data recovery
- Legal record retention
- Regulatory audit support

### Modifying Retention Policy

**⚠️ Requires System Administrator approval**

**To change retention periods:**

1. **Update configuration:**

Edit `supabase/functions/backup-scheduler/index.ts`:

```typescript
const config: BackupConfig = {
  scheduleTime: '02:00:00+08',
  retentionPolicy: {
    daily: 30,    // Change this value
    weekly: 90,   // Change this value
    monthly: 365, // Change this value
  },
  compressionLevel: 6,
  encryptionAlgorithm: 'AES-256-CBC',
};
```

2. **Redeploy Edge Function:**

```bash
supabase functions deploy backup-scheduler
```

3. **Update existing backups (optional):**

```sql
-- Recalculate retention dates for existing backups
UPDATE backup_logs
SET retention_until = 
  CASE backup_type
    WHEN 'daily' THEN created_at + INTERVAL '30 days'  -- New value
    WHEN 'weekly' THEN created_at + INTERVAL '90 days' -- New value
    WHEN 'monthly' THEN created_at + INTERVAL '365 days' -- New value
  END
WHERE status = 'success';
```

4. **Document change:**
   - Update this guide
   - Notify stakeholders
   - Record in change log


### Storage Capacity Planning

**Current Status (Free Tier):**
- Database size: 37 MB
- Compressed backup: ~12 MB
- Available storage: 430 MB
- Estimated capacity: 35 backups

**Growth Projections:**

| Time Period | Database Size | Backup Size | Backups Stored | Storage Used |
|-------------|---------------|-------------|----------------|--------------|
| **Current** | 37 MB | 12 MB | 35 | 420 MB |
| **6 months** | 75 MB | 25 MB | 35 | 875 MB ⚠️ |
| **1 year** | 150 MB | 50 MB | 35 | 1,750 MB ❌ |

**⚠️ Action Required:**
- Monitor storage usage monthly
- Consider upgrading to Pro tier ($25/month) at 6 months
- Or reduce retention periods
- Or implement external backup storage

**Monitor storage usage:**

```sql
-- Check total backup storage
SELECT 
  COUNT(*) as backup_count,
  SUM(file_size_bytes) / 1024 / 1024 as total_mb,
  AVG(file_size_bytes) / 1024 / 1024 as avg_mb
FROM backup_logs
WHERE status = 'success';
```

---

## Testing Procedures

### Purpose

Regular disaster recovery testing ensures:
- Backup procedures work correctly
- Staff know how to perform restoration
- RTO (4 hours) is achievable
- Documentation is accurate and complete

### Test Schedule

**Quarterly Full DR Test:**
- Frequency: Every 3 months
- Duration: 4-6 hours
- Participants: IT staff, System Administrator
- Scope: Complete system restoration

**Monthly Backup Verification:**
- Frequency: Every month
- Duration: 30 minutes
- Participants: Database Administrator
- Scope: Verify backup integrity

**Weekly Automated Verification:**
- Frequency: Every Sunday
- Duration: Automated (20 minutes)
- Scope: Test restore to temporary database

### Quarterly Full DR Test Procedure

**Preparation (1 week before):**

1. **Schedule test:**
   - Choose date/time (weekend or after hours)
   - Notify all stakeholders
   - Book conference room for coordination

2. **Prepare test environment:**
   - Create separate Supabase project for testing
   - Document current production state
   - Prepare test checklist

3. **Assign roles:**
   - Test Coordinator (System Administrator)
   - Database Restorer (Database Administrator)
   - Application Tester (IT Support)
   - Documentation Reviewer (All participants)

**Test Day:**

1. **Kickoff (15 minutes):**
   - Review test objectives
   - Confirm roles and responsibilities
   - Start timer for RTO tracking

2. **Restoration Phase (2-3 hours):**
   - Follow full restoration procedure (Steps 1-6)
   - Document actual time for each step
   - Note any deviations from documented procedure
   - Record all issues encountered

3. **Verification Phase (1 hour):**
   - Perform all verification checks (Step 7)
   - Test critical workflows
   - Verify data integrity
   - Check user access

4. **Debrief (30 minutes):**
   - Review test results
   - Discuss issues encountered
   - Identify procedure improvements
   - Update documentation


**Test Checklist:**

- [ ] Backup selection completed in <15 minutes
- [ ] Backup download and decrypt completed in <30 minutes
- [ ] Database restoration completed in <90 minutes
- [ ] System verification completed in <45 minutes
- [ ] Total time within 4-hour RTO
- [ ] All critical workflows functional
- [ ] No data corruption detected
- [ ] User access working correctly
- [ ] Documentation accurate and complete
- [ ] All participants understand their roles

**Post-Test Actions:**

1. **Update documentation:**
   - Correct any inaccuracies found
   - Add clarifications where needed
   - Update time estimates based on actual performance

2. **Address issues:**
   - Create action items for problems found
   - Assign owners and deadlines
   - Track to completion

3. **Report results:**
   - Document test outcome
   - Share with management
   - File for compliance records

4. **Schedule next test:**
   - Set date for next quarterly test
   - Send calendar invitations

### Test Documentation Template

```
DISASTER RECOVERY TEST REPORT

Test Date: _______________
Test Type: Quarterly Full DR Test
Participants: _______________

OBJECTIVES:
- Verify backup restoration procedure
- Validate 4-hour RTO
- Train staff on DR procedures
- Update documentation

RESULTS:
Total Time: ___ hours ___ minutes
RTO Met: Yes / No

Phase Timings:
- Backup Selection: ___ minutes
- Download/Decrypt: ___ minutes
- Database Restoration: ___ minutes
- System Verification: ___ minutes
- User Access Restoration: ___ minutes

ISSUES ENCOUNTERED:
1. _______________
2. _______________
3. _______________

CORRECTIVE ACTIONS:
1. _______________
2. _______________
3. _______________

DOCUMENTATION UPDATES:
1. _______________
2. _______________

CONCLUSION:
[Pass / Fail with explanation]

NEXT TEST DATE: _______________

Prepared by: _______________
Reviewed by: _______________
Date: _______________
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Backup Download Fails

**Symptoms:**
- Cannot download backup from Supabase Storage
- "Access Denied" error
- File not found error

**Possible Causes:**
- Incorrect storage bucket name
- Missing permissions
- File was deleted by retention policy
- Network connectivity issues

**Solutions:**

1. **Verify bucket name:**
   ```sql
   -- Check storage bucket exists
   SELECT * FROM storage.buckets WHERE name = 'database-backups';
   ```

2. **Check file exists:**
   - Go to Supabase Dashboard → Storage
   - Navigate to `database-backups` bucket
   - Verify file is present

3. **Verify permissions:**
   - Ensure using service role key (not anon key)
   - Check bucket policies allow download

4. **Try alternative download method:**
   - Use Supabase CLI instead of dashboard
   - Use direct API call with curl


#### Issue 2: Decryption Fails

**Symptoms:**
- "Bad decrypt" error
- Corrupted output file
- Wrong file size after decryption

**Possible Causes:**
- Incorrect encryption key
- Corrupted backup file
- Wrong decryption command

**Solutions:**

1. **Verify encryption key:**
   - Confirm with System Administrator
   - Check environment variable is set correctly
   - Ensure no extra spaces or characters

2. **Check backup file integrity:**
   ```bash
   # Check file size
   ls -lh backup.sql.gz.enc
   # Should be 10-15 MB
   
   # Check file type
   file backup.sql.gz.enc
   # Should show "data" (encrypted)
   ```

3. **Try alternative decryption:**
   ```bash
   # Use different OpenSSL syntax
   openssl enc -d -aes-256-cbc \
     -in backup.sql.gz.enc \
     -out backup.sql.gz \
     -k "your-encryption-key" \
     -md sha256
   ```

4. **Use different backup:**
   - If one backup fails, try previous backup
   - Check verification status of backups

#### Issue 3: Database Restoration Hangs

**Symptoms:**
- psql command runs for hours
- No progress indicators
- System appears frozen

**Possible Causes:**
- Very large backup file
- Network timeout
- Database connection issues
- Insufficient database resources

**Solutions:**

1. **Check connection:**
   ```bash
   # Test database connectivity
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Monitor progress:**
   ```bash
   # Run restoration with verbose output
   psql $DATABASE_URL < backup.sql 2>&1 | tee restore.log
   
   # In another terminal, watch log file
   tail -f restore.log
   ```

3. **Use smaller chunks:**
   ```bash
   # Split backup into smaller files
   split -l 10000 backup.sql backup_part_
   
   # Restore each part
   for file in backup_part_*; do
     psql $DATABASE_URL < $file
   done
   ```

4. **Increase timeout:**
   ```bash
   # Set longer timeout
   export PGOPTIONS="-c statement_timeout=3600000"  # 1 hour
   psql $DATABASE_URL < backup.sql
   ```

#### Issue 4: Missing Tables After Restoration

**Symptoms:**
- Some tables not restored
- "Table does not exist" errors
- Incomplete data

**Possible Causes:**
- Backup file incomplete
- Restoration interrupted
- Schema conflicts
- RLS policies blocking access

**Solutions:**

1. **Verify backup completeness:**
   ```bash
   # Check backup file size
   ls -lh backup.sql
   # Should be 30-50 MB
   
   # Check for table creation statements
   grep "CREATE TABLE" backup.sql | wc -l
   # Should show 20+ tables
   ```

2. **Check restoration logs:**
   ```bash
   # Review errors during restoration
   psql $DATABASE_URL < backup.sql 2> restore_errors.log
   cat restore_errors.log
   ```

3. **Verify schema:**
   ```sql
   -- List all tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

4. **Re-run restoration:**
   - Drop all tables again
   - Use fresh backup file
   - Monitor for errors


#### Issue 5: Users Cannot Log In After Restoration

**Symptoms:**
- Login page loads but authentication fails
- "Invalid credentials" error
- Users exist in database but cannot authenticate

**Possible Causes:**
- Auth users not in backup (stored separately)
- RLS policies blocking access
- Session tokens invalid
- Environment variables incorrect

**Solutions:**

1. **Check auth.users table:**
   ```sql
   -- Verify users exist in auth schema
   SELECT id, email, created_at 
   FROM auth.users 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

2. **Verify user_profiles:**
   ```sql
   -- Check user profiles exist
   SELECT up.id, up.email, up.role, au.email as auth_email
   FROM user_profiles up
   LEFT JOIN auth.users au ON up.id = au.id
   WHERE au.id IS NULL;
   -- Should return 0 rows (all profiles have auth users)
   ```

3. **Reset user passwords:**
   - Go to Supabase Dashboard → Authentication
   - Select user
   - Click "Send password reset email"
   - User resets password and tries again

4. **Check RLS policies:**
   ```sql
   -- Verify RLS policies on user_profiles
   SELECT * FROM pg_policies 
   WHERE tablename = 'user_profiles';
   ```

5. **Verify environment variables:**
   - Check SUPABASE_URL in application
   - Check SUPABASE_ANON_KEY in application
   - Ensure they match current project

#### Issue 6: Backup Verification Fails

**Symptoms:**
- Automated verification reports failure
- `verified = false` in backup_logs
- Error messages in verification logs

**Possible Causes:**
- Backup file corrupted
- Encryption key changed
- Insufficient database resources
- Network issues during verification

**Solutions:**

1. **Check error details:**
   ```sql
   -- View verification error
   SELECT backup_filename, error_message, verification_date
   FROM backup_logs
   WHERE verified = false
   ORDER BY created_at DESC
   LIMIT 5;
   ```

2. **Manual verification:**
   - Download backup manually
   - Decrypt and decompress
   - Inspect SQL file for completeness
   - Check file size and content

3. **Re-run verification:**
   ```bash
   # Trigger manual verification
   curl -X POST \
     https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-verifier \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

4. **Create new backup:**
   - If backup is corrupted, create new one
   - Verify new backup immediately
   - Mark old backup for deletion

#### Issue 7: Insufficient Storage Space

**Symptoms:**
- Backup creation fails with "storage full" error
- Cannot upload backup to storage
- Retention cleanup not working

**Possible Causes:**
- Exceeded Supabase storage limit (1 GB free tier)
- Too many backups retained
- Large database size
- Retention policy not running

**Solutions:**

1. **Check storage usage:**
   ```sql
   -- Calculate total backup storage
   SELECT 
     COUNT(*) as backup_count,
     SUM(file_size_bytes) / 1024 / 1024 as total_mb,
     1024 - (SUM(file_size_bytes) / 1024 / 1024) as available_mb
   FROM backup_logs
   WHERE status = 'success';
   ```

2. **Manual cleanup:**
   ```sql
   -- Delete old backups manually
   DELETE FROM backup_logs
   WHERE retention_until < CURRENT_DATE - INTERVAL '7 days'
     AND status = 'success';
   ```

3. **Reduce retention periods:**
   - Temporarily reduce daily retention to 15 days
   - Reduce weekly retention to 60 days
   - See "Modifying Retention Policy" section

4. **Upgrade storage:**
   - Consider Supabase Pro tier ($25/month)
   - Includes 8 GB storage (8x free tier)
   - Or implement external backup storage


### Emergency Escalation

**When to escalate:**
- Cannot resolve issue within 1 hour
- Multiple restoration attempts failed
- Data corruption detected
- RTO (4 hours) at risk
- Unsure how to proceed

**Escalation Steps:**

1. **Document current state:**
   - What you've tried
   - Error messages received
   - Current system status
   - Time elapsed

2. **Contact System Administrator:**
   - Provide documentation
   - Explain urgency
   - Request immediate assistance

3. **If unavailable, contact:**
   - Database Administrator
   - Supabase Support (for infrastructure issues)
   - External consultant (if available)

4. **Preserve evidence:**
   - Save all error logs
   - Take screenshots
   - Keep backup files
   - Document timeline

---

## Appendix: Technical Reference

### A. Database Connection Strings

**Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Example:**
```
postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
```

**Where to find:**
- Supabase Dashboard → Settings → Database
- Look for "Connection string" section
- Use "URI" format for psql

### B. Required Tools and Software

**For Windows:**
- PostgreSQL client tools (psql, pg_dump)
- 7-Zip (for decompression)
- OpenSSL (for decryption) - may require WSL
- Text editor (Notepad++, VS Code)

**For macOS:**
- PostgreSQL client tools (install via Homebrew)
- Built-in compression tools (gunzip)
- Built-in OpenSSL
- Terminal application

**For Linux:**
- PostgreSQL client tools (apt-get install postgresql-client)
- Built-in compression tools (gunzip)
- Built-in OpenSSL
- Terminal application

**Installation Commands:**

```bash
# macOS (Homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-client

# Windows (Chocolatey)
choco install postgresql
```

### C. Environment Variables

**Required for restoration:**

```bash
# Database connection
export DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Backup encryption key
export BACKUP_ENCRYPTION_KEY="your-encryption-key-here"

# Supabase credentials (for API calls)
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Security Note:** Never commit these to version control or share publicly.


### D. SQL Queries Reference

**Check backup status:**
```sql
-- Recent backups
SELECT backup_filename, status, created_at, verified
FROM backup_logs
ORDER BY created_at DESC
LIMIT 10;

-- Backup success rate (last 30 days)
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate,
  COUNT(*) as total_backups,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM backup_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Storage usage
SELECT 
  backup_type,
  COUNT(*) as count,
  SUM(file_size_bytes) / 1024 / 1024 as total_mb
FROM backup_logs
WHERE status = 'success'
GROUP BY backup_type;
```

**Verify database integrity:**
```sql
-- Table count
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';

-- Record counts
SELECT 
  'patients' as table_name, COUNT(*) as record_count FROM patients
UNION ALL
SELECT 'consultations', COUNT(*) FROM consultations
UNION ALL
SELECT 'prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'billing', COUNT(*) FROM billing;

-- Recent activity
SELECT 
  'consultations' as table_name,
  COUNT(*) as last_7_days
FROM consultations
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 'appointments', COUNT(*)
FROM appointments
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
```

**Check RLS policies:**
```sql
-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### E. Backup File Structure

**Encrypted backup file (.enc):**
```
[16 bytes: Salt]
[16 bytes: IV (Initialization Vector)]
[Remaining bytes: Encrypted data]
```

**Compressed backup file (.gz):**
- Standard gzip format
- Compression level 6 (default)
- Can be opened with any gzip-compatible tool

**SQL backup file (.sql):**
- Plain text SQL commands
- Contains CREATE TABLE statements
- Contains INSERT statements for data
- Contains CREATE INDEX statements
- Contains constraint definitions
- Size: 30-50 MB (uncompressed)

### F. Backup Scheduler Configuration

**pg_cron schedule (if using):**
```sql
-- Daily backup: 2:00 AM PHT (18:00 UTC)
'0 18 * * *'

-- Weekly backup: 3:00 AM PHT Sunday (19:00 UTC Saturday)
'0 19 * * 6'

-- Monthly backup: 4:00 AM PHT 1st of month (20:00 UTC last day)
'0 20 L * *'
```

**GitHub Actions schedule:**
```yaml
schedule:
  - cron: '0 18 * * *'  # Daily at 2:00 AM PHT
  - cron: '0 19 * * 0'  # Weekly at 3:00 AM PHT Sunday
  - cron: '0 20 1 * *'  # Monthly at 4:00 AM PHT 1st
```


### G. Compliance and Regulatory Requirements

**Data Privacy Act (Philippines) Requirements:**
- Maintain backup copies of personal data
- Ensure data can be recovered within reasonable time
- Protect backup data with encryption
- Maintain audit trail of backup operations
- Document disaster recovery procedures

**DOH (Department of Health) Requirements:**
- Patient records must be recoverable
- Backup retention minimum 5 years (for patient records)
- Regular testing of backup procedures
- Documentation of recovery capabilities

**ISO 27001 Alignment:**
- Information backup policy (A.12.3.1)
- Backup testing procedures
- Documented recovery procedures
- Regular review and updates

### H. Disaster Recovery Metrics

**Key Performance Indicators:**

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **RTO (Recovery Time Objective)** | 4 hours | TBD | 🟡 To be tested |
| **RPO (Recovery Point Objective)** | 24 hours | 24 hours | ✅ Met |
| **Backup Success Rate** | 99%+ | TBD | 🟡 Monitor |
| **Verification Success Rate** | 95%+ | TBD | 🟡 Monitor |
| **Storage Utilization** | <80% | ~40% | ✅ Good |
| **Mean Time to Restore (MTTR)** | <4 hours | TBD | 🟡 To be tested |

**Monitoring Queries:**

```sql
-- Backup success rate (last 30 days)
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / NULLIF(COUNT(*), 0) as success_rate
FROM backup_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Average backup size
SELECT 
  AVG(file_size_bytes) / 1024 / 1024 as avg_backup_size_mb
FROM backup_logs
WHERE status = 'success'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Verification rate
SELECT 
  COUNT(*) FILTER (WHERE verified = true) * 100.0 / NULLIF(COUNT(*), 0) as verification_rate
FROM backup_logs
WHERE status = 'success'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Storage trend
SELECT 
  DATE_TRUNC('week', created_at) as week,
  SUM(file_size_bytes) / 1024 / 1024 as total_mb
FROM backup_logs
WHERE status = 'success'
GROUP BY week
ORDER BY week DESC
LIMIT 12;
```

### I. Contact Information Template

**Fill in and keep updated:**

```
EMERGENCY CONTACTS

System Administrator:
Name: _______________
Phone: _______________
Email: _______________
Available: _______________

Database Administrator:
Name: _______________
Phone: _______________
Email: _______________
Available: _______________

IT Support Lead:
Name: _______________
Phone: _______________
Email: _______________
Available: _______________

Clinic Director:
Name: _______________
Phone: _______________
Email: _______________

Supabase Support:
Portal: https://supabase.com/dashboard/support
Email: support@supabase.com

Cloudflare Support:
Dashboard: https://dash.cloudflare.com

External Consultant (if applicable):
Name: _______________
Company: _______________
Phone: _______________
Email: _______________
```


### J. Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2025 | System Implementation | Initial version |
| | | | |
| | | | |

**Review Schedule:**
- Quarterly review after each DR test
- Annual comprehensive review
- After any major system changes
- After any actual disaster recovery event

---

## Quick Reference Card

**Print this page and keep accessible during emergencies**

### Emergency Restoration - Quick Steps

1. **Assess** (15 min)
   - Identify problem
   - Determine recovery point
   - Contact System Administrator

2. **Select Backup** (15 min)
   - Query backup_logs table
   - Choose verified backup before incident
   - Record selection

3. **Download** (30 min)
   - Download from Supabase Storage
   - Decrypt with encryption key
   - Decompress with gunzip

4. **Prepare** (15 min)
   - Backup current state
   - Notify users of downtime
   - Disable scheduled backups

5. **Restore** (90 min)
   - Connect to database
   - Drop existing schema
   - Restore from backup file
   - Verify restoration

6. **Verify** (45 min)
   - Check table counts
   - Test critical workflows
   - Verify user access
   - Re-enable backups

7. **Communicate** (30 min)
   - Notify users of restoration
   - Document data loss period
   - Provide support contact

**Total Time: ~4 hours (RTO)**

### Critical Commands

```bash
# Download backup
supabase storage download database-backups/backups/[FILENAME]

# Decrypt
openssl enc -d -aes-256-cbc -in backup.sql.gz.enc -out backup.sql.gz -pass env:BACKUP_ENCRYPTION_KEY -pbkdf2

# Decompress
gunzip backup.sql.gz

# Restore
psql $DATABASE_URL < backup.sql
```

### Critical Queries

```sql
-- List recent backups
SELECT backup_filename, status, verified, created_at
FROM backup_logs
WHERE status = 'success'
ORDER BY created_at DESC
LIMIT 10;

-- Verify restoration
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM consultations;
SELECT COUNT(*) FROM prescriptions;
```

### Emergency Contacts

- System Administrator: _______________
- Database Administrator: _______________
- Supabase Support: support@supabase.com

---

## Document Approval

**Prepared by:**
Name: _______________
Title: _______________
Date: _______________
Signature: _______________

**Reviewed by:**
Name: _______________
Title: _______________
Date: _______________
Signature: _______________

**Approved by:**
Name: _______________
Title: _______________
Date: _______________
Signature: _______________

---

## End of Document

**Last Updated:** January 2025  
**Next Review Date:** April 2025  
**Document Owner:** System Administrator  
**Classification:** Internal Use - Confidential

For questions or updates to this document, contact the System Administrator.

