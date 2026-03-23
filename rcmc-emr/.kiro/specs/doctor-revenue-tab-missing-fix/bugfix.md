# Bugfix Requirements Document

## Introduction

The Doctor Revenue Sharing tab is not appearing in the Reports & Analytics page even though the implementation exists. The tab should be visible to users with 'admin' or 'doctor' roles, positioned after the Inventory tab. The root cause is that the conditional rendering logic checks `user.role` instead of `userProfile.role`, where the role property actually exists in the AuthContext structure.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user with 'admin' or 'doctor' role views the Reports & Analytics page THEN the Doctor Revenue Sharing tab does not appear in the tab list

1.2 WHEN the tabs array is constructed in Reports.jsx THEN the conditional check `user && ['admin', 'doctor'].includes(user.role)` evaluates to false because `user.role` is undefined

1.3 WHEN the AuthContext provides the user object THEN it contains the Supabase auth user object without a role property, while the role is stored in the separate `userProfile` object

### Expected Behavior (Correct)

2.1 WHEN a user with 'admin' role views the Reports & Analytics page THEN the Doctor Revenue Sharing tab SHALL appear after the Inventory tab

2.2 WHEN a user with 'doctor' role views the Reports & Analytics page THEN the Doctor Revenue Sharing tab SHALL appear after the Inventory tab

2.3 WHEN the tabs array is constructed in Reports.jsx THEN the conditional check SHALL use `userProfile.role` instead of `user.role` to correctly evaluate the user's role

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user with 'receptionist' role views the Reports & Analytics page THEN the Doctor Revenue Sharing tab SHALL CONTINUE TO be hidden

3.2 WHEN a user with any other role (not 'admin' or 'doctor') views the Reports & Analytics page THEN the Doctor Revenue Sharing tab SHALL CONTINUE TO be hidden

3.3 WHEN the Doctor Revenue Sharing tab is clicked by an authorized user THEN the DoctorRevenueReport component SHALL CONTINUE TO render correctly

3.4 WHEN the other tabs (Analytics, Financial, Patients, Appointments, Inventory) are displayed THEN they SHALL CONTINUE TO appear and function correctly for all users

3.5 WHEN the userProfile is null or undefined during initial load THEN the tab SHALL CONTINUE TO be hidden until the profile loads
