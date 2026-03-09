# 🗄️ Database Backup Instructions (Free Tier)

Since you're on Supabase free tier, we'll use an alternative backup method that doesn't require point-in-time recovery.

---

## Method 1: Schema Backup (Recommended)

This creates a backup schema within your database.

### Steps:

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Click: SQL Editor

2. **Run the Backup Script**
   - Open file: `BACKUP_DATABASE_NOW.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run"

3. **Verify Backup**
   - You should see: "BACKUP COMPLETE" message
   - Check that backup schema was created

### What This Does:
- Creates a new schema called `backup_feb_26_2026`
- Copies all your tables to this schema
- Keeps the backup in the same database
- No data leaves Supabase

### To Restore:
- Run the restore commands at the bottom of `BACKUP_DATABASE_NOW.sql`

---

## Method 2: Export Data (Alternative)

If you want an external backup file:

### Steps:

1. **Run Export Script**
   - Open file: `EXPORT_DATABASE_BACKUP.sql`
   - Copy contents
   - Paste into Supabase SQL Editor
   - Click "Run"

2. **Save Output**
   - Copy all INSERT statements from the output
   - Save to: `backups/database-export-feb-26-2026.sql`

3. **Keep File Safe**
   - This file contains all your data
   - Store it securely
   - Don't commit to git!

### To Restore:
- Run the saved SQL file in Supabase SQL Editor

---

## Method 3: Manual Table Export

For critical tables only:

### Steps:

1. **Go to Table Editor**
   - Supabase Dashboard → Table Editor

2. **For Each Important Table:**
   - Select table (patients, doctors, appointments, etc.)
   - Click "..." menu
   - Select "Export as CSV"
   - Save file

3. **Store CSV Files**
   - Save to: `backups/csv-exports/`
   - Keep organized by table name

### To Restore:
- Use Supabase Table Editor → Import CSV

---

## ✅ Recommended Approach

**Use Method 1 (Schema Backup)** because:
- ✅ Fastest and easiest
- ✅ Preserves all data types
- ✅ Preserves relationships
- ✅ Easy to restore
- ✅ No file management needed
- ✅ Works on free tier

---

## 🔍 Verify Your Backup

After running Method 1, verify with this query:

```sql
-- Check backup exists
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = schemaname AND table_name = tablename) as columns
FROM pg_tables 
WHERE schemaname = 'backup_feb_26_2026'
ORDER BY tablename;
```

You should see all your tables listed.

---

## ⚠️ Important Notes

1. **Backup takes space** - The backup schema uses your database storage
2. **Delete after updates** - Once security updates are stable, delete the backup schema
3. **Not a replacement** - This is for rollback only, not long-term backup
4. **Consider upgrading** - For production, consider Supabase Pro for automatic backups

---

## 🗑️ Delete Backup (After Successful Update)

Once everything is working:

```sql
-- Remove backup schema
DROP SCHEMA backup_feb_26_2026 CASCADE;
```

---

## 📊 Current Status

- ✅ File backup: COMPLETE (4,414 files)
- ⏳ Database backup: PENDING (run Method 1)

**Next:** Run `BACKUP_DATABASE_NOW.sql` in Supabase SQL Editor
