# AayuLink - AI-Powered Health Record Platform

A comprehensive health record platform aligned with ABDM (Ayushman Bharat Digital Mission) featuring AI-powered summaries, conversational chatbot, and seamless data access.

## 🚀 Features

- **User Authentication**: Secure login/register with JWT tokens
- **ABDM Integration**: Fetch health records via ABHA ID
- **AI-Powered Summaries**: Intelligent health record analysis
- **Conversational Chatbot**: AI assistant for health queries
- **E-Prescription**: Digital prescription generation
- **Patient-Centric Control**: DPDP-compliant consent management

## 🏗️ Architecture

### Frontend (Vite + React)
- **Framework**: React 19 with Vite
- **UI Library**: Ant Design
- **Routing**: React Router DOM
- **State Management**: Context API
- **HTTP Client**: Axios

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
main_website/
├── frontend/                 # Vite React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   └── App.jsx         # Main app component
│   ├── package.json
│   └── vite.config.js
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── server.js       # Main server file
│   ├── package.json
│   └── env.example
└── DATABASE_SCHEMA.md      # Database documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/aayulink
PORT=5001
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
```

## 🗄️ Database Schema

The application uses MongoDB with the following main collections:

### Users
- Authentication and profile information
- ABHA ID integration
- Role-based access control

### HealthRecords
- Comprehensive health record storage
- AI-generated summaries
- Privacy and consent management

### AIChats
- Conversation history
- Context for RAG system
- AI interaction metadata

See `DATABASE_SCHEMA.md` for detailed schema documentation.

## 🔐 Authentication

### User Registration
- Name, Email, Phone, ABHA ID
- Password validation
- Duplicate prevention

### User Login
- Email/Password authentication
- JWT token generation
- Session management

### Protected Routes
- JWT middleware
- Role-based access control
- Token expiration handling

## 🤖 AI Integration

### Gemini AI
- Health record summarization
- Conversational chatbot
- Medical query processing

### RAG System Ready
- Vector embeddings support
- Semantic search capabilities
- Context-aware responses

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Health Records (Future)
- `GET /api/records` - Get health records
- `POST /api/records` - Create health record
- `GET /api/records/search` - Search records

### AI Chat (Future)
- `POST /api/chat` - Send message to AI
- `GET /api/chat/history` - Get chat history

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication
- **Rate Limiting**: API request throttling
- **CORS**: Cross-origin request handling
- **Helmet**: Security headers
- **Input Validation**: Request validation

## 🔒 Privacy & Compliance

- **DPDP Compliant**: Data privacy controls
- **Consent Management**: Time-based data sharing
- **ABDM Aligned**: Government standards compliance
- **Data Encryption**: At rest and in transit

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Heroku)
```bash
cd backend
npm start
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📊 Monitoring

- **Health Checks**: API status monitoring
- **Error Logging**: Comprehensive error tracking
- **Performance**: Request timing and metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the Smart India Hackathon 2025.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for Smart India Hackathon 2025**
