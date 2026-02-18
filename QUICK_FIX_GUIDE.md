# QUICK FIX - Patient Records Not Showing

## The Problem
The error `userCodeAppPanel?createOAuthDialog=true` means the web app needs authorization to access your spreadsheet.

## THE SOLUTION (Follow Exactly):

### STEP 1: Delete Old Deployment
1. In Apps Script, click **Deploy** → **Manage deployments**
2. Click the **Archive** button (📦) next to your current deployment
3. Confirm archiving

### STEP 2: Create Fresh Deployment
1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **"Web app"**
4. Configure:
   - **Description**: "Rizalcare EMR - Fresh Deploy"
   - **Execute as**: **"Me (your-email@gmail.com)"** ← CRITICAL!
   - **Who has access**: **"Anyone"**
5. Click **"Deploy"**
6. **IMPORTANT**: Click **"Authorize access"**
7. Choose your Google account
8. Click **"Advanced"** (if you see a warning)
9. Click **"Go to Rizalcare EMR System (unsafe)"**
10. Click **"Allow"** for all permissions
11. Copy the new **Web App URL**

### STEP 3: Test Authorization in Apps Script
1. In Apps Script editor, select function: **`testDatabaseConnection`**
2. Click **Run** (▶️)
3. If prompted to authorize, click **"Review Permissions"** and authorize
4. Check execution log - should show "✓ PASS"

### STEP 4: Clear Browser & Test
1. **Close ALL browser tabs** with the old web app
2. **Clear browser cache**: 
   - Chrome: Ctrl+Shift+Delete → Clear data
   - Or use Incognito/Private mode
3. **Open the NEW Web App URL**
4. Login: `admin` / `admin123`
5. Go to **Patients**
6. Click **"Show All Patients"** button

### STEP 5: Verify Data Exists
1. Open your spreadsheet: https://docs.google.com/spreadsheets/d/1E3w2cQo3wIHnEod0eMRnuArN5jaTAN3DunRrxgZNV1M/edit
2. Check **Patients** sheet
3. Verify there are rows with patient data (not just headers)
4. If empty, register a test patient first

---

## If Still Not Working:

### Check Browser Console:
1. Press **F12** in the web app
2. Go to **Console** tab
3. Click "Show All Patients"
4. Look for error messages
5. Share the error with me

### Run This Test in Apps Script:
```javascript
function testEverything() {
  Logger.log('=== TESTING EVERYTHING ===');
  
  // Test 1: Can we get spreadsheet?
  try {
    var ss = getSpreadsheet();
    Logger.log('✓ Spreadsheet: ' + ss.getName());
  } catch (e) {
    Logger.log('✗ Spreadsheet error: ' + e);
    return;
  }
  
  // Test 2: Can we read patients?
  try {
    var patients = getAllPatients();
    Logger.log('✓ Found ' + patients.length + ' patients');
    if (patients.length > 0) {
      Logger.log('  First patient: ' + patients[0].firstName + ' ' + patients[0].lastName);
    }
  } catch (e) {
    Logger.log('✗ Get patients error: ' + e);
  }
  
  // Test 3: Can we search?
  try {
    var results = searchPatients('test');
    Logger.log('✓ Search returned ' + results.length + ' results');
  } catch (e) {
    Logger.log('✗ Search error: ' + e);
  }
}
```

---

## Common Issues:

### Issue: "Authorization Required"
**Solution**: The web app must be deployed with "Execute as: Me"

### Issue: "No patients found"
**Solution**: 
1. Check if Patients sheet has data
2. Check if Status column = "Active"
3. Register a test patient first

### Issue: "Script error"
**Solution**: 
1. Redeploy the web app
2. Reauthorize in Apps Script
3. Clear browser cache

---

## Quick Checklist:

- [ ] Archived old deployment
- [ ] Created new deployment with "Execute as: Me"
- [ ] Authorized the script (clicked "Allow")
- [ ] Ran `testDatabaseConnection()` successfully
- [ ] Cleared browser cache
- [ ] Opened NEW web app URL
- [ ] Patients sheet has data
- [ ] Clicked "Show All Patients" button

---

## The Root Cause:

The error `userCodeAppPanel?createOAuthDialog=true` happens when:
1. The web app is deployed with wrong "Execute as" setting
2. The script hasn't been authorized
3. The authorization expired

**The fix**: Fresh deployment with proper authorization!

---

**After following these steps, the system WILL work!**
