# 🚀 DO THIS NOW - Quick Login Fix

## ✅ What's Already Done
- Dev server is running at http://localhost:5173
- Database is cleared (all tables have 0 records)
- Schema is configured to use `emr` schema
- All 12 modules are 100% functional
- AuthContext is updated

## ⚠️ What You Need to Do
Create the admin user so you can login!

## 📋 Quick Steps (5 minutes)

### 1️⃣ Open Supabase Dashboard
Go to: https://imznlhualfuvstfyvdns.supabase.co

### 2️⃣ Create Authentication User
- Click "Authentication" → "Users" → "Add User"
- Email: `admin@rcmc.com`
- Password: `Admin123!`
- ✅ Check "Auto Confirm User"
- Click "Create User"
- **COPY THE USER ID** (looks like: a1b2c3d4-e5f6-7890-abcd-ef1234567890)

### 3️⃣ Create Database Profile
- Click "SQL Editor" → "New Query"
- Paste this (replace YOUR-USER-ID):

```sql
INSERT INTO emr.user_profiles (
  id, email, full_name, role, status, created_at, updated_at
) VALUES (
  'YOUR-USER-ID'::uuid,
  'admin@rcmc.com',
  'System Administrator',
  'admin',
  'Active',
  NOW(),
  NOW()
);
```

- Click "Run"

### 4️⃣ Login
- Open: http://localhost:5173
- Press `Ctrl + Shift + R` (hard refresh)
- Login:
  - Email: `admin@rcmc.com`
  - Password: `Admin123!`

## 🎉 Done!
You should now be logged in and see the dashboard.

## 🆘 If It Doesn't Work
1. Press F12 in browser
2. Look at Console tab for errors
3. Share the error message with me

---

**Files Created for Reference:**
- `LOGIN_SETUP_GUIDE.md` - Detailed step-by-step guide
- `CHECK_TABLES.sql` - SQL to verify database status
- `create-admin-user.sql` - SQL template for creating admin
- `FIX_LOGIN_NOW.md` - Technical explanation of the fix
