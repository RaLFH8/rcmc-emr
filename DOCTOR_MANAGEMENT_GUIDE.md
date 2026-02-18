# Doctor Management Feature Guide

## Overview
The Doctor Management module allows administrators to add, edit, view, and manage doctor profiles directly from the web interface.

## Features

### ✨ Add New Doctors
- Full name and credentials
- 15+ specialization options (General Practitioner, Pediatrician, Cardiologist, etc.)
- License number tracking
- Contact information (phone and email)
- Customizable consultation fees
- Automatic doctor ID generation (DOC001, DOC002, etc.)

### ✏️ Edit Doctor Information
- Update any doctor details
- Modify consultation fees
- Change contact information
- Update specialization
- Activate/deactivate doctor profiles

### 👁️ View Doctor Details
- Complete doctor profile view
- Quick access to all information
- Status indicators (Active/Inactive)
- Direct edit access from details view

### 📋 Doctor Directory
- Comprehensive list of all doctors
- Sortable table with all key information
- Status badges for quick identification
- Action buttons for View and Edit

## How to Use

### Adding a New Doctor

1. **Navigate to Doctors Menu**
   - Click on "👨‍⚕️ Doctors" in the left sidebar

2. **Open Add Doctor Form**
   - Click the "+ Add New Doctor" button (top right)

3. **Fill in Doctor Information**
   - **Full Name**: Enter doctor's complete name (e.g., "Dr. Juan dela Cruz")
   - **Specialization**: Select from dropdown menu
   - **License Number**: Enter medical license number
   - **Contact Number**: Enter phone number
   - **Email Address**: Enter email (optional)
   - **Consultation Fee**: Enter fee in Philippine Peso (₱)

4. **Submit**
   - Click "Add Doctor" button
   - System generates unique Doctor ID automatically
   - Success message displays with new Doctor ID

### Editing Doctor Information

1. **Locate Doctor**
   - Go to Doctors menu
   - Find doctor in the directory table

2. **Open Edit Form**
   - Click "Edit" button next to doctor's name
   - OR click "View" then "Edit Information"

3. **Update Information**
   - Modify any fields as needed
   - Change status (Active/Inactive) if required
   - Update consultation fee

4. **Save Changes**
   - Click "Update Doctor" button
   - Success message confirms update

### Viewing Doctor Details

1. **Click "View" Button**
   - In the doctor directory table
   - Click "View" next to any doctor

2. **Review Information**
   - See complete doctor profile
   - Check current status
   - View all contact details

3. **Quick Edit**
   - Click "Edit Information" button
   - Directly opens edit form

### Deactivating a Doctor

1. **Edit Doctor Profile**
   - Click "Edit" button for the doctor

2. **Change Status**
   - In the Status dropdown, select "Inactive"

3. **Save**
   - Click "Update Doctor"
   - Doctor remains in system but marked as inactive

## Available Specializations

The system includes 16 medical specializations:

1. General Practitioner
2. Pediatrician
3. Cardiologist
4. Dermatologist
5. Gynecologist
6. Neurologist
7. Orthopedic
8. Psychiatrist
9. Surgeon
10. Ophthalmologist
11. ENT Specialist
12. Pulmonologist
13. Gastroenterologist
14. Endocrinologist
15. Urologist
16. Other

## Doctor Status

### Active
- Doctor appears in appointment booking
- Available for consultations
- Included in billing doctor selection
- Shows in reports

### Inactive
- Doctor still visible in directory
- Not available for new appointments
- Historical data preserved
- Can be reactivated anytime

## Integration with Other Modules

### Appointments
- Active doctors appear in appointment scheduling
- Patients can select doctors based on specialization
- Doctor's schedule managed through appointments

### Consultations
- Doctors linked to consultation records
- Medical history tracked by doctor
- Prescription records maintained

### Billing
- Doctor's consultation fee auto-populated
- Revenue tracked per doctor
- Doctor-wise income reports available

### Reports
- Consultations per doctor metrics
- Revenue by doctor analysis
- Doctor performance tracking

## Data Storage

All doctor information is stored in the "Doctors" sheet of the Google Spreadsheet database:

- **Doctor ID**: Unique identifier (auto-generated)
- **Name**: Full name with title
- **Specialization**: Medical specialty
- **License Number**: Professional license
- **Contact Number**: Phone number
- **Email**: Email address
- **Consultation Fee**: Fee in ₱
- **Status**: Active or Inactive
- **Created Date**: Registration timestamp

## Best Practices

### When Adding Doctors
- ✅ Use full name with title (Dr., Dra.)
- ✅ Verify license number accuracy
- ✅ Set appropriate consultation fees
- ✅ Include valid contact information
- ✅ Select correct specialization

### When Editing Doctors
- ✅ Update fees regularly as needed
- ✅ Keep contact information current
- ✅ Use Inactive status instead of deleting
- ✅ Verify changes before saving

### Managing Doctor Status
- ✅ Set to Inactive when doctor leaves
- ✅ Keep historical records intact
- ✅ Reactivate when doctor returns
- ✅ Never delete doctor records (preserves history)

## Troubleshooting

### Doctor Not Appearing in Appointments
- Check if doctor status is "Active"
- Verify doctor was saved successfully
- Refresh the page

### Cannot Edit Doctor
- Ensure you're logged in as Admin
- Check internet connection
- Try refreshing the page

### Consultation Fee Not Updating
- Make sure to click "Update Doctor"
- Check if changes were saved
- Verify in the database spreadsheet

## Security & Access

### Who Can Manage Doctors?
- **Admin**: Full access (add, edit, view, deactivate)
- **Doctor**: View only (their own profile)
- **Reception**: View only (for appointments)

### Data Protection
- All changes logged with timestamps
- Historical data preserved
- No permanent deletion
- Audit trail in spreadsheet version history

## Tips for Efficient Management

1. **Regular Updates**: Keep doctor information current
2. **Fee Management**: Review and update consultation fees periodically
3. **Status Management**: Use Inactive status for temporary unavailability
4. **Contact Info**: Ensure emergency contact details are accurate
5. **Specialization**: Keep specializations accurate for patient matching

---

**Need Help?**
Refer to the main README.md for complete system documentation or check the Settings menu for system information.
