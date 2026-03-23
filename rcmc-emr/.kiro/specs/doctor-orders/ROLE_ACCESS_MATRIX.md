# Doctor Orders - Role Access Matrix

## Overview
This document defines the complete access control matrix for the Doctor Orders feature in the RCMC EMR system.

---

## Database Table: `doctor_orders`

### Table Structure
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: 
  - `appointment_id` → appointments(id)
  - `patient_id` → patients(id)
  - `created_by` → auth.users(id)
  - `completed_by` → auth.users(id)
  - `cancelled_by` → auth.users(id)

### Order Types
- `medication` - Prescription orders
- `procedure` - Medical procedures
- `lab_test` - Laboratory tests
- `diet` - Dietary orders
- `activity_restriction` - Activity limitations

### Order Status
- `pending` - Awaiting execution
- `in_progress` - Currently being processed
- `completed` - Finished
- `cancelled` - Cancelled by physician

### Priority Levels
- `routine` - Standard priority
- `urgent` - High priority
- `stat` - Immediate attention required

---

## Role-Based Access Control

### 1. Admin Role
**Full system access with all permissions**

#### Read Access (SELECT)
- ✅ View ALL orders for ALL patients
- ✅ View all order types (medication, procedure, lab_test, diet, activity_restriction)
- ✅ View all order statuses (pending, in_progress, completed, cancelled)
- ✅ View all priority levels (routine, urgent, stat)
- ✅ View complete audit trail (created_by, completed_by, cancelled_by)

#### Write Access (INSERT)
- ✅ Create orders on behalf of any doctor
- ✅ Create all order types
- ✅ Set any priority level
- ✅ Assign to any patient

#### Update Access (UPDATE)
- ✅ Update order status (pending → in_progress → completed)
- ✅ Cancel orders
- ✅ Modify order details
- ✅ Update priority levels
- ✅ Add/modify notes

#### Delete Access (DELETE)
- ❌ **DENIED** - Orders are immutable for audit compliance
- Use status='cancelled' instead

#### Special Permissions
- ✅ Access to all automated triggers
- ✅ Receive urgent/stat order notifications
- ✅ View billing queue integration
- ✅ Override any access restrictions

---

### 2. Doctor Role
**Clinical-focused access for order creation and management**

#### Read Access (SELECT)
- ✅ View ALL orders for ALL patients (not restricted to own patients)
- ✅ View all order types
- ✅ View all order statuses
- ✅ View all priority levels
- ✅ View complete audit trail

**RLS Policy**: `"Physicians can view all orders for their patients"`
```sql
EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() 
  AND up.role = 'doctor'
  AND up.status = 'Active'
)
```

#### Write Access (INSERT)
- ✅ Create new orders
- ✅ Create all order types (medication, procedure, lab_test, diet, activity_restriction)
- ✅ Set any priority level (routine, urgent, stat)
- ✅ Assign to any patient
- ✅ Link to appointments
- ⚠️ **Constraint**: `created_by` must be own user ID

**RLS Policy**: `"Only physicians can create orders"`
```sql
EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() 
  AND up.role IN ('doctor', 'admin')
  AND up.status = 'Active'
)
AND created_by = auth.uid()
```

#### Update Access (UPDATE)
- ✅ Update order status (pending → in_progress → completed)
- ✅ Cancel orders (status → cancelled)
- ✅ Modify order details
- ✅ Update priority levels
- ✅ Add/modify notes
- ✅ Set completed_by and completed_at
- ✅ Set cancelled_by and cancelled_at

**RLS Policy**: `"Physicians and nurses can update order status"`
```sql
EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() 
  AND up.role IN ('doctor', 'receptionist', 'admin')
  AND up.status = 'Active'
)
```

#### Delete Access (DELETE)
- ❌ **DENIED** - Orders are immutable for audit compliance
- Use status='cancelled' instead

#### Special Permissions
- ✅ Trigger billing queue for procedure/lab_test orders
- ✅ Trigger urgent/stat notifications
- ✅ Receive urgent/stat order notifications
- ✅ Access order parsing utility
- ✅ Extract orders from SOAP notes

---

### 3. Receptionist Role
**Administrative and billing-focused access**

#### Read Access (SELECT)
- ✅ View ALL orders for ALL patients
- ✅ View all order types
- ✅ View all order statuses
- ✅ View all priority levels
- ✅ View complete audit trail
- ✅ **Special focus**: procedure and lab_test orders (for billing)

**RLS Policies**: 
1. `"Nurses can view all orders"`
```sql
EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() 
  AND up.role IN ('receptionist', 'admin')
  AND up.status = 'Active'
)
```

2. `"Billing staff can view procedure and lab orders"`
```sql
order_type IN ('procedure', 'lab_test')
AND EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() 
  AND up.role IN ('receptionist', 'admin')
  AND up.status = 'Active'
)
```

#### Write Access (INSERT)
- ❌ **DENIED** - Cannot create orders
- Only doctors can create orders

#### Update Access (UPDATE)
- ✅ Update order status (pending → in_progress → completed)
- ✅ Mark orders as completed
- ✅ Add/modify notes
- ✅ Set completed_by and completed_at
- ❌ **RESTRICTED**: Cannot cancel orders (doctor-only action)
- ❌ **RESTRICTED**: Cannot modify order details or priority

**RLS Policy**: `"Physicians and nurses can update order status"`
```sql
EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.id = auth.uid() 
  AND up.role IN ('doctor', 'receptionist', 'admin')
  AND up.status = 'Active'
)
```

#### Delete Access (DELETE)
- ❌ **DENIED** - Orders are immutable for audit compliance

#### Special Permissions
- ✅ Access billing queue integration
- ✅ View orders linked to billing_queue
- ✅ Receive urgent/stat order notifications
- ✅ Process procedure and lab_test orders for billing
- ✅ Update order status during fulfillment

---

## Automated Triggers & Workflows

### 1. Billing Queue Integration
**Trigger**: `trigger_add_order_to_billing`

**Activated When**:
- New order created with `order_type` IN ('procedure', 'lab_test')
- Order status is 'pending'

**Action**:
- Automatically adds order to `billing_queue` table
- Links order via `order_id` foreign key
- Captures patient_id, doctor_id, consultation_id

**Access**:
- ✅ Admin - Full visibility
- ✅ Doctor - Triggered by their orders
- ✅ Receptionist - Can view and process in billing queue

---

### 2. Urgent/STAT Notifications
**Trigger**: `trigger_notify_urgent_order`

**Activated When**:
- New order created with `priority` IN ('urgent', 'stat')

**Action**:
- Sends notifications to all active doctors and receptionists
- STAT orders: Red notification (bg-red-50 text-red-600)
- Urgent orders: Orange notification (bg-orange-50 text-orange-600)
- Notification includes: patient name, order type, order details

**Recipients**:
- ✅ All doctors (role='doctor', status='Active')
- ✅ All receptionists (role='receptionist', status='Active')
- ✅ Admins (role='admin', status='Active')

---

### 3. Cancelled Order Cleanup
**Trigger**: `trigger_remove_cancelled_order`

**Activated When**:
- Order status changes from any status → 'cancelled'

**Action**:
- Removes order from `billing_queue` table
- Prevents billing for cancelled orders

**Access**:
- ✅ Admin - Can cancel any order
- ✅ Doctor - Can cancel own orders
- ❌ Receptionist - Cannot cancel orders

---

## UI/Frontend Access

### Orders Page (`/orders`)

#### Admin View
- ✅ View all orders (all patients, all types, all statuses)
- ✅ Create new orders
- ✅ Update order status
- ✅ Cancel orders
- ✅ Filter by: patient, order type, status, priority, date range
- ✅ Export orders data
- ✅ View audit trail

#### Doctor View
- ✅ View all orders (all patients)
- ✅ Create new orders
- ✅ Update order status
- ✅ Cancel orders
- ✅ Filter by: patient, order type, status, priority, date range
- ✅ Extract orders from SOAP notes
- ✅ View orders linked to appointments

#### Receptionist View
- ✅ View all orders (all patients)
- ✅ Update order status (mark as in_progress/completed)
- ❌ Cannot create orders
- ❌ Cannot cancel orders
- ✅ Filter by: patient, order type, status, priority, date range
- ✅ Focus on procedure/lab_test orders for billing
- ✅ View billing queue integration

---

## Security Features

### 1. Row Level Security (RLS)
- ✅ Enabled on `doctor_orders` table
- ✅ 6 policies enforcing role-based access
- ✅ Automatic enforcement at database level
- ✅ Cannot be bypassed by frontend code

### 2. Audit Trail
- ✅ `created_by` - Who created the order
- ✅ `created_at` - When order was created
- ✅ `completed_by` - Who completed the order
- ✅ `completed_at` - When order was completed
- ✅ `cancelled_by` - Who cancelled the order
- ✅ `cancelled_at` - When order was cancelled

### 3. Immutability
- ✅ Orders cannot be deleted (no DELETE policy)
- ✅ Use status='cancelled' for cancellations
- ✅ Preserves complete medical record
- ✅ Compliance with healthcare regulations

### 4. Data Integrity
- ✅ Foreign key constraints
- ✅ CHECK constraints on order_type, status, priority
- ✅ NOT NULL constraints on critical fields
- ✅ Cascading deletes for patient records

---

## Summary Table

| Permission | Admin | Doctor | Receptionist |
|------------|-------|--------|--------------|
| **View all orders** | ✅ | ✅ | ✅ |
| **View own orders only** | N/A | N/A | N/A |
| **Create orders** | ✅ | ✅ | ❌ |
| **Update order status** | ✅ | ✅ | ✅ |
| **Cancel orders** | ✅ | ✅ | ❌ |
| **Delete orders** | ❌ | ❌ | ❌ |
| **Modify order details** | ✅ | ✅ | ❌ |
| **Set priority** | ✅ | ✅ | ❌ |
| **View audit trail** | ✅ | ✅ | ✅ |
| **Receive urgent notifications** | ✅ | ✅ | ✅ |
| **Access billing queue** | ✅ | ✅ | ✅ |
| **Extract from SOAP notes** | ✅ | ✅ | ❌ |

---

## Implementation Notes

1. **All roles have read access to all orders** - This ensures care coordination and transparency
2. **Only doctors can create and cancel orders** - Clinical decision-making authority
3. **Receptionists can update status** - For order fulfillment and workflow management
4. **No one can delete orders** - Ensures audit trail and regulatory compliance
5. **Automated triggers handle billing and notifications** - Reduces manual work and errors

---

## Compliance & Best Practices

- ✅ HIPAA compliant audit trail
- ✅ Role-based access control (RBAC)
- ✅ Immutable medical records
- ✅ Automated workflow integration
- ✅ Real-time notifications for urgent orders
- ✅ Database-level security enforcement
- ✅ Complete audit trail for all actions

---

**Last Updated**: March 7, 2026  
**Feature**: Doctor Orders  
**Spec Location**: `.kiro/specs/doctor-orders/`
