# Supabase Multi-Role Setup Guide

Follow these steps in order to set up the multi-role authentication system.

---

## Step 1: Run the Updated Database Schema

Go to your Supabase project → SQL Editor → New Query

Copy and paste the entire content from `supabase-schema.sql` file and click "Run".

This will create:
- User profiles table with roles
- Inventory table
- Vital signs table
- Updated RLS policies for role-based access

---

## Step 2: Create Test User Accounts

Go to Supabase → Authentication → Users → Add User

Create 3 test accounts:

### Admin Account
- Email: `admin@rcmc.com`
- Password: `admin123`
- Auto Confirm User: ✓ (checked)

### Doctor Account
- Email: `doctor@rcmc.com`
- Password: `doctor123`
- Auto Confirm User: ✓ (checked)

### Receptionist Account
- Email: `receptionist@rcmc.com`
- Password: `receptionist123`
- Auto Confirm User: ✓ (checked)

---

## Step 3: Get User IDs

After creating the users, go to Authentication → Users and copy the UUID for each user.

You'll see something like:
- Admin: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Doctor: `b2c3d4e5-f6a7-8901-bcde-f12345678901`
- Receptionist: `c3d4e5f6-a7b8-9012-cdef-123456789012`

---

## Step 4: Create User Profiles

Go to Supabase → SQL Editor → New Query

Run this SQL (replace the UUIDs with your actual user IDs from Step 3):

```sql
-- Insert Admin Profile
INSERT INTO emr.user_profiles (id, email, full_name, role, status)
VALUES (
  'PASTE_ADMIN_UUID_HERE',
  'admin@rcmc.com',
  'Admin User',
  'admin',
  'Active'
);

-- Insert Doctor Profile (link to existing doctor)
INSERT INTO emr.user_profiles (id, email, full_name, role, doctor_id, status)
VALUES (
  'PASTE_DOCTOR_UUID_HERE',
  'doctor@rcmc.com',
  'Dr. Ashlynn Kenter',
  'doctor',
  (SELECT id FROM emr.doctors WHERE email = 'dr.kenter@rcmc.com' LIMIT 1),
  'Active'
);

-- Insert Receptionist Profile
INSERT INTO emr.user_profiles (id, email, full_name, role, status)
VALUES (
  'PASTE_RECEPTIONIST_UUID_HERE',
  'receptionist@rcmc.com',
  'Maria Santos',
  'receptionist',
  'Active'
);
```

---

## Step 5: Verify Setup

Run this query to check if profiles were created correctly:

```sql
SELECT 
  up.email,
  up.full_name,
  up.role,
  up.status,
  d.first_name || ' ' || d.last_name as doctor_name
FROM emr.user_profiles up
LEFT JOIN emr.doctors d ON up.doctor_id = d.id
ORDER BY up.role;
```

You should see 3 rows with admin, doctor, and receptionist.

---

## Step 6: Test Login

1. Open your app at http://localhost:3001
2. You should see the login page
3. Try logging in with each account:
   - `admin@rcmc.com` / `admin123` → Should see all menu items
   - `doctor@rcmc.com` / `doctor123` → Should see Dashboard, Appointments, Patients, Inpatients
   - `receptionist@rcmc.com` / `receptionist123` → Should see Dashboard, Appointments, Patients, Payments, Rooms

---

## Troubleshooting

### If you get "relation does not exist" error:
Make sure you're using the `emr` schema. Check that your tables are in the correct schema:
```sql
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'emr';
```

### If login doesn't work:
1. Check that users are confirmed in Authentication → Users
2. Verify user_profiles exist with correct UUIDs
3. Check browser console for errors

### If RLS blocks access:
Temporarily disable RLS for testing:
```sql
ALTER TABLE emr.user_profiles DISABLE ROW LEVEL SECURITY;
```

Then re-enable after fixing:
```sql
ALTER TABLE emr.user_profiles ENABLE ROW LEVEL SECURITY;
```

---

## Quick Copy-Paste Template

Here's a template with placeholder UUIDs. Replace with your actual UUIDs:

```sql
-- Step 4: Create User Profiles
-- Replace these UUIDs with actual ones from Authentication → Users

-- Admin
INSERT INTO emr.user_profiles (id, email, full_name, role, status)
VALUES ('ADMIN_UUID_HERE', 'admin@rcmc.com', 'Admin User', 'admin', 'Active');

-- Doctor
INSERT INTO emr.user_profiles (id, email, full_name, role, doctor_id, status)
VALUES (
  'DOCTOR_UUID_HERE',
  'doctor@rcmc.com',
  'Dr. Ashlynn Kenter',
  'doctor',
  (SELECT id FROM emr.doctors WHERE email = 'dr.kenter@rcmc.com' LIMIT 1),
  'Active'
);

-- Receptionist
INSERT INTO emr.user_profiles (id, email, full_name, role, status)
VALUES ('RECEPTIONIST_UUID_HERE', 'receptionist@rcmc.com', 'Maria Santos', 'receptionist', 'Active');

-- Verify
SELECT email, full_name, role, status FROM emr.user_profiles;
```

---

## Role Permissions Summary

| Feature | Admin | Doctor | Receptionist |
|---------|-------|--------|--------------|
| Dashboard (Clinic-wide) | ✓ | ✗ | ✗ |
| Dashboard (Own data) | ✓ | ✓ | ✓ |
| View All Patients | ✓ | ✗ | ✓ |
| View Own Patients | ✓ | ✓ | ✓ |
| Add/Edit Patients | ✓ | ✗ | ✓ |
| Appointments | ✓ | ✓ | ✓ |
| Consultations | ✓ | ✓ | ✗ |
| Billing/Payments | ✓ | ✗ | ✓ |
| Inventory | ✓ | ✗ | ✓ |
| Vital Signs | ✓ | ✓ | ✓ |
| Manage Doctors | ✓ | ✗ | ✗ |
| Rooms | ✓ | ✗ | ✓ |

---

Done! Your multi-role EMR system is now ready to use.


---

## Admin Panel: User Management

Once you have an admin account set up, you can manage users directly from the app!

### Accessing User Management

1. Login as admin (`admin@rcmc.com` / `admin123`)
2. Click "User Management" in the sidebar (gear icon)
3. You'll see a list of all system users

### Adding New Users via Admin Panel

**Add Doctor:**
1. Click "Add New User" button
2. Fill in:
   - Email: doctor's email (e.g., `dr.newdoctor@rcmc.com`)
   - Password: temporary password (minimum 6 characters)
   - Full Name: doctor's full name
   - Role: Select "Doctor"
   - Link to Doctor Profile: Select from existing doctors in database
3. Click "Create User"

**Add Receptionist:**
1. Click "Add New User" button
2. Fill in:
   - Email: receptionist's email
   - Password: temporary password
   - Full Name: receptionist's full name
   - Role: Select "Receptionist"
3. Click "Create User"

**Add Another Admin:**
1. Click "Add New User" button
2. Fill in details
3. Role: Select "Admin"
4. Click "Create User"

### Managing Existing Users

- **Edit User**: Click the blue edit icon to update name, role, or linked doctor
- **Delete User**: Click the red trash icon to remove user access
- **View Details**: See user ID, email, role, linked doctor, and status

### Important Notes

1. **Admin Privileges Required**: Only users with "admin" role can access User Management
2. **Doctor Linking**: When creating a doctor account, you must link it to an existing doctor profile in the `emr.doctors` table
3. **Password Security**: Encourage users to change their password after first login
4. **Cannot Delete Self**: Admins cannot delete their own account while logged in

---

## Creating Multiple Doctor Accounts

If you want to create login credentials for all 4 sample doctors:

1. See `create-multiple-doctors.sql` for step-by-step SQL commands
2. Or use the Admin Panel to create them one by one (recommended)

**Sample Doctor Accounts:**
- Dr. Ashlynn Kenter (General Practitioner) - `dr.kenter@rcmc.com`
- Dr. Charlie Gouse (Pediatrician) - `dr.gouse@rcmc.com`
- Dr. Justin Bergson (Cardiologist) - `dr.bergson@rcmc.com`
- Dr. Madelyn Geldt (Dermatologist) - `dr.geldt@rcmc.com`

All can use password: `doctor123` (change after first login)

---

## User Management Features

✓ Create new users (admin, doctor, receptionist)
✓ Edit existing user profiles
✓ Delete user accounts
✓ Link doctor accounts to doctor profiles
✓ View all system users in one place
✓ Role-based access control
✓ Automatic email confirmation

---

## Security Best Practices

1. **Strong Passwords**: Use minimum 8 characters with mix of letters, numbers, symbols
2. **Unique Emails**: Each user must have a unique email address
3. **Regular Audits**: Review user list regularly and remove inactive accounts
4. **Role Assignment**: Only assign admin role to trusted personnel
5. **Password Changes**: Encourage users to change default passwords immediately

---
