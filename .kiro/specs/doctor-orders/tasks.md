# Implementation Plan: Doctor's Orders Feature

## Overview

This implementation plan transforms the Doctor's Orders design into actionable coding tasks. The feature extracts medical orders from SOAP note Treatment sections, stores them in a dedicated database table, and integrates them into the medical history timeline, patient profiles, and billing workflow. Implementation follows an incremental approach: database setup, core parsing logic, UI components, integration points, and finally workflow enhancements.

## Tasks

- [x] 1. Set up database schema and triggers
  - [x] 1.1 Create doctor_orders table with all required fields and constraints
    - Create table with id, appointment_id, patient_id, order_type, order_details, status, priority, created_by, created_at, completed_by, completed_at, cancelled_by, cancelled_at, notes
    - Add CHECK constraints for order_type (medication, procedure, lab_test, diet, activity_restriction)
    - Add CHECK constraints for status (pending, in_progress, completed, cancelled)
    - Add CHECK constraints for priority (routine, urgent, stat)
    - Set up foreign key relationships to appointments, patients, and auth.users tables
    - Create indexes on patient_id, appointment_id, status, priority, order_type, and created_at
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 1.2 Add order_id column to billing_queue table
    - Add order_id UUID column with foreign key to doctor_orders(id)
    - Create index on order_id for efficient lookups
    - _Requirements: 9.1, 9.3_

  - [x] 1.3 Create billing queue trigger function
    - Implement add_order_to_billing_queue() function
    - Trigger on INSERT for order_type 'procedure' or 'lab_test'
    - Insert billing_queue entry with patient_id, doctor_id, consultation_id, order_id
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 1.4 Create notification trigger function
    - Implement notify_urgent_order() function
    - Trigger on INSERT for priority 'stat' or 'urgent'
    - Query patient name and insert notifications for doctors and receptionists
    - Include order details and link to Orders page
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x] 1.5 Create cancelled order cleanup trigger
    - Implement remove_cancelled_order_from_billing() function
    - Trigger on UPDATE when status changes to 'cancelled'
    - Delete corresponding billing_queue entry
    - _Requirements: 9.4_

  - [x] 1.6 Set up Row Level Security policies
    - Create RLS policy for physicians to view all orders for their patients
    - Create RLS policy for nurses to view all orders
    - Create RLS policy for billing staff to view procedure and lab_test orders only
    - Create RLS policy allowing only physicians to INSERT orders
    - Create RLS policy allowing physicians and nurses to UPDATE order status
    - Prevent DELETE operations on doctor_orders table
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 2. Checkpoint - Verify database setup
  - Run all migration scripts in Supabase SQL Editor
  - Verify table creation and constraints
  - Test RLS policies with different user roles
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement order parsing utility
  - [x] 3.1 Create orderParser.js utility module
    - Implement parseOrders(treatmentText) function
    - Use regex patterns to identify medication keywords: "prescribe", "medication", "drug", "Rx"
    - Use regex patterns to identify lab test keywords: "order", "test", "lab", "check", "screen"
    - Use regex patterns to identify procedure keywords: "procedure", "perform", "schedule", "refer"
    - Use regex patterns to identify diet keywords: "diet", "nutrition", "NPO", "clear liquids", "restrict intake"
    - Use regex patterns to identify activity keywords: "restrict", "avoid", "bed rest", "ambulate", "physical therapy"
    - Extract priority indicators: "stat", "urgent", "routine"
    - Return array of ParsedOrder objects with type, details, priority, confidence, sourceText
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 1.2, 1.3_

  - [x] 3.2 Implement formatOrder() function
    - Convert Order object back to human-readable text
    - Include order type, details, and priority in formatted output
    - _Requirements: 12.6_

  - [ ]* 3.3 Write unit tests for order parser
    - Test medication order detection with various phrasings
    - Test lab test order detection
    - Test procedure order detection
    - Test diet order detection
    - Test activity restriction detection
    - Test priority extraction (stat, urgent, routine)
    - Test multiple orders in single treatment text
    - Test edge cases: empty text, no orders, malformed text
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 1.3_

  - [ ]* 3.4 Write property test for round-trip consistency
    - **Property 1: Round-trip parsing consistency**
    - **Validates: Requirements 12.7**
    - Generate valid order details text
    - Parse to Order object, format back to text, parse again
    - Verify second parse produces equivalent Order object

- [x] 4. Create database service methods
  - [x] 4.1 Extend supabase.js with order management functions
    - Implement createOrders(orders) for batch insert
    - Implement getOrdersByPatient(patientId, filters) with status, type, priority, date range support
    - Implement getOrdersByAppointment(appointmentId)
    - Implement getAllOrders(filters) with pagination support
    - Implement updateOrderStatus(orderId, status, userId) with status transition validation
    - Implement searchOrders(searchTerm, filters) with full-text search on order_details
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 11.1, 11.2, 11.3, 11.4_

  - [x] 4.2 Implement status transition validation logic
    - Enforce pending → in_progress → completed transitions
    - Allow pending → cancelled and in_progress → cancelled
    - Prevent transitions from completed or cancelled states
    - Record user_id and timestamp for status changes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 4.3 Write unit tests for database service methods
    - Test createOrders with valid and invalid data
    - Test getOrdersByPatient with various filters
    - Test updateOrderStatus with valid and invalid transitions
    - Test searchOrders with different search terms
    - Mock Supabase client responses
    - _Requirements: 2.1, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. Build OrderReviewPanel component
  - [x] 5.1 Create OrderReviewPanel.jsx component
    - Accept orders, onConfirm, onEdit, onRemove, onAdd props
    - Display extracted orders in editable list format
    - Show order type, details, and priority for each order
    - Provide edit button to modify order details
    - Provide remove button to delete incorrectly detected orders
    - Provide priority dropdown (routine, urgent, stat)
    - Provide "Add Order" button for manual entry
    - Validate order completeness before confirmation
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.2 Implement order editing modal
    - Create modal for editing order details
    - Support changing order_type via dropdown
    - Support editing order_details text field
    - Support changing priority level
    - Validate required fields before saving
    - _Requirements: 4.3, 4.4_

  - [x] 5.3 Implement manual order addition
    - Create modal for adding new orders
    - Provide order_type dropdown
    - Provide order_details textarea
    - Provide priority dropdown
    - Validate and add to orders list
    - _Requirements: 4.6_

- [x] 6. Integrate order extraction into Consultations page
  - [x] 6.1 Add real-time order preview to Consultations page
    - Import parseOrders utility
    - Watch soap_treatment field for changes
    - Parse treatment text on every change
    - Display extracted orders in preview section
    - Show confidence scores for detected orders
    - _Requirements: 4.1, 1.1, 1.2_

  - [x] 6.2 Add OrderReviewPanel to consultation save workflow
    - Display OrderReviewPanel before final save
    - Allow physician to review, edit, remove, or add orders
    - Pass confirmed orders to createOrders() on save
    - Link orders to appointment_id and patient_id
    - Set created_by to current user_id
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 2.5, 2.6_

  - [x] 6.3 Prevent duplicate order creation on consultation edit
    - Check if orders already exist for appointment_id
    - Skip order creation if orders already exist
    - Only create orders on initial consultation save or explicit request
    - _Requirements: 13.6, 13.7_

  - [x] 6.4 Preserve existing soap_treatment behavior
    - Ensure soap_treatment field saves normally
    - Do not modify soap_treatment content
    - Order extraction operates independently
    - _Requirements: 1.4, 13.1, 13.2, 13.3_

- [ ] 7. Checkpoint - Test consultation integration
  - Create test consultation with treatment text containing multiple order types
  - Verify orders are parsed correctly
  - Verify OrderReviewPanel displays extracted orders
  - Verify orders save to database on consultation save
  - Verify billing queue entries created for procedures and lab tests
  - Verify notifications sent for stat/urgent orders
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Build Orders management page
  - [x] 8.1 Create Orders.jsx page component
    - Set up page layout with header and filters section
    - Add sidebar navigation entry for Orders page
    - Implement table view for displaying orders
    - Show patient name, order_type, order_details, priority, status, created_at columns
    - _Requirements: 5.1, 5.6_

  - [x] 8.2 Implement filtering controls
    - Add status filter dropdown (pending, in_progress, completed, cancelled)
    - Add priority filter dropdown (routine, urgent, stat)
    - Add order_type filter dropdown (medication, procedure, lab_test, diet, activity_restriction)
    - Add date range picker for created_at filtering
    - Default to showing pending and in_progress orders
    - Display result count after applying filters
    - _Requirements: 5.2, 5.3, 11.2, 11.5_

  - [x] 8.3 Implement search functionality
    - Add search input field
    - Search by patient name using patient_id lookup
    - Search by order_details text content
    - Filter by created_by physician
    - Update results in real-time as user types
    - _Requirements: 11.1, 11.3, 11.4_

  - [x] 8.4 Implement status update controls
    - Add status dropdown for each order row
    - Allow updating to in_progress, completed, or cancelled
    - Validate status transitions before update
    - Record completed_by and completed_at for completed orders
    - Record cancelled_by and cancelled_at for cancelled orders
    - Show confirmation dialog for status changes
    - _Requirements: 5.4, 5.5, 7.1, 7.2, 7.3, 7.6, 7.7_

  - [x] 8.5 Implement order detail view
    - Add click handler to open order detail modal
    - Display full order information including notes
    - Show source consultation link if appointment_id exists
    - Show audit trail: created_by, created_at, completed_by, completed_at
    - _Requirements: 5.7, 10.1, 10.2, 10.3, 10.4_

  - [x] 8.6 Add real-time updates with Supabase subscription
    - Subscribe to doctor_orders table changes
    - Update UI when new orders are created
    - Update UI when order status changes
    - Handle subscription cleanup on component unmount
    - _Requirements: 5.2_

  - [x] 8.7 Implement CSV export functionality
    - Add "Export to CSV" button
    - Export filtered results to CSV file
    - Include all order fields in export
    - Format dates and enums for readability
    - _Requirements: 11.6_

  - [x] 8.8 Implement priority-based sorting and visual highlighting
    - Sort orders by priority: stat first, then urgent, then routine
    - Apply red badge/background for stat orders
    - Apply orange badge/background for urgent orders
    - Apply default styling for routine orders
    - _Requirements: 8.2, 8.3, 8.4_

- [ ] 9. Create PatientOrdersTab component
  - [ ] 9.1 Create PatientOrdersTab.jsx component
    - Accept patientId and onAddOrder props
    - Query orders for specific patient using getOrdersByPatient()
    - Display orders grouped by status (pending, in_progress, completed, cancelled)
    - Sort orders reverse chronologically within each status group
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 9.2 Implement quick add order functionality
    - Add "New Order" button at top of tab
    - Open modal for creating standalone order (no appointment_id)
    - Provide order_type, order_details, priority inputs
    - Save order with patient_id and created_by
    - _Requirements: 6.5, 6.6_

  - [ ] 9.3 Add link to source consultation
    - Display appointment date/time for orders with appointment_id
    - Make appointment info clickable to navigate to consultation details
    - Show "Standalone Order" label for orders without appointment_id
    - _Requirements: 5.7_

  - [ ] 9.4 Integrate PatientOrdersTab into patient profile
    - Add "Orders" tab to patient profile page
    - Position alongside Demographics, History, and other tabs
    - Pass patientId from patient profile context
    - _Requirements: 6.1_

- [ ] 10. Enhance Medical History Timeline with orders
  - [ ] 10.1 Modify MedicalHistoryTimeline.jsx to query orders
    - Add doctor_orders query alongside existing consultations, lab results, prescriptions
    - Merge orders into chronological timeline
    - Sort all events by created_at/date field
    - _Requirements: 3.1_

  - [ ] 10.2 Implement order entry rendering
    - Create order entry component for timeline
    - Display order_type with type-specific icon (pill for medication, beaker for lab, etc.)
    - Show order_details, status, and priority
    - Apply color coding based on order_type
    - _Requirements: 3.2, 3.3_

  - [ ] 10.3 Display completion information
    - Show completed_at timestamp for completed orders
    - Show completed_by user name for completed orders
    - Show cancelled_at and cancelled_by for cancelled orders
    - _Requirements: 3.4_

  - [ ] 10.4 Add order filtering to timeline
    - Add filter dropdown for order_type
    - Add filter dropdown for order_status
    - Update timeline display based on selected filters
    - _Requirements: 3.5, 3.6_

- [ ] 11. Implement audit trail and immutability
  - [ ] 11.1 Enforce immutability in database service
    - Remove any DELETE methods for doctor_orders
    - Prevent modification of order_details after creation
    - Only allow status, completed_by, completed_at, cancelled_by, cancelled_at, notes updates
    - _Requirements: 10.5, 10.6_

  - [ ] 11.2 Add correction workflow UI
    - Display message when user attempts to edit order_details
    - Explain that corrections require cancelling and creating new order
    - Provide "Cancel and Create New" button
    - Copy order_details to new order form for editing
    - _Requirements: 10.7_

  - [ ] 11.3 Ensure audit trail completeness
    - Verify created_by and created_at recorded on INSERT
    - Verify completed_by and completed_at recorded on status change to completed
    - Verify cancelled_by and cancelled_at recorded on status change to cancelled
    - Maintain appointment_id link for traceability
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.8_

- [ ] 12. Final integration and testing
  - [ ] 12.1 Test complete workflow end-to-end
    - Create consultation with treatment text
    - Verify orders extracted and displayed in OrderReviewPanel
    - Confirm orders and save consultation
    - Verify orders appear in Orders page
    - Verify orders appear in patient profile Orders tab
    - Verify orders appear in medical history timeline
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.7_

  - [ ] 12.2 Test billing queue integration
    - Create procedure order and verify billing_queue entry created
    - Create lab_test order and verify billing_queue entry created
    - Create medication order and verify no billing_queue entry
    - Cancel procedure order and verify billing_queue entry removed
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 12.3 Test notification system integration
    - Create stat order and verify notifications sent to doctors and receptionists
    - Create urgent order and verify notifications sent
    - Create routine order and verify no notifications sent
    - Verify notification content includes patient name, order type, details, priority
    - Verify notification links to Orders page
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 8.6_

  - [ ] 12.4 Test RLS policies
    - Login as physician and verify access to patient orders
    - Login as nurse and verify access to all orders
    - Login as billing staff and verify access only to procedure/lab orders
    - Verify only physicians can create orders
    - Verify physicians and nurses can update order status
    - Verify no user can delete orders
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

  - [ ] 12.5 Test status transition validation
    - Verify pending → in_progress transition works
    - Verify in_progress → completed transition works
    - Verify pending → cancelled transition works
    - Verify in_progress → cancelled transition works
    - Verify completed → any transition is blocked
    - Verify cancelled → any transition is blocked
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 12.6 Write integration tests for complete workflow
    - Test consultation save with order extraction
    - Test order status updates
    - Test billing queue trigger
    - Test notification trigger
    - Test RLS policy enforcement
    - Mock Supabase client and verify correct API calls

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Verify all unit tests pass
  - Verify all integration tests pass
  - Verify all property tests pass
  - Test with real user accounts and data
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses JavaScript/TypeScript for frontend and SQL for database
- Real-time updates leverage existing Supabase subscription patterns
- Notification integration uses existing NotificationContext
- RLS policies follow existing security patterns in the codebase
