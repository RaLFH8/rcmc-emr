const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDatabase, getDatabase, saveDatabase, generateId } = require('./database');

const app = express();
let PORT = process.env.PORT || 54321;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'rizalcare-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Serve static files
app.use(express.static(__dirname));

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Index.html'));
});

// Authentication API
app.post('/api/authenticate', (req, res) => {
  const { username, password } = req.body;
  
  try {
    const db = getDatabase();
    const result = db.exec(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}' AND status = 'Active'`);
    
    if (result[0] && result[0].values.length > 0) {
      const row = result[0].values[0];
      const user = {
        userId: row[0],
        username: row[1],
        role: row[3],
        name: row[4]
      };
      req.session.user = user;
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/session', (req, res) => {
  res.json(req.session.user || null);
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Patient APIs
app.post('/api/patients/register', (req, res) => {
  try {
    const db = getDatabase();
    const patientId = generateId('PAT', 'patients', 'patient_id');
    const data = req.body;
    
    db.run(`
      INSERT INTO patients (
        patient_id, first_name, last_name, date_of_birth, gender,
        contact_number, email, address, emergency_contact, emergency_number,
        blood_type, allergies, medical_history, patient_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      patientId,
      data.firstName || '',
      data.lastName || '',
      data.dateOfBirth || '',
      data.gender || '',
      data.contactNumber || '',
      data.email || '',
      data.address || '',
      data.emergencyContact || '',
      data.emergencyNumber || '',
      data.bloodType || '',
      data.allergies || '',
      data.medicalHistory || '',
      data.patientType || 'New',
      'Active'
    ]);
    
    saveDatabase();
    res.json({ success: true, patientId });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/patients/all', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT patient_id, first_name, last_name, date_of_birth, gender,
             contact_number, email, address, patient_type
      FROM patients
      WHERE status = 'Active'
      ORDER BY registration_date DESC
    `);
    
    if (!result[0]) {
      return res.json([]);
    }
    
    const patients = result[0].values.map(row => ({
      patientId: row[0],
      firstName: row[1],
      lastName: row[2],
      dateOfBirth: row[3],
      gender: row[4],
      contactNumber: row[5],
      email: row[6],
      address: row[7],
      patientType: row[8]
    }));
    
    res.json(patients);
  } catch (error) {
    console.error('Error getting patients:', error);
    res.status(500).json([]);
  }
});

app.get('/api/patients/search/:term', (req, res) => {
  try {
    const db = getDatabase();
    const searchTerm = `%${req.params.term.toLowerCase()}%`;
    
    const result = db.exec(`
      SELECT patient_id, first_name, last_name, date_of_birth, gender,
             contact_number, email, address, patient_type
      FROM patients
      WHERE status = 'Active'
        AND (
          LOWER(patient_id) LIKE '${searchTerm}'
          OR LOWER(first_name) LIKE '${searchTerm}'
          OR LOWER(last_name) LIKE '${searchTerm}'
          OR LOWER(contact_number) LIKE '${searchTerm}'
        )
      ORDER BY registration_date DESC
    `);
    
    if (!result[0]) {
      return res.json([]);
    }
    
    const patients = result[0].values.map(row => ({
      patientId: row[0],
      firstName: row[1],
      lastName: row[2],
      dateOfBirth: row[3],
      gender: row[4],
      contactNumber: row[5],
      email: row[6],
      address: row[7],
      patientType: row[8]
    }));
    
    res.json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json([]);
  }
});

app.get('/api/patients/:id', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT patient_id, first_name, last_name, date_of_birth, gender,
             contact_number, email, address, emergency_contact, emergency_number,
             blood_type, allergies, medical_history, patient_type, registration_date
      FROM patients
      WHERE patient_id = '${req.params.id}'
    `);
    
    if (!result[0] || result[0].values.length === 0) {
      return res.json(null);
    }
    
    const row = result[0].values[0];
    const patient = {
      patientId: row[0],
      firstName: row[1],
      lastName: row[2],
      dateOfBirth: row[3],
      gender: row[4],
      contactNumber: row[5],
      email: row[6],
      address: row[7],
      emergencyContact: row[8],
      emergencyNumber: row[9],
      bloodType: row[10],
      allergies: row[11],
      medicalHistory: row[12],
      patientType: row[13],
      registrationDate: row[14]
    };
    
    res.json(patient);
  } catch (error) {
    console.error('Error getting patient details:', error);
    res.status(500).json(null);
  }
});

// Doctor APIs
app.get('/api/doctors/all', (req, res) => {
  try {
    const db = getDatabase();
    const includeInactive = req.query.includeInactive === 'true';
    let query = `
      SELECT doctor_id, name, specialization, license_number,
             contact_number, email, consultation_fee, status
      FROM doctors
    `;
    
    if (!includeInactive) {
      query += ` WHERE status = 'Active'`;
    }
    
    query += ` ORDER BY name`;
    
    const result = db.exec(query);
    
    if (!result[0]) {
      return res.json([]);
    }
    
    const doctors = result[0].values.map(row => ({
      doctorId: row[0],
      name: row[1],
      specialization: row[2],
      licenseNumber: row[3],
      contactNumber: row[4],
      email: row[5],
      consultationFee: row[6],
      status: row[7]
    }));
    
    res.json(doctors);
  } catch (error) {
    console.error('Error getting doctors:', error);
    res.status(500).json([]);
  }
});

app.post('/api/doctors/add', (req, res) => {
  try {
    const db = getDatabase();
    const doctorId = generateId('DOC', 'doctors', 'doctor_id');
    const data = req.body;
    
    db.run(`
      INSERT INTO doctors (doctor_id, name, specialization, license_number, contact_number, email, consultation_fee, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      doctorId,
      data.name || '',
      data.specialization || '',
      data.licenseNumber || '',
      data.contactNumber || '',
      data.email || '',
      parseFloat(data.consultationFee) || 0,
      'Active'
    ]);
    
    saveDatabase();
    res.json({ success: true, doctorId });
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/doctors/update', (req, res) => {
  try {
    const db = getDatabase();
    const data = req.body;
    
    db.run(`
      UPDATE doctors
      SET name = ?, specialization = ?, license_number = ?, contact_number = ?,
          email = ?, consultation_fee = ?, status = ?
      WHERE doctor_id = ?
    `, [
      data.name,
      data.specialization,
      data.licenseNumber,
      data.contactNumber,
      data.email,
      parseFloat(data.consultationFee),
      data.status,
      data.doctorId
    ]);
    
    saveDatabase();
    res.json({ success: true, message: 'Doctor updated successfully' });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/doctors/:id', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT doctor_id, name, specialization, license_number,
             contact_number, email, consultation_fee, status
      FROM doctors
      WHERE doctor_id = '${req.params.id}'
    `);
    
    if (!result[0] || result[0].values.length === 0) {
      return res.json(null);
    }
    
    const row = result[0].values[0];
    const doctor = {
      doctorId: row[0],
      name: row[1],
      specialization: row[2],
      licenseNumber: row[3],
      contactNumber: row[4],
      email: row[5],
      consultationFee: row[6],
      status: row[7]
    };
    
    res.json(doctor);
  } catch (error) {
    console.error('Error getting doctor details:', error);
    res.status(500).json(null);
  }
});

// Items APIs
app.get('/api/items/all', (req, res) => {
  try {
    const db = getDatabase();
    const includeInactive = req.query.includeInactive === 'true';
    let query = `
      SELECT item_id, item_name, category, unit_price,
             unit, description, status
      FROM items
    `;
    
    if (!includeInactive) {
      query += ` WHERE status = 'Active'`;
    }
    
    query += ` ORDER BY item_name`;
    
    const result = db.exec(query);
    
    if (!result[0]) {
      return res.json([]);
    }
    
    const items = result[0].values.map(row => ({
      itemId: row[0],
      itemName: row[1],
      category: row[2],
      unitPrice: row[3],
      unit: row[4],
      description: row[5],
      status: row[6]
    }));
    
    res.json(items);
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json([]);
  }
});

app.post('/api/items/add', (req, res) => {
  try {
    const db = getDatabase();
    const itemId = generateId('ITM', 'items', 'item_id');
    const data = req.body;
    
    db.run(`
      INSERT INTO items (item_id, item_name, category, unit_price, unit, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      itemId,
      data.itemName || '',
      data.category || '',
      parseFloat(data.unitPrice) || 0,
      data.unit || '',
      data.description || '',
      'Active'
    ]);
    
    saveDatabase();
    res.json({ success: true, itemId });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/items/update', (req, res) => {
  try {
    const db = getDatabase();
    const data = req.body;
    
    db.run(`
      UPDATE items
      SET item_name = ?, category = ?, unit_price = ?, unit = ?, description = ?, status = ?
      WHERE item_id = ?
    `, [
      data.itemName,
      data.category,
      parseFloat(data.unitPrice),
      data.unit,
      data.description,
      data.status,
      data.itemId
    ]);
    
    saveDatabase();
    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Consultation APIs
app.post('/api/consultations/create', (req, res) => {
  try {
    const db = getDatabase();
    const consultationId = generateId('CON', 'consultations', 'consultation_id');
    const data = req.body;
    
    db.run(`
      INSERT INTO consultations (
        consultation_id, patient_id, doctor_id, chief_complaint,
        vital_signs, diagnosis, treatment_plan, prescription,
        follow_up_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      consultationId,
      data.patientId || '',
      data.doctorId || '',
      data.chiefComplaint || '',
      data.vitalSigns || '',
      data.diagnosis || '',
      data.treatmentPlan || '',
      data.prescription || '',
      data.followUpDate || '',
      data.notes || ''
    ]);
    
    saveDatabase();
    res.json({ success: true, consultationId });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/consultations/patient/:patientId', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT c.*, d.name as doctor_name
      FROM consultations c
      LEFT JOIN doctors d ON c.doctor_id = d.doctor_id
      WHERE c.patient_id = '${req.params.patientId}'
      ORDER BY c.consultation_date DESC
    `);
    
    if (!result[0]) {
      return res.json([]);
    }
    
    const consultations = result[0].values.map(row => ({
      consultationId: row[0],
      patientId: row[1],
      doctorId: row[2],
      consultationDate: row[3],
      chiefComplaint: row[4],
      vitalSigns: row[5],
      diagnosis: row[6],
      treatmentPlan: row[7],
      prescription: row[8],
      followUpDate: row[9],
      notes: row[10],
      doctorName: row[12]
    }));
    
    res.json(consultations);
  } catch (error) {
    console.error('Error getting consultations:', error);
    res.status(500).json([]);
  }
});

app.get('/api/consultations/recent', (req, res) => {
  try {
    const db = getDatabase();
    const limit = req.query.limit || 10;
    const result = db.exec(`
      SELECT c.*, p.first_name, p.last_name, d.name as doctor_name
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.patient_id
      LEFT JOIN doctors d ON c.doctor_id = d.doctor_id
      ORDER BY c.consultation_date DESC
      LIMIT ${limit}
    `);
    
    if (!result[0]) {
      return res.json([]);
    }
    
    const consultations = result[0].values.map(row => ({
      consultationId: row[0],
      patientId: row[1],
      doctorId: row[2],
      consultationDate: row[3],
      chiefComplaint: row[4],
      patientName: row[12] + ' ' + row[13],
      doctorName: row[14]
    }));
    
    res.json(consultations);
  } catch (error) {
    console.error('Error getting recent consultations:', error);
    res.status(500).json([]);
  }
});

// Dashboard APIs
app.get('/api/dashboard/metrics', (req, res) => {
  try {
    const db = getDatabase();
    const filter = req.query.filter || 'month';
    const today = new Date().toISOString().split('T')[0];
    
    // Total patients
    const patientsResult = db.exec('SELECT COUNT(*) as count FROM patients WHERE status = "Active"');
    const totalPatients = (patientsResult[0] && patientsResult[0].values[0][0]) || 0;
    
    // Today's appointments
    const todayApptResult = db.exec(`SELECT COUNT(*) as count FROM appointments WHERE appointment_date = '${today}'`);
    const todayAppointments = (todayApptResult[0] && todayApptResult[0].values[0][0]) || 0;
    
    // Total consultations (filtered)
    let consultationsQuery = 'SELECT COUNT(*) as count FROM consultations';
    if (filter === 'today') consultationsQuery += ` WHERE DATE(consultation_date) = '${today}'`;
    else if (filter === 'week') consultationsQuery += ` WHERE DATE(consultation_date) >= DATE('now', '-7 days')`;
    else if (filter === 'month') consultationsQuery += ` WHERE DATE(consultation_date) >= DATE('now', '-30 days')`;
    else if (filter === 'year') consultationsQuery += ` WHERE DATE(consultation_date) >= DATE('now', '-365 days')`;
    
    const consultationsResult = db.exec(consultationsQuery);
    const totalConsultations = (consultationsResult[0] && consultationsResult[0].values[0][0]) || 0;
    
    // Total revenue (filtered)
    let revenueQuery = 'SELECT SUM(grand_total) as total FROM billing';
    if (filter === 'today') revenueQuery += ` WHERE DATE(invoice_date) = '${today}'`;
    else if (filter === 'week') revenueQuery += ` WHERE DATE(invoice_date) >= DATE('now', '-7 days')`;
    else if (filter === 'month') revenueQuery += ` WHERE DATE(invoice_date) >= DATE('now', '-30 days')`;
    else if (filter === 'year') revenueQuery += ` WHERE DATE(invoice_date) >= DATE('now', '-365 days')`;
    
    const revenueResult = db.exec(revenueQuery);
    const totalRevenue = (revenueResult[0] && revenueResult[0].values[0][0]) || 0;
    
    // Active doctors
    const doctorsResult = db.exec('SELECT COUNT(*) as count FROM doctors WHERE status = "Active"');
    const totalDoctors = (doctorsResult[0] && doctorsResult[0].values[0][0]) || 0;
    
    // Pending payments
    const pendingResult = db.exec('SELECT SUM(balance) as total FROM billing WHERE payment_status != "Paid" AND balance > 0');
    const pendingPayments = (pendingResult[0] && pendingResult[0].values[0][0]) || 0;
    
    // New patients (this month)
    const newPatientsResult = db.exec(`SELECT COUNT(*) as count FROM patients WHERE DATE(registration_date) >= DATE('now', '-30 days')`);
    const newPatients = (newPatientsResult[0] && newPatientsResult[0].values[0][0]) || 0;
    
    res.json({
      totalPatients,
      todayAppointments,
      totalConsultations,
      totalRevenue,
      totalDoctors,
      pendingPayments,
      newPatients
    });
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    res.status(500).json({});
  }
});

app.get('/api/dashboard/revenue-trend', (req, res) => {
  try {
    const db = getDatabase();
    const filter = req.query.filter || 'month';
    
    let query, labels = [];
    if (filter === 'week') {
      query = `
        SELECT DATE(invoice_date) as date, SUM(grand_total) as total
        FROM billing
        WHERE DATE(invoice_date) >= DATE('now', '-7 days')
        GROUP BY DATE(invoice_date)
        ORDER BY date
      `;
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      }
    } else if (filter === 'month') {
      query = `
        SELECT DATE(invoice_date) as date, SUM(grand_total) as total
        FROM billing
        WHERE DATE(invoice_date) >= DATE('now', '-30 days')
        GROUP BY DATE(invoice_date)
        ORDER BY date
      `;
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.getDate().toString());
      }
    } else {
      query = `
        SELECT strftime('%Y-%m', invoice_date) as month, SUM(grand_total) as total
        FROM billing
        WHERE DATE(invoice_date) >= DATE('now', '-365 days')
        GROUP BY month
        ORDER BY month
      `;
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
      }
    }
    
    const result = db.exec(query);
    const values = labels.map(() => 0);
    
    if (result[0]) {
      result[0].values.forEach(row => {
        // Map data to labels (simplified)
        values[values.length - 1] = row[1] || 0;
      });
    }
    
    res.json({ labels, values });
  } catch (error) {
    console.error('Error getting revenue trend:', error);
    res.json({ labels: [], values: [] });
  }
});

app.get('/api/dashboard/patient-types', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT patient_type, COUNT(*) as count
      FROM patients
      WHERE status = 'Active'
      GROUP BY patient_type
    `);
    
    const labels = [];
    const values = [];
    
    if (result[0]) {
      result[0].values.forEach(row => {
        labels.push(row[0] || 'Unknown');
        values.push(row[1] || 0);
      });
    }
    
    res.json({ labels, values });
  } catch (error) {
    console.error('Error getting patient types:', error);
    res.json({ labels: [], values: [] });
  }
});

app.get('/api/dashboard/doctor-consultations', (req, res) => {
  try {
    const db = getDatabase();
    const filter = req.query.filter || 'month';
    
    let dateFilter = '';
    if (filter === 'today') dateFilter = `AND DATE(c.consultation_date) = DATE('now')`;
    else if (filter === 'week') dateFilter = `AND DATE(c.consultation_date) >= DATE('now', '-7 days')`;
    else if (filter === 'month') dateFilter = `AND DATE(c.consultation_date) >= DATE('now', '-30 days')`;
    else if (filter === 'year') dateFilter = `AND DATE(c.consultation_date) >= DATE('now', '-365 days')`;
    
    const result = db.exec(`
      SELECT d.name, COUNT(*) as count
      FROM consultations c
      LEFT JOIN doctors d ON c.doctor_id = d.doctor_id
      WHERE d.name IS NOT NULL ${dateFilter}
      GROUP BY d.name
      ORDER BY count DESC
      LIMIT 5
    `);
    
    const labels = [];
    const values = [];
    
    if (result[0]) {
      result[0].values.forEach(row => {
        labels.push(row[0] || 'Unknown');
        values.push(row[1] || 0);
      });
    }
    
    res.json({ labels, values });
  } catch (error) {
    console.error('Error getting doctor consultations:', error);
    res.json({ labels: [], values: [] });
  }
});

app.get('/api/dashboard/appointment-status', (req, res) => {
  try {
    const db = getDatabase();
    const filter = req.query.filter || 'month';
    
    let dateFilter = '';
    if (filter === 'today') dateFilter = `WHERE DATE(appointment_date) = DATE('now')`;
    else if (filter === 'week') dateFilter = `WHERE DATE(appointment_date) >= DATE('now', '-7 days')`;
    else if (filter === 'month') dateFilter = `WHERE DATE(appointment_date) >= DATE('now', '-30 days')`;
    else if (filter === 'year') dateFilter = `WHERE DATE(appointment_date) >= DATE('now', '-365 days')`;
    
    const result = db.exec(`
      SELECT status, COUNT(*) as count
      FROM appointments
      ${dateFilter}
      GROUP BY status
    `);
    
    const labels = [];
    const values = [];
    
    if (result[0]) {
      result[0].values.forEach(row => {
        labels.push(row[0] || 'Unknown');
        values.push(row[1] || 0);
      });
    }
    
    res.json({ labels, values });
  } catch (error) {
    console.error('Error getting appointment status:', error);
    res.json({ labels: [], values: [] });
  }
});

app.get('/api/dashboard/upcoming-appointments', (req, res) => {
  try {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    const result = db.exec(`
      SELECT a.*, p.first_name, p.last_name, d.name as doctor_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE a.appointment_date >= '${today}' AND a.status = 'Scheduled'
      ORDER BY a.appointment_date, a.appointment_time
      LIMIT 5
    `);
    
    if (!result[0]) {
      return res.json([]);
    }
    
    const appointments = result[0].values.map(row => ({
      appointmentId: row[0],
      appointmentDate: row[3],
      appointmentTime: row[4],
      status: row[6],
      patientName: row[11] + ' ' + row[12],
      doctorName: row[13]
    }));
    
    res.json(appointments);
  } catch (error) {
    console.error('Error getting upcoming appointments:', error);
    res.json([]);
  }
});

// Billing APIs
app.post('/api/billing/create', (req, res) => {
  try {
    const db = getDatabase();
    const invoiceId = generateId('INV', 'billing', 'invoice_id');
    const data = req.body;
    
    db.run(`
      INSERT INTO billing (
        invoice_id, patient_id, doctor_id, items_json, subtotal,
        discount_type, discount_amount, grand_total, payment_status,
        payment_mode, amount_paid, balance, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceId,
      data.patientId || '',
      data.doctorId || '',
      JSON.stringify(data.items),
      data.subtotal || 0,
      data.discountType || 'None',
      data.discountAmount || 0,
      data.grandTotal || 0,
      data.paymentStatus || 'Unpaid',
      data.paymentMode || '',
      data.amountPaid || 0,
      data.balance || 0,
      data.createdBy || ''
    ]);
    
    saveDatabase();
    res.json({ success: true, invoiceId });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/billing/recent', (req, res) => {
  try {
    const db = getDatabase();
    const limit = req.query.limit || 20;
    const result = db.exec(`
      SELECT b.*, p.first_name, p.last_name, d.name as doctor_name
      FROM billing b
      LEFT JOIN patients p ON b.patient_id = p.patient_id
      LEFT JOIN doctors d ON b.doctor_id = d.doctor_id
      ORDER BY b.invoice_date DESC
      LIMIT ${limit}
    `);
    
    if (!result[0]) {
      return res.json([]);
    }
    
    const invoices = result[0].values.map(row => ({
      invoiceId: row[0],
      patientId: row[1],
      doctorId: row[2],
      invoiceDate: row[3],
      itemsJson: row[4],
      subtotal: row[5],
      discountType: row[6],
      discountAmount: row[7],
      grandTotal: row[8],
      paymentStatus: row[9],
      paymentMode: row[10],
      amountPaid: row[11],
      balance: row[12],
      patientName: row[16] + ' ' + row[17],
      doctorName: row[18]
    }));
    
    res.json(invoices);
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json([]);
  }
});

app.get('/api/billing/invoice/:invoiceId', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT b.*, p.first_name, p.last_name, d.name as doctor_name
      FROM billing b
      LEFT JOIN patients p ON b.patient_id = p.patient_id
      LEFT JOIN doctors d ON b.doctor_id = d.doctor_id
      WHERE b.invoice_id = '${req.params.invoiceId}'
    `);
    
    if (!result[0] || result[0].values.length === 0) {
      return res.json(null);
    }
    
    const row = result[0].values[0];
    const invoice = {
      invoiceId: row[0],
      patientId: row[1],
      doctorId: row[2],
      invoiceDate: row[3],
      itemsJson: row[4],
      subtotal: row[5],
      discountType: row[6],
      discountAmount: row[7],
      grandTotal: row[8],
      paymentStatus: row[9],
      paymentMode: row[10],
      amountPaid: row[11],
      balance: row[12],
      patientName: row[16] + ' ' + row[17],
      doctorName: row[18]
    };
    
    res.json(invoice);
  } catch (error) {
    console.error('Error getting invoice:', error);
    res.status(500).json(null);
  }
});

app.get('/api/billing/metrics', (req, res) => {
  try {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    // Today's revenue
    const todayResult = db.exec(`
      SELECT SUM(grand_total) as total
      FROM billing
      WHERE DATE(invoice_date) = '${today}'
    `);
    const todayRevenue = (todayResult[0] && todayResult[0].values[0][0]) || 0;
    
    // Pending payments
    const pendingResult = db.exec(`
      SELECT SUM(balance) as total
      FROM billing
      WHERE payment_status != 'Paid' AND balance > 0
    `);
    const pendingPayments = (pendingResult[0] && pendingResult[0].values[0][0]) || 0;
    
    // Total invoices
    const countResult = db.exec(`SELECT COUNT(*) as count FROM billing`);
    const totalInvoices = (countResult[0] && countResult[0].values[0][0]) || 0;
    
    res.json({
      todayRevenue: todayRevenue,
      pendingPayments: pendingPayments,
      totalInvoices: totalInvoices
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ todayRevenue: 0, pendingPayments: 0, totalInvoices: 0 });
  }
});

// Appointment APIs
app.post('/api/appointments/create', (req, res) => {
  try {
    const db = getDatabase();
    const appointmentId = generateId('APT', 'appointments', 'appointment_id');
    const data = req.body;
    
    db.run(`
      INSERT INTO appointments (
        appointment_id, patient_id, doctor_id, appointment_date,
        appointment_time, purpose, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      appointmentId,
      data.patientId || '',
      data.doctorId || '',
      data.appointmentDate || '',
      data.appointmentTime || '',
      data.purpose || '',
      'Scheduled',
      data.notes || '',
      data.createdBy || ''
    ]);
    
    saveDatabase();
    res.json({ success: true, appointmentId });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/appointments/date/:date', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT a.*, p.first_name, p.last_name, d.name as doctor_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE a.appointment_date = '${req.params.date}'
      ORDER BY a.appointment_time
    `);
    
    if (!result[0]) {
      return res.json([]);
    }
    
    const appointments = result[0].values.map(row => ({
      appointmentId: row[0],
      patientId: row[1],
      doctorId: row[2],
      appointmentDate: row[3],
      appointmentTime: row[4],
      purpose: row[5],
      status: row[6],
      notes: row[7],
      patientName: row[11] + ' ' + row[12],
      doctorName: row[13]
    }));
    
    res.json(appointments);
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json([]);
  }
});

app.get('/api/appointments/patient/:patientId', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT a.*, d.name as doctor_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE a.patient_id = '${req.params.patientId}'
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `);
    
    if (!result[0]) {
      return res.json([]);
    }
    
    const appointments = result[0].values.map(row => ({
      appointmentId: row[0],
      patientId: row[1],
      doctorId: row[2],
      appointmentDate: row[3],
      appointmentTime: row[4],
      purpose: row[5],
      status: row[6],
      notes: row[7],
      doctorName: row[11]
    }));
    
    res.json(appointments);
  } catch (error) {
    console.error('Error getting patient appointments:', error);
    res.status(500).json([]);
  }
});

app.put('/api/appointments/update-status', (req, res) => {
  try {
    const db = getDatabase();
    const { appointmentId, status } = req.body;
    
    db.run(`
      UPDATE appointments
      SET status = ?
      WHERE appointment_id = ?
    `, [status, appointmentId]);
    
    saveDatabase();
    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server after database initialization with auto port finding
initializeDatabase().then(() => {
  const tryPort = (port) => {
    const server = app.listen(port)
      .on('listening', () => {
        console.log('');
        console.log('========================================');
        console.log('  Rizalcare EMR System');
        console.log('========================================');
        console.log(`  Server running on: http://localhost:${port}`);
        console.log('  Database: SQLite (rizalcare.db)');
        console.log('');
        console.log('  Default Login:');
        console.log('    Username: admin');
        console.log('    Password: admin123');
        console.log('========================================');
        console.log('');
        console.log(`  OPEN THIS IN YOUR BROWSER: http://localhost:${port}`);
        console.log('');
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying ${port + 1}...`);
          tryPort(port + 1);
        } else {
          console.error('Server error:', err);
          process.exit(1);
        }
      });
  };
  
  tryPort(PORT);
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
