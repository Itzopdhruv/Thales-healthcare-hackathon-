# PharmaAssist Backend API

A comprehensive medicine inventory management system with OCR capabilities and vector search functionality.

## Features

- **Medicine Inventory Management**: CRUD operations for medicines
- **OCR Prescription Processing**: Extract text from prescription images using Google Gemini API
- **Vector Search**: Find similar medicines using semantic search
- **Drug Information API**: Fetch drug summaries from Wikipedia, PubChem, and OpenFDA
- **Invoice Generation**: Create invoices for medicine sales
- **Stock Management**: Track quantities and low stock alerts

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Google Gemini API** for OCR
- **Vector Search** using MongoDB collections
- **RESTful API** design

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `env.example`:
```bash
cp env.example .env
```

3. Update the `.env` file with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/pharmaassist
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Inventory Management
- `GET /api/inventory/all` - Get all medicines
- `GET /api/inventory/low-stock` - Get low stock medicines
- `GET /api/inventory/:id` - Get medicine by ID
- `POST /api/inventory/add` - Add new medicine
- `PUT /api/inventory/update/:id` - Update medicine
- `DELETE /api/inventory/delete/:id` - Delete medicine
- `POST /api/inventory/sell` - Sell medicines and generate invoice

### Search
- `POST /api/search/similar` - Find similar medicines using vector search

### OCR
- `POST /api/ocr/extract` - Extract text from prescription image

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/pharmaassist` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## Development

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start
```

## Project Structure

```
backend/
├── controllers/     # Request handlers
├── models/         # MongoDB models
├── routes/         # API routes
├── services/       # Business logic
├── middleware/     # Custom middleware
├── utils/          # Utility functions
├── server.js       # Main server file
└── package.json    # Dependencies
```
