# How to Change Server Port

## Current Issue
Port 8080 is already in use (likely by Kiro IDE)

## ✅ I've Changed It To Port 5000

Now run:
```cmd
npm start
```

Open browser: **http://localhost:5000**

---

## If Port 5000 is Also Busy

Try these ports in order:

### Option 1: Port 4000
Edit `server.js` line 8:
```javascript
const PORT = process.env.PORT || 4000;
```

### Option 2: Port 9000
```javascript
const PORT = process.env.PORT || 9000;
```

### Option 3: Port 7000
```javascript
const PORT = process.env.PORT || 7000;
```

### Option 4: Random High Port
```javascript
const PORT = process.env.PORT || 54321;
```

---

## Quick Steps:

1. **Stop the server** (if running): Press Ctrl+C
2. **Edit server.js**: Change the PORT number
3. **Save the file**
4. **Run again**: `npm start`
5. **Open browser**: Use the new port number

---

## Find Which Ports Are Free

Run this in Command Prompt:
```cmd
netstat -ano | findstr :5000
```

If it shows nothing = port is free ✅
If it shows something = port is busy ❌

---

## Current Server Settings

- Port: **5000**
- URL: **http://localhost:5000**
- Login: **admin / admin123**

Try it now!
