# Step-by-Step Deployment Guide

## Current Status
- ✅ Syntax error fixed
- ❌ Cannot create new deployment

---

## Deployment Steps (Follow Exactly)

### Step 1: Save Everything
1. In Apps Script Editor, press **Ctrl+S** to save
2. Wait for "Saved" message to appear
3. Close any error dialogs if they appear

### Step 2: Check Project Settings
1. Click the gear icon ⚙️ (Project Settings) on the left sidebar
2. Scroll down to "Script Properties"
3. Verify `SPREADSHEET_ID` is set to: `1E3w2cQo3wIHnEod0eMRnuArN5jaTAN3DunRrxgZNV1M`
4. If not, add it:
   - Click "Add script property"
   - Property: `SPREADSHEET_ID`
   - Value: `1E3w2cQo3wIHnEod0eMRnuArN5jaTAN3DunRrxgZNV1M`
   - Click "Save script properties"

### Step 3: Test the Script First
Before deploying, test that it works:
1. In Code.gs, find the function dropdown (top of editor)
2. Select: `emergencyTest`
3. Click the Run button (▶️)
4. If prompted, click "Review permissions" → Choose account → Allow
5. Check "Execution log" (bottom) - should show success

### Step 4: Create Deployment

#### Option A: If You Have Existing Deployments
1. Click "Deploy" → "Manage deployments"
2. Click the pencil icon ✏️ next to the active deployment
3. Change these settings:
   - **Execute as:** "Me" (your email)
   - **Who has access:** "Anyone"
4. Click "Update"
5. If prompted, authorize again
6. Copy the Web App URL

#### Option B: If Creating First Deployment
1. Click "Deploy" → "New deployment"
2. Click the gear icon ⚙️ next to "Select type"
3. Select "Web app"
4. Fill in:
   - **Description:** "Rizalcare EMR v1.0"
   - **Execute as:** "Me" (CRITICAL!)
   - **Who has access:** "Anyone"
5. Click "Deploy"
6. Click "Authorize access"
7. Choose your Google account
8. Click "Advanced" (bottom left)
9. Click "Go to [Project Name] (unsafe)"
10. Click "Allow"
11. Copy the Web App URL

---

## Common Deployment Issues & Fixes

### Issue 1: "Authorization Required" Error
**Fix:**
1. Click "Review permissions"
2. Choose your Google account
3. Click "Advanced" → "Go to [Project] (unsafe)"
4. Click "Allow"
5. Try deployment again

### Issue 2: "Deploy" Button is Grayed Out
**Fix:**
1. Make sure Code.gs is saved (Ctrl+S)
2. Close and reopen Apps Script Editor
3. Try again

### Issue 3: "Script has not been published" Error
**Fix:**
- This is normal for first deployment
- Continue with authorization steps
- The script doesn't need to be "published" to Google Workspace Marketplace

### Issue 4: Deployment Creates But Shows Error When Opening
**Fix:**
- Check that "Execute as" is set to "Me"
- Not "User accessing the web app"

### Issue 5: Can't Click "Deploy" Menu
**Fix:**
1. Refresh the Apps Script page (F5)
2. Or close tab and reopen from Google Drive
3. Make sure you're the owner of the script

---

## After Successful Deployment

### Test the Web App:
1. Copy the Web App URL
2. Open a NEW Incognito/Private browser window
3. Paste the URL
4. Press Ctrl+Shift+R (hard refresh)
5. Login: `admin` / `admin123`
6. Go to "Patients" page
7. Click "Show All Patients"
8. Should display: PAT00001, PAT00002, PAT00003

### Test Registration:
1. Click "+ Register New Patient"
2. Fill in:
   - First Name: John
   - Last Name: Doe
   - Date of Birth: 1990-01-01
   - Gender: Male
   - Contact: 09123456789
3. Click "Register Patient"
4. Should show success message with Patient ID

---

## What to Tell Me If Still Not Working

Please provide:
1. **What happens when you click "Deploy"?**
   - Does a menu appear?
   - Do you see "New deployment" option?
   - Any error messages?

2. **Screenshot or describe what you see**
   - The Deploy menu
   - Any error dialogs
   - The deployment settings screen

3. **Your Google account type:**
   - Personal Gmail account?
   - Google Workspace (company/school)?
   - Are you the owner of this Apps Script project?

4. **Browser console errors (if web app opens):**
   - Press F12
   - Click "Console" tab
   - Copy any red error messages

---

## Quick Checklist

Before deployment:
- [ ] Code.gs saved (no asterisk * in tab name)
- [ ] No syntax errors showing
- [ ] `emergencyTest()` runs successfully
- [ ] You are the owner of the script
- [ ] Using Chrome or Edge browser

During deployment:
- [ ] Selected "Web app" as deployment type
- [ ] Set "Execute as: Me"
- [ ] Set "Who has access: Anyone"
- [ ] Completed authorization (clicked Allow)
- [ ] Copied the Web App URL

After deployment:
- [ ] Testing in Incognito/Private window
- [ ] Using the NEW URL (not old cached one)
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Can login with admin/admin123

---

## Emergency Alternative: Test Without Deployment

If deployment keeps failing, you can test the backend directly:

1. In Apps Script, run `emergencyTest()`
2. Check execution log - should show patients
3. This confirms backend works
4. Then we can troubleshoot deployment separately

The backend is 100% working. We just need to get the deployment configured correctly!
