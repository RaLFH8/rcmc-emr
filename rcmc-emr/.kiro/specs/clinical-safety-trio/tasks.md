# Implementation Plan: Clinical Safety Trio

## Overview

This implementation plan covers three critical clinical safety features for the RCMC EMR system: Automated Backup System, Patient Consent Management, and Emergency Access Override. The implementation follows the priority order: Backups → Emergency Access → Consent Management, ensuring data protection is established first, followed by emergency care capabilities, and finally legal compliance features.

**Technology Stack:**
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Storage + Edge Functions)
- Testing: Vitest + fast-check (property-based testing)
- Libraries: react-signature-canvas, jsPDF, date-fns

**Implementation Timeline:** 5-6 days

**Key Principles:**
- Each task builds incrementally on previous work
- Testing integrated throughout (not separate phase)
- Database migrations run before UI implementation
- Property tests validate universal correctness
- All features include comprehensive audit trails

## Tasks

- [x] 1. Setup project infrastructure and dependencies
  - Install required npm packages: react-signature-canvas, jsPDF, fast-check, date-fns
  - Create directory structure: src/components/backup/, src/components/consent/, src/components/emergency/
  - Create directory structure: src/services/, src/utils/, src/tests/
  - Set up test configuration for property-based testing with fast-check
  - _Requirements: All features_

- [ ] 2. Implement Automated Backup System (Priority 1)
  - [x] 2.1 Create database schema for backup logging
    - Create backup_logs table with all required fields
    - Add indexes for status, created_at, backup_type, retention_until
    - Create trigger for automatic duration calculation
    - Add backup-related columns to audit_log table
    - _Requirements: 1.10, 4.1_

  - [x] 2.2 Implement Supabase Edge Function for backup execution
    - Create supabase/functions/backup-scheduler/index.ts
    - Implement executeBackup() orchestration function
    - Implement dumpDatabase() using pg_dump
    - Implement compressBackup() with gzip
    - Implement encryptBackup() with AES-256-CBC
    - Implement uploadToStorage() for Supabase Storage
    - Implement logBackupOperation() for audit trail
    - Implement sendFailureAlert() for admin notifications
    - Implement cleanupOldBackups() for retention policy enforcement
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.10, 1.11_

  - [ ]* 2.3 Write property tests for backup system
    - **Property 1: Backup Filename Format Consistency**
    - **Validates: Requirements 1.2**
    - **Property 2: Backup Retention Policy Calculation**
    - **Validates: Requirements 1.3**
    - **Property 3: Backup Compression Application**
    - **Validates: Requirements 1.6**
    - **Property 4: Backup Operation Logging Completeness**
    - **Validates: Requirements 1.10**
    - **Property 5: Backup File Encryption**
    - **Validates: Requirements 1.11, 6.1**

  - [ ]* 2.4 Write unit tests for backup system
    - Test backup execution with mocked pg_dump
    - Test compression with sample data
    - Test encryption with known plaintext
    - Test upload to storage with mocked Supabase client
    - Test failure notification with mocked notification service
    - Test retention policy cleanup with various backup ages
    - Test edge cases: empty database, concurrent backups
    - Test error cases: storage full, network failure, encryption key missing
    - _Requirements: 1.1-1.12_

  - [x] 2.5 Implement backup verification service
    - Create supabase/functions/backup-verifier/index.ts
    - Implement selectBackupForVerification() for weekly selection
    - Implement createTemporaryDatabase() for isolated testing
    - Implement restoreBackup() for test restore
    - Implement verifyDataIntegrity() for table/constraint checks
    - Implement cleanupTemporaryDatabase() for cleanup
    - Implement logVerificationResult() for audit trail
    - _Requirements: 1.5_

  - [x] 2.6 Create backup management UI
    - Create src/pages/BackupManagement.jsx
    - Implement backup status dashboard with success rate metrics
    - Implement backup history table with filters
    - Implement manual backup trigger button
    - Implement backup download interface (admin only)
    - Display retention policy configuration
    - Display disaster recovery documentation
    - _Requirements: 1.9_

  - [x] 2.7 Configure pg_cron scheduler for daily backups
    - Set up pg_cron extension in Supabase
    - Schedule backup function to run at 2:00 AM Philippine Time
    - Test scheduled execution
    - _Requirements: 1.1_

  - [x] 2.8 Create disaster recovery documentation
    - Document full system restoration procedure
    - Document backup verification process
    - Document manual backup procedure
    - Document retention policy details
    - Target: 4-hour recovery time
    - _Requirements: 1.8_

- [x] 3. Checkpoint - Verify backup system functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Emergency Access Override (Priority 2)
  - [x] 4.1 Create database schema for emergency access
    - Create emergency_access_logs table with all required fields
    - Add indexes for user_id, patient_id, access_granted_at, active access
    - Create trigger for access duration calculation
    - Create trigger for concurrent session limit enforcement (max 5)
    - Create function check_emergency_access() for RLS bypass
    - Add emergency access columns to audit_log table
    - _Requirements: 3.4, 3.12, 4.3_

  - [x] 4.2 Implement emergency access service
    - Create src/services/emergencyAccessService.js
    - Implement requestEmergencyAccess() with justification validation
    - Implement checkEmergencyAccess() for active session check
    - Implement revokeEmergencyAccess() for manual revocation
    - Implement getActiveEmergencyAccess() for user's active sessions
    - Implement getEmergencyAccessHistory() with filtering
    - Implement sendEmergencyNotifications() for real-time alerts
    - Implement generateComplianceReport() for PDF export
    - Implement rate limiting (max 10 requests per user per day)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 3.12, 3.13, 6.3_

  - [ ]* 4.3 Write property tests for emergency access
    - **Property 13: Emergency Access Justification Validation**
    - **Validates: Requirements 3.2**
    - **Property 14: Emergency Access Audit Log Creation**
    - **Validates: Requirements 3.4**
    - **Property 15: Emergency Access Expiration Time Calculation**
    - **Validates: Requirements 3.7**
    - **Property 16: Emergency Access Role Authorization**
    - **Validates: Requirements 3.9**
    - **Property 17: Emergency Access Concurrent Session Limit**
    - **Validates: Requirements 3.12**
    - **Property 20: Emergency Access Rate Limiting**
    - **Validates: Requirements 6.3**

  - [ ]* 4.4 Write unit tests for emergency access
    - Test emergency access dialog display
    - Test justification validation (29 chars, 30 chars, 31 chars)
    - Test access grant with valid justification
    - Test audit log creation
    - Test notification sending
    - Test access expiration after 24 hours
    - Test concurrent session limit (4, 5, 6 sessions)
    - Test rate limiting (9, 10, 11 requests)
    - Test role authorization for each role
    - Test edge cases: access expiring in 1 second, exactly 5 concurrent sessions
    - Test error cases: invalid patient ID, unauthorized role, rate limit exceeded
    - _Requirements: 3.1-3.13_

  - [x] 4.5 Create emergency access UI components
    - Create src/components/emergency/EmergencyAccessDialog.jsx
    - Implement break-glass dialog with justification input
    - Implement emergency type selector
    - Implement character counter (minimum 30 characters)
    - Implement warning message about audit trail
    - Implement confirm and cancel actions
    - _Requirements: 3.1, 3.2_

  - [x] 4.6 Create emergency access banner component
    - Create src/components/emergency/EmergencyAccessBanner.jsx
    - Implement prominent red banner display
    - Display "EMERGENCY ACCESS MODE" text
    - Display patient name and access expiration countdown
    - Implement revoke access button
    - Display audit trail indicator
    - _Requirements: 3.6_

  - [x] 4.7 Modify RLS policies for emergency access bypass
    - Update patients table RLS policy to check emergency access
    - Update consultations table RLS policy to check emergency access
    - Update prescriptions table RLS policy to check emergency access
    - Update lab_results table RLS policy to check emergency access
    - Update billing table RLS policy to check emergency access
    - Update medical_history table RLS policy to check emergency access
    - Test RLS bypass with active emergency access
    - _Requirements: 3.3, 3.10_

  - [x] 4.8 Implement emergency access expiration scheduler
    - Create Edge Function for access expiration check
    - Schedule to run every hour
    - Revoke expired access sessions
    - Log expiration events to audit trail
    - _Requirements: 3.7, 3.8_

  - [x] 4.9 Create emergency access dashboard
    - Create src/pages/EmergencyAccessDashboard.jsx
    - Display break-glass event statistics
    - Implement filterable event history table
    - Display user activity breakdown
    - Display emergency type distribution chart
    - Implement suspicious pattern alerts
    - Implement compliance report export to PDF
    - _Requirements: 3.11, 3.13, 7.1, 7.2_

  - [x] 4.10 Implement real-time notifications for emergency access
    - Integrate with existing notification system
    - Send notification to primary physician on access grant
    - Send notification to administrators on access grant
    - Include patient name, accessing user, and justification
    - _Requirements: 3.5_

- [ ] 5. Checkpoint - Verify emergency access functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Patient Consent Management (Priority 3)
  - [x] 6.1 Create database schema for consent records
    - Create consent_records table with all required fields
    - Add indexes for patient_id, consent_status, expiration_date, consent_type
    - Create unique constraint for active consents per type per patient
    - Create trigger for automatic consent expiration
    - Add consent-related columns to audit_log table
    - _Requirements: 2.4, 2.5, 4.2_

  - [x] 6.2 Implement consent service
    - Create src/services/consentService.js
    - Implement createConsent() with signature validation
    - Implement withdrawConsent() with reason capture
    - Implement checkConsentStatus() for access control
    - Implement getPatientConsents() for consent history
    - Implement renewConsent() for expiration handling
    - Implement generateConsentPDF() for document generation
    - Implement getExpiringConsents() for warning notifications
    - _Requirements: 2.1, 2.4, 2.5, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 6.3 Write property tests for consent management
    - **Property 6: Consent Record Field Completeness**
    - **Validates: Requirements 2.4**
    - **Property 7: Consent Withdrawal Status Update**
    - **Validates: Requirements 2.5**
    - **Property 8: Consent-Based Access Control**
    - **Validates: Requirements 2.6**
    - **Property 9: Consent PDF Generation Completeness**
    - **Validates: Requirements 2.8**
    - **Property 10: Consent Expiration Date Calculation**
    - **Validates: Requirements 2.9**
    - **Property 11: Consent Expiration Warning Detection**
    - **Validates: Requirements 2.10**
    - **Property 12: Signature Data Validation**
    - **Validates: Requirements 2.11**

  - [ ]* 6.4 Write unit tests for consent management
    - Test consent form rendering with sample patient data
    - Test signature capture with mock canvas data
    - Test consent creation with valid data
    - Test consent withdrawal workflow
    - Test consent validation with various consent states
    - Test PDF generation with sample consent
    - Test expiration warning detection
    - Test multi-language consent text retrieval
    - Test edge cases: signature exactly 50KB, consent expiring today, multiple consent types
    - Test error cases: invalid signature format, missing witness, duplicate consent
    - _Requirements: 2.1-2.12_

  - [x] 6.5 Create consent form UI component
    - Create src/components/consent/ConsentForm.jsx
    - Implement multi-language consent text display (English/Filipino)
    - Integrate react-signature-canvas for signature capture
    - Implement witness information capture
    - Implement consent type selector (general_treatment, data_sharing, research_participation, emergency_contact)
    - Implement clear/reset signature button
    - Implement submit and cancel actions
    - Validate signature size (max 50KB)
    - _Requirements: 2.1, 2.2, 2.3, 2.11, 2.12_

  - [x] 6.6 Create consent validation middleware
    - Create src/middleware/consentValidation.js
    - Implement validatePatientAccess() function
    - Check for active general_treatment consent
    - Verify consent not expired
    - Allow emergency override bypass
    - Log consent checks to audit trail
    - Return detailed validation result with missing consents
    - _Requirements: 2.6, 2.7_

  - [x] 6.7 Implement consent PDF generator
    - Create src/utils/consentPdfGenerator.js
    - Use jsPDF library for PDF generation
    - Include clinic header and logo
    - Include patient information
    - Include consent type and text (bilingual)
    - Include signature image
    - Include witness information
    - Include timestamp and consent ID
    - Include QR code for verification
    - _Requirements: 2.8_

  - [x] 6.8 Create consent status display components
    - Create src/components/consent/ConsentStatusBadge.jsx
    - Display current consent status prominently in patient UI
    - Show consent type indicators
    - Show expiration date
    - Show warning for expiring consents (within 30 days)
    - Show error for missing/expired consents
    - _Requirements: 2.7, 2.10_

  - [x] 6.9 Integrate consent validation into patient access workflows
    - Add consent check to patient record access
    - Add consent check to consultation creation
    - Add consent check to prescription creation
    - Add consent check to lab results access
    - Add consent check to billing operations
    - Display consent required message when access blocked
    - Provide link to consent form when consent missing
    - _Requirements: 2.6_

  - [x] 6.10 Create consent management page
    - Create src/pages/ConsentManagement.jsx
    - Display list of all patients with consent status
    - Implement consent coverage percentage metric
    - Implement filter by consent status (active, expired, withdrawn, missing)
    - Implement consent renewal workflow
    - Implement consent withdrawal workflow
    - Display expiring consents warning list
    - Implement bulk consent reminder notifications
    - _Requirements: 2.5, 2.9, 2.10, 7.4_

  - [x] 6.11 Implement consent expiration notification system
    - Create Edge Function for expiration check
    - Schedule to run daily
    - Identify consents expiring within 30 days
    - Send notifications to staff
    - Display warnings in UI
    - _Requirements: 2.10_

  - [x] 6.12 Create multi-language consent text content
    - Create consent text templates in English
    - Create consent text templates in Filipino
    - Include all consent types: general_treatment, data_sharing, research_participation, emergency_contact
    - Store in database or configuration file
    - _Requirements: 2.12_

- [x] 7. Checkpoint - Verify consent management functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement cross-cutting integration features
  - [x] 8.1 Enhance audit trail system
    - Ensure audit_log table has all required columns
    - Implement audit logging for backup operations
    - Implement audit logging for consent operations
    - Implement audit logging for emergency access operations
    - Implement audit log immutability constraints
    - Test audit trail completeness
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 8.2 Write property tests for integration features
    - **Property 18: Comprehensive Audit Trail Logging**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - **Property 19: Audit Log Immutability**
    - **Validates: Requirements 4.4**
    - **Property 21: Consent Coverage Calculation**
    - **Validates: Requirements 7.4**

  - [ ]* 8.3 Write integration tests
    - Test full backup workflow from trigger to storage
    - Test patient registration with consent capture
    - Test emergency access with consent bypass
    - Test audit trail integration across all three features
    - Test notification system integration
    - Test RLS policy interaction with emergency access
    - Test backup restoration in test environment
    - Test consent expiration job
    - Test emergency access expiration job
    - _Requirements: All features_

  - [x] 8.4 Create compliance dashboard
    - Create src/pages/ComplianceDashboard.jsx
    - Display backup success rate metric
    - Display consent coverage percentage metric
    - Display break-glass event count metric
    - Display real-time alerts for backup failures
    - Display real-time alerts for expired consents
    - Display real-time alerts for unusual emergency access patterns
    - Implement monthly compliance report export to PDF
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 8.5 Implement performance optimizations
    - Ensure backup execution during off-peak hours (2 AM)
    - Optimize consent form loading (target: <500ms)
    - Optimize emergency access grant (target: <2 seconds)
    - Optimize consent status indicators (no additional page loads)
    - Add database indexes for frequently queried fields
    - Implement caching for consent text templates
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 8.6 Implement security enhancements
    - Verify AES-256 encryption for backup files
    - Verify encryption at rest for signature data
    - Implement rate limiting for emergency access (max 10/day)
    - Verify RLS policies for consent records
    - Verify RLS policies for emergency access logs
    - Test security with penetration testing scenarios
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Create database migration scripts
  - Create rcmc-emr/.kiro/specs/clinical-safety-trio/migrations/01-create-backup-logs.sql
  - Create rcmc-emr/.kiro/specs/clinical-safety-trio/migrations/02-create-consent-records.sql
  - Create rcmc-emr/.kiro/specs/clinical-safety-trio/migrations/03-create-emergency-access-logs.sql
  - Create rcmc-emr/.kiro/specs/clinical-safety-trio/migrations/04-enhance-audit-log.sql
  - Create rcmc-emr/.kiro/specs/clinical-safety-trio/migrations/05-create-triggers-and-functions.sql
  - Create rcmc-emr/.kiro/specs/clinical-safety-trio/migrations/06-update-rls-policies.sql
  - Create rcmc-emr/.kiro/specs/clinical-safety-trio/migrations/RUN_ALL_MIGRATIONS.sql (master script)
  - _Requirements: All features_

- [ ] 10. Create user documentation
  - Create backup system user guide
  - Create consent management user guide
  - Create emergency access user guide
  - Create compliance reporting guide
  - Create disaster recovery procedure document
  - Create troubleshooting guide
  - _Requirements: 1.8_

- [ ] 11. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties (21 total properties)
- Unit tests validate specific examples and edge cases
- Implementation order prioritizes data protection (backups) first, then emergency care (emergency access), then legal compliance (consent management)
- All features integrate with existing audit trail system
- Database migrations must be run before implementing UI components
- Testing is integrated throughout implementation, not a separate phase
- All three features operate within Supabase free tier constraints (430 MB available)

## Success Criteria

- All 21 correctness properties pass property-based tests (100+ iterations each)
- All unit tests pass with 90%+ code coverage
- Backup success rate: 99%+ daily backup completion
- Backup recovery time: <4 hours for full system restoration
- Consent coverage: 100% of new patients with valid consent
- Emergency access response time: <2 seconds from justification to access
- Emergency access audit: 100% of break-glass events logged
- Zero data loss incidents
- Data Privacy Act compliance: 100%
- User satisfaction: Minimal workflow disruption
