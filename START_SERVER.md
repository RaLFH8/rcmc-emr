# ✅ Installation Complete! How to Start Your Server

## Good News!
✅ `npm install` completed successfully!
✅ All dependencies installed (73 packages)
✅ Database setup ready
✅ Server files ready

---

## 🚀 How to Start the Server

### Option 1: Using Command Prompt (Recommended)

1. **Open Command Prompt** (not PowerShell):
   - Press `Windows + R`
   - Type: `cmd`
   - Press Enter

2. **Navigate to your project folder**:
   ```cmd
   cd C:\Users\ralfh\Desktop\Kiro
   ```

3. **Start the server**:
   ```cmd
   npm start
   ```

4. **You should see**:
   ```
   ========================================
     Rizalcare EMR System
   ========================================
     Server running on: http://localhost:8080
     Database: SQLite (rizalcare.db)

     Default Login:
       Username: admin
       Password: admin123
   ========================================
   ```

5. **Open your browser**:
   - Go to: http://localhost:8080
   - Login with: admin / admin123

---

## 🎯 Test the System

1. **Login**: admin / admin123
2. **Go to Patients page**
3. **Click "Show All Patients"** - Should show empty list
4. **Click "+ Register New Patient"**
5. **Fill in the form and submit**
6. **Patient should appear in the list!**

---

## ⚠️ If Port 8080 is Already in Use

If you see error: `EADDRINUSE: address already in use :::8080`

### Solution: Change the port

1. **Stop the server** (Press Ctrl+C in Command Prompt)

2. **Edit server.js**:
   - Find line: `const PORT = process.env.PORT || 8080;`
   - Change to: `const PORT = process.env.PORT || 5000;`
   - Save the file

3. **Start again**:
   ```cmd
   npm start
   ```

4. **Open browser**:
   - Go to: http://localhost:5000

---

## 📱 Access from Other Devices (Same Network)

### Find Your Computer's IP Address:

1. In Command Prompt, run:
   ```cmd
   ipconfig
   ```

2. Look for "IPv4 Address" (e.g., 192.168.1.100)

3. **On other devices** (phones, tablets, other computers):
   - Open browser
   - Go to: http://192.168.1.100:8080
   - (Replace with your actual IP address)

### Important:
- Your computer must be ON
- Devices must be on the same WiFi network
- Windows Firewall might block it (allow Node.js if prompted)

---

## 🌐 Deploy Online (For Staff Access from Anywhere)

Once you've tested locally and everything works, I can help you deploy to:

1. **Render.com** (FREE) - Recommended
2. **Railway.app** (FREE $5/month credit)
3. **Vercel** (FREE)

Your staff will get a URL like:
- `https://rizalcare-emr.onrender.com`

---

## 🛑 How to Stop the Server

In the Command Prompt where the server is running:
- Press **Ctrl + C**
- Type: `Y` and press Enter

---

## 📝 What's Working Now

✅ Patient registration
✅ Patient search
✅ View patient details
✅ User authentication (login/logout)
✅ SQLite database (saves to rizalcare.db file)

---

## 🔄 Next Steps

After you test and confirm it works:

1. I'll update the remaining HTML files (Doctors, Items, Appointments, etc.)
2. Add all remaining API endpoints
3. Help you deploy online for staff access

---

## ❓ Troubleshooting

### Server won't start:
- Make sure you're in the correct folder
- Check if port is already in use (change port in server.js)
- Try restarting your computer

### Can't access from browser:
- Make sure server is running (check Command Prompt)
- Try http://127.0.0.1:8080 instead of localhost
- Clear browser cache (Ctrl+Shift+Delete)

### Database errors:
- Delete `rizalcare.db` file
- Restart server (it will create a new database)

---

## 📞 Ready to Test?

1. Open Command Prompt
2. Run: `cd C:\Users\ralfh\Desktop\Kiro`
3. Run: `npm start`
4. Open browser: http://localhost:8080
5. Login: admin / admin123

Let me know if it works!
