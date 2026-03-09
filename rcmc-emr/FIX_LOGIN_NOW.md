# FIX LOGIN - STEP BY STEP

## Problem
Cannot login after clearing data. The admin user needs to be created in both Supabase Authentication and the emr.user_profiles table.

## Solution Steps

### Step 1: Create Admin User in Supabase Authentication
1. Go to your Supabase Dashboard: https://imznlhualfuvstfyvdns.supabase.co
2. Click on "Authentication" in the left sidebar
3. Click on "Users" tab
4. Click "Add User" button
5. Enter:
   - Email: `admin@rcmc.com`
   - Password: `Admin123!`
   - Auto Confirm User: YES (check this box)
6. Click "Create User"
7. **COPY THE USER ID** - you'll need it for Step 2

### Step 2: Create User Profile in emr.user_profiles
1. Go to "SQL Editor" in Supabase Dashboard
2. Run this SQL (replace YOUR-USER-ID with the ID from Step 1):

```sql
-- Insert admin profile into emr.user_profiles
INSERT INTO emr.user_profiles (
  id,
  email,
  full_name,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'YOUR-USER-ID'::uuid,  -- Replace with actual user ID from Step 1
  'admin@rcmc.com',
  'System Administrator',
  'admin',
  'Active',
  NOW(),
  NOW()
);
```

### Step 3: Verify the Setup
Run this query to verify:

```sql
-- Check if profile exists
SELECT * FROM emr.user_profiles WHERE email = 'admin@rcmc.com';
```

### Step 4: Clear Browser Cache and Login
1. In your browser, press `Ctrl + Shift + Delete`
2. Clear "Cached images and files"
3. Close all browser tabs
4. Open http://localhost:5173
5. Login with:
   - Email: `admin@rcmc.com`
   - Password: `Admin123!`

## What Was Fixed
1. Updated `AuthContext.jsx` to use emr schema (comment updated)
2. The `supabase.js` already has schema config: `db: { schema: 'emr' }`
3. This ensures all queries go to the emr schema by default

## If Still Having Issues
Check browser console (F12) for error messages and share them.
