# 🔄 ROLLBACK INSTRUCTIONS

## When to Use This
If the security update or online appointment system causes issues, follow these steps to restore the system to its previous working state.

---

## ⚠️ Before You Start

**STOP ALL SERVICES FIRST!**
- Close frontend terminal (Ctrl+C)
- Close backend terminal (Ctrl+C)
- Close any other running processes

---

## 📋 Rollback Steps

### Step 1: Restore Database

**Option A: Using Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select project: `imznlhualfuvstfyvdns`
3. Go to Database → Backups
4. Find backup: `pre-security-update-feb-26-2026`
5. Click "Restore"
6. Confirm restoration

**Option B: Using SQL Backup**
1. Open Supabase SQL Editor
2. Run the restore script from `BACKUP_DATABASE_NOW.sql`
3. Wait for completion message

### Step 2: Restore Files

**Windows:**
```batch
cd backups\pre-security-update-[date]

REM Restore environment files
copy .env ..\..\rcmc-emr\
copy server\.env ..\..\rcmc-emr\server\

REM Restore database files
copy database.js ..\..
copy server.js ..\..

REM Restore source code
xcopy src ..\..\rcmc-emr\src /E /I /Y
xcopy server ..\..\rcmc-emr\server /E /I /Y
```

**Manual Method:**
1. Open `backups/pre-security-update-[date]/` folder
2. Copy all files back to their original locations
3. Overwrite when prompted

### Step 3: Reinstall Dependencies (if needed)

```bash
# Frontend
cd rcmc-emr
npm install

# Backend
cd rcmc-emr/server
npm install
```

### Step 4: Restart Services

**Terminal 1 - Backend:**
```bash
cd rcmc-emr/server
npm start
```

Wait for: `✅ Server running on port 3003`

**Terminal 2 - Frontend:**
```bash
cd rcmc-emr
npm run dev
```

Wait for: `Local: http://localhost:3002`

### Step 5: Verify System

Open browser: `http://localhost:3002`

**Test Checklist:**
- [ ] Login works (use old credentials)
- [ ] Dashboard loads
- [ ] Patient list displays
- [ ] Can create appointment
- [ ] Billing works
- [ ] Reports generate

---

## 🔍 Troubleshooting

### Issue: "Module not found" errors
**Solution:**
```bash
cd rcmc-emr
npm install
cd server
npm install
```

### Issue: Database connection error
**Solution:**
1. Check `.env` file has correct Supabase URL
2. Verify Supabase project is running
3. Check internet connection

### Issue: Port already in use
**Solution:**
```bash
# Find and kill process on port 3002
netstat -ano | findstr :3002
taskkill /PID [process_id] /F

# Find and kill process on port 3003
netstat -ano | findstr :3003
taskkill /PID [process_id] /F
```

### Issue: Login not working
**Solution:**
1. Clear browser cache
2. Use old credentials:
   - Admin: `admin@rcmc.com` / check Supabase
   - Or use Supabase dashboard to reset password

### Issue: Data is missing
**Solution:**
1. Verify database restore completed
2. Check Supabase dashboard for table data
3. Re-run database restore if needed

---

## 🆘 Emergency Recovery

If rollback fails completely:

### Nuclear Option: Fresh Install

1. **Backup current state** (even if broken)
   ```bash
   mkdir emergency-backup
   xcopy rcmc-emr emergency-backup\rcmc-emr /E /I
   ```

2. **Delete and reinstall**
   ```bash
   cd rcmc-emr
   rmdir /s /q node_modules
   rmdir /s /q server\node_modules
   npm install
   cd server
   npm install
   ```

3. **Restore from backup**
   - Follow Step 2 above
   - Restore database from Supabase backup

4. **Restart everything**
   - Follow Step 4 above

---

## 📞 Support Checklist

If you need help, gather this information:

- [ ] Error messages (screenshot or copy)
- [ ] Which step failed
- [ ] Browser console errors (F12 → Console)
- [ ] Server terminal output
- [ ] Database restore status
- [ ] Supabase project status

---

## ✅ Success Indicators

You'll know rollback succeeded when:

1. ✅ No errors in terminal
2. ✅ Login page loads
3. ✅ Can log in with old credentials
4. ✅ Dashboard shows data
5. ✅ All features work as before

---

## 📝 After Successful Rollback

1. Document what went wrong
2. Review error logs
3. Plan fixes before trying again
4. Consider testing in development first

---

## 🔐 Security Note

After rollback, you're back to the **unsecured version**. This is temporary for stability. Plan to re-attempt security updates after identifying and fixing the issue.

---

**Remember:** Rollback is a safety net, not a failure. It's better to rollback and fix issues than to have a broken system.
