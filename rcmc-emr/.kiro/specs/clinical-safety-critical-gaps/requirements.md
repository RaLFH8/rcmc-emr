# Requirements Document: Clinical Safety Critical Gaps

## Introduction

This document specifies requirements for implementing 5 critical clinical safety features in the RCMC EMR system to achieve 95%+ clinical readiness. These features address legal compliance (Data Privacy Act, DOH requirements), patient safety risks, and data integrity concerns. Implementation will increase clinical readiness from 82% to 95%+, making the system deployment-ready for clinical use.

**Current System Status:**
- Overall Readiness: 87/100 (92% deployment ready, 82% clinically ready)
- Stack: React 18 + Vite + Supabase (PostgreSQL) + Tailwind CSS
- Database Capacity: 36.76 MB used (7.35% of 500 MB free tier)
- Projected Capacity Year 1: ~70 MB (14% of free tier) - sufficient headroom

**Target Outcome:** 95%+ clinical readiness within 2-3 weeks

## Glossary

- **Audit_Trail_System**: Comprehensive logging system that records all patient data modifications with user identity, timestamp, and change details
- **Backup_System**: Automated daily backup mechanism with disaster recovery capabilities
- **Consent_Management_System**: Digital consent tracking system with electronic signature capture
- **Clinical_Decision_Support_System** (CDSS): Safety alert system that checks for drug interactions, allergies, and critical lab values
- **Emergency_Access_Override**: "Break glass" mechanism allowing emergency access to patient records with audit trail
- **Data_Privacy_Act**: Philippine data protection law requiring consent tracking and audit trails
- **DOH**: Department of Health (Philippines) - regulatory authority for healthcare facilities
- **RLS**: Row Level Security - PostgreSQL security feature for data access control
- **Patient_Data**: Any information in patients, consultations, prescriptions, lab_results, billing, or medical history tables
- **Authorized_User**: User with valid credentials and appropriate role (doctor, nurse, admin, billing_staff)
- **Emergency_User**: Healthcare provider accessing records via Emergency_Access_Override
- **Audit_Log**: Immutable record of data modification containing user_id, timestamp, table_name, record_id, action, old_value, new_value
- **Backup_Job**: Automated process that creates database snapshots and stores them securely
- **Consent_Record**: Digital record of patient consent with signature, timestamp, and consent type
- **Safety_Alert**: Real-time notification of potential clinical risks (drug interactions, allergies, critical values)
- **Drug_Interaction**: Potentially harmful combination of medications
- **Critical_Lab_Value**: Laboratory result outside safe ranges requiring immediate attention
- **Break_Glass_Event**: Emergency access override with mandatory justification and audit trail

## Requirements

### Requirement 1: Audit Trail System

**User Story:** As a compliance officer, I want comprehensive audit logs of all patient data modifications, so that I can demonstrate Data Privacy Act compliance and investigate security incidents.

**Business Impact:** Missing 4% of clinical readiness. Legal/compliance risk. Required by Data Privacy Act (Philippines).

**Estimated Implementation:** 3 days

#### Acceptance Criteria

1. WHEN an Authorized_User creates, updates, or deletes Patient_Data, THE Audit_Trail_System SHALL record an Audit_Log entry containing user_id, timestamp, table_name, record_id, action type, old_value, and new_value

2. WHEN an Authorized_User queries Patient_Data (SELECT operations), THE Audit_Trail_System SHALL record an Audit_Log entry containing user_id, timestamp, table_name, record_id, and query_type

3. THE Audit_Trail_System SHALL store Audit_Log entries in an immutable audit_logs table that prevents updates and deletes

4. WHEN an Audit_Log entry is created, THE Audit_Trail_System SHALL complete the write operation within 100ms to avoid impacting user experience

5. THE Audit_Trail_System SHALL capture audit logs for all tables containing Patient_Data: patients, consultations, prescriptions, lab_results, billing, medical_history, appointments, inpatients

6. WHEN an administrator queries audit logs, THE Audit_Trail_System SHALL support filtering by user_id, date_range, table_name, record_id, and action_type

7. THE Audit_Trail_System SHALL retain Audit_Log entries for a minimum of 7 years to comply with Data Privacy Act requirements

8. WHEN the audit_logs table reaches 80% of allocated storage, THE Audit_Trail_System SHALL generate an alert to administrators

9. FOR ALL Audit_Log entries, the timestamp SHALL be stored in UTC with timezone information preserved

10. THE Audit_Trail_System SHALL use PostgreSQL triggers to ensure audit logging cannot be bypassed by direct database access

### Requirement 2: Automated Backup System

**User Story:** As a system administrator, I want automated daily backups with disaster recovery capabilities, so that patient data is protected against database corruption, hardware failure, or accidental deletion.

**Business Impact:** Missing 3% of clinical readiness. Data loss risk. One database corruption event could lose all patient data.

**Estimated Implementation:** 1 day

#### Acceptance Criteria

1. THE Backup_System SHALL execute a full database backup automatically every day at 2:00 AM Philippine Time

2. WHEN a Backup_Job completes successfully, THE Backup_System SHALL store the backup file with timestamp in filename format: `rcmc_emr_backup_YYYY-MM-DD_HH-MM-SS.sql`

3. THE Backup_System SHALL retain daily backups for 30 days, weekly backups for 90 days, and monthly backups for 1 year

4. WHEN a Backup_Job fails, THE Backup_System SHALL send an alert notification to administrators within 5 minutes

5. THE Backup_System SHALL verify backup integrity by performing a test restore to a temporary database once per week

6. WHEN a backup file is created, THE Backup_System SHALL compress it using gzip to reduce storage consumption

7. THE Backup_System SHALL store backups in a separate storage location from the primary database (Supabase Storage or external service)

8. THE Backup_System SHALL include a documented disaster recovery procedure that allows full system restoration within 4 hours

9. WHEN an administrator initiates a manual backup, THE Backup_System SHALL execute the backup immediately and confirm completion

10. THE Backup_System SHALL log all backup operations (start time, end time, file size, status) to a backup_logs table

11. THE Backup_System SHALL encrypt backup files at rest using AES-256 encryption

12. FOR ALL backup operations, the system SHALL ensure database consistency by using PostgreSQL's pg_dump with transaction snapshot isolation

### Requirement 3: Patient Consent Management

**User Story:** As a healthcare provider, I want to capture and track patient consent digitally with electronic signatures, so that I comply with Data Privacy Act requirements and have legal documentation of patient authorization.

**Business Impact:** Missing 4% of clinical readiness. Legal/HIPAA-equivalent risk. Required by Data Privacy Act.

**Estimated Implementation:** 3 days

#### Acceptance Criteria

1. WHEN a new patient is registered, THE Consent_Management_System SHALL present a consent form covering data collection, storage, and sharing

2. THE Consent_Management_System SHALL support multiple consent types: general_treatment, data_sharing, research_participation, emergency_contact

3. WHEN a patient provides consent, THE Consent_Management_System SHALL capture an electronic signature using touch/mouse input

4. THE Consent_Management_System SHALL store each Consent_Record with patient_id, consent_type, signature_data, timestamp, witness_user_id, and consent_status

5. WHEN a patient withdraws consent, THE Consent_Management_System SHALL update the consent_status to "withdrawn" and record the withdrawal timestamp

6. THE Consent_Management_System SHALL prevent access to Patient_Data if required consent is missing or withdrawn, except for Emergency_Access_Override scenarios

7. WHEN a healthcare provider accesses patient records, THE Consent_Management_System SHALL display current consent status prominently in the UI

8. THE Consent_Management_System SHALL generate a printable PDF consent form with signature, timestamp, and witness information

9. WHEN consent is captured, THE Consent_Management_System SHALL create an Audit_Log entry recording the consent event

10. THE Consent_Management_System SHALL support consent renewal with configurable expiration periods (default: 1 year)

11. WHEN consent expires within 30 days, THE Consent_Management_System SHALL display a warning notification to staff

12. THE Consent_Management_System SHALL store signature data as base64-encoded PNG images with maximum file size of 50KB

13. FOR ALL consent forms, the text SHALL be available in English and Filipino languages

### Requirement 4: Clinical Decision Support System

**User Story:** As a physician, I want real-time safety alerts for drug interactions, allergies, and critical lab values, so that I can prevent medication errors and respond quickly to dangerous clinical situations.

**Business Impact:** Missing 5% of clinical readiness. Patient safety risk. Could result in patient harm or death.

**Estimated Implementation:** 5-7 days

#### Acceptance Criteria

1. WHEN a physician prescribes a medication, THE Clinical_Decision_Support_System SHALL check for Drug_Interaction with the patient's current medications within 500ms

2. WHEN a Drug_Interaction is detected, THE Clinical_Decision_Support_System SHALL display a Safety_Alert with severity level (critical, moderate, minor), interaction description, and clinical recommendation

3. THE Clinical_Decision_Support_System SHALL prevent prescription submission if a critical Drug_Interaction is detected unless the physician provides override justification

4. WHEN a physician prescribes a medication, THE Clinical_Decision_Support_System SHALL check the patient's allergy history and display a Safety_Alert if the medication contains a known allergen

5. THE Clinical_Decision_Support_System SHALL block prescription submission if an allergy match is detected, requiring physician acknowledgment and override justification

6. WHEN a lab result is entered with a Critical_Lab_Value, THE Clinical_Decision_Support_System SHALL generate an immediate Safety_Alert visible to all authorized providers

7. THE Clinical_Decision_Support_System SHALL define Critical_Lab_Value thresholds for common tests: glucose (<60 or >400 mg/dL), potassium (<3.0 or >6.0 mEq/L), creatinine (>3.0 mg/dL), hemoglobin (<7.0 g/dL)

8. WHEN a Safety_Alert is displayed, THE Clinical_Decision_Support_System SHALL require physician acknowledgment before proceeding

9. THE Clinical_Decision_Support_System SHALL log all Safety_Alert events to the Audit_Trail_System including alert_type, severity, physician_response, and override_justification

10. THE Clinical_Decision_Support_System SHALL maintain a drug interaction database with minimum 500 common medication combinations

11. WHEN a physician overrides a Safety_Alert, THE Clinical_Decision_Support_System SHALL require a text justification of minimum 20 characters

12. THE Clinical_Decision_Support_System SHALL display active Safety_Alert count in the top navigation bar for real-time awareness

13. WHEN multiple Safety_Alerts exist for a patient, THE Clinical_Decision_Support_System SHALL prioritize display by severity: critical first, then moderate, then minor

14. THE Clinical_Decision_Support_System SHALL support manual addition of custom drug interactions and allergy entries by administrators

15. FOR ALL Drug_Interaction checks, the system SHALL use both generic and brand names to ensure comprehensive matching

### Requirement 5: Emergency Access Override

**User Story:** As an emergency room physician, I want to access patient records immediately during life-threatening emergencies even without regular authorization, so that I can provide timely critical care while maintaining an audit trail of the access.

**Business Impact:** Missing 2% of clinical readiness. Patient safety risk. ER doctors cannot access records if regular doctor unavailable.

**Estimated Implementation:** 1-2 days

#### Acceptance Criteria

1. WHEN an Emergency_User clicks "Emergency Access" on a patient record, THE Emergency_Access_Override SHALL display a Break_Glass_Event dialog requiring justification

2. THE Emergency_Access_Override SHALL require a text justification of minimum 30 characters describing the emergency situation

3. WHEN an Emergency_User provides justification, THE Emergency_Access_Override SHALL grant immediate read and write access to all Patient_Data for that patient

4. THE Emergency_Access_Override SHALL create an Audit_Log entry recording the Break_Glass_Event with user_id, patient_id, timestamp, justification, and access_duration

5. THE Emergency_Access_Override SHALL send a real-time notification to the patient's primary physician and system administrators when activated

6. WHEN Emergency_Access_Override is activated, THE system SHALL display a prominent red banner indicating "EMERGENCY ACCESS MODE" on all patient screens

7. THE Emergency_Access_Override SHALL automatically expire after 24 hours, requiring re-justification for continued access

8. WHEN Emergency_Access_Override expires, THE system SHALL revoke access and create an Audit_Log entry recording the expiration

9. THE Emergency_Access_Override SHALL be available to users with roles: doctor, nurse, emergency_staff

10. THE Emergency_Access_Override SHALL bypass consent requirements and RLS policies while maintaining audit trail

11. WHEN an administrator reviews Break_Glass_Events, THE Emergency_Access_Override SHALL provide a dashboard showing all emergency access events with filtering by date, user, and patient

12. THE Emergency_Access_Override SHALL limit each Emergency_User to a maximum of 5 concurrent emergency access sessions

13. FOR ALL Break_Glass_Events, the system SHALL generate a compliance report exportable to PDF for regulatory review

## Cross-Cutting Requirements

### Requirement 6: Performance and Scalability

**User Story:** As a system user, I want all safety features to operate without degrading system performance, so that clinical workflows remain efficient.

#### Acceptance Criteria

1. THE system SHALL ensure all safety checks (audit logging, consent verification, CDSS alerts) complete within 500ms for 95% of operations

2. WHEN database size reaches 70 MB (Year 1 projection), THE system SHALL maintain current performance levels

3. THE system SHALL support concurrent access by 50 users without performance degradation

4. THE system SHALL use database indexes on audit_logs (user_id, timestamp, table_name), consent_records (patient_id, consent_type), and drug_interactions (medication_name) tables

### Requirement 7: Data Privacy and Security

**User Story:** As a data protection officer, I want all safety features to enhance rather than compromise data security, so that patient privacy is protected.

#### Acceptance Criteria

1. THE system SHALL encrypt all sensitive data fields (signatures, justifications, audit logs) at rest using AES-256

2. THE system SHALL use RLS policies to ensure users can only access audit logs for their own actions or patients they are authorized to view

3. THE system SHALL mask sensitive data in audit logs when displayed to non-administrator users

4. THE system SHALL implement rate limiting on Emergency_Access_Override to prevent abuse (maximum 10 activations per user per day)

### Requirement 8: User Interface and Experience

**User Story:** As a healthcare provider, I want safety features integrated seamlessly into existing workflows, so that compliance doesn't slow down patient care.

#### Acceptance Criteria

1. THE system SHALL display Safety_Alerts as modal dialogs that require acknowledgment but don't block background work

2. THE system SHALL use color coding for alert severity: red for critical, yellow for moderate, blue for informational

3. THE system SHALL provide a "Safety Dashboard" page showing active alerts, recent Break_Glass_Events, and consent status summary

4. THE system SHALL display consent status icons next to patient names in all patient lists

### Requirement 9: Reporting and Compliance

**User Story:** As a compliance officer, I want comprehensive reports on all safety features, so that I can demonstrate regulatory compliance during audits.

#### Acceptance Criteria

1. THE system SHALL generate monthly compliance reports including: audit log summary, backup success rate, consent coverage percentage, CDSS alert statistics, and Break_Glass_Event count

2. THE system SHALL export all reports to PDF and CSV formats

3. THE system SHALL provide a compliance dashboard with real-time metrics for all 5 safety features

### Requirement 10: Testing and Validation

**User Story:** As a quality assurance engineer, I want comprehensive test coverage for all safety features, so that I can verify correct operation before clinical deployment.

#### Acceptance Criteria

1. THE system SHALL include automated tests for audit trail creation, backup execution, consent capture, CDSS alert triggering, and emergency access override

2. THE system SHALL include a test mode that simulates emergency scenarios without affecting production data

3. THE system SHALL provide a validation checklist confirming all Data Privacy Act and DOH requirements are met

## Implementation Notes

**Database Capacity Validation:**
- Current: 36.76 MB (7.35% of 500 MB)
- Projected Year 1 with all features: ~70 MB (14% of 500 MB)
- Headroom: 430 MB (86% available)
- Conclusion: Supabase free tier is sufficient

**Technology Stack:**
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Deployment: Cloudflare Pages
- Security: RLS policies, role-based access control

**Implementation Priority:**
1. Audit Trail System (3 days) - Foundation for other features
2. Automated Backups (1 day) - Protect data immediately
3. Emergency Access Override (1-2 days) - Critical safety feature
4. Patient Consent Management (3 days) - Legal compliance
5. Clinical Decision Support (5-7 days) - Most complex, highest patient safety impact

**Total Timeline:** 13-16 days (2-3 weeks)

## Success Metrics

- Clinical Readiness: Increase from 82% to 95%+
- Audit Coverage: 100% of patient data modifications logged
- Backup Success Rate: 99%+ daily backup completion
- Consent Coverage: 100% of patients with valid consent
- CDSS Alert Response Time: <500ms for 95% of checks
- Emergency Access Audit: 100% of Break_Glass_Events logged
- Zero data loss incidents
- Data Privacy Act compliance: 100%
- DOH requirements: 100% met
