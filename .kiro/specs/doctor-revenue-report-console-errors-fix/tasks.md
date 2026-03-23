# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Console Errors on Doctor Revenue Tab Load
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate both bugs exist
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - loading the Doctor Revenue Sharing tab and fetching doctor performance data
  - Test that loading DoctorRevenueReport component produces React Router error for useNavigate hook
  - Test that calling getDoctorPerformance function produces database error "column doctors_2.name does not exist"
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bugs exist)
  - Document counterexamples found:
    - Console error: "useNavigate() may be used only in the context of a <Router> component"
    - Console error: "column doctors_2.name does not exist"
  - Mark task complete when test is written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Authentication, Authorization, and Other Revenue Queries
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy functionality:
    - Authentication redirects unauthenticated users to login
    - Authorization redirects unauthorized users to dashboard
    - Navigation logic uses useAuth's navigate function correctly
    - Other revenue insight queries (departmentRevenue, serviceTypeRevenue, paymentMethodDistribution, inventoryCosts, patientTypeRevenue) work correctly
    - Summary cards, tables, and charts display correctly
    - Export functionality (CSV, PDF, Excel) works correctly
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Fix console errors in Doctor Revenue Report

  - [x] 3.1 Remove unused useNavigate import and declaration
    - Remove `useNavigate` import from react-router-dom in DoctorRevenueReport.jsx (line 6)
    - Remove `const navigate = useNavigate()` declaration (line 28)
    - Verify that useEffect (lines 54-68) correctly uses `navigate` from useAuth context
    - _Bug_Condition: isBugCondition_ReactRouter(component) where component imports useNavigate but uses navigate from useAuth instead_
    - _Expected_Behavior: Component renders without React Router errors, navigation logic continues to work using useAuth's navigate_
    - _Preservation: Authentication, authorization, and all navigation logic must remain unchanged_
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Fix getDoctorPerformance database query aliasing
    - Adjust query in analyticsService.js getDoctorPerformance function (lines 1063-1100)
    - Fix Supabase aliasing conflict by ensuring correct field path reference
    - Test query returns doctor name data without "column does not exist" errors
    - Verify query returns same data structure as before
    - _Bug_Condition: isBugCondition_DatabaseQuery(query) where query joins billing → consultations → doctors and Supabase creates doctors_2 alias_
    - _Expected_Behavior: Query executes without database errors, returns doctor performance data with names correctly_
    - _Preservation: All other revenue insight queries must continue to work unchanged_
    - _Requirements: 1.2, 2.2, 2.4, 2.5, 3.5, 3.6, 3.7_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - No Console Errors on Doctor Revenue Tab Load
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bugs are fixed)
    - Verify no React Router errors appear in console
    - Verify no database "column does not exist" errors appear in console
    - Verify doctor performance data loads correctly with names
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Authentication, Authorization, and Other Revenue Queries
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm authentication redirects still work
    - Confirm authorization redirects still work
    - Confirm navigation using useAuth's navigate still works
    - Confirm all other revenue insight queries still work
    - Confirm UI components still display correctly
    - Confirm export functionality still works
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify Doctor Revenue Sharing tab loads without console errors
  - Verify doctor performance data displays correctly in charts and tables
  - Verify all other revenue insights continue to work
  - Verify authentication and authorization behavior is preserved
  - Verify export functionality works correctly
