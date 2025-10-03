# 🔧 Troubleshooting Guide - PharmaAssist

## 🚨 **Connection Error Fix**

If you're seeing this error on the dashboard:

> ❌ **Connection Error**  
> Failed to load dashboard data. Please check if the backend server is running.

### **Why This Happens:**
The frontend (React app) is trying to connect to the backend (Node.js server) but can't reach it. This usually means:
1. Backend server is not running
2. Backend is running on wrong port
3. Firewall blocking the connection
4. Backend crashed or has errors

### **Quick Fix:**

**Step 1: Check if Backend is Running**
```bash
# Open Command Prompt and run:
curl http://localhost:5000

# If you get a response like:
# {"message":"PharmaAssist API is running!","version":"1.0.0",...}
# Then backend is working ✅

# If you get "Could not connect" or timeout:
# Then backend is NOT running ❌
```

**Step 2: Start the Backend**
```bash
# Navigate to backend directory
cd "C:\Users\kumar\Desktop\t\Mern_project\backend"

# Start the server
npm run dev

# You should see:
# 🚀 Server running on port 5000
# ✅ MongoDB connected successfully (or warning)
```

**Step 3: Test the Connection**
```bash
# In a new Command Prompt window:
curl http://localhost:5000/api/inventory/all

# Should return: []
# (empty array is normal - means no medicines added yet)
```

**Step 4: Refresh the Frontend**
- Go to http://localhost:3000
- Press `Ctrl + F5` to hard refresh
- The connection error should disappear

## 🔍 **Detailed Troubleshooting**

### **Backend Won't Start**

**Error: `EADDRINUSE :::5000`**
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace XXXX with actual PID)
taskkill /PID XXXX /F

# Try starting backend again
npm run dev
```

**Error: `Module not found`**
```bash
# Install dependencies
cd backend
npm install

# Try starting again
npm run dev
```

**Error: `MongoDB connection failed`**
```bash
# Option 1: Install MongoDB locally
# Download from: https://www.mongodb.com/try/download/community

# Option 2: Use cloud MongoDB (MongoDB Atlas)
# 1. Go to https://cloud.mongodb.com/
# 2. Create free account
# 3. Create cluster
# 4. Get connection string
# 5. Update backend/.env file

# Option 3: Run without MongoDB (limited features)
# The app will still work but some features may not function
```

### **Frontend Won't Start**

**Error: `Invalid options object. Dev Server has been initialized`**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

**Error: `Port 3000 is already in use`**
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID XXXX /F

# Or use different port
set PORT=3001 && npm start
```

### **API Calls Fail**

**Error: `Network Error` or `CORS Error`**
```bash
# Check if backend is running on correct port
curl http://localhost:5000

# Check backend/.env file has correct FRONTEND_URL
# Should be: FRONTEND_URL=http://localhost:3000
```

**Error: `404 Not Found`**
```bash
# Check API endpoint exists
curl http://localhost:5000/api/inventory/all

# If 404, check routes are properly configured
# Make sure backend/server.js includes the routes
```

## 🛠 **Complete Reset (If Nothing Works)**

**Step 1: Stop All Processes**
```bash
# Kill any Node.js processes
taskkill /IM node.exe /F

# Or restart your computer
```

**Step 2: Clean Install**
```bash
# Navigate to project root
cd "C:\Users\kumar\Desktop\t\Mern_project"

# Remove all node_modules
rmdir /s /q backend\node_modules
rmdir /s /q frontend\node_modules
rmdir /s /q node_modules

# Remove package-lock files
del backend\package-lock.json
del frontend\package-lock.json
del package-lock.json

# Reinstall everything
npm install
cd backend && npm install
cd ../frontend && npm install
```

**Step 3: Start Fresh**
```bash
# From project root
npm run dev
```

## 📋 **Checklist for Success**

Before reporting issues, verify:

- [ ] Node.js is installed (v16 or higher)
- [ ] All dependencies are installed (`npm install` completed successfully)
- [ ] Backend server is running on port 5000
- [ ] Frontend server is running on port 3000
- [ ] No firewall blocking localhost connections
- [ ] Environment variables are set correctly
- [ ] No other applications using ports 3000 or 5000

## 🆘 **Still Having Issues?**

If you're still experiencing problems:

1. **Check the Console Logs**
   - Backend: Look at Command Prompt where you ran `npm run dev`
   - Frontend: Open browser Developer Tools (F12) → Console tab

2. **Verify Network Connectivity**
   ```bash
   # Test if ports are accessible
   telnet localhost 5000
   telnet localhost 3000
   ```

3. **Check System Requirements**
   - Windows 10/11
   - Node.js v16+
   - At least 4GB RAM
   - 1GB free disk space

4. **Try Alternative Ports**
   ```bash
   # Change backend port in backend/.env
   PORT=5001
   
   # Change frontend port
   set PORT=3001 && npm start
   ```

## 🎯 **Expected Behavior When Working**

When everything is working correctly:

1. **Backend Console Shows:**
   ```
   🚀 Server running on port 5000
   ✅ MongoDB connected successfully
   ```

2. **Frontend Console Shows:**
   ```
   webpack compiled successfully
   ```

3. **Browser Shows:**
   - PharmaAssist dashboard loads
   - No connection errors
   - Navigation menu works
   - Statistics display correctly

4. **API Test Works:**
   ```bash
   curl http://localhost:5000
   # Returns: {"message":"PharmaAssist API is running!",...}
   ```

---

**Remember:** The most common cause of connection errors is simply that the backend server isn't running. Always start with `npm run dev` in the backend directory! 🚀
