# Requirements Document

## Introduction

The Doctor's Orders feature enables physicians to formally document medical orders extracted from SOAP note Treatment sections. Orders are recorded in the patient's medical history timeline for complete documentation, legal compliance, continuity of care, and audit trail purposes. The system captures medications, procedures, lab tests, diet instructions, and activity restrictions as structured, trackable orders.

## Glossary

- **Order_System**: The Doctor's Orders feature that extracts, structures, and tracks medical orders
- **SOAP_Treatment**: The Treatment field in SOAP notes stored in the appointments table (soap_treatment column)
- **Medical_Order**: A structured record of a physician's instruction for patient care (medication, procedure, lab test, diet, or activity restriction)
- **Order_Type**: Classification of orders: medication, procedure, lab_test, diet, activity_restriction
- **Order_Status**: Current state of an order: pending, in_progress, completed, cancelled
- **Medical_History_Timeline**: Chronological view of all patient events including consultations, orders, lab results, prescriptions, and procedures
- **Priority_Level**: Urgency classification: routine, urgent, stat (immediate)
- **Consultation**: A patient appointment with completed SOAP notes
- **Billing_Queue**: System component that manages patient billing workflow

## Requirements

### Requirement 1: Extract Orders from SOAP Treatment Field

**User Story:** As a physician, I want my treatment instructions automatically captured as formal orders, so that I don't have to enter the same information twice.

#### Acceptance Criteria

1. WHEN a consultation is saved with soap_treatment content, THE Order_System SHALL parse the treatment text for order-like instructions
2. THE Order_System SHALL identify order types based on keywords: "prescribe/medication" for medications, "order/test" for lab tests, "procedure/perform" for procedures, "diet/nutrition" for diet instructions, "restrict/avoid" for activity restrictions
3. WHEN multiple orders are present in soap_treatment, THE Order_System SHALL extract each order as a separate Medical_Order record
4. THE Order_System SHALL preserve the original soap_treatment text without modification
5. THE Order_System SHALL link each Medical_Order to the source appointment via appointment_id

### Requirement 2: Store Orders in Database

**User Story:** As a system administrator, I want orders stored in a dedicated table, so that they can be queried, tracked, and audited independently.

#### Acceptance Criteria

1. THE Order_System SHALL store Medical_Orders in a doctor_orders table with fields: order_id, appointment_id, patient_id, order_type, order_details, status, priority, created_by, created_at, completed_by, completed_at
2. THE Order_System SHALL set order_id as a UUID primary key
3. THE Order_System SHALL set status to "pending" for newly created orders
4. THE Order_System SHALL set priority to "routine" unless specified otherwise in the treatment text
5. THE Order_System SHALL record created_by as the physician's user_id from the appointment
6. THE Order_System SHALL set created_at to the current timestamp
7. THE Order_System SHALL establish a foreign key relationship between doctor_orders.appointment_id and appointments.id
8. THE Order_System SHALL establish a foreign key relationship between doctor_orders.patient_id and patients.id

### Requirement 3: Display Orders in Medical History Timeline

**User Story:** As a physician, I want to see all patient orders in the medical history timeline, so that I have complete visibility into the patient's care plan.

#### Acceptance Criteria

1. THE Medical_History_Timeline SHALL display Medical_Orders chronologically alongside consultations, lab results, prescriptions, and procedures
2. WHEN displaying a Medical_Order, THE Medical_History_Timeline SHALL show order_type, order_details, status, priority, and created_at
3. THE Medical_History_Timeline SHALL visually distinguish order types using icons or color coding
4. WHEN a Medical_Order status is "completed", THE Medical_History_Timeline SHALL display completed_at and completed_by
5. THE Medical_History_Timeline SHALL allow filtering by order_type
6. THE Medical_History_Timeline SHALL allow filtering by order_status

### Requirement 4: Integrated Order Creation within Consultations

**User Story:** As a physician, I want to review and confirm extracted orders during the consultation, so that I can ensure accuracy before finalizing.

#### Acceptance Criteria

1. WHEN a physician enters text in the soap_treatment field, THE Order_System SHALL provide real-time preview of detected orders
2. THE Consultation_Page SHALL display extracted orders in a review section before saving
3. THE Consultation_Page SHALL allow physicians to edit order_details before saving
4. THE Consultation_Page SHALL allow physicians to set priority_level for each order
5. THE Consultation_Page SHALL allow physicians to remove incorrectly detected orders
6. THE Consultation_Page SHALL allow physicians to manually add orders not detected by parsing
7. WHEN the consultation is saved, THE Order_System SHALL create all confirmed Medical_Orders in the database

### Requirement 5: Centralized Orders Management Page

**User Story:** As a nurse or care coordinator, I want a dedicated Orders page to track all pending and active orders, so that I can ensure timely execution.

#### Acceptance Criteria

1. THE Order_System SHALL provide an Orders page accessible from the sidebar navigation
2. THE Orders_Page SHALL display all Medical_Orders with filters for status, priority, order_type, and date_range
3. THE Orders_Page SHALL default to showing "pending" and "in_progress" orders
4. THE Orders_Page SHALL allow users to update order_status to "in_progress", "completed", or "cancelled"
5. WHEN a user marks an order as "completed", THE Order_System SHALL record completed_at timestamp and completed_by user_id
6. THE Orders_Page SHALL display patient name, order_type, order_details, priority, and created_at for each order
7. THE Orders_Page SHALL allow users to click an order to view full details including the source consultation

### Requirement 6: Patient Profile Orders Tab

**User Story:** As a physician viewing a patient profile, I want to see all orders for that specific patient, so that I can review their complete care plan.

#### Acceptance Criteria

1. THE Patient_Profile SHALL include an "Orders" tab alongside Demographics, History, and other tabs
2. THE Orders_Tab SHALL display all Medical_Orders for the current patient
3. THE Orders_Tab SHALL group orders by order_status: pending, in_progress, completed, cancelled
4. THE Orders_Tab SHALL display orders in reverse chronological order within each status group
5. THE Orders_Tab SHALL allow physicians to add new orders directly from the patient profile
6. WHEN a physician adds an order from the patient profile, THE Order_System SHALL create a Medical_Order without requiring an appointment_id

### Requirement 7: Order Status Workflow

**User Story:** As a care team member, I want clear status transitions for orders, so that everyone knows what stage each order is in.

#### Acceptance Criteria

1. THE Order_System SHALL enforce status transitions: pending → in_progress → completed
2. THE Order_System SHALL allow status transition: pending → cancelled
3. THE Order_System SHALL allow status transition: in_progress → cancelled
4. THE Order_System SHALL prevent status changes from "completed" to any other status
5. THE Order_System SHALL prevent status changes from "cancelled" to any other status
6. WHEN status changes to "in_progress", THE Order_System SHALL record the user_id of who initiated the change
7. WHEN status changes to "completed" or "cancelled", THE Order_System SHALL require the user_id of who performed the action

### Requirement 8: Order Priority Handling

**User Story:** As a nurse, I want to see urgent and stat orders prominently, so that I can prioritize critical patient care.

#### Acceptance Criteria

1. THE Order_System SHALL support three priority levels: routine, urgent, stat
2. THE Orders_Page SHALL sort orders by priority: stat first, then urgent, then routine
3. THE Orders_Page SHALL visually highlight "stat" orders with a distinct color or badge
4. THE Orders_Page SHALL visually highlight "urgent" orders with a distinct color or badge
5. THE Medical_History_Timeline SHALL display priority_level for each Medical_Order
6. WHEN an order has priority "stat", THE Order_System SHALL send a notification to relevant care team members

### Requirement 9: Link Orders to Billing

**User Story:** As a billing clerk, I want orders for procedures and lab tests to appear in the billing queue, so that I can ensure proper charges.

#### Acceptance Criteria

1. WHEN a Medical_Order with order_type "procedure" or "lab_test" is created, THE Order_System SHALL add an entry to the Billing_Queue
2. THE Billing_Queue SHALL include order_details and patient_id from the Medical_Order
3. THE Billing_Queue SHALL link to the Medical_Order via order_id
4. WHEN a Medical_Order status changes to "cancelled", THE Order_System SHALL remove or mark the corresponding Billing_Queue entry as cancelled
5. THE Order_System SHALL not create Billing_Queue entries for order_type "medication", "diet", or "activity_restriction"

### Requirement 10: Audit Trail and Legal Documentation

**User Story:** As a compliance officer, I want complete audit trails for all orders, so that we can demonstrate proper care documentation for legal and regulatory purposes.

#### Acceptance Criteria

1. THE Order_System SHALL record created_by user_id for every Medical_Order
2. THE Order_System SHALL record created_at timestamp for every Medical_Order
3. THE Order_System SHALL record completed_by user_id when status changes to "completed"
4. THE Order_System SHALL record completed_at timestamp when status changes to "completed"
5. THE Order_System SHALL prevent deletion of Medical_Orders
6. THE Order_System SHALL prevent modification of order_details after creation
7. WHEN an order needs correction, THE Order_System SHALL require creating a new order and cancelling the incorrect one
8. THE Order_System SHALL maintain a link to the source appointment via appointment_id for traceability

### Requirement 11: Order Search and Filtering

**User Story:** As a physician, I want to search for specific orders across all patients, so that I can track patterns or follow up on specific treatments.

#### Acceptance Criteria

1. THE Orders_Page SHALL provide a search field that filters by order_details text
2. THE Orders_Page SHALL provide filters for order_type, status, priority, and date_range
3. THE Orders_Page SHALL allow filtering by patient_name
4. THE Orders_Page SHALL allow filtering by created_by physician
5. THE Orders_Page SHALL display result count after applying filters
6. THE Orders_Page SHALL allow exporting filtered results to CSV format

### Requirement 12: Order Parser Accuracy

**User Story:** As a physician, I want the order parser to accurately identify my treatment instructions, so that I can trust the automated extraction.

#### Acceptance Criteria

1. THE Order_System SHALL use a parser that identifies medication orders from keywords: "prescribe", "medication", "drug", "Rx"
2. THE Order_System SHALL use a parser that identifies lab test orders from keywords: "order", "test", "lab", "check", "screen"
3. THE Order_System SHALL use a parser that identifies procedure orders from keywords: "procedure", "perform", "schedule", "refer"
4. THE Order_System SHALL use a parser that identifies diet orders from keywords: "diet", "nutrition", "NPO", "clear liquids", "restrict intake"
5. THE Order_System SHALL use a parser that identifies activity orders from keywords: "restrict", "avoid", "bed rest", "ambulate", "physical therapy"
6. THE Order_System SHALL provide a pretty printer that formats Medical_Orders back into human-readable text
7. FOR ALL valid Medical_Orders, parsing the order_details then formatting then parsing SHALL produce an equivalent Medical_Order (round-trip property)

### Requirement 13: Integration with Existing Workflows

**User Story:** As a physician, I want orders to integrate seamlessly with my existing consultation workflow, so that I don't have to change my documentation habits.

#### Acceptance Criteria

1. THE Order_System SHALL not modify the existing soap_treatment field behavior
2. THE Order_System SHALL not require physicians to use special formatting in soap_treatment
3. THE Consultation_Page SHALL continue to function normally if no orders are detected
4. THE Order_System SHALL operate independently of the prescription system
5. THE Order_System SHALL operate independently of the lab results system
6. WHEN a consultation is edited, THE Order_System SHALL not create duplicate orders
7. THE Order_System SHALL only create orders when a consultation is initially saved or when explicitly requested

### Requirement 14: Notification System Integration

**User Story:** As a care team member, I want to receive notifications for new orders relevant to my role, so that I can respond promptly.

#### Acceptance Criteria

1. WHEN a Medical_Order with priority "stat" is created, THE Order_System SHALL send notifications to all nurses and physicians
2. WHEN a Medical_Order with order_type "lab_test" is created, THE Order_System SHALL send a notification to laboratory staff
3. WHEN a Medical_Order with order_type "procedure" is created, THE Order_System SHALL send a notification to procedure coordinators
4. THE Order_System SHALL use the existing notification system for sending alerts
5. THE Order_System SHALL include patient_name, order_type, order_details, and priority in notifications
6. THE Order_System SHALL include a link to the Orders_Page in notifications

### Requirement 15: Row Level Security and Permissions

**User Story:** As a security administrator, I want orders protected by appropriate access controls, so that patient data remains confidential.

#### Acceptance Criteria

1. THE Order_System SHALL enforce Row Level Security (RLS) on the doctor_orders table
2. THE Order_System SHALL allow physicians to view all Medical_Orders for their patients
3. THE Order_System SHALL allow nurses to view all Medical_Orders
4. THE Order_System SHALL allow billing staff to view Medical_Orders with order_type "procedure" or "lab_test"
5. THE Order_System SHALL allow only physicians to create Medical_Orders
6. THE Order_System SHALL allow physicians and nurses to update order_status
7. THE Order_System SHALL prevent deletion of Medical_Orders by all users
8. THE Order_System SHALL log all access attempts to the doctor_orders table for audit purposes
