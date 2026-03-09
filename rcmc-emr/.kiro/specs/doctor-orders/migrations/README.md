# Doctor Orders Database Migration

## Overview

This directory contains the SQL migration script for setting up the Doctor Orders feature database schema, triggers, and Row Level Security policies.

## Migration File

**`01-setup-doctor-orders-complete.sql`** - Complete database setup including:
- `doctor_orders` table with all fields, constraints, and indexes
- `order_id` column addition to `billing_queue` table
- Trigger to auto-populate billing queue for procedures/lab tests
- Trigger to send notifications for urgent/stat orders
- Trigger to cleanup billing queue when orders are cancelled
- Row Level Security policies for proper access control

## How to Run

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Execute Migration

1. Open `01-setup-doctor-orders-complete.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

### Step 3: Verify Installation

The migration includes verification queries at the end that will display:
- Table creation confirmation
- List of indexes created
- List of triggers created
- List of RLS policies created
- Billing queue order_id column confirmation

Review the output to ensure everything was created successfully.

## What Gets Created

### Tables

#### `doctor_orders`
- **Purpose**: Stores formal medical orders extracted from SOAP notes or created standalone
- **Fields**:
  - `id` (UUID, Primary Key)
  - `appointment_id` (UUID, Foreign Key to appointments)
  - `patient_id` (UUID, Foreign Key to patients, NOT NULL)
  - `order_type` (TEXT, CHECK constraint: medication, procedure, lab_test, diet, activity_restriction)
  - `order_details` (TEXT, NOT NULL)
  - `status` (TEXT, CHECK constraint: pending, in_progress, completed, cancelled)
  - `priority` (TEXT, CHECK constraint: routine, urgent, stat)
  - `created_by` (UUID, Foreign Key to auth.users, NOT NULL)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `completed_by` (UUID, Foreign Key to auth.users)
  - `completed_at` (TIMESTAMP WITH TIME ZONE)
  - `cancelled_by` (UUID, Foreign Key to auth.users)
  - `cancelled_at` (TIMESTAMP WITH TIME ZONE)
  - `notes` (TEXT)

### Indexes

7 indexes for optimal query performance:
- `idx_doctor_orders_patient` - Patient lookups
- `idx_doctor_orders_appointment` - Appointment lookups
- `idx_doctor_orders_status` - Status filtering
- `idx_doctor_orders_priority` - Priority filtering
- `idx_doctor_orders_type` - Order type filtering
- `idx_doctor_orders_created_at` - Date sorting
- `idx_doctor_orders_created_by` - Creator lookups

### Triggers

#### 1. `trigger_add_order_to_billing`
- **When**: After INSERT on doctor_orders
- **What**: Automatically adds procedure and lab_test orders to billing_queue
- **Function**: `add_order_to_billing_queue()`

#### 2. `trigger_notify_urgent_order`
- **When**: After INSERT on doctor_orders
- **What**: Sends notifications to doctors and receptionists for urgent/stat orders
- **Function**: `notify_urgent_order()`

#### 3. `trigger_remove_cancelled_order`
- **When**: After UPDATE on doctor_orders
- **What**: Removes cancelled orders from billing_queue
- **Function**: `remove_cancelled_order_from_billing()`

### Row Level Security Policies

6 RLS policies for secure access control:

1. **"Physicians can view all orders for their patients"**
   - Allows doctors to SELECT orders
   
2. **"Nurses can view all orders"**
   - Allows receptionists and admins to SELECT all orders
   
3. **"Billing staff can view procedure and lab orders"**
   - Allows billing staff to SELECT procedure and lab_test orders only
   
4. **"Only physicians can create orders"**
   - Allows only doctors and admins to INSERT orders
   
5. **"Physicians and nurses can update order status"**
   - Allows doctors, receptionists, and admins to UPDATE orders
   
6. **No DELETE policy**
   - Prevents deletion of orders (enforces immutability)

## Testing the Setup

After running the migration, you can test with these queries:

### Test 1: Verify Table Structure
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'doctor_orders'
ORDER BY ordinal_position;
```

### Test 2: Check Constraints
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'doctor_orders';
```

### Test 3: Verify Triggers
```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'doctor_orders';
```

### Test 4: Check RLS Policies
```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'doctor_orders';
```

## Rollback (If Needed)

If you need to remove the doctor_orders feature:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_add_order_to_billing ON doctor_orders;
DROP TRIGGER IF EXISTS trigger_notify_urgent_order ON doctor_orders;
DROP TRIGGER IF EXISTS trigger_remove_cancelled_order ON doctor_orders;

-- Drop functions
DROP FUNCTION IF EXISTS add_order_to_billing_queue();
DROP FUNCTION IF EXISTS notify_urgent_order();
DROP FUNCTION IF EXISTS remove_cancelled_order_from_billing();

-- Remove order_id from billing_queue
ALTER TABLE billing_queue DROP COLUMN IF EXISTS order_id;

-- Drop table (this will cascade to all dependent objects)
DROP TABLE IF EXISTS doctor_orders CASCADE;
```

## Next Steps

After successfully running this migration:

1. ✅ **Task 1.1-1.6 Complete** - Database schema and triggers are set up
2. ⏭️ **Task 2** - Proceed to checkpoint verification
3. ⏭️ **Task 3** - Implement order parsing utility (`src/utils/orderParser.js`)
4. ⏭️ **Task 4** - Create database service methods
5. ⏭️ **Task 5** - Build OrderReviewPanel component

## Troubleshooting

### Issue: "relation does not exist"
- **Cause**: Referenced tables (patients, appointments, auth.users) don't exist
- **Solution**: Ensure base schema is set up first (run `supabase-schema.sql`)

### Issue: "billing_queue table does not exist"
- **Cause**: billing_queue table hasn't been created yet
- **Solution**: This is expected - the migration handles this gracefully with conditional logic

### Issue: "notifications table does not exist"
- **Cause**: notifications table hasn't been created yet
- **Solution**: This is expected - the migration handles this gracefully with conditional logic

### Issue: RLS policies blocking access
- **Cause**: User role not properly set in user_profiles table
- **Solution**: Verify user has correct role:
  ```sql
  SELECT id, email, role, status FROM user_profiles WHERE id = auth.uid();
  ```

## Support

For issues or questions:
1. Check the verification queries output
2. Review the troubleshooting section above
3. Consult the design document: `rcmc-emr/.kiro/specs/doctor-orders/design.md`
4. Consult the requirements document: `rcmc-emr/.kiro/specs/doctor-orders/requirements.md`
