# Import Audit Logging System

## Overview

The Import Audit Logging System provides comprehensive tracking of all CSV import operations for compliance, troubleshooting, and security monitoring. All import operations (patient, inventory, and lab test imports) are automatically logged to the `import_logs` table in Supabase.

## Features

### Tracked Information

Each import operation logs the following information:

1. **User Information**
   - User ID (references auth.users)
   - Username (preserved even if user is deleted)

2. **Import Metadata**
   - Module type (patient, inventory, lab_test)
   - Source filename
   - Start time
   - End time
   - Duration in milliseconds

3. **Record Counts**
   - Total records in CSV
   - Successfully imported records
   - Failed records
   - Skipped records (e.g., duplicates)

4. **Category Breakdown** (for inventory and lab test imports)
   - JSON object with counts per category
   - Example: `{"Services": 10, "Medicines": 20, "Medical_Supplies": 5}`

5. **Error Details**
   - Array of error objects with:
     - Row number
     - Row data
     - Error message
     - Stack trace (for debugging)
     - Timestamp

6. **Status**
   - `in_progress`: Import is currently running
   - `completed`: Import finished successfully
   - `failed`: Import failed with errors

## Database Schema

```sql
CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  module_type TEXT NOT NULL CHECK (module_type IN ('patient', 'inventory', 'lab_test')),
  filename TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  skipped_records INTEGER NOT NULL DEFAULT 0,
  category_breakdown JSONB,
  error_details JSONB,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Setup Instructions

### 1. Run Database Migration

Execute the migration script to create the `import_logs` table:

```bash
# Navigate to the migrations directory
cd rcmc-emr/.kiro/specs/intelligent-csv-import-system/migrations

# Run the migration in Supabase SQL Editor
# Copy and paste the contents of 03-create-import-logs-table.sql
```

Or run directly in Supabase SQL Editor:

```sql
-- Copy the entire contents of:
-- rcmc-emr/.kiro/specs/intelligent-csv-import-system/migrations/03-create-import-logs-table.sql
```

### 2. Verify Table Creation

Check that the table was created successfully:

```sql
-- Verify table exists
SELECT * FROM import_logs LIMIT 1;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'import_logs';

-- Verify RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'import_logs';
```

### 3. Test Audit Logging

Perform a test import to verify logging works:

1. Go to Patients, Inventory, or Services page
2. Click "Import" button
3. Upload a small CSV file (5-10 rows)
4. Complete the import
5. Check the logs:

```sql
-- View recent import logs
SELECT 
  id,
  username,
  module_type,
  filename,
  start_time,
  end_time,
  duration_ms,
  total_records,
  successful_records,
  failed_records,
  status
FROM import_logs
ORDER BY created_at DESC
LIMIT 10;
```

## Usage

### Automatic Logging

Audit logging is automatically integrated into all three import services:
- `patientImportService.js`
- `inventoryImportService.js`
- `labTestImportService.js`

No additional code is required in the UI components - logging happens automatically when imports are performed.

### Querying Import Logs

#### Get All Import Logs

```javascript
import { getImportLogs } from '../../utils/import/auditLogger';

// Get last 50 imports
const logs = await getImportLogs();

// Get imports by user
const userLogs = await getImportLogs({ userId: 'user-uuid' });

// Get imports by module type
const patientImports = await getImportLogs({ moduleType: 'patient' });

// Get imports by status
const failedImports = await getImportLogs({ status: 'failed' });

// Get imports in date range
const recentImports = await getImportLogs({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 100
});
```

#### Get Import Statistics

```javascript
import { getImportStatistics } from '../../utils/import/auditLogger';

// Get overall statistics
const stats = await getImportStatistics();

// Returns:
// {
//   totalImports: 150,
//   completedImports: 140,
//   failedImports: 10,
//   inProgressImports: 0,
//   totalRecordsProcessed: 5000,
//   totalSuccessfulRecords: 4800,
//   totalFailedRecords: 200,
//   totalSkippedRecords: 50,
//   averageDuration: 8500, // milliseconds
//   byModule: {
//     patient: { count: 50, successful: 1200, failed: 50 },
//     inventory: { count: 60, successful: 2000, failed: 100 },
//     lab_test: { count: 40, successful: 1600, failed: 50 }
//   }
// }
```

### SQL Queries for Reporting

#### Most Active Users

```sql
SELECT 
  username,
  COUNT(*) as import_count,
  SUM(successful_records) as total_successful,
  SUM(failed_records) as total_failed
FROM import_logs
WHERE status = 'completed'
GROUP BY username
ORDER BY import_count DESC
LIMIT 10;
```

#### Import Success Rate by Module

```sql
SELECT 
  module_type,
  COUNT(*) as total_imports,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_imports,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_imports,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as success_rate_percent
FROM import_logs
GROUP BY module_type;
```

#### Average Import Duration by Module

```sql
SELECT 
  module_type,
  COUNT(*) as import_count,
  ROUND(AVG(duration_ms)) as avg_duration_ms,
  ROUND(AVG(duration_ms) / 1000.0, 2) as avg_duration_seconds,
  ROUND(AVG(total_records)) as avg_records_per_import
FROM import_logs
WHERE status = 'completed'
  AND duration_ms IS NOT NULL
GROUP BY module_type;
```

#### Recent Failed Imports with Errors

```sql
SELECT 
  id,
  username,
  module_type,
  filename,
  start_time,
  failed_records,
  error_details
FROM import_logs
WHERE status = 'failed'
  OR failed_records > 0
ORDER BY start_time DESC
LIMIT 20;
```

#### Category Breakdown for Inventory Imports

```sql
SELECT 
  filename,
  start_time,
  successful_records,
  category_breakdown->>'Services' as services_count,
  category_breakdown->>'Medicines' as medicines_count,
  category_breakdown->>'Medical_Supplies' as supplies_count
FROM import_logs
WHERE module_type = 'inventory'
  AND status = 'completed'
ORDER BY start_time DESC
LIMIT 20;
```

#### Lab Test Category Distribution

```sql
SELECT 
  category_breakdown->>'Hematology' as hematology,
  category_breakdown->>'Clinical_Chemistry' as chemistry,
  category_breakdown->>'Serology' as serology,
  category_breakdown->>'Microbiology' as microbiology,
  SUM(successful_records) as total_tests
FROM import_logs
WHERE module_type = 'lab_test'
  AND status = 'completed'
GROUP BY category_breakdown;
```

## Security and Access Control

### Row Level Security (RLS)

The `import_logs` table has RLS enabled with the following policies:

1. **View Logs**: Only admin and staff users can view import logs
2. **Insert Logs**: Only admin and staff users can create import logs
3. **Update Logs**: Only admin and staff users can update import logs

### User Tracking

- User ID is stored as a foreign key to `auth.users`
- Username is stored as text and preserved even if the user is deleted
- This ensures audit trail integrity even after user account deletion

## Error Logging

### Error Details Structure

Errors are stored in the `error_details` JSONB column as an array of error objects:

```json
[
  {
    "row": 5,
    "data": {
      "patient_name": "John Doe",
      "age_sex": "invalid",
      "doctor_name": "Dr. Smith"
    },
    "error": "Invalid Age/Sex format: invalid. Expected format: \"25/M\" or \"30/F\"",
    "stack": "Error: Invalid Age/Sex format...\n    at parseAgeSex...",
    "timestamp": "2024-01-15T10:30:45.123Z"
  },
  {
    "row": 12,
    "data": {
      "patient_name": "Jane Smith",
      "doctor_name": "Dr. Unknown"
    },
    "error": "Doctor not found: Dr. Unknown",
    "timestamp": "2024-01-15T10:30:46.456Z"
  }
]
```

### Querying Specific Errors

```sql
-- Find imports with specific error types
SELECT 
  id,
  username,
  filename,
  start_time,
  failed_records,
  jsonb_array_length(error_details) as error_count
FROM import_logs
WHERE error_details::text LIKE '%Doctor not found%'
ORDER BY start_time DESC;

-- Extract all error messages from an import
SELECT 
  id,
  filename,
  jsonb_array_elements(error_details)->>'row' as error_row,
  jsonb_array_elements(error_details)->>'error' as error_message
FROM import_logs
WHERE id = 'your-import-log-id';
```

## Performance Considerations

### Indexes

The following indexes are created for efficient querying:

- `idx_import_logs_user_id`: Fast user-based filtering
- `idx_import_logs_module_type`: Fast module-based filtering
- `idx_import_logs_created_at`: Fast time-based sorting
- `idx_import_logs_status`: Fast status-based filtering
- `idx_import_logs_start_time`: Fast time-range queries

### Data Retention

Consider implementing a data retention policy:

```sql
-- Delete logs older than 1 year
DELETE FROM import_logs
WHERE created_at < NOW() - INTERVAL '1 year';

-- Or archive old logs to a separate table
CREATE TABLE import_logs_archive AS
SELECT * FROM import_logs
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM import_logs
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Troubleshooting

### Logging Not Working

1. **Check table exists**:
   ```sql
   SELECT * FROM import_logs LIMIT 1;
   ```

2. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'import_logs';
   ```

3. **Check user permissions**:
   ```sql
   SELECT * FROM user_profiles WHERE id = auth.uid();
   ```

4. **Check console for errors**:
   - Open browser DevTools
   - Look for errors related to `auditLogger` or `import_logs`

### Missing Error Details

If error details are not being logged:

1. Check that errors have stack traces
2. Verify `logError()` is being called in catch blocks
3. Check console for logging errors

### Performance Issues

If queries are slow:

1. Check indexes are created:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'import_logs';
   ```

2. Analyze query performance:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM import_logs
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC
   LIMIT 50;
   ```

3. Consider archiving old logs

## Compliance and Reporting

### Audit Trail Requirements

The audit logging system satisfies common compliance requirements:

- **Who**: User ID and username tracked
- **What**: Module type, filename, record counts tracked
- **When**: Start time, end time, duration tracked
- **Result**: Status, success/failure counts tracked
- **Details**: Full error details with stack traces

### Export Audit Logs

```javascript
// Export logs to CSV for compliance reporting
import { getImportLogs } from '../../utils/import/auditLogger';
import { exportToCSV } from '../../utils/import/csvPrettyPrinter';

const logs = await getImportLogs({ limit: 1000 });
const csv = exportToCSV(logs);
// Download or save CSV file
```

## Requirements Satisfied

This audit logging system satisfies the following requirements:

- **Requirement 7.7**: Transaction operations logged for audit purposes
- **Requirement 19.1**: Log start time, end time, duration
- **Requirement 19.2**: Log user ID and username
- **Requirement 19.3**: Log record counts (processed, succeeded, failed)
- **Requirement 19.4**: Log import module type
- **Requirement 19.5**: Log source filename
- **Requirement 19.6**: Store logs in queryable format
- **Requirement 19.7**: Log detailed error information with stack traces
- **Requirement 16.7**: Log detailed error information for developer troubleshooting

## Future Enhancements

Potential improvements to the audit logging system:

1. **Real-time Monitoring Dashboard**
   - Display active imports
   - Show success/failure rates
   - Alert on high failure rates

2. **Automated Alerts**
   - Email notifications for failed imports
   - Slack/Teams integration
   - Threshold-based alerts

3. **Advanced Analytics**
   - Import trends over time
   - User activity patterns
   - Error pattern analysis

4. **Log Archival**
   - Automatic archival of old logs
   - Compressed storage
   - Long-term retention

5. **Export Functionality**
   - Export logs to external systems
   - Integration with SIEM tools
   - Compliance report generation
