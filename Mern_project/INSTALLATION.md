# Installation Guide - PharmaAssist MERN Stack

## Prerequisites

Before installing PharmaAssist, ensure you have the following software installed on your system:

### Required Software
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

### API Keys Required
- **Google Gemini API Key** - [Get API Key](https://makersuite.google.com/app/apikey)

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Mern_project
```

### 2. Install Dependencies

#### Option A: Install All Dependencies at Once
```bash
npm run install-all
```

#### Option B: Install Dependencies Separately
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Setup Environment Variables

#### Backend Environment Setup
```bash
cd backend
cp env.example .env
```

Edit the `.env` file with your configuration:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pharmaassist

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Security
JWT_SECRET=your_jwt_secret_here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. Setup MongoDB

#### Option A: Local MongoDB
1. Start MongoDB service:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

2. Create database (optional - will be created automatically):
```bash
mongo
use pharmaassist
```

#### Option B: MongoDB Atlas (Cloud)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env` file

### 5. Start the Application

#### Development Mode (Recommended)
```bash
# Start both backend and frontend concurrently
npm run dev
```

#### Start Services Separately
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000

## Verification

### 1. Check Backend Health
Visit http://localhost:5000 in your browser. You should see:
```json
{
  "message": "PharmaAssist API is running!",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Check Frontend
Visit http://localhost:3000. You should see the PharmaAssist dashboard.

### 3. Test API Endpoints
```bash
# Test inventory endpoint
curl http://localhost:5000/api/inventory/all

# Expected response: [] (empty array initially)
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: MongoDB connection error
```
**Solution:**
- Ensure MongoDB is running
- Check connection string in `.env` file
- Verify MongoDB port (default: 27017)

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
- Change PORT in `.env` file
- Or kill the process using the port:
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

#### 3. Frontend Build Errors
```
Error: Cannot find module
```
**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 4. API Key Errors
```
Error: OCR extraction failed
```
**Solution:**
- Verify GEMINI_API_KEY in `.env` file
- Ensure API key is valid and has proper permissions

### Environment-Specific Issues

#### Windows
- Use Command Prompt or PowerShell as Administrator
- Ensure MongoDB service is running
- Check Windows Firewall settings

#### macOS
- Use Homebrew for MongoDB: `brew install mongodb-community`
- Start MongoDB: `brew services start mongodb-community`

#### Linux
- Install MongoDB: `sudo apt-get install mongodb`
- Start service: `sudo systemctl start mongod`

## Production Deployment

### 1. Build Frontend
```bash
cd frontend
npm run build
```

### 2. Set Production Environment Variables
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
GEMINI_API_KEY=your_production_api_key
FRONTEND_URL=your_production_frontend_url
```

### 3. Deploy Backend
Deploy to your preferred platform (Heroku, AWS, DigitalOcean, etc.)

### 4. Deploy Frontend
Deploy the `build` folder to your preferred platform (Netlify, Vercel, etc.)

## Support

If you encounter any issues during installation:

1. Check the troubleshooting section above
2. Create an issue in the repository
3. Contact the development team

## Next Steps

After successful installation:

1. Add some sample medicines to test the system
2. Try the OCR functionality with a sample prescription
3. Explore the vector search feature
4. Generate test invoices

Welcome to PharmaAssist! 🎉
