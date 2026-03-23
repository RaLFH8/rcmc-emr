# Backup System Deployment Guide

## Quick Start

### 1. Install Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Install PostgreSQL client (for pg_dump)
# Windows: Download from https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql-client
# macOS: brew install postgresql
```

### 2. Deploy Edge Function

```bash
cd rcmc-emr
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy backup-scheduler
```

### 3. Create Storage Bucket

Run in Supabase SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('database-backups', 'database-backups', false);

CREATE POLICY "Service role can manage backups"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'database-backups');
```

### 4. Set Environment Variables

In Supabase Dashboard → Settings → Edge Functions → Secrets:

- `DATABASE_URL`: Your PostgreSQL connection string
- `BACKUP_ENCRYPTION_KEY`: Strong passphrase (min 32 chars)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### 5. Schedule Daily Backups

See `supabase/functions/backup-scheduler/README.md` for pg_cron setup.

## Manual Backup

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/backup-scheduler \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"backupType": "manual"}'
```

## Important Notes

**Limitation**: Supabase Edge Functions (Deno runtime) may not have pg_dump available.

**Alternative Solutions**:
1. Use Supabase's built-in backup feature (Dashboard → Database → Backups)
2. Implement SQL-based backup instead of pg_dump
3. Use external cron job with pg_dump on a server

See full documentation in `supabase/functions/backup-scheduler/README.md`
