# Implementation Plan: PhilHealth YAKAP Phase 1

## Overview

Additive integration of the PhilHealth YAKAP capitation module into the existing RCMC EMR. New tables, services, pages, and badge components are added without modifying existing data structures. Existing pages receive minimal, non-breaking additions.

## Tasks

- [ ] 1. Database migrations
  - [ ] 1.1 Create new YAKAP tables with indexes
    - Create `yakap_empanelment`, `yakap_fpe_records`, `yakap_submission_log`, `gamot_formulary`, and `laboratoryo_packages` tables with all columns, constraints, and indexes as defined in the design
    - Place SQL in `rcmc-emr/.kiro/specs/philhealth-yakap-phase1/migrations/01-create-yakap-tables.sql`
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.2_

  - [ ] 1.2 Add additive columns to existing tables
    - Add `yakap_enrolled`, `yakap_empanelment_id` to `patients`
    - Add `icd10_code`, `icd10_description` to `consultations`
    - Add `gamot_covered` to `prescriptions`
    - Add `laboratoryo_covered` to `lab_results`
    - Place SQL in `rcmc-emr/.kiro/specs/philhealth-yakap-phase1/migrations/02-alter-existing-tables.sql`
    - _Requirements: 1.1, 2.1, 2.2, 4.1_

  - [ ] 1.3 Apply RLS policies
    - Enable RLS and create read/write policies for all five new tables following the pattern in the design
    - Place SQL in `rcmc-emr/.kiro/specs/philhealth-yakap-phase1/migrations/03-rls-policies.sql`
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.2_

  - [ ] 1.4 Seed GAMOT formulary and LABORATORYO packages
    - Insert all 75 GAMOT medicines and 13 LABORATORYO tests as defined in the design seed data section
    - Place SQL in `rcmc-emr/.kiro/specs/philhealth-yakap-phase1/migrations/04-seed-formulary.sql`
    - _Requirements: 2.1, 2.2_

- [ ] 2. Service layer
  - [ ] 2.1 Implement `src/services/yakapService.js`
    - Implement all functions: `empanelPatient`, `getEmpanelments`, `getEmpanelmentByPatient`, `saveFPE`, `getFPEByEmpanelment`, `logSubmission`, `updateSubmissionStatus`, `getSubmissions`, `getYakapStats`
    - `empanelPatient` must catch Postgres error `23505` and re-throw as `Error('Patient is already enrolled in YAKAP')`
    - `saveFPE` must validate required fields client-side before insert and throw `Error('FPE incomplete: missing [field list]')` on failure
    - `logSubmission` must auto-generate `reference_number` in format `YAKAP-{YYYY}-{6-digit-seq}`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2_

  - [ ]* 2.2 Write property test for empanelment uniqueness invariant
    - **Property 1: Empanelment uniqueness invariant**
    - **Validates: Requirements 1.2**
    - Use fast-check; empanel same patientId twice, assert second call rejects and count remains 1

  - [ ]* 2.3 Write property test for empanelment record completeness
    - **Property 2: Empanelment record completeness**
    - **Validates: Requirements 1.1**
    - Assert returned record has non-null `empanelment_date`, `doctor_id`, `patient_id`, and `status === 'Active'`

  - [ ]* 2.4 Write property test for FPE round-trip integrity
    - **Property 3: FPE round-trip integrity**
    - **Validates: Requirements 1.4**
    - Save a complete FPE, fetch it back, assert `patient_id` and `empanelment_id` match exactly

  - [ ]* 2.5 Write property test for FPE validation rejecting incomplete records
    - **Property 4: FPE validation rejects incomplete records**
    - **Validates: Requirements 1.3**
    - Generate arbitrary FPE objects missing one or more required fields; assert `saveFPE` throws

  - [ ]* 2.6 Write property test for submission log completeness
    - **Property 5: Submission log completeness**
    - **Validates: Requirements 1.5**
    - Assert `logSubmission` returns record with non-null `submission_type`, `submission_date`, `status`, `reference_number`

  - [ ] 2.7 Implement `src/services/formularyService.js`
    - Implement `isInGamot`, `isInLaboratoryo`, `getGamotFormulary`, `getLaboratoryoPackages`, `preloadFormularyCaches`
    - Module-level cache: load full list once on first call; subsequent calls are Set lookups (O(1))
    - `isInGamot` / `isInLaboratoryo` must return `false` gracefully if DB query fails (fail-open)
    - _Requirements: 2.1, 2.2_

  - [ ]* 2.8 Write property test for coverage lookup correctness
    - **Property 6: Coverage lookup correctness**
    - **Validates: Requirements 2.1, 2.2**
    - For names in DB assert `true`; for names not in DB assert `false`; test both `isInGamot` and `isInLaboratoryo`

  - [ ]* 2.9 Write property test for submission status update round-trip
    - **Property 8: Submission status update round-trip**
    - **Validates: Requirements 3.2**
    - For each valid status value, call `updateSubmissionStatus`, fetch back, assert `status` matches

  - [ ]* 2.10 Write unit tests for yakapService edge cases
    - Test `generateReferenceNumber` format (`YAKAP-YYYY-NNNNNN`)
    - Test `getYakapStats` with mocked Supabase responses (0 empanelments, 100% FPE completion, mixed states)
    - _Requirements: 1.5, 3.1_

- [ ] 3. Checkpoint — Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. YAKAP module pages
  - [ ] 4.1 Create `src/pages/Yakap/YakapDashboard.jsx`
    - Render 3 stat cards (Total Empaneled, FPE Completion %, Pending Submissions) using `yakapService.getYakapStats()`
    - Render recent activity list
    - _Requirements: 3.1_

  - [ ] 4.2 Create `src/pages/Yakap/EmpanelmentList.jsx`
    - Searchable table of empanelments with patient name / patient number filter and status filter dropdown
    - "Add to YAKAP" modal calling `yakapService.empanelPatient()`
    - Show toast via `NotificationContext` on success or duplicate error
    - _Requirements: 1.1, 1.2_

  - [ ] 4.3 Create `src/pages/Yakap/FPEForm.jsx`
    - Multi-section form: Vitals | Medical History | Risk Factors | Chronic Conditions
    - `validateSection(section)` returns array of missing field names
    - Submit calls `yakapService.saveFPE()`; show validation errors inline
    - _Requirements: 1.3, 1.4_

  - [ ] 4.4 Create `src/pages/Yakap/SubmissionTracker.jsx`
    - Table of submissions with type and status filter dropdowns
    - Status badge per row; inline status update calling `yakapService.updateSubmissionStatus()`
    - _Requirements: 1.5, 3.2_

  - [ ] 4.5 Create `src/pages/Yakap/GamotFormulary.jsx`
    - Searchable table of 75 medicines with category filter
    - Uses `formularyService.getGamotFormulary(filters)`
    - _Requirements: 2.1_

  - [ ] 4.6 Create `src/pages/Yakap/LaboratoryoPackages.jsx`
    - Table of 13 lab tests with test code, category, and description columns
    - Uses `formularyService.getLaboratoryoPackages()`
    - _Requirements: 2.2_

- [ ] 5. Badge and indicator components
  - [ ] 5.1 Create `src/components/yakap/YakapBadge.jsx`
    - Accepts `patientId` prop; calls `yakapService.getEmpanelmentByPatient(patientId)` on mount
    - Renders teal "YAKAP" pill badge if enrolled; renders nothing if not enrolled or on error
    - _Requirements: 1.2_

  - [ ] 5.2 Create `src/components/yakap/GamotCoverageIndicator.jsx`
    - Accepts `medicineName` prop; calls `formularyService.isInGamot(medicineName)`
    - Renders green "GAMOT ✓" badge if covered; renders nothing otherwise
    - _Requirements: 2.1_

  - [ ] 5.3 Create `src/components/yakap/LaboratoryoCoverageIndicator.jsx`
    - Accepts `testName` prop; calls `formularyService.isInLaboratoryo(testName)`
    - Renders green "LABORATORYO ✓" badge if covered; renders nothing otherwise
    - _Requirements: 2.2_

- [ ] 6. Integration into existing pages
  - [ ] 6.1 Update `src/components/Sidebar.jsx`
    - Add "PhilHealth YAKAP" collapsible section with 6 sub-nav items: Dashboard, Empanelment, FPE Form, Submission Tracker, GAMOT Formulary, LABORATORYO Packages
    - Follow existing sidebar nav item pattern
    - _Requirements: 3.1_

  - [ ] 6.2 Update `src/App.jsx`
    - Add `React.lazy()` imports for all 6 new YAKAP pages
    - Add route/switch cases for each page consistent with existing routing pattern
    - Call `formularyService.preloadFormularyCaches()` on YAKAP module mount
    - _Requirements: 2.1, 2.2, 3.1_

  - [ ] 6.3 Update `src/pages/Patients.jsx`
    - Render `<YakapBadge patientId={patient.id} />` in each patient row
    - Import is additive; no existing logic changes
    - _Requirements: 1.2_

  - [ ] 6.4 Update `src/pages/Prescriptions.jsx`
    - Render `<GamotCoverageIndicator medicineName={med.name} />` next to each medication item
    - Import is additive; no existing logic changes
    - _Requirements: 2.1_

  - [ ] 6.5 Update `src/pages/LabResults.jsx`
    - Render `<LaboratoryoCoverageIndicator testName={result.test_name} />` in each result row
    - Import is additive; no existing logic changes
    - _Requirements: 2.2_

- [ ] 7. ICD-10 field on consultations
  - [ ] 7.1 Add ICD-10 code input to the consultation form
    - Add a text input (or searchable dropdown) for `icd10_code` and `icd10_description` in the existing consultation form/modal
    - Wire to the `icd10_code` and `icd10_description` columns added in migration 1.2
    - Fields are optional (nullable) — no existing consultation workflow is broken
    - _Requirements: 4.1_

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All migrations are additive (IF NOT EXISTS / nullable columns) — safe to run on the live database
- Property tests require `fast-check`: run `npm install --save-dev fast-check` in `rcmc-emr/`
- Formulary cache is module-level; it resets on page reload — no explicit invalidation needed in Phase 1
- All YAKAP pages use `React.lazy()` consistent with the existing `App.jsx` pattern
