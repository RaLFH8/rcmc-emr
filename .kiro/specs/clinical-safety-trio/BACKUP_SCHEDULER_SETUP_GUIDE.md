# Backup Scheduler Setup Guide

Complete guide for configuring automated daily backups for RCMC EMR system.

## Overview

This guide covers multiple options for scheduling automated daily backups at 2:00 AM Philippine Time (UTC+8). Choose the option that best fits your Supabase tier and infrastructure.

**Requirement:** 1.1 - Automated daily backups at 2:00 AM Philippine Time

## Prerequisites

- ✅ Backup Edge Function deployed (`backup-scheduler`)
- ✅ Database schema created (`backup_logs` table)
- ✅ Supabase Storage bucket created (`database-backups`)
- ✅ Environment variables configured (see Edge Function README)

## Option 1: pg_cron (Recommended if available)

### Availability Check

pg_cron is **NOT available** in Supabase free tier. It's typically available in:
- Supabase Pro tier ($25/month)
- Supabase Team tier ($599/month)
- Self-hosted Supabase instances

### Check if pg_cron is Available

Run this SQL in Supabase SQL Editor:

```sql
SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';
```

If this returns no rows, pg_cron is **not available**. Skip to Option 2.

### Setup Instructions

If pg_cron is available:

1. **Enable pg_cron extension:**

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

2. **Configure service role key:**

In Supabase Dashboard:
- Go to: Settings → Database → Custom Postgres Configuration
- Add: `app.settings.service_role_key = 'your-service-role-key'`

3. **Run the scheduler setup script:**

```bash
# Navigate to migrations directory
cd rcmc-emr/.kiro/specs/clinical-safety-trio/migrations/

# Run the pg_cron setup script in Supabase SQL Editor
# Copy and paste the contents of 07-setup-pg-cron-scheduler.sql
```

4. **Replace placeholders:**

In the SQL script, replace:
- `YOUR_PROJECT_REF` with your actual Supabase project reference
- Example: `abcdefghijklmnop.supabase.co`

5. **Verify setup:**

```sql
-- View scheduled jobs
SELECT jobname, schedule, active 
FROM cron.job 
WHERE jobname LIKE 'rcmc-emr%';

-- Expected output:
-- rcmc-emr-daily-backup   | 0 18 * * * | t
-- rcmc-emr-weekly-backup  | 0 19 * * 6 | t
-- rcmc-emr-monthly-backup | 0 20 L * * | t
```

### Advantages
- ✅ Native PostgreSQL scheduling
- ✅ Runs inside database (no external dependencies)
- ✅ Automatic retry on failure
- ✅ Built-in execution logging

### Disadvantages
- ❌ Not available in free tier
- ❌ Requires Pro tier or higher ($25/month minimum)

---

## Option 2: External Cron Job (Recommended for Free Tier)

### Overview

Set up a cron job on a server you control to call the backup Edge Function via HTTP.

### Requirements

- A server with cron (Linux, macOS, or Windows Task Scheduler)
- Internet connectivity
- curl or similar HTTP client

### Setup Instructions

#### Linux/macOS

1. **Create backup script:**

```bash
#!/bin/bash
# File: /usr/local/bin/rcmc-backup.sh

SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
LOG_FILE="/var/log/rcmc-backup.log"

echo "[$(date)] Starting RCMC EMR backup..." >> "$LOG_FILE"

response=$(curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/functions/v1/backup-scheduler" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"backupType": "daily"}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
  echo "[$(date)] Backup completed successfully" >> "$LOG_FILE"
  echo "$body" >> "$LOG_FILE"
else
  echo "[$(date)] Backup failed with HTTP $http_code" >> "$LOG_FILE"
  echo "$body" >> "$LOG_FILE"
  
  # Optional: Send email alert
  # echo "Backup failed: $body" | mail -s "RCMC EMR Backup Failed" admin@example.com
fi
```

2. **Make script executable:**

```bash
chmod +x /usr/local/bin/rcmc-backup.sh
```

3. **Add to crontab:**

```bash
# Edit crontab
crontab -e

# Add this line (2:00 AM Philippine Time = 18:00 UTC previous day)
0 18 * * * /usr/local/bin/rcmc-backup.sh
```

4. **Verify crontab:**

```bash
crontab -l
```

#### Windows Task Scheduler

1. **Create PowerShell script:**

```powershell
# File: C:\Scripts\rcmc-backup.ps1

$supabaseUrl = "https://YOUR_PROJECT_REF.supabase.co"
$serviceRoleKey = "YOUR_SERVICE_ROLE_KEY"
$logFile = "C:\Logs\rcmc-backup.log"

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "[$timestamp] Starting RCMC EMR backup..."

$headers = @{
    "Authorization" = "Bearer $serviceRoleKey"
    "Content-Type" = "application/json"
}

$body = @{
    backupType = "daily"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/backup-scheduler" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logFile -Value "[$timestamp] Backup completed successfully"
    Add-Content -Path $logFile -Value ($response | ConvertTo-Json)
} catch {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logFile -Value "[$timestamp] Backup failed: $($_.Exception.Message)"
    
    # Optional: Send email alert
    # Send-MailMessage -To "admin@example.com" -Subject "RCMC EMR Backup Failed" -Body $_.Exception.Message
}
```

2. **Create scheduled task:**

```powershell
# Run as Administrator
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-ExecutionPolicy Bypass -File C:\Scripts\rcmc-backup.ps1"

$trigger = New-ScheduledTaskTrigger -Daily -At "2:00AM"

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount

Register-ScheduledTask -TaskName "RCMC EMR Daily Backup" `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Description "Automated daily backup for RCMC EMR system"
```

### Advantages
- ✅ Works with free tier
- ✅ Full control over scheduling
- ✅ Can add custom alerting/monitoring
- ✅ No additional costs

### Disadvantages
- ❌ Requires external server
- ❌ Server must be always running
- ❌ Manual setup and maintenance

---

## Option 3: GitHub Actions (Free)

### Overview

Use GitHub Actions to schedule backups. Free for public repositories, 2000 minutes/month for private repos.

### Setup Instructions

1. **Create workflow file:**

```yaml
# File: .github/workflows/backup-scheduler.yml

name: RCMC EMR Daily Backup

on:
  schedule:
    # 2:00 AM Philippine Time = 18:00 UTC previous day
    - cron: '0 18 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Trigger Backup Edge Function
        run: |
          response=$(curl -s -w "\n%{http_code}" -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/backup-scheduler" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"backupType": "daily"}')
          
          http_code=$(echo "$response" | tail -n1)
          body=$(echo "$response" | sed '$d')
          
          echo "HTTP Status: $http_code"
          echo "Response: $body"
          
          if [ "$http_code" -ne 200 ]; then
            echo "::error::Backup failed with HTTP $http_code"
            exit 1
          fi
      
      - name: Verify Backup in Database
        run: |
          # Optional: Query backup_logs table to verify
          echo "Backup triggered successfully"
```

2. **Add secrets to GitHub:**

In your GitHub repository:
- Go to: Settings → Secrets and variables → Actions
- Add secrets:
  - `SUPABASE_URL`: Your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

3. **Commit and push:**

```bash
git add .github/workflows/backup-scheduler.yml
git commit -m "Add automated backup scheduler"
git push
```

4. **Verify workflow:**

- Go to: Actions tab in GitHub
- You should see "RCMC EMR Daily Backup" workflow
- Click "Run workflow" to test manually

### Advantages
- ✅ Free (2000 minutes/month for private repos)
- ✅ No server maintenance
- ✅ Built-in logging and notifications
- ✅ Easy to modify schedule

### Disadvantages
- ❌ Requires GitHub repository
- ❌ Limited to 2000 minutes/month (private repos)
- ❌ Depends on GitHub's availability

---

## Option 4: Cloud Scheduler Services

### AWS EventBridge

**Cost:** ~$1/month for 1 daily event

```json
{
  "schedule": "cron(0 18 * * ? *)",
  "target": {
    "url": "https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler",
    "headers": {
      "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY",
      "Content-Type": "application/json"
    },
    "body": "{\"backupType\": \"daily\"}"
  }
}
```

### Google Cloud Scheduler

**Cost:** Free for first 3 jobs/month

```bash
gcloud scheduler jobs create http rcmc-emr-backup \
  --schedule="0 18 * * *" \
  --uri="https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_SERVICE_ROLE_KEY,Content-Type=application/json" \
  --message-body='{"backupType": "daily"}'
```

### Azure Logic Apps

**Cost:** ~$0.50/month for 1 daily run

Create a Logic App with:
- Trigger: Recurrence (daily at 18:00 UTC)
- Action: HTTP POST to backup-scheduler Edge Function

---

## Option 5: Supabase Built-in Backups

### Overview

Use Supabase's native backup feature (available in all tiers).

### Setup Instructions

1. **Navigate to Supabase Dashboard:**
   - Database → Backups

2. **Enable automatic backups:**
   - Toggle "Enable automatic backups"
   - Set retention period (7 days for free tier)

3. **Configure schedule:**
   - Backups run daily automatically
   - Time is managed by Supabase (not configurable)

### Advantages
- ✅ Available in free tier
- ✅ No setup required
- ✅ Managed by Supabase
- ✅ Point-in-time recovery (Pro tier)

### Disadvantages
- ❌ Less control over backup format
- ❌ No custom encryption
- ❌ Limited retention (7 days free tier)
- ❌ Cannot customize schedule
- ❌ Doesn't use your custom backup Edge Function

---

## Comparison Table

| Option | Cost | Setup Complexity | Free Tier | Control | Reliability |
|--------|------|------------------|-----------|---------|-------------|
| pg_cron | $25/mo | Low | ❌ | High | Excellent |
| External Cron | Free* | Medium | ✅ | High | Good |
| GitHub Actions | Free** | Low | ✅ | Medium | Good |
| AWS EventBridge | $1/mo | Medium | ❌ | High | Excellent |
| Google Cloud | Free*** | Medium | ✅ | High | Excellent |
| Supabase Built-in | Free | Very Low | ✅ | Low | Excellent |

\* Requires server you already own  
\** 2000 minutes/month for private repos  
\*** First 3 jobs free

---

## Recommended Setup by Tier

### Free Tier (Current)
**Recommended:** GitHub Actions or External Cron

**Rationale:**
- No additional costs
- Full control over backup process
- Uses your custom Edge Function with encryption
- Easy to set up and maintain

### Pro Tier ($25/month)
**Recommended:** pg_cron

**Rationale:**
- Native PostgreSQL scheduling
- No external dependencies
- Automatic retry on failure
- Built-in execution logging

### Production/Enterprise
**Recommended:** pg_cron + External Monitoring

**Rationale:**
- Primary: pg_cron for reliability
- Secondary: External monitoring service to verify backups
- Redundancy ensures backups never fail silently

---

## Testing the Scheduler

### Manual Backup Test

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"backupType": "manual"}'
```

### Verify Backup in Database

```sql
-- Check recent backups
SELECT 
  backup_filename,
  backup_type,
  file_size_bytes / 1024 / 1024 as size_mb,
  duration_seconds,
  status,
  compression_ratio,
  encrypted,
  created_at
FROM backup_logs
ORDER BY created_at DESC
LIMIT 5;

-- Check backup success rate
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM backup_logs
WHERE created_at >= NOW() - INTERVAL '7 days';
```

### Verify Backup in Storage

```sql
-- Check storage objects
SELECT 
  name,
  (metadata->>'size')::bigint / 1024 / 1024 as size_mb,
  created_at
FROM storage.objects
WHERE bucket_id = 'database-backups'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Monitoring and Alerts

### Set Up Backup Monitoring

Create a monitoring query to check backup health:

```sql
-- Create a view for backup monitoring
CREATE OR REPLACE VIEW backup_health AS
SELECT 
  -- Last successful backup
  (SELECT created_at FROM backup_logs WHERE status = 'success' ORDER BY created_at DESC LIMIT 1) as last_success,
  
  -- Hours since last successful backup
  EXTRACT(EPOCH FROM (NOW() - (SELECT created_at FROM backup_logs WHERE status = 'success' ORDER BY created_at DESC LIMIT 1))) / 3600 as hours_since_last_success,
  
  -- Success rate (last 7 days)
  (SELECT COUNT(*) FILTER (WHERE status = 'success') * 100.0 / NULLIF(COUNT(*), 0) 
   FROM backup_logs WHERE created_at >= NOW() - INTERVAL '7 days') as success_rate_7d,
  
  -- Recent failures
  (SELECT COUNT(*) FROM backup_logs WHERE status = 'failed' AND created_at >= NOW() - INTERVAL '24 hours') as failures_24h,
  
  -- Total storage used
  (SELECT SUM(file_size_bytes) / 1024 / 1024 / 1024 FROM backup_logs WHERE status = 'success') as total_storage_gb;

-- Query the view
SELECT * FROM backup_health;
```

### Alert Conditions

Set up alerts for:
1. **No successful backup in 25+ hours** (missed daily backup)
2. **Success rate < 95%** (frequent failures)
3. **3+ failures in 24 hours** (persistent issues)
4. **Storage > 400 MB** (approaching free tier limit)

---

## Troubleshooting

### Backup Not Running

1. **Check scheduler is active:**
   - pg_cron: `SELECT * FROM cron.job WHERE jobname LIKE 'rcmc-emr%';`
   - External cron: `crontab -l`
   - GitHub Actions: Check Actions tab

2. **Check execution logs:**
   - pg_cron: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
   - External cron: Check log file
   - GitHub Actions: Check workflow run logs

3. **Test manual backup:**
   ```bash
   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"backupType": "manual"}'
   ```

### Backup Failing

1. **Check Edge Function logs:**
   - Supabase Dashboard → Edge Functions → backup-scheduler → Logs

2. **Check environment variables:**
   - Verify all required env vars are set
   - Check service role key is correct

3. **Check storage bucket:**
   - Verify `database-backups` bucket exists
   - Check RLS policies allow service role access

4. **Check database connection:**
   - Verify `DATABASE_URL` is correct
   - Test database connectivity

---

## Next Steps

1. **Choose your scheduling option** based on your Supabase tier
2. **Follow the setup instructions** for your chosen option
3. **Test the scheduler** with a manual backup
4. **Verify backups** are being created successfully
5. **Set up monitoring** to track backup health
6. **Document your setup** for your team

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Edge Function logs in Supabase Dashboard
3. Check `backup_logs` table for error messages
4. Consult the backup-scheduler Edge Function README

---

## Requirements Validation

This setup validates:
- ✅ **Requirement 1.1**: Automated daily backups at 2:00 AM Philippine Time

Multiple options provided to ensure compatibility with all Supabase tiers and infrastructure setups.
