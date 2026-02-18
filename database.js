const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'rizalcare.db');
let db = null;

// Initialize SQL.js database
async function initializeDatabase() {
  console.log('Initializing database...');
  
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('Existing database loaded');
  } else {
    db = new SQL.Database();
    console.log('New database created');
  }
  
  // Create tables
  createTables();
  
  // Insert default data
  insertDefaultData();
  
  // Save database
  saveDatabase();
  
  console.log('Database initialized successfully');
}

function createTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      created_date TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Patients table
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      patient_id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth TEXT,
      gender TEXT,
      contact_number TEXT,
      email TEXT,
      address TEXT,
      emergency_contact TEXT,
      emergency_number TEXT,
      blood_type TEXT,
      allergies TEXT,
      medical_history TEXT,
      patient_type TEXT DEFAULT 'New',
      registration_date TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'Active'
    )
  `);

  // Doctors table
  db.run(`
    CREATE TABLE IF NOT EXISTS doctors (
      doctor_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialization TEXT,
      license_number TEXT,
      contact_number TEXT,
      email TEXT,
      consultation_fee REAL DEFAULT 0,
      status TEXT DEFAULT 'Active',
      created_date TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Appointments table
  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      appointment_id TEXT PRIMARY KEY,
      patient_id TEXT,
      doctor_id TEXT,
      appointment_date TEXT,
      appointment_time TEXT,
      purpose TEXT,
      status TEXT DEFAULT 'Scheduled',
      notes TEXT,
      created_by TEXT,
      created_date TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Consultations table
  db.run(`
    CREATE TABLE IF NOT EXISTS consultations (
      consultation_id TEXT PRIMARY KEY,
      patient_id TEXT,
      doctor_id TEXT,
      consultation_date TEXT DEFAULT CURRENT_TIMESTAMP,
      chief_complaint TEXT,
      vital_signs TEXT,
      diagnosis TEXT,
      treatment_plan TEXT,
      prescription TEXT,
      follow_up_date TEXT,
      notes TEXT,
      created_date TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Items table
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      item_id TEXT PRIMARY KEY,
      item_name TEXT NOT NULL,
      category TEXT,
      unit_price REAL DEFAULT 0,
      unit TEXT,
      description TEXT,
      status TEXT DEFAULT 'Active',
      created_date TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Billing table
  db.run(`
    CREATE TABLE IF NOT EXISTS billing (
      invoice_id TEXT PRIMARY KEY,
      patient_id TEXT,
      doctor_id TEXT,
      invoice_date TEXT DEFAULT CURRENT_TIMESTAMP,
      items_json TEXT,
      subtotal REAL DEFAULT 0,
      discount_type TEXT,
      discount_amount REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'Unpaid',
      payment_mode TEXT,
      amount_paid REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      created_by TEXT,
      created_date TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Payments table
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      payment_id TEXT PRIMARY KEY,
      invoice_id TEXT,
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      amount REAL DEFAULT 0,
      payment_mode TEXT,
      reference_number TEXT,
      received_by TEXT,
      notes TEXT,
      created_date TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables created');
}

function insertDefaultData() {
  // Check if users exist
  const userCount = db.exec('SELECT COUNT(*) as count FROM users');
  
  if (!userCount[0] || userCount[0].values[0][0] === 0) {
    console.log('Inserting default users...');
    
    db.run(`INSERT INTO users (user_id, username, password, role, name, status) VALUES (?, ?, ?, ?, ?, ?)`,
      ['U001', 'admin', 'admin123', 'Admin', 'System Administrator', 'Active']);
    db.run(`INSERT INTO users (user_id, username, password, role, name, status) VALUES (?, ?, ?, ?, ?, ?)`,
      ['U002', 'doctor1', 'doc123', 'Doctor', 'Dr. Juan dela Cruz', 'Active']);
    db.run(`INSERT INTO users (user_id, username, password, role, name, status) VALUES (?, ?, ?, ?, ?, ?)`,
      ['U003', 'reception', 'rec123', 'Reception', 'Maria Santos', 'Active']);
    
    console.log('Default users created');
    saveDatabase();
  }

  // Check if doctors exist
  const doctorCount = db.exec('SELECT COUNT(*) as count FROM doctors');
  
  if (!doctorCount[0] || doctorCount[0].values[0][0] === 0) {
    console.log('Inserting default doctors...');
    
    db.run(`INSERT INTO doctors (doctor_id, name, specialization, license_number, contact_number, email, consultation_fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['DOC001', 'Dr. Juan dela Cruz', 'General Practitioner', 'LIC123456', '09171234567', 'juan@clinic.com', 500, 'Active']);
    db.run(`INSERT INTO doctors (doctor_id, name, specialization, license_number, contact_number, email, consultation_fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['DOC002', 'Dr. Maria Santos', 'Pediatrician', 'LIC789012', '09187654321', 'maria@clinic.com', 600, 'Active']);
    
    console.log('Default doctors created');
    saveDatabase();
  }

  // Check if items exist
  const itemCount = db.exec('SELECT COUNT(*) as count FROM items');
  
  if (!itemCount[0] || itemCount[0].values[0][0] === 0) {
    console.log('Inserting default items...');
    
    db.run(`INSERT INTO items (item_id, item_name, category, unit_price, unit, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ITM001', 'General Consultation', 'Consultation', 500, 'per visit', 'Standard consultation', 'Active']);
    db.run(`INSERT INTO items (item_id, item_name, category, unit_price, unit, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ITM002', 'Follow-up Consultation', 'Consultation', 300, 'per visit', 'Follow-up visit', 'Active']);
    db.run(`INSERT INTO items (item_id, item_name, category, unit_price, unit, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ITM003', 'Complete Blood Count', 'Laboratory', 350, 'per test', 'CBC test', 'Active']);
    db.run(`INSERT INTO items (item_id, item_name, category, unit_price, unit, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ITM004', 'Urinalysis', 'Laboratory', 150, 'per test', 'Urine test', 'Active']);
    db.run(`INSERT INTO items (item_id, item_name, category, unit_price, unit, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ITM005', 'Blood Pressure Monitoring', 'Procedure', 100, 'per session', 'BP check', 'Active']);
    db.run(`INSERT INTO items (item_id, item_name, category, unit_price, unit, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ITM006', 'Amoxicillin 500mg', 'Medicine', 15, 'per capsule', 'Antibiotic', 'Active']);
    db.run(`INSERT INTO items (item_id, item_name, category, unit_price, unit, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ITM007', 'Paracetamol 500mg', 'Medicine', 5, 'per tablet', 'Pain reliever', 'Active']);
    
    console.log('Default items created');
    saveDatabase();
  }
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function getDatabase() {
  return db;
}

// Helper function to generate IDs
function generateId(prefix, table, idColumn) {
  const result = db.exec(`SELECT ${idColumn} FROM ${table} ORDER BY ${idColumn} DESC LIMIT 1`);
  
  if (!result[0] || result[0].values.length === 0) {
    return `${prefix}00001`;
  }
  
  const lastId = result[0].values[0][0];
  const numPart = parseInt(lastId.replace(prefix, '')) + 1;
  return `${prefix}${String(numPart).padStart(5, '0')}`;
}

module.exports = {
  initializeDatabase,
  getDatabase,
  saveDatabase,
  generateId
};
