# Implementation Plan: Returning Patient Info Message

## Overview

This implementation adds a simple informational message to Step 2 of the online booking flow. The message reassures returning patients that the system will automatically recognize them using their phone number or email address. This is a pure UX enhancement requiring changes to only one file: `PublicBooking.jsx`.

The implementation involves:
1. Adding the `Info` icon to the lucide-react imports
2. Inserting an info message JSX element between the heading and form in Step 2
3. Writing unit tests to verify the 11 correctness properties

## Tasks

- [x] 1. Add info message to PublicBooking component
  - [x] 1.1 Add Info icon to lucide-react imports in PublicBooking.jsx
    - Update the import statement to include `Info` from lucide-react
    - _Requirements: 2.2_
  
  - [x] 1.2 Insert info message JSX element in Step 2
    - Add the info message div after the h2 heading and before the form element
    - Use blue background (bg-blue-50), border, rounded corners, and flexbox layout
    - Include Info icon on the left and message text on the right
    - Message text: "Returning patient? We'll find your records automatically using your phone or email"
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 5.1, 5.2, 5.3, 5.4_

- [ ] 2. Write unit tests for info message
  - [ ]* 2.1 Write test for info message rendering in Step 2
    - **Property 1: Info Message Renders in Step 2**
    - **Validates: Requirements 1.1, 3.1, 3.2**
    - Verify the info message element is present in the DOM when step === 2
    - Verify it's positioned after the heading and before the form
  
  - [ ]* 2.2 Write test for correct text content
    - **Property 2: Info Message Contains Correct Text**
    - **Validates: Requirements 1.2**
    - Verify the exact text appears: "Returning patient? We'll find your records automatically using your phone or email"
  
  - [ ]* 2.3 Write test for info message visibility
    - **Property 3: Info Message Is Visible**
    - **Validates: Requirements 1.3**
    - Verify the element is visible (not hidden by CSS)
  
  - [ ]* 2.4 Write test for blue background styling
    - **Property 4: Info Message Has Blue Background**
    - **Validates: Requirements 2.1**
    - Verify the element has bg-blue-50 class or equivalent blue background
  
  - [ ]* 2.5 Write test for Info icon display
    - **Property 5: Info Icon Displays Correctly**
    - **Validates: Requirements 2.2**
    - Verify Info icon component exists and has correct sizing (w-5 h-5)
  
  - [ ]* 2.6 Write test for full width span
    - **Property 6: Info Message Spans Full Width**
    - **Validates: Requirements 3.3**
    - Verify the element spans the full width of its container
  
  - [ ]* 2.7 Write test for booking flow regression
    - **Property 7: Booking Flow Completes Successfully**
    - **Validates: Requirements 4.1, 4.4**
    - Mock API calls and complete full booking flow (step 1 → 2 → 3 → submit)
    - Verify booking submission succeeds without errors
  
  - [ ]* 2.8 Write test for form validation preservation
    - **Property 8: Form Validation Preserved**
    - **Validates: Requirements 4.3**
    - Attempt to submit step 2 with empty required fields
    - Verify validation prevents progression to step 3
  
  - [ ]* 2.9 Write test for mobile text wrapping
    - **Property 9: Mobile Text Wrapping**
    - **Validates: Requirements 5.1**
    - Set viewport to 375px width
    - Verify text wraps without horizontal overflow
  
  - [ ]* 2.10 Write test for desktop display
    - **Property 10: Desktop Display Without Scrolling**
    - **Validates: Requirements 5.3**
    - Set viewport to 1024px width
    - Verify no horizontal scrolling occurs
  
  - [ ]* 2.11 Write test for responsive icon alignment
    - **Property 11: Responsive Icon Alignment**
    - **Validates: Requirements 5.4**
    - Test at 375px, 768px, and 1024px viewport widths
    - Verify flexbox maintains proper icon-text alignment at all sizes

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Manual testing across devices
  - Verify visual appearance on Chrome, Firefox, Safari, and Edge
  - Test on mobile devices (iPhone Safari, Android Chrome)
  - Test on tablet (iPad)
  - Test on desktop (1920x1080)
  - Verify no console errors or warnings
  - Confirm booking flow completes successfully

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- This is a simple UX enhancement with no backend changes required
- Only one file needs modification: `rcmc-emr/src/pages/PublicBooking.jsx`
- All unit tests use React Testing Library and Jest
- Manual testing verifies visual appearance and responsive behavior
- The info message is purely presentational and does not affect existing functionality
