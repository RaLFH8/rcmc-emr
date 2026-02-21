# FIX LOGIN - FOLLOW THESE STEPS EXACTLY

## THE PROBLEM
Supabase API cannot access tables in `emr` schema. It only works with `public` schema.

## THE SOLUTION
Move `user_profiles` table from `emr` schema to `public` schema.

---

## STEP 1: Run SQL in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project: **imznlhualfuvstfyvdns**
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy and paste the ENTIRE content from `move-to-public-schema.sql`
6. Click **RUN** button
7. You should see: "Success. No rows returned"
8. Verify by running: `SELECT * FROM public.user_profiles;`
9. You should see 1 row with admin@rcmc.com

---

## STEP 2: Restart Development Server

```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
npm run dev
```

---

## STEP 3: Test Login

1. Open browser: http://localhost:3001
2. Login with:
   - Email: `admin@rcmc.com`
   - Password: `admin123`
3. You should now successfully log in!

---

## WHAT WAS FIXED

✅ AuthContext.jsx - Now queries from `user_profiles` (public schema)
✅ UserManagement.jsx - Now queries from `user_profiles` (public schema)
✅ move-to-public-schema.sql - Creates table in public schema with all data

---

## IF IT STILL DOESN'T WORK

Check browser console (F12) for errors and send me the error message.

---

## AFTER LOGIN WORKS

You can then:
1. Create new doctor accounts from User Management page
2. Create receptionist accounts
3. Each user will have their own login credentials
4. Push all changes to GitHub

