# 💊 PharmaAssist - MERN Stack

A comprehensive medicine inventory management system with OCR capabilities and vector search functionality.

![PharmaAssist Dashboard](https://img.shields.io/badge/Status-Ready-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-blue)
![React](https://img.shields.io/badge/React-18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green)

## 🚨 **Connection Error? Read This First!**

If you're seeing a **"Connection Error"** on the dashboard like this:

> ❌ **Connection Error**  
> Failed to load dashboard data. Please check if the backend server is running.

**This means your frontend can't connect to the backend server.** Follow the steps below to fix it.

## 🚀 **Quick Start Guide**

### **Step 1: Prerequisites**
Make sure you have these installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (optional - can run without it initially)
- **Git** - [Download here](https://git-scm.com/)

### **Step 2: Install Dependencies**

Open **Command Prompt** or **PowerShell** and run:

```bash
# Navigate to the project directory
cd "C:\Users\kumar\Desktop\t\Mern_project"

# Install all dependencies (backend + frontend)
npm run install-all
```

### **Step 3: Start the Application**

**Option A: Start Both Services Together (Recommended)**
```bash
npm run dev
```

**Option B: Start Services Separately**
```bash
# Terminal 1 - Backend Server
cd backend
npm run dev

# Terminal 2 - Frontend Server (in a new terminal)
cd frontend
npm start
```

### **Step 4: Access the Application**
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔧 **Troubleshooting Connection Errors**

### **Problem 1: Backend Server Not Running**

**Symptoms:**
- Connection Error on dashboard
- Frontend loads but shows error message
- Empty API responses

**Solution:**
```bash
# Check if backend is running
curl http://localhost:5000

# If no response, start the backend
cd backend
npm run dev

# You should see:
# 🚀 Server running on port 5000
# ✅ MongoDB connected successfully (or warning if no MongoDB)
```

### **Problem 2: Port Already in Use**

**Symptoms:**
- `EADDRINUSE` error
- Server fails to start

**Solution:**
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use different port
# Edit backend/.env file and change PORT=5001
```

### **Problem 3: MongoDB Connection Issues**

**Symptoms:**
- Backend starts but shows MongoDB connection error
- Database operations fail

**Solution:**
```bash
# Option 1: Install and start MongoDB locally
# Download from https://www.mongodb.com/try/download/community
# Start MongoDB service

# Option 2: Use MongoDB Atlas (Cloud)
# 1. Go to https://cloud.mongodb.com/
# 2. Create free account and cluster
# 3. Get connection string
# 4. Update backend/.env file with your connection string

# Option 3: Run without MongoDB (limited functionality)
# The app will work but some features may not function properly
```

### **Problem 4: Frontend Dependencies Not Installed**

**Symptoms:**
- Frontend won't start
- Module not found errors

**Solution:**
```bash
cd frontend
npm install
npm start
```

## 📋 **Step-by-Step Installation**

### **Complete Installation Process:**

1. **Open Command Prompt as Administrator**

2. **Navigate to project directory:**
```bash
cd "C:\Users\kumar\Desktop\t\Mern_project"
```

3. **Install root dependencies:**
```bash
npm install
```

4. **Install backend dependencies:**
```bash
cd backend
npm install
```

5. **Install frontend dependencies:**
```bash
cd ../frontend
npm install
```

6. **Create environment file:**
```bash
cd ../backend
copy env.example .env
```

7. **Start the application:**
```bash
cd ..
npm run dev
```

## 🎯 **Testing the Application**

### **Test Backend:**
```bash
# Test health endpoint
curl http://localhost:5000

# Expected response:
# {"message":"PharmaAssist API is running!","version":"1.0.0","timestamp":"..."}

# Test inventory endpoint
curl http://localhost:5000/api/inventory/all

# Expected response:
# []
```

### **Test Frontend:**
1. Open browser to http://localhost:3000
2. You should see the PharmaAssist dashboard
3. No connection errors should appear

## 📊 **Application Features**

Once running, you can:

- **📊 Dashboard**: View inventory statistics and analytics
- **💊 Medicine Management**: Add, edit, delete medicines
- **📄 OCR Processing**: Upload prescription images for text extraction
- **🔍 Vector Search**: Find similar medicines using AI
- **🧾 Invoice Generation**: Create PDF invoices for sales
- **📈 Stock Management**: Track low stock and expiry dates

## 🔑 **Environment Configuration**

The application uses these environment variables (in `backend/.env`):

```env
# Database (Optional - app works without MongoDB)
MONGODB_URI=mongodb://localhost:27017/pharmaassist

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# API Keys (Required for OCR features)
GEMINI_API_KEY=your_gemini_api_key_here

# Security
JWT_SECRET=pharmaassist_secret_key_2024
```

## 🐳 **Docker Alternative (Advanced Users)**

If you prefer Docker:

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📞 **Need Help?**

### **Common Issues & Solutions:**

| Problem | Solution |
|---------|----------|
| Connection Error | Start backend server with `npm run dev` |
| Port 5000 in use | Kill process or change PORT in .env |
| Module not found | Run `npm install` in backend and frontend |
| MongoDB error | Install MongoDB or use cloud service |
| Frontend won't start | Check Node.js version (need v16+) |

### **Getting Support:**
1. Check this README first
2. Verify all prerequisites are installed
3. Check console logs for specific error messages
4. Ensure both backend and frontend are running

## 🎉 **Success!**

When everything is working correctly, you should see:
- ✅ Backend running on port 5000
- ✅ Frontend running on port 3000
- ✅ Dashboard loads without connection errors
- ✅ API endpoints responding correctly

## 📚 **Additional Resources**

- **Backend API Docs**: http://localhost:5000 (when running)
- **Frontend Dashboard**: http://localhost:3000 (when running)
- **MongoDB Documentation**: https://docs.mongodb.com/
- **React Documentation**: https://reactjs.org/docs/
- **Node.js Documentation**: https://nodejs.org/docs/

---

**Happy coding! 🚀** If you encounter any issues, check the troubleshooting section above.