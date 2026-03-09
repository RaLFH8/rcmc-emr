# Bugfix Requirements Document

## Introduction

The ADD_INVENTORY_BATCH_TRACKING.sql migration script fails when executed in Supabase with the error: "ERROR: 42P17: functions in index expression must be marked IMMUTABLE". This error occurs because PostgreSQL requires that any function used in an index expression must be explicitly marked as IMMUTABLE to guarantee that the function always returns the same output for the same input, which is necessary for index consistency.

The bug prevents the inventory batch tracking feature from being deployed to the database, blocking the ability to track multiple batches of the same medicine/supply with different expiration dates.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the ADD_INVENTORY_BATCH_TRACKING.sql script is executed in Supabase THEN the system returns error "ERROR: 42P17: functions in index expression must be marked IMMUTABLE"

1.2 WHEN the migration fails THEN the batch tracking columns (batch_number, lot_number, expiration_date, manufacture_date) are not added to the inventory table

1.3 WHEN the migration fails THEN the unique indexes for batch tracking are not created

1.4 WHEN the migration fails THEN the inventory_summary, expiring_inventory, and expired_inventory views are not created

1.5 WHEN the migration fails THEN the auto-status update trigger is not installed

### Expected Behavior (Correct)

2.1 WHEN the ADD_INVENTORY_BATCH_TRACKING.sql script is executed in Supabase THEN the system SHALL complete successfully without immutable function errors

2.2 WHEN the migration completes successfully THEN the batch tracking columns SHALL be added to the inventory table

2.3 WHEN the migration completes successfully THEN all unique indexes SHALL be created to enforce batch uniqueness constraints

2.4 WHEN the migration completes successfully THEN all views (inventory_summary, expiring_inventory, expired_inventory) SHALL be created and queryable

2.5 WHEN the migration completes successfully THEN the trigger SHALL automatically update inventory status based on expiration dates

2.6 WHEN existing inventory records exist THEN they SHALL be updated with generated batch numbers without causing constraint violations

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the inventory table has existing data THEN the system SHALL CONTINUE TO preserve all existing inventory records and their data

3.2 WHEN the migration adds new columns THEN the system SHALL CONTINUE TO allow NULL values for batch_number, lot_number, expiration_date, and manufacture_date on existing records

3.3 WHEN unique indexes are created THEN the system SHALL CONTINUE TO allow multiple inventory items with the same name if they have different batch numbers or expiration dates

3.4 WHEN the status update trigger is installed THEN the system SHALL CONTINUE TO update status based on stock levels (Out of Stock, Low Stock, In Stock) for items without expiration dates

3.5 WHEN views are created THEN the system SHALL CONTINUE TO allow direct queries on the inventory table without requiring view usage
