# Rizalcare EMR System - Changelog

## Version 1.1.0 - Items & Pricing Management (2026-02-17)

### ✨ New Features

#### Items & Pricing Management Module
- **New Menu Item**: "💊 Items & Pricing" added to sidebar navigation
- **Complete CRUD Operations**: Add, Edit, View, and Deactivate items
- **Category Management**: Filter by Consultation, Laboratory, Procedure, Medicine
- **Status Management**: Active/Inactive toggle with soft delete
- **Comprehensive Directory**: Full table view with all item details

#### Backend Functions (Code.gs)
- `addItem()` - Create new billable items
- `updateItem()` - Edit existing item information
- `getItemDetails()` - Retrieve complete item profile
- `deleteItem()` - Deactivate items (soft delete)
- Updated `getAllItems()` - Now supports showing inactive items

#### User Interface (Items.html)
- Add Item Form with validation
- Edit Item Form with all fields
- Item Details Modal
- Delete Confirmation Dialog
- Category Filter
- Show/Hide Inactive Items toggle
- Color-coded category badges
- Responsive table layout

### 🔧 Improvements

#### Enhanced Item Management
- **13+ Unit Options**: per visit, per test, per tablet, per capsule, per bottle, per vial, per ampule, per piece, per box, per ml, per mg, per session, per procedure
- **4 Categories**: Consultation, Laboratory, Procedure, Medicine
- **Automatic ID Generation**: ITM001, ITM002, ITM003...
- **Price Formatting**: Philippine Peso (₱) with decimal support
- **Status Indicators**: Green badges for Active, Red for Inactive

#### Integration Updates
- Billing module updated to use new getAllItems() function
- Settings page updated with links to dedicated management pages
- Navigation system enhanced with new menu item
- View loading logic updated in Scripts.html

### 📝 Documentation

#### New Guides
- **ITEMS_MANAGEMENT_GUIDE.md**: Complete 400+ line guide covering:
  - How to add, edit, and deactivate items
  - Category descriptions and examples
  - Available units and their uses
  - Best practices and tips
  - Troubleshooting guide
  - Integration with other modules

#### Updated Documentation
- **README.md**: Updated with Items & Pricing features
- **File list**: Updated to include Items.html
- **Usage guide**: Added Items management section
- **Customization**: Added Items management instructions

### 🗂️ Files Modified

1. **Code.gs** - Added 4 new item management functions
2. **Index.html** - Added Items menu and view
3. **Scripts.html** - Added items view loading logic
4. **Settings.html** - Updated with links to dedicated pages
5. **Billing.html** - Updated getAllItems() call
6. **README.md** - Updated documentation

### 🆕 Files Created

1. **Items.html** - Complete items management interface
2. **ITEMS_MANAGEMENT_GUIDE.md** - Comprehensive user guide
3. **CHANGELOG.md** - This file

---

## Version 1.0.1 - Doctor Management (2026-02-17)

### ✨ New Features

#### Doctor Management Module
- **New Menu Item**: "👨‍⚕️ Doctors" added to sidebar navigation
- **Complete CRUD Operations**: Add, Edit, View, and Deactivate doctors
- **Specialization Options**: 16 medical specializations available
- **Status Management**: Active/Inactive toggle

#### Backend Functions (Code.gs)
- `addDoctor()` - Register new doctors
- `updateDoctor()` - Edit doctor information
- `getDoctorDetails()` - Retrieve complete doctor profile
- `deactivateDoctor()` - Set doctor status to inactive
- Updated `getAllDoctors()` - Now supports showing inactive doctors

#### User Interface (Doctors.html)
- Add Doctor Form with 16 specializations
- Edit Doctor Form with all fields
- Doctor Details Modal
- Doctor Directory Table
- Status badges and action buttons

### 📝 Documentation

#### New Guides
- **DOCTOR_MANAGEMENT_GUIDE.md**: Complete guide for doctor management

#### Updated Documentation
- **README.md**: Updated with Doctor Management features

### 🗂️ Files Modified

1. **Code.gs** - Added 4 new doctor management functions
2. **Index.html** - Added Doctors menu and view
3. **Scripts.html** - Added doctors view loading logic
4. **README.md** - Updated documentation

### 🆕 Files Created

1. **Doctors.html** - Complete doctor management interface
2. **DOCTOR_MANAGEMENT_GUIDE.md** - Comprehensive user guide

---

## Version 1.0.0 - Initial Release (2026-02-17)

### 🎉 Initial Features

#### Core Modules
- **Patient Management**: Complete registration and search
- **Appointment Scheduling**: Calendar-like interface
- **Consultation Records**: Medical history tracking
- **Billing & Invoicing**: Complete billing system with discounts
- **Executive Dashboard**: Real-time metrics and analytics
- **Income Reports**: Revenue analysis and reporting
- **Settings**: System configuration

#### User Roles
- **Admin**: Full system access
- **Doctor**: Consultations and patient history
- **Reception**: Registration, billing, scheduling

#### Design
- Minimalist 60-30-10 color scheme
- Fully responsive mobile design
- Professional medical interface
- Google Calendar-like scheduling

#### Database
- Automatic Google Sheets creation
- 8 organized data sheets
- Sample data included
- Secure cloud storage

### 📦 Initial Files

1. **Code.gs** - Backend logic
2. **Index.html** - Main application
3. **Styles.html** - CSS styling
4. **Dashboard.html** - Executive dashboard
5. **Patients.html** - Patient management
6. **Appointments.html** - Scheduling
7. **Consultations.html** - Medical records
8. **Billing.html** - Invoicing
9. **Reports.html** - Analytics
10. **Settings.html** - Configuration
11. **Scripts.html** - Frontend JavaScript
12. **README.md** - Documentation

---

## Upgrade Instructions

### From v1.0.0 to v1.0.1 (Doctor Management)
1. Update **Code.gs** with new doctor functions
2. Add **Doctors.html** file
3. Update **Index.html** with Doctors menu
4. Update **Scripts.html** with view loading
5. Redeploy the web app

### From v1.0.1 to v1.1.0 (Items Management)
1. Update **Code.gs** with new item functions
2. Add **Items.html** file
3. Update **Index.html** with Items menu
4. Update **Scripts.html** with view loading
5. Update **Settings.html** with new links
6. Update **Billing.html** with function call
7. Redeploy the web app

### Fresh Installation
Follow the complete installation guide in README.md

---

## Future Roadmap

### Planned Features
- [ ] User password management interface
- [ ] Advanced reporting with charts
- [ ] Patient portal for appointments
- [ ] SMS/Email notifications
- [ ] Inventory management
- [ ] Prescription printing
- [ ] Medical certificate generation
- [ ] Backup and restore functionality
- [ ] Multi-clinic support
- [ ] Mobile app version

### Under Consideration
- [ ] Integration with laboratory systems
- [ ] Telemedicine support
- [ ] Insurance claim processing
- [ ] Pharmacy integration
- [ ] Accounting system integration

---

**Current Version**: 1.1.0  
**Last Updated**: February 17, 2026  
**Developed for**: Rizalcare Medical Clinic
