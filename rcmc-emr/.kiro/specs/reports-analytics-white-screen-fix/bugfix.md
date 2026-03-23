# Bugfix Requirements Document

## Introduction

The Reports module's Analytics Dashboard displays a white screen instead of showing analytics data when users navigate to it. This critical bug prevents users from accessing important healthcare analytics including KPI metrics, patient distribution, revenue trends, and performance comparisons. The root cause has been identified as multiple data formatting and database schema issues in the analytics service layer.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the `formatDatePH()` function processes date strings THEN the system produces invalid dates like "2026-27-02" (month 27 doesn't exist) causing "date/time field value out of range" errors

1.2 WHEN Date objects with timezone strings like "Sun Mar 01 2026 00:00:00 GMT+0800 (Taiwan Standard Time)" are passed to Supabase queries THEN the system throws error "time zone 'gmt+0800' not recognized"

1.3 WHEN analytics queries attempt to access `satisfaction_ratings.overall_rating` column THEN the system throws error "column satisfaction_ratings.overall_rating does not exist"

1.4 WHEN analytics queries attempt to access `consultations.outcome` column THEN the system throws error "column consultations.outcome does not exist"

1.5 WHEN any of the above errors occur THEN the system displays a white screen with no content and multiple 400 Bad Request errors in the browser console

### Expected Behavior (Correct)

2.1 WHEN the `formatDatePH()` function processes date strings THEN the system SHALL produce valid ISO 8601 date strings in YYYY-MM-DD format without timezone information

2.2 WHEN date ranges are passed to Supabase queries THEN the system SHALL convert Date objects to YYYY-MM-DD format strings before sending to the database

2.3 WHEN analytics queries need satisfaction rating data THEN the system SHALL use existing column names or gracefully handle missing columns without crashing

2.4 WHEN analytics queries need consultation outcome data THEN the system SHALL use existing column names or gracefully handle missing columns without crashing

2.5 WHEN all data formatting is correct THEN the system SHALL display the Analytics Dashboard with KPI metrics, Patient Distribution chart, Revenue Trend chart, Expense Breakdown chart, and Performance Comparison chart

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Analytics Dashboard receives valid date ranges THEN the system SHALL CONTINUE TO filter data correctly based on the selected time period

3.2 WHEN analytics data is successfully fetched THEN the system SHALL CONTINUE TO display charts and metrics with proper formatting and styling

3.3 WHEN users interact with other tabs in the Reports module THEN the system SHALL CONTINUE TO function normally without being affected by Analytics Dashboard fixes

3.4 WHEN the system processes dates in other modules (Appointments, Consultations, etc.) THEN the system SHALL CONTINUE TO handle dates correctly without being affected by analytics date formatting changes
