# DO THIS NOW - SIMPLE CHECKLIST

## ☐ STEP 1: Open Supabase
1. Go to: https://supabase.com/dashboard
2. Click on your project
3. Click **SQL Editor** (left sidebar)

## ☐ STEP 2: Run the SQL Script
1. Click **New Query**
2. Open file: `move-to-public-schema.sql`
3. Copy EVERYTHING from that file
4. Paste into Supabase SQL Editor
5. Click **RUN** (or press Ctrl+Enter)
6. Wait for "Success. No rows returned"

## ☐ STEP 3: Verify It Worked
In the same SQL Editor, run this:
```sql
SELECT * FROM public.user_profiles;
```
You should see 1 row with admin@rcmc.com

## ☐ STEP 4: Restart Your Server
Open Command Prompt:
```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
npm run dev
```

## ☐ STEP 5: Test Login
1. Open browser: http://localhost:3001
2. Enter email: `admin@rcmc.com`
3. Enter password: `admin123`
4. Click Sign In
5. You should see the dashboard!

## ☐ STEP 6: Push to GitHub (ONLY AFTER LOGIN WORKS)
```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
PUSH_TO_GITHUB.bat
```
Commit message: "Fix login - move user_profiles to public schema"

---

## IF YOU GET STUCK

Send me the error message from browser console (press F12)

