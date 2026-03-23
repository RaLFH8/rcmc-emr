# Bugfix Requirements Document

## Introduction

This document specifies the requirements for fixing two console errors that appear when clicking the Doctor Revenue Sharing tab in the Reports page. The errors prevent the report from loading correctly and create a poor user experience with visible console warnings.

The Doctor Revenue Tab visibility fix was previously completed and is working correctly. However, two new errors were introduced that need to be resolved:

1. **React Router Error**: `useNavigate() may be used only in the context of a <Router> component` - caused by importing and declaring the `useNavigate` hook but never using it
2. **Database Query Error**: `column doctors_2.name does not exist` - caused by Supabase creating an alias `doctors_2` when joining to the doctors table, but the query expecting `doctors.name`

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Doctor Revenue Sharing tab is clicked THEN the console displays error "useNavigate() may be used only in the context of a <Router> component" at DoctorRevenueReport.jsx line 28

1.2 WHEN the Doctor Revenue Sharing tab loads and attempts to fetch doctor performance data THEN the console displays error "column doctors_2.name does not exist" from the getDoctorPerformance function in analyticsService.js

1.3 WHEN the useNavigate hook is imported and declared in DoctorRevenueReport.jsx THEN it is never actually used in the component logic

1.4 WHEN the getDoctorPerformance function joins billing → consultations → doctors THEN Supabase creates a `doctors_2` alias but the query references `doctors.name`

### Expected Behavior (Correct)

2.1 WHEN the Doctor Revenue Sharing tab is clicked THEN no React Router errors SHALL appear in the console

2.2 WHEN the Doctor Revenue Sharing tab loads and fetches doctor performance data THEN no database query errors SHALL appear in the console

2.3 WHEN the DoctorRevenueReport component renders THEN it SHALL NOT import or declare the useNavigate hook since navigation logic is handled in the useEffect

2.4 WHEN the getDoctorPerformance function queries doctor data THEN it SHALL correctly reference the doctor name field without alias conflicts

2.5 WHEN the Doctor Revenue Sharing report loads THEN the doctor performance data SHALL display correctly in the Revenue Insights chart

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Doctor Revenue Sharing tab is clicked by admin or doctor users THEN the tab SHALL CONTINUE TO be visible and accessible

3.2 WHEN the DoctorRevenueReport component checks user authentication THEN it SHALL CONTINUE TO redirect unauthenticated users to login

3.3 WHEN the DoctorRevenueReport component checks user roles THEN it SHALL CONTINUE TO redirect unauthorized users to dashboard

3.4 WHEN the navigation logic in the useEffect executes THEN it SHALL CONTINUE TO use the navigate function from useAuth context (not useNavigate hook)

3.5 WHEN other revenue insight queries execute (departmentRevenue, serviceTypeRevenue, etc.) THEN they SHALL CONTINUE TO work without errors

3.6 WHEN the report data loads successfully THEN all summary cards, tables, and charts SHALL CONTINUE TO display correctly

3.7 WHEN users export the report to CSV, PDF, or Excel THEN the export functionality SHALL CONTINUE TO work correctly
