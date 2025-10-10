# AI-Powered Pharmacy Management System

A comprehensive, modern pharmacy management system with advanced AI features including OCR prescription processing, medicine alternatives using RAG, automated invoicing, and intelligent analytics.

## 🚀 Features

### Core Features
- **Modern Dashboard**: Sleek, responsive UI with real-time insights
- **Authentication**: Secure login/signup system
- **Inventory Management**: Complete stock tracking and alerts
- **Prescription Processing**: OCR-powered prescription scanning and processing
- **Appointment Management**: Schedule and track patient appointments
- **Analytics Dashboard**: Comprehensive business insights and reporting

### AI-Powered Features
- **AI Doctor Chatbot**: Interactive medical assistant for customer engagement
- **Prescription OCR**: Advanced optical character recognition for prescription processing
- **Medicine Alternatives**: RAG-powered suggestions for medicine alternatives
- **Automated Invoicing**: AI-generated invoices and billing
- **Stock Alerts**: Intelligent inventory management with predictive alerts
- **Agentic SQL**: Natural language database queries

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **UI Components**: Lucide React Icons
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-pharmacy-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Authentication
1. Visit the login page at `/auth/login`
2. Use any email/password combination (demo mode)
3. Or create a new account at `/auth/signup`

### Dashboard Navigation
- **Overview**: Main dashboard with KPIs and recent activity
- **Inventory**: Medicine stock management and tracking
- **Prescriptions**: OCR processing and prescription management
- **Appointments**: Patient appointment scheduling
- **Analytics**: Business insights and reporting

### AI Doctor Chatbot
- Click the floating chat button in the bottom-right corner
- Ask medical questions, upload prescription images
- Get AI-powered responses and medicine suggestions

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme switching
- **Smooth Animations**: Framer Motion powered transitions
- **Modern Components**: Clean, professional interface
- **Accessibility**: WCAG compliant design

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
DATABASE_URL=your_database_url
```

### Customization
- Modify `tailwind.config.js` for theme customization
- Update `components/` for UI changes
- Configure API endpoints in `lib/` directory

## 📊 Dashboard Sections

### Overview
- Key performance indicators
- Recent activity feed
- Quick action buttons
- System health metrics

### Inventory Management
- Medicine stock tracking
- Low stock alerts
- Category management
- Price tracking

### Prescription Processing
- OCR-powered scanning
- Prescription validation
- Medicine dispensing
- Patient records

### Analytics
- Sales performance
- Inventory turnover
- Customer insights
- Revenue tracking

## 🤖 AI Features

### OCR Processing
- Upload prescription images
- Automatic text extraction
- Medicine identification
- Dosage recognition

### RAG Medicine Alternatives
- Vector-based medicine search
- Alternative suggestions
- Drug interaction checking
- Cost comparison

### Automated Invoicing
- AI-generated invoices
- Automatic calculations
- Tax computation
- Payment tracking

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Other Platforms
- Netlify
- AWS Amplify
- DigitalOcean App Platform

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Built with ❤️ for modern pharmacy management**
