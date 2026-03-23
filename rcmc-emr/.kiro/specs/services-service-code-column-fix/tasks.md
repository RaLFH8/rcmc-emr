# Implementation Tasks

## Tasks

- [x] 1. Write bug condition exploration property test
  - [x] 1.1 Create a test file that calls `getServicesByCodePrefix` and `getServiceByCode` with valid inputs and asserts no 42703 error is returned
  - [x] 1.2 Run the test on unfixed code to confirm the bug condition (expected: test fails with 42703 error)

- [x] 2. Fix `getServicesByCodePrefix` in `src/lib/supabase.js`
  - [x] 2.1 Replace `.select('service_code').like('service_code', ...)` with `.select('code').like('code', ...)`
  - [x] 2.2 Replace `.order('service_code', ...)` with `.order('code', ...)`

- [x] 3. Fix `getServiceByCode` in `src/lib/supabase.js`
  - [x] 3.1 Replace `.eq('service_code', code)` with `.eq('code', code)`

- [x] 4. Fix CSV template header in `src/components/services/ServicesCSVImportModal.jsx`
  - [x] 4.1 In `TEMPLATE_ROWS`, replace the `service_code` column header with `code`
  - [x] 4.2 In `handleImport`, replace `row.service_code?.trim()` with `row.code?.trim()`

- [x] 5. Fix CSV template header in `src/pages/Services.jsx`
  - [x] 5.1 In `SERVICES_TEMPLATE_ROWS`, replace the `service_code` column header with `code`

- [x] 6. Write fix verification and preservation tests
  - [x] 6.1 Verify `getServicesByCodePrefix` succeeds after fix
  - [x] 6.2 Verify `getServiceByCode` succeeds after fix
  - [x] 6.3 Verify `getServices` (load all) behavior is unchanged
  - [x] 6.4 Verify `updateService` behavior is unchanged
  - [x] 6.5 Verify `deleteService` behavior is unchanged
