const Medicine = require('../models/Medicine');
const { addToVectorDB, deleteFromVectorDB } = require('../services/vectorSearchService');
const { fetchDrugSummary } = require('../services/drugApiService');

// Get all medicines
const getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ message: 'Error fetching medicines', error: error.message });
  }
};

// Get medicine by ID
const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findOne({ id });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.json(medicine);
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({ message: 'Error fetching medicine', error: error.message });
  }
};

// Add new medicine
const addMedicine = async (req, res) => {
  try {
    const { id, name, dosage, quantity, price, expiry_date } = req.body;

    // Check if medicine with this ID already exists
    const existingMedicine = await Medicine.findOne({ id });
    if (existingMedicine) {
      return res.status(400).json({ message: 'Medicine with this ID already exists' });
    }

    // Create new medicine
    const newMedicine = new Medicine({
      id,
      name,
      dosage,
      quantity,
      price,
      expiry_date: new Date(expiry_date)
    });

    await newMedicine.save();

    // Fetch drug summary and add to vector database
    try {
      const summary = await fetchDrugSummary(name);
      await addToVectorDB(id, name, summary || '');
    } catch (vectorError) {
      console.error('Error adding to vector DB:', vectorError);
      // Don't fail the request if vector DB fails
    }

    res.status(201).json(newMedicine);
  } catch (error) {
    console.error('Error adding medicine:', error);
    res.status(500).json({ message: 'Error adding medicine', error: error.message });
  }
};

// Update medicine
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Convert expiry_date to Date object if provided
    if (updateData.expiry_date) {
      updateData.expiry_date = new Date(updateData.expiry_date);
    }

    const medicine = await Medicine.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Update vector database if name changed
    if (updateData.name) {
      try {
        await deleteFromVectorDB(id);
        const summary = await fetchDrugSummary(updateData.name);
        await addToVectorDB(id, updateData.name, summary || '');
      } catch (vectorError) {
        console.error('Error updating vector DB:', vectorError);
        // Don't fail the request if vector DB fails
      }
    }

    res.json(medicine);
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ message: 'Error updating medicine', error: error.message });
  }
};

// Delete medicine
const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    
    const medicine = await Medicine.findOneAndDelete({ id });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Remove from vector database
    try {
      await deleteFromVectorDB(id);
    } catch (vectorError) {
      console.error('Error deleting from vector DB:', vectorError);
      // Don't fail the request if vector DB fails
    }

    res.json({ message: `Medicine ${id} deleted from database and vector index` });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ message: 'Error deleting medicine', error: error.message });
  }
};

// Get low stock medicines
const getLowStockMedicines = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const medicines = await Medicine.findLowStock(threshold);
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching low stock medicines:', error);
    res.status(500).json({ message: 'Error fetching low stock medicines', error: error.message });
  }
};

// Sell medicines and generate invoice
const sellMedicines = async (req, res) => {
  try {
    const { medicines } = req.body;
    const soldItems = [];
    let totalPrice = 0;

    // Process each medicine in the sale
    for (const item of medicines) {
      const { name, quantity } = item;

      // Find medicine by name
      const medicine = await Medicine.findOne({ name });
      
      if (!medicine) {
        return res.status(404).json({ message: `Medicine ${name} not found` });
      }

      if (medicine.quantity < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${name}` });
      }

      // Update quantity
      medicine.quantity -= quantity;
      await medicine.save();

      // Add to sold items
      const soldItem = {
        name: medicine.name,
        quantity,
        unit_price: medicine.price,
        subtotal: medicine.price * quantity
      };
      
      soldItems.push(soldItem);
      totalPrice += soldItem.subtotal;
    }

    // Generate invoice
    const invoice = {
      items: soldItems,
      total: totalPrice,
      timestamp: new Date().toISOString()
    };

    res.json({ invoice });
  } catch (error) {
    console.error('Error processing sale:', error);
    res.status(500).json({ message: 'Error processing sale', error: error.message });
  }
};

module.exports = {
  getAllMedicines,
  getMedicineById,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getLowStockMedicines,
  sellMedicines
};
