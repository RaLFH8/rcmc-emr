# Troubleshooting Guide - Rizalcare EMR System

## Common Issues and Solutions

### Issue: Data Not Saving to Google Sheets

#### Symptoms:
- Forms submit successfully but data doesn't appear in spreadsheet
- Success messages show but no records in database
- Data disappears after page refresh

#### Solutions:

**1. Check Spreadsheet Exists**
- Go to Google Drive (https://drive.google.com/)
- Search for "Rizalcare_EMR_Database"
- If not found, the database wasn't created

**2. Verify Script Permissions**
- Open Apps Script editor
- Click "Run" > "testDatabaseConnection"
- If prompted, authorize the script
- Check "Execution log" for results

**3. Check Spreadsheet ID**
- In Apps Script, go to "Project Settings"
- Click "Script Properties"
- Look for "SPREADSHEET_ID"
- If missing, delete and redeploy

**4. Force Database Recreation**
```javascript
// In Apps Script editor, run this function:
function resetDatabase() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty('SPREADSHEET_ID');
  // Now reload the web app to recreate database
}
```

**5. Check Sheet Names**
- Open the spreadsheet
- Verify these sheets exist:
  - Users
  - Patients
  - Doctors
  - Appointments
  - Consultations
  - Items
  - Billing
  - Payments

**6. Verify Write Permissions**
- Open the spreadsheet
- Check if you can manually edit cells
- If not, check sharing settings
- Script must have edit access

---

### Issue: "Authorization Required" Error

#### Symptoms:
- Can't access the web app
- "Authorization required" message appears
- Script won't run

#### Solutions:

**1. Grant Permissions**
- Click "Authorize access"
- Select your Google account
- Click "Allow"
- Accept all permissions

**2. Check Account**
- Ensure you're logged into correct Google account
- Script owner must authorize first
- Other users need appropriate access level

**3. Re-authorize**
- Go to Apps Script editor
- Run any function manually
- Re-authorize when prompted

---

### Issue: Login Not Working

#### Symptoms:
- "Invalid credentials" message
- Can't login with default passwords
- Login button doesn't respond

#### Solutions:

**1. Verify Default Credentials**
```
Admin: admin / admin123
Doctor: doctor1 / doc123
Reception: reception / rec123
```

**2. Check Users Sheet**
- Open spreadsheet
- Go to "Users" sheet
- Verify usernames and passwords match
- Check "Status" column is "Active"

**3. Check Browser Console**
- Press F12 to open developer tools
- Look for JavaScript errors
- Share errors for debugging

**4. Clear Browser Cache**
- Clear cookies and cache
- Try incognito/private mode
- Try different browser

---

### Issue: Spreadsheet Not Created

#### Symptoms:
- Web app loads but no spreadsheet in Drive
- Database functions fail
- "Sheet not found" errors

#### Solutions:

**1. Manual Database Creation**
```javascript
// Run this in Apps Script editor:
function manualInitialize() {
  var ss = SpreadsheetApp.create('Rizalcare_EMR_Database');
  var ssId = ss.getId();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ssId);
  initializeDatabase(ss);
  Logger.log('Database created: ' + ss.getUrl());
}
```

**2. Check Drive Permissions**
- Verify script can create files in Drive
- Check Drive storage quota
- Ensure Drive API is enabled

**3. Check Script Properties**
- Apps Script > Project Settings
- Script Properties section
- Add SPREADSHEET_ID manually if needed

---

### Issue: Data Not Displaying

#### Symptoms:
- Forms work but lists are empty
- Dashboard shows zeros
- Tables show "Loading..." forever

#### Solutions:

**1. Check Data Exists**
- Open spreadsheet manually
- Verify data is in sheets
- Check row count

**2. Verify Sheet Structure**
- Ensure headers are in row 1
- Check column order matches code
- No extra blank rows at top

**3. Check Browser Console**
- Press F12
- Look for JavaScript errors
- Check Network tab for failed requests

**4. Test Individual Functions**
```javascript
// In Apps Script, run:
function testDataRetrieval() {
  var patients = searchPatients('test');
  Logger.log('Patients found: ' + patients.length);
  
  var doctors = getAllDoctors(true);
  Logger.log('Doctors found: ' + doctors.length);
  
  var items = getAllItems(true);
  Logger.log('Items found: ' + items.length);
}
```

---

### Issue: Slow Performance

#### Symptoms:
- Pages load slowly
- Forms take long to submit
- Dashboard takes time to refresh

#### Solutions:

**1. Reduce Data Volume**
- Archive old records
- Use date filters
- Limit search results

**2. Optimize Queries**
- Use specific date ranges
- Filter by category
- Limit displayed rows

**3. Check Internet Connection**
- Test connection speed
- Try different network
- Check for firewall issues

**4. Browser Performance**
- Close unnecessary tabs
- Clear browser cache
- Update browser to latest version

---

### Issue: Changes Not Saving

#### Symptoms:
- Edit forms submit but changes don't persist
- Updates show success but data unchanged
- Old data still appears after edit

#### Solutions:

**1. Check Update Functions**
- Verify correct ID is being passed
- Check if row is found
- Look for error messages

**2. Force Refresh**
- Add SpreadsheetApp.flush() calls
- Reload page after save
- Check spreadsheet directly

**3. Check for Conflicts**
- Ensure no one else is editing
- Check version history
- Look for locked cells

---

### Issue: Invoice Not Generating

#### Symptoms:
- Billing form submits but no invoice
- Invoice preview doesn't show
- Print button doesn't work

#### Solutions:

**1. Check Items Added**
- Ensure at least one item in invoice
- Verify item prices are set
- Check quantity is valid

**2. Verify Patient/Doctor Selected**
- Patient ID must be valid
- Doctor ID must be valid
- Check selection dropdowns

**3. Check Calculations**
- Verify subtotal is calculated
- Check discount logic
- Ensure grand total is positive

---

### Issue: Reports Not Loading

#### Symptoms:
- Report page is blank
- No data in report tables
- Date filter doesn't work

#### Solutions:

**1. Check Date Range**
- Ensure start date < end date
- Use valid date format
- Check if data exists in range

**2. Verify Billing Data**
- Check Billing sheet has records
- Verify invoice dates are correct
- Ensure amounts are numeric

**3. Check Calculations**
- Look for division by zero errors
- Verify JSON parsing works
- Check for null values

---

## Debugging Steps

### Step 1: Check Execution Logs
```
1. Open Apps Script editor
2. Click "Executions" (clock icon)
3. Look for recent executions
4. Check for errors
5. Note error messages
```

### Step 2: Test Database Connection
```javascript
// Run this function:
function testConnection() {
  var result = testDatabaseConnection();
  Logger.log(JSON.stringify(result));
}
```

### Step 3: Verify Sheet Structure
```javascript
// Run this function:
function verifySheets() {
  var ss = getSpreadsheet();
  var sheets = ['Users', 'Patients', 'Doctors', 'Appointments', 
                'Consultations', 'Items', 'Billing', 'Payments'];
  
  sheets.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      Logger.log(sheetName + ': OK (' + sheet.getLastRow() + ' rows)');
    } else {
      Logger.log(sheetName + ': MISSING!');
    }
  });
}
```

### Step 4: Test Data Operations
```javascript
// Test adding data:
function testDataOperations() {
  // Test patient registration
  var patientResult = registerPatient({
    firstName: 'Test',
    lastName: 'Patient',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    contactNumber: '09123456789',
    patientType: 'New'
  });
  Logger.log('Patient: ' + JSON.stringify(patientResult));
  
  // Test doctor addition
  var doctorResult = addDoctor({
    name: 'Dr. Test Doctor',
    specialization: 'General Practitioner',
    licenseNumber: 'TEST123',
    contactNumber: '09123456789',
    consultationFee: 500
  });
  Logger.log('Doctor: ' + JSON.stringify(doctorResult));
}
```

---

## Getting Help

### Information to Provide

When reporting issues, include:

1. **Error Message**: Exact text of any error
2. **Steps to Reproduce**: What you did before error
3. **Browser**: Chrome, Firefox, Safari, etc.
4. **Device**: Desktop, mobile, tablet
5. **Screenshots**: If applicable
6. **Execution Log**: From Apps Script
7. **Spreadsheet ID**: From script properties

### Where to Check

1. **Browser Console**: F12 > Console tab
2. **Apps Script Logs**: Apps Script > Executions
3. **Spreadsheet**: Direct data verification
4. **Network Tab**: F12 > Network (for API calls)

### Quick Fixes Checklist

- [ ] Refresh the page
- [ ] Clear browser cache
- [ ] Try incognito mode
- [ ] Check internet connection
- [ ] Verify logged into correct account
- [ ] Check spreadsheet exists
- [ ] Verify script permissions
- [ ] Check execution logs
- [ ] Test in different browser
- [ ] Redeploy web app

---

## Prevention Tips

### Best Practices

1. **Regular Backups**
   - Copy spreadsheet weekly
   - Export important data
   - Keep version history

2. **Monitor Performance**
   - Check execution logs regularly
   - Watch for slow queries
   - Archive old data

3. **User Training**
   - Train staff properly
   - Document procedures
   - Provide quick reference

4. **Maintenance**
   - Update passwords regularly
   - Review user access
   - Clean up test data

5. **Testing**
   - Test changes in copy first
   - Verify before deploying
   - Keep backup of working version

---

## Emergency Recovery

### If System is Down

1. **Access Spreadsheet Directly**
   - Go to Google Drive
   - Open Rizalcare_EMR_Database
   - View/edit data manually

2. **Redeploy Web App**
   - Apps Script > Deploy > Manage deployments
   - Create new deployment
   - Update URL with staff

3. **Restore from Backup**
   - Find backup copy in Drive
   - Copy data to new spreadsheet
   - Update SPREADSHEET_ID in script

4. **Contact Support**
   - Provide all error details
   - Share spreadsheet (view only)
   - Describe what happened

---

**Last Updated**: February 17, 2026  
**System Version**: 1.1.0
