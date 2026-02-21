# Supabase Free Tier Capacity Analysis

## Supabase Free Tier Limits
- **Database Size**: 500 MB
- **Bandwidth**: 5 GB/month
- **Storage**: 1 GB
- **Monthly Active Users**: Unlimited
- **API Requests**: Unlimited

---

## Project 1: Payroll System

### Database Tables
1. **employees** table
   - Columns: ~15 fields (id, name, email, position, department, salary, sss_salary, status, join_date, sss_number, sss, philhealth, pagibig, created_at, updated_at)
   - Estimated row size: ~500 bytes per employee
   - Expected records: 50-100 employees
   - **Storage**: 100 employees × 500 bytes = **50 KB**

### Total Payroll System Storage
- Database: **~50 KB** (0.05 MB)
- Indexes: **~10 KB**
- **Total: ~60 KB (0.06 MB)**

---

## Project 2: EMR Healthcare Dashboard

### Database Tables

1. **patients** table
   - Columns: ~18 fields (id, patient_number, first_name, middle_name, last_name, date_of_birth, gender, contact_number, email, address, emergency_contact_name, emergency_contact_number, blood_type, allergies, medical_history, created_at, updated_at, created_by)
   - Estimated row size: ~800 bytes per patient
   - Expected records: 1,000 patients/month × 12 months = 12,000 patients/year
   - **Storage**: 12,000 patients × 800 bytes = **9.6 MB/year**

2. **appointments** table
   - Columns: ~10 fields (id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, notes, created_at, updated_at)
   - Estimated row size: ~400 bytes per appointment
   - Expected records: 1,000 appointments/month × 12 months = 12,000 appointments/year
   - **Storage**: 12,000 appointments × 400 bytes = **4.8 MB/year**

3. **consultations** table
   - Columns: ~13 fields (id, patient_id, doctor_id, appointment_id, consultation_date, chief_complaint, vital_signs, diagnosis, prescription, lab_orders, follow_up_date, notes, created_at, created_by)
   - Estimated row size: ~1,200 bytes per consultation (includes JSONB for vital_signs)
   - Expected records: 800 consultations/month × 12 months = 9,600 consultations/year
   - **Storage**: 9,600 consultations × 1,200 bytes = **11.5 MB/year**

4. **doctors** table
   - Columns: ~10 fields (id, user_id, first_name, last_name, specialization, license_number, contact_number, email, status, created_at)
   - Estimated row size: ~400 bytes per doctor
   - Expected records: 20-50 doctors
   - **Storage**: 50 doctors × 400 bytes = **20 KB**

5. **billing** table
   - Columns: ~13 fields (id, patient_id, consultation_id, bill_date, items, subtotal, discount, total_amount, amount_paid, balance, payment_status, payment_method, notes, created_at, created_by)
   - Estimated row size: ~600 bytes per bill (includes JSONB for items)
   - Expected records: 800 bills/month × 12 months = 9,600 bills/year
   - **Storage**: 9,600 bills × 600 bytes = **5.8 MB/year**

6. **auth.users** (Supabase Auth)
   - Estimated row size: ~300 bytes per user
   - Expected records: 10-20 staff users
   - **Storage**: 20 users × 300 bytes = **6 KB**

### Total EMR System Storage (First Year)
- patients: **9.6 MB**
- appointments: **4.8 MB**
- consultations: **11.5 MB**
- doctors: **0.02 MB**
- billing: **5.8 MB**
- auth.users: **0.006 MB**
- Indexes: **~5 MB** (estimated 15% overhead)
- **Total: ~36.7 MB**

---

## Combined Storage Analysis

### Year 1 Total Storage
- Payroll System: **0.06 MB**
- EMR System: **36.7 MB**
- **Combined Total: 36.76 MB**

### Supabase Free Tier Capacity
- **Available**: 500 MB
- **Used**: 36.76 MB
- **Remaining**: 463.24 MB
- **Usage**: 7.35% of free tier

---

## Growth Projections

### Year 2 (Cumulative)
- Payroll: 0.06 MB (minimal growth)
- EMR: 36.7 MB × 2 = 73.4 MB
- **Total: 73.46 MB (14.7% of free tier)**

### Year 3 (Cumulative)
- Payroll: 0.06 MB
- EMR: 36.7 MB × 3 = 110.1 MB
- **Total: 110.16 MB (22% of free tier)**

### Year 5 (Cumulative)
- Payroll: 0.06 MB
- EMR: 36.7 MB × 5 = 183.5 MB
- **Total: 183.56 MB (36.7% of free tier)**

### Year 10 (Cumulative)
- Payroll: 0.06 MB
- EMR: 36.7 MB × 10 = 367 MB
- **Total: 367.06 MB (73.4% of free tier)**

---

## Bandwidth Analysis

### Monthly API Requests (Estimated)
- **Payroll System**: 
  - 10 users × 50 requests/day × 30 days = 15,000 requests/month
  - Average response size: 5 KB
  - **Bandwidth**: 15,000 × 5 KB = **75 MB/month**

- **EMR System**:
  - 20 users × 100 requests/day × 30 days = 60,000 requests/month
  - Average response size: 10 KB
  - **Bandwidth**: 60,000 × 10 KB = **600 MB/month**

### Total Bandwidth
- **Combined**: 675 MB/month
- **Free Tier Limit**: 5 GB/month (5,000 MB)
- **Usage**: 13.5% of free tier
- **Remaining**: 4,325 MB/month

---

## Storage Optimization Strategies

### 1. Data Archiving
- Archive records older than 2 years to external storage
- Keep only active/recent data in Supabase
- **Savings**: ~50% reduction after 2 years

### 2. Efficient Data Types
- Use appropriate column types (INT vs BIGINT, VARCHAR vs TEXT)
- Compress JSONB fields
- **Savings**: ~10-15% reduction

### 3. Index Optimization
- Create indexes only on frequently queried columns
- Use partial indexes where applicable
- **Savings**: ~20% reduction in index overhead

### 4. Soft Deletes
- Mark records as deleted instead of hard deletes
- Periodically purge old soft-deleted records
- **Savings**: Maintains data integrity while reducing storage

### 5. Image/File Storage
- Use Supabase Storage (1 GB free) for profile photos, documents
- Compress images before upload
- Use CDN for frequently accessed files

---

## Conclusion

✅ **VERDICT: YES, Your Supabase Free Tier Can Handle Both Projects**

### Summary
- **Current Usage**: 36.76 MB (7.35% of 500 MB)
- **5-Year Projection**: 183.56 MB (36.7% of 500 MB)
- **10-Year Projection**: 367.06 MB (73.4% of 500 MB)
- **Bandwidth**: 675 MB/month (13.5% of 5 GB)

### Recommendations
1. ✅ **Proceed with both projects** on the same Supabase account
2. ✅ Use the **same Supabase project** for both databases (separate schemas)
3. ✅ Implement data archiving after 2-3 years
4. ✅ Monitor storage usage quarterly
5. ✅ Consider upgrading to Pro tier ($25/month) only if you exceed 400 MB

### Cost Savings
- **Free Tier**: $0/month for 10+ years
- **Pro Tier** (if needed later): $25/month
- **Estimated Break-even**: Year 8-10

---

## Database Schema Organization

### Option 1: Single Database with Schemas (Recommended)
```sql
-- Payroll schema
CREATE SCHEMA payroll;
CREATE TABLE payroll.employees (...);

-- EMR schema
CREATE SCHEMA emr;
CREATE TABLE emr.patients (...);
CREATE TABLE emr.appointments (...);
CREATE TABLE emr.consultations (...);
```

**Advantages:**
- Single Supabase project
- Shared authentication
- Lower cost
- Easier management

### Option 2: Separate Databases
- Create two Supabase projects
- Requires two free tier accounts or one paid account

**Advantages:**
- Complete isolation
- Independent scaling
- Separate backups

**Recommendation**: Use Option 1 (Single Database with Schemas) for cost efficiency and simplicity.

---

## Next Steps

1. ✅ Confirm Supabase capacity is sufficient
2. Create database schemas for both projects
3. Set up Row Level Security (RLS) policies
4. Initialize React + Vite project for EMR
5. Deploy to Cloudflare Pages

**Status**: Ready to proceed with full build! 🚀
