# Analytics Dashboard 400 Errors - Root Cause Analysis

## Summary

The Analytics Dashboard displays a white screen with multiple 400 Bad Request errors. Tasks 3 and 4 were marked complete, but the errors persist because the root cause is **database configuration issues**, not code logic issues.

## Issues Identified

### Issue 1: RLS Policy Blocking satisfaction_ratings Access ⚠️ CRITICAL

**Problem:**
- The `satisfaction_ratings` table has a Row Level Security (RLS) policy that only allows users with 'admin' or 'owner' roles to SELECT data
- Policy name: "Admins and owners can view all survey data"
- This blocks Analytics Dashboard queries from all other authenticated users (doctors, nurses, staff)

**Evidence:**
```
Failed to load resource: the server responded with a status of 400 ()
Error fetching patient satisfaction: Object
URL: .../satisfaction_ratings?select=professionalism_rating%2Cwaiting_time_rating%2Ccleanliness_rating&created_at=gte.2026-02-28&created_at=lte.2026-03-02
```

**Code is Correct:**
- analyticsService.js queries the correct columns: `professionalism_rating`, `waiting_time_rating`, `cleanliness_rating`
- These columns exist in the database (verified in migration file)
- The query syntax is correct

**Root Cause:**
- RLS policy in `rcmc-emr/.kiro/specs/patient-satisfaction-survey/migrations/RUN_ALL_MIGRATIONS.sql` (lines 105-120)
- Policy prevents non-admin users from reading satisfaction_ratings

**Fix Required:**
- Run `COMPLETE_FIX.sql` in Supabase SQL Editor
- This updates the RLS policy to allow all authenticated users to read satisfaction_ratings for analytics purposes

---

### Issue 2: Inventory Column Name Mismatch ✅ FIXED IN CODE

**Problem:**
- Analytics code was querying: `unit_price`, `quantity`
- Actual inventory table columns: `price`, `stock`

**Evidence:**
```
Failed to load resource: the server responded with a status of 400 ()
URL: .../inventory?select=unit_price%2Cquantity%2Ccategory%2Ccreated_at&created_at=gte.2026-02-28&created_at=lte.2026-03-02
```

**Fix Applied:**
- Updated analyticsService.js line 530 to query: `price, stock, category, created_at`
- Updated line 543 to use: `item.price` and `item.stock`

**Status:** ✅ Code fix complete, no database changes needed

---

## What Was Already Fixed (Tasks 3-4)

Tasks 3.1-3.6 fixed the following code issues:
1. ✅ Date formatting logic (formatDatePH function)
2. ✅ Date object validation in query functions
3. ✅ Satisfaction ratings query to use existing columns
4. ✅ Consultations query to handle missing outcome column
5. ✅ Bug condition exploration tests
6. ✅ Preservation tests

These fixes were necessary but not sufficient because the database RLS policy was still blocking access.

---

## What Still Needs to Be Done

### Step 1: Run Database Fix (REQUIRED)
```bash
# Open Supabase SQL Editor
# Navigate to: rcmc-emr/.kiro/specs/reports-analytics-white-screen-fix/COMPLETE_FIX.sql
# Copy and paste the SQL into Supabase SQL Editor
# Click "Run" to execute
```

### Step 2: Verify Fix
```sql
-- Run this query in Supabase to verify:
SELECT COUNT(*) FROM satisfaction_ratings;

-- If you get a count (even if 0), the fix worked
-- If you get a permission error, the policy needs adjustment
```

### Step 3: Test Analytics Dashboard
1. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Navigate to Reports > Analytics Dashboard
3. Verify no 400 errors in browser console (F12 > Console tab)
4. Verify all charts and KPIs display correctly

---

## Why This Happened

The bugfix spec correctly identified code issues (date formatting, column names), but the 400 errors were actually caused by database access restrictions (RLS policies). This is a common scenario where:
- Code is syntactically correct
- Database schema exists with correct columns
- But RLS policies prevent access

The fix requires both code changes (already done) AND database policy updates (needs to be done).

---

## Files Modified

### Code Changes (Already Applied)
- `rcmc-emr/src/services/analyticsService.js` - Fixed inventory column names

### Database Changes (Need to Run)
- `rcmc-emr/.kiro/specs/reports-analytics-white-screen-fix/COMPLETE_FIX.sql` - RLS policy fix

### Documentation
- `rcmc-emr/.kiro/specs/reports-analytics-white-screen-fix/tasks.md` - Updated with Task 5
- `rcmc-emr/.kiro/specs/reports-analytics-white-screen-fix/ROOT_CAUSE_ANALYSIS.md` - This file

---

## Next Steps

1. **Run COMPLETE_FIX.sql in Supabase** (5 minutes)
2. **Refresh browser and test** (2 minutes)
3. **Mark Task 5 complete** if Analytics Dashboard loads without errors

The Analytics Dashboard should work correctly after the RLS policy is updated.
