# Bugfix Requirements Document

## Introduction

When attempting to insert a service record into the `services` table, the application throws a SQL error: `ERROR: 42703: column "service_code" of relation "services" does not exist`. The `services` table schema defines the column as `code`, but the application code references it as `service_code` in INSERT statements, SELECT queries, CSV templates, and import parsing logic. This mismatch prevents any service from being created or imported via CSV.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user submits the "Add Service" form THEN the system fails with `ERROR: 42703: column "service_code" of relation "services" does not exist`

1.2 WHEN a user imports services via CSV using the template THEN the system fails to insert rows because the CSV template header uses `service_code` instead of the actual column name `code`

1.3 WHEN `getServicesByCodePrefix` is called THEN the system throws an error because it queries `.select('service_code')` and `.like('service_code', ...)` against a column that does not exist

1.4 WHEN `getServiceByCode` is called THEN the system throws an error because it queries `.eq('service_code', code)` against a column that does not exist

### Expected Behavior (Correct)

2.1 WHEN a user submits the "Add Service" form THEN the system SHALL successfully insert the service record using the `code` column that exists in the `services` table

2.2 WHEN a user imports services via CSV using the template THEN the system SHALL correctly map the CSV `service_code` header to the `code` column, or the template SHALL use `code` as the header to match the schema

2.3 WHEN `getServicesByCodePrefix` is called THEN the system SHALL query the `code` column and return matching service records without error

2.4 WHEN `getServiceByCode` is called THEN the system SHALL query the `code` column and return the matching service record without error

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user edits an existing service THEN the system SHALL CONTINUE TO update the service record successfully

3.2 WHEN a user deletes (deactivates) a service THEN the system SHALL CONTINUE TO set the service status to Inactive

3.3 WHEN a user loads the Services page THEN the system SHALL CONTINUE TO display all existing services from the database

3.4 WHEN a user searches or filters services THEN the system SHALL CONTINUE TO return correctly filtered results
