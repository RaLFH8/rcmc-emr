# Rizalcare EMR System - Deployment Checklist

## 📋 Pre-Deployment Checklist

### Files to Upload (13 files)

#### Backend
- [ ] **Code.gs** - All server-side functions

#### Frontend HTML Files
- [ ] **Index.html** - Main application structure
- [ ] **Styles.html** - CSS styling
- [ ] **Scripts.html** - JavaScript logic
- [ ] **Dashboard.html** - Executive dashboard
- [ ] **Patients.html** - Patient management
- [ ] **Appointments.html** - Appointment scheduling
- [ ] **Consultations.html** - Medical records
- [ ] **Doctors.html** - Doctor management
- [ ] **Items.html** - Items & pricing management
- [ ] **Billing.html** - Billing & invoicing
- [ ] **Reports.html** - Income reports
- [ ] **Settings.html** - System settings

### Documentation Files (Optional - for reference)
- [ ] **README.md** - Complete system documentation
- [ ] **DOCTOR_MANAGEMENT_GUIDE.md** - Doctor management guide
- [ ] **ITEMS_MANAGEMENT_GUIDE.md** - Items management guide
- [ ] **CHANGELOG.md** - Version history
- [ ] **DEPLOYMENT_CHECKLIST.md** - This file

---

## 🚀 Deployment Steps

### Step 1: Create Google Apps Script Project
- [ ] Go to https://script.google.com/
- [ ] Click "New Project"
- [ ] Name it "Rizalcare EMR System"

### Step 2: Upload Code Files
- [ ] Create **Code.gs** file (rename Script.gs if needed)
- [ ] Paste Code.gs content
- [ ] Click "+" to add HTML files
- [ ] Add all 12 HTML files one by one
- [ ] Verify all files are present

### Step 3: Configure Project
- [ ] Click on Project Settings (gear icon)
- [ ] Note the Script ID (for reference)
- [ ] Verify timezone is set correctly

### Step 4: Deploy as Web App
- [ ] Click "Deploy" > "New deployment"
- [ ] Click gear icon ⚙️ next to "Select type"
- [ ] Choose "Web app"
- [ ] Configure deployment:
  - Description: "Rizalcare EMR v1.1.0"
  - Execute as: "Me"
  - Who has access: "Anyone" or "Anyone with Google account"
- [ ] Click "Deploy"
- [ ] Authorize access when prompted
- [ ] Copy the Web App URL
- [ ] Save URL in a secure location

### Step 5: First Run & Database Initialization
- [ ] Open the Web App URL in browser
- [ ] Wait for database creation (may take 10-30 seconds)
- [ ] Check Google Drive for "Rizalcare_EMR_Database" spreadsheet
- [ ] Verify all 8 sheets are created:
  - [ ] Users
  - [ ] Patients
  - [ ] Doctors
  - [ ] Appointments
  - [ ] Consultations
  - [ ] Items
  - [ ] Billing
  - [ ] Payments

### Step 6: Test Default Login
- [ ] Login as Admin (admin / admin123)
- [ ] Verify dashboard loads
- [ ] Check all menu items are visible
- [ ] Logout

### Step 7: Test Each Module
- [ ] **Dashboard**: Verify metrics display
- [ ] **Patients**: Test patient registration
- [ ] **Appointments**: Test appointment creation
- [ ] **Consultations**: Test consultation record
- [ ] **Doctors**: Test add/edit doctor
- [ ] **Items & Pricing**: Test add/edit item
- [ ] **Billing**: Test invoice creation
- [ ] **Reports**: Test report generation
- [ ] **Settings**: Verify settings display

### Step 8: Security Configuration
- [ ] Change default admin password in spreadsheet
- [ ] Change default doctor password in spreadsheet
- [ ] Change default reception password in spreadsheet
- [ ] Set up additional user accounts if needed
- [ ] Configure deployment access restrictions if needed

### Step 9: Customize for Clinic
- [ ] Update clinic name if different
- [ ] Add actual doctors to system
- [ ] Add actual services and pricing
- [ ] Configure discount rules if different
- [ ] Add clinic logo placeholder if needed

### Step 10: Staff Training
- [ ] Share Web App URL with staff
- [ ] Provide login credentials
- [ ] Conduct training session
- [ ] Share user guides (README, Doctor Guide, Items Guide)
- [ ] Set up support channel

---

## ✅ Post-Deployment Verification

### Functionality Tests

#### Patient Management
- [ ] Register new patient
- [ ] Search for patient
- [ ] View patient details
- [ ] Verify patient ID generation

#### Appointment Scheduling
- [ ] Create new appointment
- [ ] View appointments by date
- [ ] Verify doctor selection works
- [ ] Check appointment ID generation

#### Doctor Management
- [ ] Add new doctor
- [ ] Edit doctor information
- [ ] View doctor details
- [ ] Deactivate/activate doctor
- [ ] Verify doctor appears in appointments

#### Items & Pricing
- [ ] Add new item (each category)
- [ ] Edit item pricing
- [ ] View item details
- [ ] Deactivate/activate item
- [ ] Verify items appear in billing
- [ ] Test category filter

#### Consultation Records
- [ ] Select patient
- [ ] Add consultation record
- [ ] View consultation history
- [ ] Verify doctor selection

#### Billing & Invoicing
- [ ] Create invoice with multiple items
- [ ] Apply Senior Citizen discount
- [ ] Apply PWD discount
- [ ] Process payment
- [ ] View invoice preview
- [ ] Test print functionality

#### Dashboard
- [ ] Verify patient metrics
- [ ] Check financial metrics
- [ ] View consultations by doctor
- [ ] Check revenue by category
- [ ] Test date filter

#### Reports
- [ ] Generate income report
- [ ] View revenue by doctor
- [ ] Check daily revenue breakdown
- [ ] Test date range selection

### Data Integrity
- [ ] Check spreadsheet data after each operation
- [ ] Verify IDs are unique and sequential
- [ ] Confirm timestamps are correct
- [ ] Verify status fields are accurate

### User Access
- [ ] Test Admin role access
- [ ] Test Doctor role access
- [ ] Test Reception role access
- [ ] Verify menu visibility by role

### Performance
- [ ] Test on desktop browser
- [ ] Test on mobile device
- [ ] Check page load times
- [ ] Verify responsive design

---

## 🔧 Troubleshooting

### Common Issues

#### "Authorization Required" Error
- **Solution**: Click "Authorize access" and grant permissions
- **Check**: Logged into correct Google account

#### Database Not Created
- **Solution**: Refresh page and wait 30 seconds
- **Check**: Script has permission to create files in Drive

#### Can't Login
- **Solution**: Verify credentials in Users sheet
- **Check**: Status is "Active"
- **Try**: Clear browser cache

#### Items Not Loading
- **Solution**: Check if spreadsheet exists
- **Check**: Verify sheet names are correct
- **Try**: Refresh the page

#### Changes Not Saving
- **Solution**: Check internet connection
- **Check**: Verify script permissions
- **Try**: Redeploy the web app

---

## 📊 Database Verification

### Check Each Sheet

#### Users Sheet
- [ ] Has 3 default users
- [ ] Columns: User ID, Username, Password, Role, Name, Status, Created Date
- [ ] Admin, Doctor, Reception accounts present

#### Patients Sheet
- [ ] Has correct column headers
- [ ] Ready to accept patient data
- [ ] Columns: Patient ID through Status (16 columns)

#### Doctors Sheet
- [ ] Has 2 sample doctors
- [ ] Columns: Doctor ID through Created Date (9 columns)
- [ ] Sample data is realistic

#### Appointments Sheet
- [ ] Has correct column headers
- [ ] Ready to accept appointments
- [ ] Columns: Appointment ID through Created Date (10 columns)

#### Consultations Sheet
- [ ] Has correct column headers
- [ ] Ready to accept consultations
- [ ] Columns: Consultation ID through Created Date (12 columns)

#### Items Sheet
- [ ] Has 7 sample items
- [ ] Columns: Item ID through Created Date (8 columns)
- [ ] Sample items cover all categories

#### Billing Sheet
- [ ] Has correct column headers
- [ ] Ready to accept invoices
- [ ] Columns: Invoice ID through Created Date (15 columns)

#### Payments Sheet
- [ ] Has correct column headers
- [ ] Ready to accept payments
- [ ] Columns: Payment ID through Created Date (9 columns)

---

## 🔐 Security Checklist

### Access Control
- [ ] Web app access configured appropriately
- [ ] Default passwords changed
- [ ] User accounts reviewed
- [ ] Spreadsheet permissions set correctly

### Data Protection
- [ ] Spreadsheet backed up
- [ ] Version history enabled
- [ ] Edit permissions restricted
- [ ] Sharing settings reviewed

### Best Practices
- [ ] Regular backups scheduled
- [ ] Password policy established
- [ ] User access reviewed monthly
- [ ] Audit trail monitored

---

## 📱 Mobile Testing

### iOS Devices
- [ ] Test on iPhone (Safari)
- [ ] Test on iPad (Safari)
- [ ] Verify responsive layout
- [ ] Check touch interactions

### Android Devices
- [ ] Test on Android phone (Chrome)
- [ ] Test on Android tablet (Chrome)
- [ ] Verify responsive layout
- [ ] Check touch interactions

### Mobile Features
- [ ] Navigation menu works
- [ ] Forms are usable
- [ ] Tables are scrollable
- [ ] Buttons are tappable
- [ ] Text is readable

---

## 📞 Support Setup

### Documentation
- [ ] README.md accessible to staff
- [ ] Doctor Management Guide shared
- [ ] Items Management Guide shared
- [ ] Quick reference card created

### Training Materials
- [ ] Video tutorials recorded (optional)
- [ ] Screenshots prepared
- [ ] FAQ document created
- [ ] Support contact established

### Maintenance Plan
- [ ] Backup schedule established
- [ ] Update procedure documented
- [ ] Support escalation path defined
- [ ] Regular review scheduled

---

## ✨ Go-Live Checklist

### Final Verification
- [ ] All tests passed
- [ ] Staff trained
- [ ] Documentation distributed
- [ ] Backup created
- [ ] Support ready

### Launch
- [ ] Announce to staff
- [ ] Share Web App URL
- [ ] Distribute login credentials
- [ ] Monitor first day usage
- [ ] Collect feedback

### Post-Launch
- [ ] Review first week usage
- [ ] Address any issues
- [ ] Gather user feedback
- [ ] Plan improvements
- [ ] Schedule follow-up training

---

## 📈 Success Metrics

### Week 1
- [ ] All staff can login
- [ ] Patients registered
- [ ] Appointments scheduled
- [ ] Consultations recorded
- [ ] Invoices generated

### Month 1
- [ ] Daily usage established
- [ ] All features utilized
- [ ] Staff comfortable with system
- [ ] Data integrity maintained
- [ ] Positive feedback received

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Web App URL**: _______________  
**Spreadsheet ID**: _______________  

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Completed

---

*Rizalcare Medical Clinic - EMR System v1.1.0*
