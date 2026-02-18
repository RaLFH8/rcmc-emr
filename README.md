# Rizalcare Medical Clinic - EMR System

A complete, modern Electronic Medical Record (EMR) system built with Node.js, Express, and SQLite.

## 🏥 Features

### Patient Management
- Patient registration with complete medical history
- Search and filter patients
- View patient history with consultations and appointments
- CSV import/export for bulk patient data

### Appointments
- Schedule and manage appointments
- Calendar view by date
- Update appointment status (Scheduled/Completed/Cancelled)
- Patient and doctor assignment

### Consultations (SOAP Notes)
- Complete SOAP note format (Subjective, Objective, Assessment, Plan)
- Vital signs recording with auto-calculating BMI
- Patient history summary
- Prescription (Rx) management
- Follow-up scheduling

### Billing & Invoicing
- Create detailed invoices
- Add multiple items with quantities
- Automatic discount calculation (Senior Citizen/PWD 20%)
- Payment tracking and balance management
- Print-ready invoice format

### Doctor Management
- Add and manage doctor profiles
- Specialization tracking
- Consultation fee management
- Active/Inactive status

### Items & Pricing
- Manage services, procedures, medicines, and lab tests
- Category-based filtering
- CSV import/export for bulk pricing updates
- Unit price and description management

### Dashboard & Analytics
- Real-time metrics and KPIs
- Interactive charts (Revenue, Patient Types, Doctor Performance)
- Recent activity tracking
- Date range filtering (Today/Week/Month/Year)

### Patient Portal
- Patients can view their own records
- Access to appointment history
- View consultation records and prescriptions
- Medical history overview

## 🎨 Design

Modern, minimalist UI with:
- Navy Blue (#1e3a5f) and Soft Blue (#4a90e2) color scheme
- Clean, professional layouts
- Responsive design for all devices
- Smooth animations and transitions

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/rizalcare-emr.git
cd rizalcare-emr
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser:
```
http://localhost:54323
```

### Default Login
- Username: `admin`
- Password: `admin123`

## 📦 Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (sql.js)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js
- **Session Management**: express-session

## 🗂️ Project Structure

```
rizalcare-emr/
├── server.js              # Main server file
├── database.js            # Database initialization
├── package.json           # Dependencies
├── Index.html             # Login page
├── Dashboard.html         # Main dashboard
├── Patients.html          # Patient management
├── Appointments.html      # Appointment scheduling
├── Consultations.html     # SOAP notes
├── Doctors.html           # Doctor management
├── Items.html             # Items & pricing
├── Billing.html           # Billing & invoicing
├── PatientPortal.html     # Patient self-service
├── styles.css             # Global styles
└── rizalcare.db           # SQLite database
```

## 🔒 Security Notes

**Important**: Before deploying to production:

1. Change all default passwords
2. Use environment variables for sensitive data
3. Enable HTTPS (automatic on Render/Railway)
4. Implement proper access control
5. Regular database backups

## 🌐 Deployment

### Deploy to Render.com (Free)

1. Push code to GitHub
2. Sign up at https://render.com
3. Create new Web Service
4. Connect GitHub repository
5. Configure:
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Deploy!

See [ONLINE_DEPLOYMENT_GUIDE.md](ONLINE_DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📊 Database Schema

- **Users**: System users (Admin, Doctor, Reception)
- **Patients**: Patient records and medical history
- **Doctors**: Doctor profiles and specializations
- **Appointments**: Appointment scheduling
- **Consultations**: SOAP notes and prescriptions
- **Items**: Services, procedures, medicines, lab tests
- **Billing**: Invoices and payments
- **Payments**: Payment transactions

## 🔧 Configuration

The server automatically finds an available port starting from 54321. To change the default port, edit `server.js`:

```javascript
let PORT = process.env.PORT || 54321;
```

## 📝 License

This project is for Rizalcare Medical Clinic.

## 👥 Default Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| doctor1 | doc123 | Doctor |
| reception | rec123 | Reception |

## 🆘 Support

For issues or questions, please check the documentation files:
- `ONLINE_DEPLOYMENT_GUIDE.md` - Deployment instructions
- `TROUBLESHOOTING.md` - Common issues and solutions

## ✨ Features Roadmap

- [x] Patient Management
- [x] Appointments
- [x] Consultations (SOAP)
- [x] Billing & Invoicing
- [x] Dashboard & Analytics
- [x] Patient Portal
- [x] CSV Import/Export
- [ ] SMS Notifications
- [ ] Email Reminders
- [ ] Advanced Reporting
- [ ] Multi-clinic Support

---

Built with ❤️ for Rizalcare Medical Clinic
