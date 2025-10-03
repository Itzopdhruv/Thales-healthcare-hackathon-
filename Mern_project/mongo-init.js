// MongoDB initialization script for PharmaAssist

// Switch to the pharmaassist database
db = db.getSiblingDB('pharmaassist');

// Create collections
db.createCollection('medicines');
db.createCollection('medicine_vectors');

// Create indexes for better performance
db.medicines.createIndex({ "id": 1 }, { unique: true });
db.medicines.createIndex({ "name": 1 });
db.medicines.createIndex({ "name": "text", "dosage": "text" });
db.medicines.createIndex({ "quantity": 1 });
db.medicines.createIndex({ "expiry_date": 1 });

db.medicine_vectors.createIndex({ "medicineId": 1 }, { unique: true });
db.medicine_vectors.createIndex({ "metadata.name": 1 });

// Insert sample data (optional)
db.medicines.insertMany([
  {
    id: "MED001",
    name: "Paracetamol",
    dosage: "500mg",
    quantity: 100,
    price: 2.50,
    expiry_date: new Date("2025-12-31"),
    description: "Pain relief and fever reducer",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "MED002",
    name: "Ibuprofen",
    dosage: "400mg",
    quantity: 50,
    price: 3.25,
    expiry_date: new Date("2025-10-15"),
    description: "Anti-inflammatory pain reliever",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "MED003",
    name: "Amoxicillin",
    dosage: "250mg",
    quantity: 5,
    price: 15.75,
    expiry_date: new Date("2024-06-30"),
    description: "Antibiotic for bacterial infections",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('PharmaAssist database initialized successfully!');
print('Sample medicines inserted:', db.medicines.countDocuments());
