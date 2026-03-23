# Implementation Plan: Skeleton Loading Replacement

## Overview

This implementation plan replaces all heartbeat/pulse loading animations with modern skeleton loading screens across the RCMC EMR application. The migration follows a 3-phase approach: create the SkeletonLoader component with shimmer animations, replace all 12+ HeartbeatLoader instances across pages, and clean up legacy code.

## Tasks

- [x] 1. Create SkeletonLoader component and shimmer animation
  - [x] 1.1 Add shimmer animation CSS to index.css
    - Add @keyframes shimmer animation definition
    - Add .animate-shimmer utility class with gradient background
    - Use background-position animation for GPU acceleration
    - Set animation duration to 1.5s ease-in-out infinite
    - _Requirements: 1.3, 15.1, 15.2, 15.3_

  - [x] 1.2 Create SkeletonLoader component with all 7 variants
    - Create src/components/SkeletonLoader.jsx
    - Implement props interface (variant, message, rows, columns, className)
    - Add accessibility attributes (role, aria-label, aria-live, aria-busy)
    - Implement variant switch logic with default fallback
    - Create internal skeleton primitives (SkeletonBox, SkeletonText, etc.)
    - Implement table variant (header + data rows)
    - Implement card variant (grid of cards)
    - Implement list variant (stacked items)
    - Implement dashboard variant (stat cards + charts)
    - Implement form variant (label + input pairs)
    - Implement stats variant (stat cards only)
    - Implement auth variant (sidebar + topbar + content)
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 14.1, 14.2, 14.3, 14.4_

  - [ ]* 1.3 Write unit tests for SkeletonLoader component
    - Test all 7 variant renderings
    - Test prop handling (message, rows, columns, className)
    - Test accessibility attributes presence
    - Test invalid variant defaults to list
    - Test visual styling (bg-slate-200, rounded corners)
    - Test shimmer animation class application
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 14.1, 14.2, 14.3, 14.4_

  - [ ]* 1.4 Write property-based tests for SkeletonLoader
    - **Property 1: Variant prop determines layout**
    - **Validates: Requirements 1.1, 1.4**
    - Test that all variants render successfully without errors
    - Use fast-check with constantFrom for all 7 variants
    - Verify distinct output for each variant

  - [ ]* 1.5 Write property test for shimmer animation
    - **Property 2: Shimmer animation applied to all elements**
    - **Validates: Requirements 1.3**
    - Test that all placeholder elements include animate-shimmer class
    - Verify across all variants

  - [ ]* 1.6 Write property test for visual styling consistency
    - **Property 3: Consistent visual styling**
    - **Validates: Requirements 1.2**
    - Test that all placeholders have bg-slate-200 and rounded corners
    - Verify across all variants

  - [ ]* 1.7 Write property test for accessibility attributes
    - **Property 4: Accessibility attributes present**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
    - Test that root element has aria-label, role="status", aria-live="polite", aria-busy="true"
    - Verify across all variants and message values

  - [ ]* 1.8 Write property test for CSS-only animation
    - **Property 5: CSS-only animation implementation**
    - **Validates: Requirements 15.1, 15.2**
    - Test that no elements use inline JavaScript animations
    - Verify shimmer uses CSS background-position animation

- [x] 2. Checkpoint - Verify SkeletonLoader component works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Replace HeartbeatLoader in authentication and dashboard
  - [x] 3.1 Replace HeartbeatLoader in App.jsx with auth variant
    - Import SkeletonLoader component
    - Replace HeartbeatLoader with SkeletonLoader variant="auth"
    - Maintain 1.5 second minimum display time
    - Include "RIZALCARE MEDICAL CLINIC" text above skeleton
    - Remove HeartbeatLoader import
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Replace HeartbeatLoader in Dashboard.jsx with dashboard variant
    - Import SkeletonLoader component
    - Replace HeartbeatLoader with SkeletonLoader variant="dashboard"
    - Ensure skeleton shows 4 stat card placeholders
    - Ensure skeleton shows chart area placeholders
    - Remove HeartbeatLoader import
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.3 Write integration tests for App.jsx and Dashboard.jsx
    - Test App.jsx uses auth variant during initialization
    - Test Dashboard.jsx uses dashboard variant
    - Verify HeartbeatLoader is not imported
    - _Requirements: 2.2, 3.5_

- [x] 4. Replace HeartbeatLoader in table-based pages
  - [x] 4.1 Replace HeartbeatLoader in Appointments.jsx with table variant
    - Import SkeletonLoader component
    - Replace HeartbeatLoader with SkeletonLoader variant="table" rows={5}
    - Include search bar and filter control placeholders
    - Remove HeartbeatLoader import
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.2 Replace HeartbeatLoader in Payments.jsx with table variant
    - Import SkeletonLoader component
    - Replace HeartbeatLoader with SkeletonLoader variant="table"
    - Include search and filter control placeholders
    - Remove HeartbeatLoader import
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 4.3 Replace HeartbeatLoader in Inventory.jsx with table variant
    - Import SkeletonLoader component
    - Replace HeartbeatLoader with SkeletonLoader variant="table"
    - Include search and category filter placeholders
    - Remove HeartbeatLoader import
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 4.4 Replace HeartbeatLoader in LabResults.jsx with table variant
    - Import SkeletonLoader component
    - Replace HeartbeatLoader with SkeletonLoader variant="table"
    - Remove HeartbeatLoader import
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]* 4.5 Write integration tests for table-based pages
    - Test Appointments.jsx uses table variant
    - Test Payments.jsx uses table variant
    - Test Inventory.jsx uses table variant
    - Test LabResults.jsx uses table variant
    - Verify HeartbeatLoader is not imported in any
    - _Requirements: 4.5, 7.4, 9.4, 11.3_

- [x] 5. Replace HeartbeatLoader in Doctors page (3 instances)
  - [x] 5.1 Replace main loading state in Doctors.jsx with card variant
    - Import SkeletonLoader component
    - Replace first HeartbeatLoader with SkeletonLoader variant="card"
    - Show placeholders for doctor cards in grid layout
    - _Requirements: 5.1, 5.4_

  - [x] 5.2 Replace feedback loading state in Doctors.jsx with list variant
    - Replace second HeartbeatLoader with SkeletonLoader variant="list"
    - _Requirements: 5.2_

  - [x] 5.3 Replace QR code generation loading with card variant
    - Replace third HeartbeatLoader with SkeletonLoader variant="card"
    - Center the skeleton loader
    - Remove all HeartbeatLoader imports
    - _Requirements: 5.3, 5.5_

  - [ ]* 5.4 Write integration tests for Doctors.jsx
    - Test main loading uses card variant
    - Test feedback loading uses list variant
    - Test QR generation uses card variant
    - Verify HeartbeatLoader is not imported
    - _Requirements: 5.5_

- [x] 6. Replace HeartbeatLoader in Patients page (5 instances)
  - [x] 6.1 Replace main loading state in Patients.jsx with table variant
    - Import SkeletonLoader component
    - Replace first HeartbeatLoader with SkeletonLoader variant="table"
    - _Requirements: 6.1_

  - [x] 6.2 Replace patient appointments modal loading with list variant
    - Replace second HeartbeatLoader with SkeletonLoader variant="list"
    - _Requirements: 6.2_

  - [x] 6.3 Replace patient consultations modal loading with list variant
    - Replace third HeartbeatLoader with SkeletonLoader variant="list"
    - _Requirements: 6.3_

  - [x] 6.4 Replace patient payments modal loading with list variant
    - Replace fourth HeartbeatLoader with SkeletonLoader variant="list"
    - _Requirements: 6.4_

  - [x] 6.5 Replace patient admissions modal loading with list variant
    - Replace fifth HeartbeatLoader with SkeletonLoader variant="list"
    - Remove all HeartbeatLoader imports
    - _Requirements: 6.5, 6.6_

  - [ ]* 6.6 Write integration tests for Patients.jsx
    - Test main loading uses table variant
    - Test appointments modal uses list variant
    - Test consultations modal uses list variant
    - Test payments modal uses list variant
    - Test admissions modal uses list variant
    - Verify HeartbeatLoader is not imported
    - _Requirements: 6.6_

- [x] 7. Replace HeartbeatLoader in remaining pages
  - [x] 7.1 Replace HeartbeatLoader in Prescriptions.jsx with list variant
    - Import SkeletonLoader component
    - Replace HeartbeatLoader with SkeletonLoader variant="list"
    - Include search bar placeholder
    - Remove HeartbeatLoader import
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 7.2 Replace HeartbeatLoader in Orders.jsx with list variant
    - Import SkeletonLoader component
    - Replace HeartbeatLoader with SkeletonLoader variant="list"
    - Include filter control placeholders
    - Remove HeartbeatLoader import
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 7.3 Replace HeartbeatLoader in BackupManagement.jsx with card variant
    - Import SkeletonLoader component
    - Replace HeartbeatLoader with SkeletonLoader variant="card"
    - Show placeholders for backup status cards
    - Include backup history table placeholder
    - Remove HeartbeatLoader import
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 7.4 Write integration tests for remaining pages
    - Test Prescriptions.jsx uses list variant
    - Test Orders.jsx uses list variant
    - Test BackupManagement.jsx uses card variant
    - Verify HeartbeatLoader is not imported in any
    - _Requirements: 8.4, 10.4, 12.4_

- [x] 8. Checkpoint - Verify all HeartbeatLoader instances replaced
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Clean up legacy HeartbeatLoader code
  - [x] 9.1 Delete HeartbeatLoader component file
    - Delete src/components/HeartbeatLoader.jsx
    - _Requirements: 13.4_

  - [x] 9.2 Remove heartbeat animation CSS from index.css
    - Remove @keyframes heartbeat-line animation
    - Remove .heartbeat-line CSS class
    - Preserve all other animations and styles
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ]* 9.3 Write migration verification tests
    - Test HeartbeatLoader.jsx file does not exist
    - Test no page imports HeartbeatLoader
    - Test @keyframes heartbeat-line removed from index.css
    - Test .heartbeat-line class removed from index.css
    - Test other CSS animations preserved
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 10. Final checkpoint - Verify complete migration
  - Run all unit tests and property tests
  - Manually verify skeleton loaders in all pages
  - Check browser console for errors
  - Verify no broken imports or missing components
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all variants
- Unit tests validate specific page integrations and migration completeness
- The migration follows a safe 3-phase approach: create, replace, cleanup
- All skeleton loaders include accessibility attributes by default
- Shimmer animations use GPU-accelerated CSS for optimal performance
