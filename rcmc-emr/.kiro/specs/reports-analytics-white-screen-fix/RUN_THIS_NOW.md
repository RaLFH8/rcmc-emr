# 🔧 Fix Analytics Dashboard 400 Errors

## Quick Summary

The 400 errors are caused by a **database permission issue**, not a code issue. The code fixes (Tasks 3-4) are complete, but you need to update the database RLS policy.

## What to Do (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run the Fix
1. Open this file: `rcmc-emr/.kiro/specs/reports-analytics-white-screen-fix/COMPLETE_FIX.sql`
2. Copy ALL the SQL code
3. Paste it into the Supabase SQL Editor
4. Click "Run" (or press Ctrl+Enter)

### Step 3: Verify It Worked
You should see a success message. Then run this verification query:
```sql
SELECT COUNT(*) FROM satisfaction_ratings;
```

If you get a number (even 0), the fix worked! ✅

### Step 4: Test Analytics Dashboard
1. Go back to your app
2. Refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Navigate to Reports > Analytics Dashboard
4. Open browser console (F12) and check for errors

**Expected Result:** No 400 errors, Analytics Dashboard displays correctly

---

## What Was the Problem?

The `satisfaction_ratings` table had a Row Level Security (RLS) policy that only allowed admin/owner users to read data. This blocked the Analytics Dashboard from querying satisfaction ratings.

**The fix:** Updated the RLS policy to allow all authenticated users to read satisfaction_ratings for analytics purposes.

---

## Files Changed

### Code (Already Fixed)
- ✅ `analyticsService.js` - Fixed inventory column names (price, stock)

### Database (You Need to Run)
- ⏳ `COMPLETE_FIX.sql` - Updates RLS policy for satisfaction_ratings

---

## Need Help?

If you still see 400 errors after running the SQL:
1. Check the browser console for the exact error message
2. Verify you're logged in as an authenticated user
3. Check if the satisfaction_ratings table exists in Supabase

---

**Ready?** Open `COMPLETE_FIX.sql` and run it in Supabase! 🚀
