# Doctor Revenue Tab Missing Fix - Bugfix Design

## Overview

The Doctor Revenue Sharing tab is not appearing in the Reports & Analytics page due to incorrect property access in the conditional rendering logic. The code checks `user.role` but the role property exists in `userProfile.role` from the AuthContext. This is a simple property access bug that requires changing the conditional check from `user.role` to `userProfile.role` and ensuring proper null-safety handling.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the Reports.jsx component attempts to check user role using `user.role` instead of `userProfile.role`
- **Property (P)**: The desired behavior - the Doctor Revenue Sharing tab should appear for users with 'admin' or 'doctor' roles
- **Preservation**: All other tabs and their visibility logic must remain unchanged
- **AuthContext**: The React context in `src/context/AuthContext.jsx` that provides `user` (Supabase auth object) and `userProfile` (database profile with role property)
- **Reports.jsx**: The component in `src/pages/Reports.jsx` that renders the Reports & Analytics page with tab navigation
- **tabs array**: The array constructed around line 280 in Reports.jsx that defines which tabs to display

## Bug Details

### Fault Condition

The bug manifests when a user with 'admin' or 'doctor' role views the Reports & Analytics page. The conditional rendering logic in the tabs array construction checks `user.role`, but the `user` object from AuthContext is the Supabase authentication user object which does not contain a `role` property. The role is stored in the separate `userProfile` object that is loaded from the `user_profiles` table.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { user: SupabaseUser, userProfile: UserProfile }
  OUTPUT: boolean
  
  RETURN input.userProfile.role IN ['admin', 'doctor']
         AND conditionalCheckUses(input.user.role)
         AND input.user.role IS undefined
         AND tabDoesNotAppear('doctor-revenue')
END FUNCTION
```

### Examples

- **Admin user logs in**: AuthContext provides `user` (Supabase auth object without role) and `userProfile` (with `role: 'admin'`). The check `user.role` returns `undefined`, so the tab is not added to the tabs array.
- **Doctor user logs in**: AuthContext provides `user` (Supabase auth object without role) and `userProfile` (with `role: 'doctor'`). The check `user.role` returns `undefined`, so the tab is not added to the tabs array.
- **Receptionist user logs in**: Should not see the tab (expected behavior) - this works correctly because the condition evaluates to false.
- **Edge case - userProfile not loaded yet**: If `userProfile` is null during initial load, the tab should not appear until the profile loads.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All other tabs (Analytics, Financial, Patients, Appointments, Inventory) must continue to appear for all users
- The DoctorRevenueReport component must continue to render correctly when the tab is clicked
- Users with 'receptionist' or other roles must continue to NOT see the Doctor Revenue Sharing tab
- The tab navigation and switching logic must continue to work exactly as before
- The date range selector and export functionality must continue to work for all tabs

**Scope:**
All inputs that do NOT involve the Doctor Revenue Sharing tab visibility check should be completely unaffected by this fix. This includes:
- All other tab rendering logic
- Tab click handlers and active state management
- Report data loading for all other tabs
- CSV export functionality
- Date range filtering

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Incorrect Property Access**: The conditional check uses `user.role` instead of `userProfile.role`
   - Line 16: `const { user } = useAuth()` - only destructures `user`, not `userProfile`
   - Line 280: `...(user && ['admin', 'doctor'].includes(user.role)` - checks `user.role` which is undefined

2. **Missing Destructuring**: The component does not destructure `userProfile` from the AuthContext, even though it's available

3. **No Null Safety**: The check does not account for the case where `userProfile` might be null during initial load

4. **AuthContext Structure**: The AuthContext separates authentication (`user`) from profile data (`userProfile`), but the Reports component only uses `user`

## Correctness Properties

Property 1: Fault Condition - Doctor Revenue Tab Visibility

_For any_ user where the role is 'admin' or 'doctor' (stored in userProfile.role), the Reports.jsx component SHALL display the Doctor Revenue Sharing tab in the tabs array after the Inventory tab, allowing authorized users to access the revenue sharing report.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Admin/Doctor Tab Visibility

_For any_ user where the role is NOT 'admin' or 'doctor' (receptionist, or any other role), the Reports.jsx component SHALL produce exactly the same tab list as before (without the Doctor Revenue Sharing tab), preserving the existing access control behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/pages/Reports.jsx`

**Function**: `Reports` component

**Specific Changes**:
1. **Update useAuth destructuring (Line 16)**: Add `userProfile` to the destructured values
   - Change: `const { user } = useAuth()`
   - To: `const { user, userProfile } = useAuth()`

2. **Update conditional check (Line 280)**: Change the role check to use `userProfile.role` with null safety
   - Change: `...(user && ['admin', 'doctor'].includes(user.role)`
   - To: `...(userProfile && ['admin', 'doctor'].includes(userProfile.role)`

3. **Verify null safety**: Ensure the check handles the case where `userProfile` is null during initial load
   - The `userProfile &&` check provides this safety

4. **No other changes needed**: The DoctorRevenueReport component and all other logic remain unchanged

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the tab does not appear for admin/doctor users due to the incorrect property access.

**Test Plan**: Log in as admin and doctor users, inspect the tabs array in the browser console, and verify that `user.role` is undefined while `userProfile.role` contains the correct role. Run these observations on the UNFIXED code to confirm the root cause.

**Test Cases**:
1. **Admin User Tab Visibility**: Log in as admin, verify tab does not appear (will fail on unfixed code)
2. **Doctor User Tab Visibility**: Log in as doctor, verify tab does not appear (will fail on unfixed code)
3. **Console Inspection**: Check browser console to verify `user.role` is undefined and `userProfile.role` is 'admin' or 'doctor' (will confirm root cause)
4. **Receptionist User**: Log in as receptionist, verify tab does not appear (should work correctly on unfixed code)

**Expected Counterexamples**:
- The tabs array does not include the doctor-revenue tab for admin/doctor users
- Console shows `user.role` is undefined while `userProfile.role` contains the correct role
- Possible causes: incorrect property access, missing destructuring

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (admin/doctor users), the fixed function produces the expected behavior (tab appears).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := Reports_fixed(input)
  ASSERT tabArrayIncludes(result, 'doctor-revenue')
  ASSERT tabAppearsAfter(result, 'inventory', 'doctor-revenue')
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (non-admin/doctor users), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT Reports_original(input).tabs = Reports_fixed(input).tabs
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for receptionist and other roles, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Receptionist Tab List Preservation**: Verify receptionist sees the same 5 tabs (Analytics, Financial, Patients, Appointments, Inventory) before and after fix
2. **Tab Click Preservation**: Verify clicking any tab continues to work correctly after fix
3. **DoctorRevenueReport Rendering**: Verify the DoctorRevenueReport component renders correctly when tab is clicked by authorized user
4. **Null UserProfile Handling**: Verify that when userProfile is null during initial load, the tab does not appear (no crash)

### Unit Tests

- Test that admin users see the Doctor Revenue Sharing tab after the fix
- Test that doctor users see the Doctor Revenue Sharing tab after the fix
- Test that receptionist users do NOT see the Doctor Revenue Sharing tab
- Test that users with null userProfile do NOT see the tab (no crash)
- Test that the tab appears in the correct position (after Inventory)

### Property-Based Tests

- Generate random user profiles with different roles and verify tab visibility matches role-based access control
- Generate random userProfile states (null, undefined, valid) and verify no crashes occur
- Test that all other tabs continue to appear correctly across many scenarios

### Integration Tests

- Test full login flow as admin, navigate to Reports page, verify tab appears
- Test full login flow as doctor, navigate to Reports page, verify tab appears
- Test full login flow as receptionist, navigate to Reports page, verify tab does NOT appear
- Test clicking the Doctor Revenue Sharing tab and verify DoctorRevenueReport component renders
- Test that switching between tabs continues to work correctly
