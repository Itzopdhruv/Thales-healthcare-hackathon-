const express = require('express');
const router = express.Router();
const {
  getAllMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getLowStockMedicines,
  sellMedicines,
  getMedicineById
} = require('../controllers/inventoryController');

// GET /api/inventory/all - Get all medicines
router.get('/all', getAllMedicines);

// GET /api/inventory/low-stock - Get low stock medicines
router.get('/low-stock', getLowStockMedicines);

// GET /api/inventory/:id - Get medicine by ID
router.get('/:id', getMedicineById);

// POST /api/inventory/add - Add new medicine
router.post('/add', addMedicine);

// PUT /api/inventory/update/:id - Update medicine
router.put('/update/:id', updateMedicine);

// DELETE /api/inventory/delete/:id - Delete medicine
router.delete('/delete/:id', deleteMedicine);

// POST /api/inventory/sell - Sell medicines and generate invoice
router.post('/sell', sellMedicines);

module.exports = router;
