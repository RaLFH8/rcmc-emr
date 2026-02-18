// Main entry point for the web app
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Rizalcare Medical Clinic - EMR System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Include HTML files
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Test endpoint to verify the web app is working
function testWebAppConnection() {
  Logger.log('Web app connection test called');
  return {
    success: true,
    message: 'Web app is connected and working',
    timestamp: new Date().toString()
  };
}

// EMERGENCY TEST - Call this from Apps Script to verify everything works
function emergencyTest() {
  Logger.log('=== EMERGENCY TEST START ===');
  
  // Test 1: Register a patient
  Logger.log('Test 1: Registering patient...');
  var testPatient = {
    firstName: 'Emergency',
    lastName: 'Test',
    dateOfBirth: '1995-05-15',
    gender: 'Female',
    contactNumber: '09999999999',
    patientType: 'New'
  };
  
  var registerResult = registerPatient(testPatient);
  Logger.log('Register result: ' + JSON.stringify(registerResult));
  
  // Test 2: Get all patients
  Logger.log('Test 2: Getting all patients...');
  var allPatients = getAllPatients();
  Logger.log('Total patients: ' + allPatients.length);
  allPatients.forEach(function(p) {
    Logger.log('  - ' + p.patientId + ': ' + p.firstName + ' ' + p.lastName);
  });
  
  // Test 3: Search patients
  Logger.log('Test 3: Searching for "Emergency"...');
  var searchResults = searchPatients('Emergency');
  Logger.log('Search results: ' + searchResults.length);
  
  Logger.log('=== EMERGENCY TEST COMPLETE ===');
  
  return {
    registerResult: registerResult,
    totalPatients: allPatients.length,
    searchResults: searchResults.length
  };
}

// Debug function to check everything from web app
function debugFromWebApp() {
  var result = {
    timestamp: new Date().toString(),
    tests: {}
  };
  
  try {
    // Test 1: Can we get spreadsheet?
    var ss = getSpreadsheet();
    result.tests.spreadsheet = {
      success: true,
      name: ss.getName(),
      id: ss.getId(),
      url: ss.getUrl()
    };
    
    // Test 2: Does Patients sheet exist?
    var sheet = ss.getSheetByName('Patients');
    if (sheet) {
      var rowCount = sheet.getLastRow();
      var colCount = sheet.getLastColumn();
      result.tests.patientsSheet = {
        success: true,
        exists: true,
        rows: rowCount,
        columns: colCount
      };
      
      // Test 3: Can we read data?
      var data = sheet.getDataRange().getValues();
      result.tests.readData = {
        success: true,
        totalRows: data.length,
        headers: data[0],
        sampleRow: data.length > 1 ? data[1] : null
      };
      
      // Test 4: Can we get patients?
      var patients = getAllPatients();
      result.tests.getAllPatients = {
        success: true,
        count: patients.length,
        patients: patients
      };
    } else {
      result.tests.patientsSheet = {
        success: false,
        exists: false,
        message: 'Patients sheet not found'
      };
    }
    
    result.overallSuccess = true;
  } catch (error) {
    result.overallSuccess = false;
    result.error = error.toString();
    result.stack = error.stack;
  }
  
  Logger.log('Debug result: ' + JSON.stringify(result));
  return result;
}

// Test function to check what patients exist
function testPatientSearch() {
  Logger.log('=== TESTING PATIENT SEARCH ===');
  
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Patients');
    
    if (!sheet) {
      Logger.log('ERROR: Patients sheet not found');
      return { success: false, message: 'Patients sheet not found' };
    }
    
    var data = sheet.getDataRange().getValues();
    Logger.log('Total rows (including header): ' + data.length);
    
    // Show all patients
    Logger.log('');
    Logger.log('ALL PATIENTS IN DATABASE:');
    Logger.log('─────────────────────────────────────────────────────────');
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) { // If Patient ID exists
        Logger.log('Row ' + (i+1) + ':');
        Logger.log('  Patient ID: ' + data[i][0]);
        Logger.log('  Name: ' + data[i][1] + ' ' + data[i][2]);
        Logger.log('  Contact: ' + data[i][5]);
        Logger.log('  Status: ' + data[i][15]);
        Logger.log('');
      }
    }
    
    // Test search with different terms
    Logger.log('TESTING SEARCH FUNCTION:');
    Logger.log('─────────────────────────────────────────────────────────');
    
    // Get first patient name if exists
    if (data.length > 1 && data[1][1]) {
      var testName = data[1][1]; // First name of first patient
      Logger.log('Searching for: "' + testName + '"');
      var results = searchPatients(testName);
      Logger.log('Results found: ' + results.length);
      
      if (results.length > 0) {
        Logger.log('PASS: Search is working!');
        results.forEach(function(patient) {
          Logger.log('  - ' + patient.patientId + ': ' + patient.firstName + ' ' + patient.lastName);
        });
      } else {
        Logger.log('FAIL: Search returned no results');
      }
    } else {
      Logger.log('No patients in database to test search');
    }
    
    Logger.log('');
    Logger.log('=== TEST COMPLETE ===');
    
    return {
      success: true,
      totalPatients: data.length - 1,
      message: 'Check execution log for details'
    };
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// Session management
function getUserSession() {
  var userProperties = PropertiesService.getUserProperties();
  var session = userProperties.getProperty('session');
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

function setUserSession(userData) {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('session', JSON.stringify(userData));
  return true;
}

function clearUserSession() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('session');
  return true;
}

// Authentication
function authenticateUser(username, password) {
  var ss = getSpreadsheet();
  var usersSheet = ss.getSheetByName('Users');
  var data = usersSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === username && data[i][2] === password && data[i][5] === 'Active') {
      var userData = {
        userId: data[i][0],
        username: data[i][1],
        role: data[i][3],
        name: data[i][4]
      };
      setUserSession(userData);
      return { success: true, user: userData };
    }
  }
  return { success: false, message: 'Invalid credentials' };
}

// Get or create spreadsheet
function getSpreadsheet() {
  try {
    // HARDCODED SPREADSHEET ID - Your existing spreadsheet
    var HARDCODED_SPREADSHEET_ID = '1E3w2cQo3wIHnEod0eMRnuArN5jaTAN3DunRrxgZNV1M';
    
    var scriptProperties = PropertiesService.getScriptProperties();
    var ssId = scriptProperties.getProperty('SPREADSHEET_ID');
    
    // If no stored ID, use the hardcoded one
    if (!ssId) {
      ssId = HARDCODED_SPREADSHEET_ID;
      scriptProperties.setProperty('SPREADSHEET_ID', ssId);
      Logger.log('Using hardcoded spreadsheet ID: ' + ssId);
    }
    
    // Open the spreadsheet
    var ss = SpreadsheetApp.openById(ssId);
    Logger.log('Successfully opened spreadsheet: ' + ss.getName());
    return ss;
  } catch (error) {
    Logger.log('Error in getSpreadsheet: ' + error.toString());
    throw new Error('Database connection error: ' + error.toString());
  }
}

// Initialize database sheets
function initializeDatabase(ss) {
  try {
    // Delete default sheet if it exists
    var sheets = ss.getSheets();
    if (sheets.length === 1 && sheets[0].getName() === 'Sheet1') {
      // We'll delete it after creating our sheets
    }
    
    createUsersSheet(ss);
    createPatientsSheet(ss);
    createDoctorsSheet(ss);
    createAppointmentsSheet(ss);
    createConsultationsSheet(ss);
    createItemsSheet(ss);
    createBillingSheet(ss);
    createPaymentsSheet(ss);
    
    // Delete default Sheet1 if it still exists
    sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName() === 'Sheet1') {
        ss.deleteSheet(sheets[i]);
        break;
      }
    }
    
    SpreadsheetApp.flush(); // Force save all changes
    Logger.log('Database initialized successfully');
  } catch (error) {
    Logger.log('Error initializing database: ' + error.toString());
    throw error;
  }
}

function createUsersSheet(ss) {
  try {
    var sheet = ss.getSheetByName('Users');
    if (!sheet) {
      sheet = ss.insertSheet('Users');
    }
    
    // Clear existing content
    sheet.clear();
    
    // Add headers
    sheet.appendRow(['User ID', 'Username', 'Password', 'Role', 'Name', 'Status', 'Created Date']);
    
    // Add default users
    sheet.appendRow(['U001', 'admin', 'admin123', 'Admin', 'System Administrator', 'Active', new Date()]);
    sheet.appendRow(['U002', 'doctor1', 'doc123', 'Doctor', 'Dr. Juan dela Cruz', 'Active', new Date()]);
    sheet.appendRow(['U003', 'reception', 'rec123', 'Reception', 'Maria Santos', 'Active', new Date()]);
    
    // Format header
    sheet.getRange(1, 1, 1, 7).setBackground('#4A90E2').setFontColor('#FFFFFF').setFontWeight('bold');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 7);
    
    SpreadsheetApp.flush();
    Logger.log('Users sheet created');
  } catch (error) {
    Logger.log('Error creating Users sheet: ' + error.toString());
    throw error;
  }
}

function createPatientsSheet(ss) {
  try {
    var sheet = ss.getSheetByName('Patients');
    if (!sheet) {
      sheet = ss.insertSheet('Patients');
    }
    
    sheet.clear();
    sheet.appendRow(['Patient ID', 'First Name', 'Last Name', 'Date of Birth', 'Gender', 'Contact Number', 
                     'Email', 'Address', 'Emergency Contact', 'Emergency Number', 'Blood Type', 
                     'Allergies', 'Medical History', 'Patient Type', 'Registration Date', 'Status']);
    sheet.getRange(1, 1, 1, 16).setBackground('#4A90E2').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.autoResizeColumns(1, 16);
    SpreadsheetApp.flush();
    Logger.log('Patients sheet created');
  } catch (error) {
    Logger.log('Error creating Patients sheet: ' + error.toString());
    throw error;
  }
}

function createDoctorsSheet(ss) {
  try {
    var sheet = ss.getSheetByName('Doctors');
    if (!sheet) {
      sheet = ss.insertSheet('Doctors');
    }
    
    sheet.clear();
    sheet.appendRow(['Doctor ID', 'Name', 'Specialization', 'License Number', 'Contact Number', 
                     'Email', 'Consultation Fee', 'Status', 'Created Date']);
    sheet.appendRow(['DOC001', 'Dr. Juan dela Cruz', 'General Practitioner', 'LIC123456', '09171234567', 
                     'juan@clinic.com', 500, 'Active', new Date()]);
    sheet.appendRow(['DOC002', 'Dr. Maria Santos', 'Pediatrician', 'LIC789012', '09187654321', 
                     'maria@clinic.com', 600, 'Active', new Date()]);
    sheet.getRange(1, 1, 1, 9).setBackground('#4A90E2').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.autoResizeColumns(1, 9);
    SpreadsheetApp.flush();
    Logger.log('Doctors sheet created');
  } catch (error) {
    Logger.log('Error creating Doctors sheet: ' + error.toString());
    throw error;
  }
}

function createAppointmentsSheet(ss) {
  try {
    var sheet = ss.getSheetByName('Appointments');
    if (!sheet) {
      sheet = ss.insertSheet('Appointments');
    }
    
    sheet.clear();
    sheet.appendRow(['Appointment ID', 'Patient ID', 'Doctor ID', 'Appointment Date', 'Appointment Time', 
                     'Purpose', 'Status', 'Notes', 'Created By', 'Created Date']);
    sheet.getRange(1, 1, 1, 10).setBackground('#4A90E2').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.autoResizeColumns(1, 10);
    SpreadsheetApp.flush();
    Logger.log('Appointments sheet created');
  } catch (error) {
    Logger.log('Error creating Appointments sheet: ' + error.toString());
    throw error;
  }
}

function createConsultationsSheet(ss) {
  try {
    var sheet = ss.getSheetByName('Consultations');
    if (!sheet) {
      sheet = ss.insertSheet('Consultations');
    }
    
    sheet.clear();
    sheet.appendRow(['Consultation ID', 'Patient ID', 'Doctor ID', 'Consultation Date', 'Chief Complaint', 
                     'Vital Signs', 'Diagnosis', 'Treatment Plan', 'Prescription', 'Follow Up Date', 
                     'Notes', 'Created Date']);
    sheet.getRange(1, 1, 1, 12).setBackground('#4A90E2').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.autoResizeColumns(1, 12);
    SpreadsheetApp.flush();
    Logger.log('Consultations sheet created');
  } catch (error) {
    Logger.log('Error creating Consultations sheet: ' + error.toString());
    throw error;
  }
}

function createItemsSheet(ss) {
  try {
    var sheet = ss.getSheetByName('Items');
    if (!sheet) {
      sheet = ss.insertSheet('Items');
    }
    
    sheet.clear();
    sheet.appendRow(['Item ID', 'Item Name', 'Category', 'Unit Price', 'Unit', 'Description', 'Status', 'Created Date']);
    // Sample items
    sheet.appendRow(['ITM001', 'General Consultation', 'Consultation', 500, 'per visit', 'Standard consultation', 'Active', new Date()]);
    sheet.appendRow(['ITM002', 'Follow-up Consultation', 'Consultation', 300, 'per visit', 'Follow-up visit', 'Active', new Date()]);
    sheet.appendRow(['ITM003', 'Complete Blood Count', 'Laboratory', 350, 'per test', 'CBC test', 'Active', new Date()]);
    sheet.appendRow(['ITM004', 'Urinalysis', 'Laboratory', 150, 'per test', 'Urine test', 'Active', new Date()]);
    sheet.appendRow(['ITM005', 'Blood Pressure Monitoring', 'Procedure', 100, 'per session', 'BP check', 'Active', new Date()]);
    sheet.appendRow(['ITM006', 'Amoxicillin 500mg', 'Medicine', 15, 'per capsule', 'Antibiotic', 'Active', new Date()]);
    sheet.appendRow(['ITM007', 'Paracetamol 500mg', 'Medicine', 5, 'per tablet', 'Pain reliever', 'Active', new Date()]);
    sheet.getRange(1, 1, 1, 8).setBackground('#4A90E2').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.autoResizeColumns(1, 8);
    SpreadsheetApp.flush();
    Logger.log('Items sheet created');
  } catch (error) {
    Logger.log('Error creating Items sheet: ' + error.toString());
    throw error;
  }
}

function createBillingSheet(ss) {
  try {
    var sheet = ss.getSheetByName('Billing');
    if (!sheet) {
      sheet = ss.insertSheet('Billing');
    }
    
    sheet.clear();
    sheet.appendRow(['Invoice ID', 'Patient ID', 'Doctor ID', 'Invoice Date', 'Items JSON', 'Subtotal', 
                     'Discount Type', 'Discount Amount', 'Grand Total', 'Payment Status', 
                     'Payment Mode', 'Amount Paid', 'Balance', 'Created By', 'Created Date']);
    sheet.getRange(1, 1, 1, 15).setBackground('#4A90E2').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.autoResizeColumns(1, 15);
    SpreadsheetApp.flush();
    Logger.log('Billing sheet created');
  } catch (error) {
    Logger.log('Error creating Billing sheet: ' + error.toString());
    throw error;
  }
}

function createPaymentsSheet(ss) {
  try {
    var sheet = ss.getSheetByName('Payments');
    if (!sheet) {
      sheet = ss.insertSheet('Payments');
    }
    
    sheet.clear();
    sheet.appendRow(['Payment ID', 'Invoice ID', 'Payment Date', 'Amount', 'Payment Mode', 
                     'Reference Number', 'Received By', 'Notes', 'Created Date']);
    sheet.getRange(1, 1, 1, 9).setBackground('#4A90E2').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.autoResizeColumns(1, 9);
    SpreadsheetApp.flush();
    Logger.log('Payments sheet created');
  } catch (error) {
    Logger.log('Error creating Payments sheet: ' + error.toString());
    throw error;
  }
}

// Patient Management Functions
function registerPatient(patientData) {
  try {
    Logger.log('=== REGISTER PATIENT START ===');
    Logger.log('Received data: ' + JSON.stringify(patientData));
    
    var ss = getSpreadsheet();
    Logger.log('Spreadsheet opened: ' + ss.getName());
    
    var sheet = ss.getSheetByName('Patients');
    if (!sheet) {
      Logger.log('ERROR: Patients sheet not found!');
      throw new Error('Patients sheet not found. Please run setupExistingSpreadsheet() first.');
    }
    Logger.log('Patients sheet found');
    
    var lastRow = sheet.getLastRow();
    Logger.log('Last row: ' + lastRow);
    
    var patientId = 'PAT' + String(lastRow).padStart(5, '0');
    Logger.log('Generated Patient ID: ' + patientId);
    
    var rowData = [
      patientId,
      patientData.firstName || '',
      patientData.lastName || '',
      patientData.dateOfBirth || '',
      patientData.gender || '',
      patientData.contactNumber || '',
      patientData.email || '',
      patientData.address || '',
      patientData.emergencyContact || '',
      patientData.emergencyNumber || '',
      patientData.bloodType || '',
      patientData.allergies || '',
      patientData.medicalHistory || '',
      patientData.patientType || 'New',
      new Date(),
      'Active'
    ];
    
    Logger.log('Row data prepared: ' + JSON.stringify(rowData));
    
    sheet.appendRow(rowData);
    Logger.log('Row appended');
    
    SpreadsheetApp.flush();
    Logger.log('Flush completed');
    
    // Verify the data was written
    var newLastRow = sheet.getLastRow();
    Logger.log('New last row: ' + newLastRow);
    
    if (newLastRow > lastRow) {
      Logger.log('✓ Patient registered successfully: ' + patientId);
      Logger.log('=== REGISTER PATIENT END (SUCCESS) ===');
      return { success: true, patientId: patientId };
    } else {
      Logger.log('✗ Row count did not increase!');
      Logger.log('=== REGISTER PATIENT END (FAILED) ===');
      return { success: false, message: 'Data was not written to sheet' };
    }
  } catch (error) {
    Logger.log('✗ Error registering patient: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    Logger.log('=== REGISTER PATIENT END (ERROR) ===');
    return { success: false, message: error.toString() };
  }
}

function searchPatients(searchTerm) {
  try {
    Logger.log('Searching patients with term: ' + searchTerm);
    
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Patients');
    
    if (!sheet) {
      Logger.log('Patients sheet not found');
      return [];
    }
    
    var data = sheet.getDataRange().getValues();
    Logger.log('Total rows in Patients sheet: ' + data.length);
    
    var results = [];
    var searchLower = searchTerm.toLowerCase().trim();
    
    // Skip header row (index 0), start from row 1
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      // Skip if status is not Active
      if (row[15] !== 'Active') continue;
      
      // Skip empty rows
      if (!row[0]) continue;
      
      // Build search string from: Patient ID, First Name, Last Name, Contact Number
      var patientId = String(row[0] || '').toLowerCase();
      var firstName = String(row[1] || '').toLowerCase();
      var lastName = String(row[2] || '').toLowerCase();
      var contactNumber = String(row[5] || '').toLowerCase();
      
      var searchString = patientId + ' ' + firstName + ' ' + lastName + ' ' + contactNumber;
      
      Logger.log('Row ' + i + ' search string: ' + searchString);
      
      // Check if search term is found in the search string
      if (searchString.indexOf(searchLower) !== -1) {
        results.push({
          patientId: row[0],
          firstName: row[1],
          lastName: row[2],
          dateOfBirth: row[3],
          gender: row[4],
          contactNumber: row[5],
          email: row[6],
          address: row[7],
          patientType: row[13]
        });
        Logger.log('Match found: ' + row[0] + ' - ' + row[1] + ' ' + row[2]);
      }
    }
    
    Logger.log('Search completed. Found ' + results.length + ' results');
    return results;
  } catch (error) {
    Logger.log('Error searching patients: ' + error.toString());
    return [];
  }
}

function getAllPatients() {
  try {
    Logger.log('=== getAllPatients called ===');
    Logger.log('Getting all patients');
    
    var ss = getSpreadsheet();
    Logger.log('Spreadsheet: ' + ss.getName() + ' (ID: ' + ss.getId() + ')');
    
    var sheet = ss.getSheetByName('Patients');
    
    if (!sheet) {
      Logger.log('ERROR: Patients sheet not found');
      return [];
    }
    
    Logger.log('Patients sheet found');
    
    var data = sheet.getDataRange().getValues();
    Logger.log('Total rows in Patients sheet: ' + data.length);
    
    // Log first few rows for debugging
    for (var i = 0; i < Math.min(3, data.length); i++) {
      Logger.log('Row ' + i + ': ' + JSON.stringify(data[i]));
    }
    
    var results = [];
    
    // Skip header row (index 0), start from row 1
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      Logger.log('Processing row ' + i + ': PatientID=' + row[0] + ', Status=' + row[15]);
      
      // Skip empty rows
      if (!row[0]) {
        Logger.log('  Skipping - no Patient ID');
        continue;
      }
      
      // Skip if status is not Active
      if (row[15] !== 'Active') {
        Logger.log('  Skipping - status is not Active: ' + row[15]);
        continue;
      }
      
      var patient = {
        patientId: row[0],
        firstName: row[1],
        lastName: row[2],
        dateOfBirth: row[3],
        gender: row[4],
        contactNumber: row[5],
        email: row[6],
        address: row[7],
        patientType: row[13]
      };
      
      results.push(patient);
      Logger.log('  Added patient: ' + patient.patientId + ' - ' + patient.firstName + ' ' + patient.lastName);
    }
    
    Logger.log('Total patients retrieved: ' + results.length);
    Logger.log('=== getAllPatients complete ===');
    return results;
  } catch (error) {
    Logger.log('ERROR in getAllPatients: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return [];
  }
}

function getPatientDetails(patientId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Patients');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === patientId) {
      return {
        patientId: data[i][0],
        firstName: data[i][1],
        lastName: data[i][2],
        dateOfBirth: data[i][3],
        gender: data[i][4],
        contactNumber: data[i][5],
        email: data[i][6],
        address: data[i][7],
        emergencyContact: data[i][8],
        emergencyNumber: data[i][9],
        bloodType: data[i][10],
        allergies: data[i][11],
        medicalHistory: data[i][12],
        patientType: data[i][13],
        registrationDate: data[i][14]
      };
    }
  }
  return null;
}

// Doctor Management Functions
function getAllDoctors(includeInactive) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Doctors');
  var data = sheet.getDataRange().getValues();
  var doctors = [];
  
  for (var i = 1; i < data.length; i++) {
    if (includeInactive || data[i][7] === 'Active') {
      doctors.push({
        doctorId: data[i][0],
        name: data[i][1],
        specialization: data[i][2],
        licenseNumber: data[i][3],
        contactNumber: data[i][4],
        email: data[i][5],
        consultationFee: data[i][6],
        status: data[i][7]
      });
    }
  }
  
  return doctors;
}

// Appointment Management Functions
function createAppointment(appointmentData) {
  try {
    Logger.log('Creating appointment: ' + JSON.stringify(appointmentData));
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Appointments');
    
    if (!sheet) {
      throw new Error('Appointments sheet not found');
    }
    
    var lastRow = sheet.getLastRow();
    var appointmentId = 'APT' + String(lastRow).padStart(5, '0');
    var session = getUserSession();
    
    var rowData = [
      appointmentId,
      appointmentData.patientId || '',
      appointmentData.doctorId || '',
      appointmentData.appointmentDate || '',
      appointmentData.appointmentTime || '',
      appointmentData.purpose || '',
      'Scheduled',
      appointmentData.notes || '',
      session ? session.username : 'System',
      new Date()
    ];
    
    sheet.appendRow(rowData);
    SpreadsheetApp.flush(); // Force save
    
    Logger.log('Appointment created successfully: ' + appointmentId);
    return { success: true, appointmentId: appointmentId };
  } catch (error) {
    Logger.log('Error creating appointment: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

function getAppointments(filterDate) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Appointments');
  var data = sheet.getDataRange().getValues();
  var appointments = [];
  
  for (var i = 1; i < data.length; i++) {
    var appointmentDate = new Date(data[i][3]);
    var filterDateObj = filterDate ? new Date(filterDate) : new Date();
    
    if (appointmentDate.toDateString() === filterDateObj.toDateString()) {
      var patientDetails = getPatientDetails(data[i][1]);
      var doctorDetails = getDoctorDetails(data[i][2]);
      
      appointments.push({
        appointmentId: data[i][0],
        patientId: data[i][1],
        patientName: patientDetails ? patientDetails.firstName + ' ' + patientDetails.lastName : 'Unknown',
        doctorId: data[i][2],
        doctorName: doctorDetails ? doctorDetails.name : 'Unknown',
        appointmentDate: data[i][3],
        appointmentTime: data[i][4],
        purpose: data[i][5],
        status: data[i][6],
        notes: data[i][7]
      });
    }
  }
  
  return appointments;
}

function getDoctorDetails(doctorId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Doctors');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === doctorId) {
      return {
        doctorId: data[i][0],
        name: data[i][1],
        specialization: data[i][2],
        licenseNumber: data[i][3],
        contactNumber: data[i][4],
        email: data[i][5],
        consultationFee: data[i][6],
        status: data[i][7]
      };
    }
  }
  return null;
}

// Add new doctor
function addDoctor(doctorData) {
  try {
    Logger.log('Adding doctor: ' + JSON.stringify(doctorData));
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Doctors');
    
    if (!sheet) {
      throw new Error('Doctors sheet not found');
    }
    
    var lastRow = sheet.getLastRow();
    var doctorId = 'DOC' + String(lastRow).padStart(3, '0');
    
    var rowData = [
      doctorId,
      doctorData.name || '',
      doctorData.specialization || '',
      doctorData.licenseNumber || '',
      doctorData.contactNumber || '',
      doctorData.email || '',
      parseFloat(doctorData.consultationFee) || 0,
      'Active',
      new Date()
    ];
    
    sheet.appendRow(rowData);
    SpreadsheetApp.flush(); // Force save
    
    Logger.log('Doctor added successfully: ' + doctorId);
    return { success: true, doctorId: doctorId };
  } catch (error) {
    Logger.log('Error adding doctor: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// Update doctor information
function updateDoctor(doctorData) {
  try {
    Logger.log('Updating doctor: ' + JSON.stringify(doctorData));
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Doctors');
    
    if (!sheet) {
      throw new Error('Doctors sheet not found');
    }
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === doctorData.doctorId) {
        sheet.getRange(i + 1, 2).setValue(doctorData.name || '');
        sheet.getRange(i + 1, 3).setValue(doctorData.specialization || '');
        sheet.getRange(i + 1, 4).setValue(doctorData.licenseNumber || '');
        sheet.getRange(i + 1, 5).setValue(doctorData.contactNumber || '');
        sheet.getRange(i + 1, 6).setValue(doctorData.email || '');
        sheet.getRange(i + 1, 7).setValue(parseFloat(doctorData.consultationFee) || 0);
        sheet.getRange(i + 1, 8).setValue(doctorData.status || 'Active');
        
        SpreadsheetApp.flush(); // Force save
        Logger.log('Doctor updated successfully: ' + doctorData.doctorId);
        return { success: true, message: 'Doctor updated successfully' };
      }
    }
    
    return { success: false, message: 'Doctor not found' };
  } catch (error) {
    Logger.log('Error updating doctor: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// Delete/Deactivate doctor
function deactivateDoctor(doctorId) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Doctors');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === doctorId) {
        sheet.getRange(i + 1, 8).setValue('Inactive');
        return { success: true, message: 'Doctor deactivated successfully' };
      }
    }
    
    return { success: false, message: 'Doctor not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Item Management Functions
function getAllItems(includeInactive) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Items');
  var data = sheet.getDataRange().getValues();
  var items = [];
  
  for (var i = 1; i < data.length; i++) {
    if (includeInactive || data[i][6] === 'Active') {
      items.push({
        itemId: data[i][0],
        itemName: data[i][1],
        category: data[i][2],
        unitPrice: data[i][3],
        unit: data[i][4],
        description: data[i][5],
        status: data[i][6]
      });
    }
  }
  
  return items;
}

function getItemsByCategory(category) {
  var allItems = getAllItems();
  return allItems.filter(function(item) {
    return item.category === category;
  });
}

function getItemDetails(itemId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Items');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === itemId) {
      return {
        itemId: data[i][0],
        itemName: data[i][1],
        category: data[i][2],
        unitPrice: data[i][3],
        unit: data[i][4],
        description: data[i][5],
        status: data[i][6]
      };
    }
  }
  return null;
}

// Add new item
function addItem(itemData) {
  try {
    Logger.log('Adding item: ' + JSON.stringify(itemData));
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Items');
    
    if (!sheet) {
      throw new Error('Items sheet not found');
    }
    
    var lastRow = sheet.getLastRow();
    var itemId = 'ITM' + String(lastRow).padStart(3, '0');
    
    var rowData = [
      itemId,
      itemData.itemName || '',
      itemData.category || '',
      parseFloat(itemData.unitPrice) || 0,
      itemData.unit || '',
      itemData.description || '',
      'Active',
      new Date()
    ];
    
    sheet.appendRow(rowData);
    SpreadsheetApp.flush(); // Force save
    
    Logger.log('Item added successfully: ' + itemId);
    return { success: true, itemId: itemId };
  } catch (error) {
    Logger.log('Error adding item: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// Update item information
function updateItem(itemData) {
  try {
    Logger.log('Updating item: ' + JSON.stringify(itemData));
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Items');
    
    if (!sheet) {
      throw new Error('Items sheet not found');
    }
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === itemData.itemId) {
        sheet.getRange(i + 1, 2).setValue(itemData.itemName || '');
        sheet.getRange(i + 1, 3).setValue(itemData.category || '');
        sheet.getRange(i + 1, 4).setValue(parseFloat(itemData.unitPrice) || 0);
        sheet.getRange(i + 1, 5).setValue(itemData.unit || '');
        sheet.getRange(i + 1, 6).setValue(itemData.description || '');
        sheet.getRange(i + 1, 7).setValue(itemData.status || 'Active');
        
        SpreadsheetApp.flush(); // Force save
        Logger.log('Item updated successfully: ' + itemData.itemId);
        return { success: true, message: 'Item updated successfully' };
      }
    }
    
    return { success: false, message: 'Item not found' };
  } catch (error) {
    Logger.log('Error updating item: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// Delete/Deactivate item
function deleteItem(itemId) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Items');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === itemId) {
        sheet.getRange(i + 1, 7).setValue('Inactive');
        return { success: true, message: 'Item deactivated successfully' };
      }
    }
    
    return { success: false, message: 'Item not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Billing Functions
function createInvoice(billingData) {
  try {
    Logger.log('Creating invoice: ' + JSON.stringify(billingData));
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Billing');
    
    if (!sheet) {
      throw new Error('Billing sheet not found');
    }
    
    var lastRow = sheet.getLastRow();
    var invoiceId = 'INV' + String(lastRow).padStart(5, '0');
    var session = getUserSession();
    
    // Calculate discount
    var subtotal = parseFloat(billingData.subtotal) || 0;
    var discountAmount = 0;
    var discountType = billingData.discountType || 'None';
    
    if (discountType === 'Senior Citizen' || discountType === 'PWD') {
      discountAmount = subtotal * 0.20;
    }
    
    var grandTotal = subtotal - discountAmount;
    var amountPaid = parseFloat(billingData.amountPaid) || 0;
    var balance = grandTotal - amountPaid;
    var paymentStatus = balance <= 0 ? 'Paid' : (amountPaid > 0 ? 'Partial' : 'Unpaid');
    
    var rowData = [
      invoiceId,
      billingData.patientId || '',
      billingData.doctorId || '',
      new Date(),
      JSON.stringify(billingData.items || []),
      subtotal,
      discountType,
      discountAmount,
      grandTotal,
      paymentStatus,
      billingData.paymentMode || '',
      amountPaid,
      balance,
      session ? session.username : 'System',
      new Date()
    ];
    
    sheet.appendRow(rowData);
    SpreadsheetApp.flush(); // Force save
    
    Logger.log('Invoice created successfully: ' + invoiceId);
    return { success: true, invoiceId: invoiceId, grandTotal: grandTotal, balance: balance };
  } catch (error) {
    Logger.log('Error creating invoice: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

function getInvoiceDetails(invoiceId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Billing');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === invoiceId) {
      var patientDetails = getPatientDetails(data[i][1]);
      var doctorDetails = getDoctorDetails(data[i][2]);
      
      return {
        invoiceId: data[i][0],
        patientId: data[i][1],
        patientName: patientDetails ? patientDetails.firstName + ' ' + patientDetails.lastName : 'Unknown',
        doctorId: data[i][2],
        doctorName: doctorDetails ? doctorDetails.name : 'Unknown',
        invoiceDate: data[i][3],
        items: JSON.parse(data[i][4]),
        subtotal: data[i][5],
        discountType: data[i][6],
        discountAmount: data[i][7],
        grandTotal: data[i][8],
        paymentStatus: data[i][9],
        paymentMode: data[i][10],
        amountPaid: data[i][11],
        balance: data[i][12]
      };
    }
  }
  return null;
}

// Dashboard Analytics Functions
function getDashboardMetrics(dateFilter) {
  var ss = getSpreadsheet();
  var today = dateFilter ? new Date(dateFilter) : new Date();
  today.setHours(0, 0, 0, 0);
  
  // Patient metrics
  var patientsSheet = ss.getSheetByName('Patients');
  var patientsData = patientsSheet.getDataRange().getValues();
  var totalPatients = patientsData.length - 1;
  var newPatientsToday = 0;
  
  for (var i = 1; i < patientsData.length; i++) {
    var regDate = new Date(patientsData[i][14]);
    regDate.setHours(0, 0, 0, 0);
    if (regDate.getTime() === today.getTime()) {
      newPatientsToday++;
    }
  }
  
  // Consultation metrics
  var appointmentsSheet = ss.getSheetByName('Appointments');
  var appointmentsData = appointmentsSheet.getDataRange().getValues();
  var consultationsToday = 0;
  var consultationsByDoctor = {};
  
  for (var i = 1; i < appointmentsData.length; i++) {
    var aptDate = new Date(appointmentsData[i][3]);
    aptDate.setHours(0, 0, 0, 0);
    if (aptDate.getTime() === today.getTime()) {
      consultationsToday++;
      var doctorId = appointmentsData[i][2];
      consultationsByDoctor[doctorId] = (consultationsByDoctor[doctorId] || 0) + 1;
    }
  }
  
  // Financial metrics
  var billingSheet = ss.getSheetByName('Billing');
  var billingData = billingSheet.getDataRange().getValues();
  var dailyIncome = 0;
  var weeklyIncome = 0;
  var monthlyIncome = 0;
  var outstandingBalance = 0;
  var revenueByCategory = {};
  
  var weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  for (var i = 1; i < billingData.length; i++) {
    var invoiceDate = new Date(billingData[i][3]);
    invoiceDate.setHours(0, 0, 0, 0);
    var amountPaid = parseFloat(billingData[i][11]) || 0;
    var balance = parseFloat(billingData[i][12]) || 0;
    
    if (invoiceDate.getTime() === today.getTime()) {
      dailyIncome += amountPaid;
    }
    if (invoiceDate >= weekStart) {
      weeklyIncome += amountPaid;
    }
    if (invoiceDate >= monthStart) {
      monthlyIncome += amountPaid;
    }
    
    outstandingBalance += balance;
    
    // Revenue by category
    var items = JSON.parse(billingData[i][4]);
    for (var j = 0; j < items.length; j++) {
      var category = items[j].category;
      var amount = parseFloat(items[j].total);
      revenueByCategory[category] = (revenueByCategory[category] || 0) + amount;
    }
  }
  
  return {
    patientMetrics: {
      totalPatients: totalPatients,
      newPatientsToday: newPatientsToday,
      consultationsToday: consultationsToday,
      consultationsByDoctor: consultationsByDoctor
    },
    financialMetrics: {
      dailyIncome: dailyIncome,
      weeklyIncome: weeklyIncome,
      monthlyIncome: monthlyIncome,
      outstandingBalance: outstandingBalance
    },
    revenueByCategory: revenueByCategory
  };
}

function getIncomeReport(startDate, endDate) {
  var ss = getSpreadsheet();
  var billingSheet = ss.getSheetByName('Billing');
  var billingData = billingSheet.getDataRange().getValues();
  
  var start = new Date(startDate);
  var end = new Date(endDate);
  var totalRevenue = 0;
  var doctorRevenue = {};
  var dailyRevenue = {};
  
  for (var i = 1; i < billingData.length; i++) {
    var invoiceDate = new Date(billingData[i][3]);
    
    if (invoiceDate >= start && invoiceDate <= end) {
      var grandTotal = parseFloat(billingData[i][8]) || 0;
      var doctorId = billingData[i][2];
      var dateKey = invoiceDate.toISOString().split('T')[0];
      
      totalRevenue += grandTotal;
      doctorRevenue[doctorId] = (doctorRevenue[doctorId] || 0) + grandTotal;
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + grandTotal;
    }
  }
  
  return {
    totalRevenue: totalRevenue,
    doctorRevenue: doctorRevenue,
    dailyRevenue: dailyRevenue
  };
}

// Consultation Functions
function createConsultation(consultationData) {
  try {
    Logger.log('Creating consultation: ' + JSON.stringify(consultationData));
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Consultations');
    
    if (!sheet) {
      throw new Error('Consultations sheet not found');
    }
    
    var lastRow = sheet.getLastRow();
    var consultationId = 'CON' + String(lastRow).padStart(5, '0');
    
    var rowData = [
      consultationId,
      consultationData.patientId || '',
      consultationData.doctorId || '',
      new Date(),
      consultationData.chiefComplaint || '',
      consultationData.vitalSigns || '',
      consultationData.diagnosis || '',
      consultationData.treatmentPlan || '',
      consultationData.prescription || '',
      consultationData.followUpDate || '',
      consultationData.notes || '',
      new Date()
    ];
    
    sheet.appendRow(rowData);
    SpreadsheetApp.flush(); // Force save
    
    Logger.log('Consultation created successfully: ' + consultationId);
    return { success: true, consultationId: consultationId };
  } catch (error) {
    Logger.log('Error creating consultation: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

function getPatientConsultations(patientId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Consultations');
  var data = sheet.getDataRange().getValues();
  var consultations = [];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === patientId) {
      var doctorDetails = getDoctorDetails(data[i][2]);
      consultations.push({
        consultationId: data[i][0],
        doctorName: doctorDetails ? doctorDetails.name : 'Unknown',
        consultationDate: data[i][3],
        chiefComplaint: data[i][4],
        diagnosis: data[i][6],
        treatmentPlan: data[i][7],
        prescription: data[i][8]
      });
    }
  }
  
  return consultations.reverse();
}

// Test function to verify database connection
function testDatabaseConnection() {
  try {
    var ss = getSpreadsheet();
    var sheets = ss.getSheets();
    var sheetNames = [];
    
    for (var i = 0; i < sheets.length; i++) {
      sheetNames.push(sheets[i].getName());
    }
    
    Logger.log('Database connected successfully');
    Logger.log('Spreadsheet ID: ' + ss.getId());
    Logger.log('Spreadsheet URL: ' + ss.getUrl());
    Logger.log('Available sheets: ' + sheetNames.join(', '));
    
    return {
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      sheets: sheetNames
    };
  } catch (error) {
    Logger.log('Database connection error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// Function to manually set spreadsheet ID
function setSpreadsheetId(spreadsheetId) {
  try {
    var scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('SPREADSHEET_ID', spreadsheetId);
    
    // Test if we can open it
    var ss = SpreadsheetApp.openById(spreadsheetId);
    
    Logger.log('Spreadsheet ID set successfully');
    Logger.log('Spreadsheet Name: ' + ss.getName());
    Logger.log('Spreadsheet URL: ' + ss.getUrl());
    
    return {
      success: true,
      message: 'Spreadsheet ID set successfully',
      url: ss.getUrl()
    };
  } catch (error) {
    Logger.log('Error setting spreadsheet ID: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// OPTION A: Run this function to create all sheets in your existing spreadsheet
function setupExistingSpreadsheet() {
  try {
    Logger.log('=== STARTING SPREADSHEET SETUP ===');
    
    // Get your spreadsheet
    var ss = getSpreadsheet();
    Logger.log('✓ Opened spreadsheet: ' + ss.getName());
    Logger.log('  URL: ' + ss.getUrl());
    
    // Initialize all sheets
    Logger.log('Creating/updating sheets...');
    initializeDatabase(ss);
    
    Logger.log('✓ All sheets created successfully!');
    Logger.log('=== SETUP COMPLETE ===');
    Logger.log('');
    Logger.log('Your spreadsheet is ready to use!');
    Logger.log('Spreadsheet URL: ' + ss.getUrl());
    
    return {
      success: true,
      message: 'Spreadsheet setup completed successfully',
      url: ss.getUrl()
    };
  } catch (error) {
    Logger.log('✗ Error during setup: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// COMPREHENSIVE DIAGNOSTIC - Run this to check everything
function runFullDiagnostic() {
  Logger.log('');
  Logger.log('========================================================');
  Logger.log('     RIZALCARE EMR - FULL SYSTEM DIAGNOSTIC            ');
  Logger.log('========================================================');
  Logger.log('');
  
  var allPassed = true;
  
  // Test 1: Spreadsheet Connection
  Logger.log('TEST 1: Spreadsheet Connection');
  Logger.log('─────────────────────────────────────────────────────────');
  try {
    var ss = getSpreadsheet();
    Logger.log('✓ PASS: Spreadsheet opened successfully');
    Logger.log('  Name: ' + ss.getName());
    Logger.log('  ID: ' + ss.getId());
    Logger.log('  URL: ' + ss.getUrl());
  } catch (e) {
    Logger.log('✗ FAIL: Cannot open spreadsheet');
    Logger.log('  Error: ' + e.toString());
    allPassed = false;
    return;
  }
  Logger.log('');
  
  // Test 2: Sheet Existence
  Logger.log('TEST 2: Required Sheets');
  Logger.log('─────────────────────────────────────────────────────────');
  var requiredSheets = ['Users', 'Patients', 'Doctors', 'Appointments', 'Consultations', 'Items', 'Billing', 'Payments'];
  var missingSheets = [];
  
  requiredSheets.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      var rows = sheet.getLastRow();
      var cols = sheet.getLastColumn();
      Logger.log('✓ ' + sheetName + ': EXISTS (' + rows + ' rows, ' + cols + ' columns)');
    } else {
      Logger.log('✗ ' + sheetName + ': MISSING');
      missingSheets.push(sheetName);
      allPassed = false;
    }
  });
  
    if (missingSheets.length > 0) {
    Logger.log('');
    Logger.log('WARNING: Missing sheets detected: ' + missingSheets.join(', '));
    Logger.log('  Run setupExistingSpreadsheet() to create them');
  }
  Logger.log('');
  
  // Test 3: Write Permission
  Logger.log('TEST 3: Write Permission');
  Logger.log('─────────────────────────────────────────────────────────');
  try {
    var testSheet = ss.getSheetByName('Patients');
    if (testSheet) {
      var beforeCount = testSheet.getLastRow();
      
      // Try to write a test row
      var testRow = ['TEST_' + new Date().getTime(), 'Test', 'Write', '', '', '', '', '', '', '', '', '', '', 'Test', new Date(), 'Test'];
      testSheet.appendRow(testRow);
      SpreadsheetApp.flush();
      
      var afterCount = testSheet.getLastRow();
      
      if (afterCount > beforeCount) {
        Logger.log('✓ PASS: Can write to spreadsheet');
        Logger.log('  Before: ' + beforeCount + ' rows');
        Logger.log('  After: ' + afterCount + ' rows');
        
        // Clean up test row
        testSheet.deleteRow(afterCount);
        SpreadsheetApp.flush();
        Logger.log('  Test row cleaned up');
      } else {
        Logger.log('✗ FAIL: Write did not increase row count');
        allPassed = false;
      }
    } else {
      Logger.log('✗ FAIL: Patients sheet not found');
      allPassed = false;
    }
  } catch (e) {
    Logger.log('✗ FAIL: Cannot write to spreadsheet');
    Logger.log('  Error: ' + e.toString());
    allPassed = false;
  }
  Logger.log('');
  
  // Test 4: Script Properties
  Logger.log('TEST 4: Script Properties');
  Logger.log('─────────────────────────────────────────────────────────');
  try {
    var scriptProperties = PropertiesService.getScriptProperties();
    var storedId = scriptProperties.getProperty('SPREADSHEET_ID');
    
    if (storedId) {
      Logger.log('✓ PASS: Spreadsheet ID is stored');
      Logger.log('  Stored ID: ' + storedId);
      Logger.log('  Current ID: ' + ss.getId());
      
      if (storedId === ss.getId()) {
        Logger.log('  ✓ IDs match');
      } else {
        Logger.log('  ⚠ IDs do not match!');
      }
    } else {
      Logger.log('⚠ WARNING: No spreadsheet ID stored');
      Logger.log('  Setting it now...');
      scriptProperties.setProperty('SPREADSHEET_ID', ss.getId());
      Logger.log('  ✓ Spreadsheet ID stored');
    }
  } catch (e) {
    Logger.log('✗ FAIL: Cannot access script properties');
    Logger.log('  Error: ' + e.toString());
    allPassed = false;
  }
  Logger.log('');
  
  // Test 5: Sample Data
  Logger.log('TEST 5: Sample Data');
  Logger.log('─────────────────────────────────────────────────────────');
  try {
    var usersSheet = ss.getSheetByName('Users');
    var doctorsSheet = ss.getSheetByName('Doctors');
    var itemsSheet = ss.getSheetByName('Items');
    
    if (usersSheet && usersSheet.getLastRow() > 1) {
      Logger.log('✓ Users sheet has data (' + (usersSheet.getLastRow() - 1) + ' users)');
    } else {
      Logger.log('⚠ Users sheet is empty');
    }
    
    if (doctorsSheet && doctorsSheet.getLastRow() > 1) {
      Logger.log('✓ Doctors sheet has data (' + (doctorsSheet.getLastRow() - 1) + ' doctors)');
    } else {
      Logger.log('⚠ Doctors sheet is empty');
    }
    
    if (itemsSheet && itemsSheet.getLastRow() > 1) {
      Logger.log('✓ Items sheet has data (' + (itemsSheet.getLastRow() - 1) + ' items)');
    } else {
      Logger.log('⚠ Items sheet is empty');
    }
  } catch (e) {
    Logger.log('✗ FAIL: Cannot check sample data');
    Logger.log('  Error: ' + e.toString());
  }
  Logger.log('');
  
  // Final Result
  Logger.log('========================================================');
  if (allPassed) {
    Logger.log('  ALL TESTS PASSED - SYSTEM IS READY                 ');
  } else {
    Logger.log('  SOME TESTS FAILED - SEE DETAILS ABOVE              ');
  }
  Logger.log('========================================================');
  Logger.log('');
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
  Logger.log('');
  
  return {
    success: allPassed,
    spreadsheetUrl: ss.getUrl()
  };
}

// Function to test writing data
function testWriteData() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Patients');
    
    if (!sheet) {
      return { success: false, message: 'Patients sheet not found' };
    }
    
    var testData = [
      'TEST001',
      'Test',
      'Patient',
      '1990-01-01',
      'Male',
      '09123456789',
      'test@email.com',
      'Test Address',
      'Emergency Contact',
      '09987654321',
      'O+',
      'None',
      'None',
      'New',
      new Date(),
      'Active'
    ];
    
    sheet.appendRow(testData);
    SpreadsheetApp.flush();
    
    Logger.log('Test data written successfully');
    return {
      success: true,
      message: 'Test patient added successfully',
      patientId: 'TEST001'
    };
  } catch (error) {
    Logger.log('Error writing test data: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// Function to get spreadsheet URL for user
function getSpreadsheetUrl() {
  try {
    var ss = getSpreadsheet();
    return {
      success: true,
      url: ss.getUrl(),
      id: ss.getId()
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}
