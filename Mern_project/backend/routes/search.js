const express = require('express');
const router = express.Router();
const { searchSimilarMedicines } = require('../controllers/searchController');

// POST /api/search/similar - Find similar medicines using vector search
router.post('/similar', searchSimilarMedicines);

module.exports = router;
