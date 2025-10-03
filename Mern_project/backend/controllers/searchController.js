const { searchSimilarMedicines: vectorSearch } = require('../services/vectorSearchService');
const { fetchDrugSummary } = require('../services/drugApiService');

// Search for similar medicines using vector search
const searchSimilarMedicines = async (req, res) => {
  try {
    const { medicine_name, top_k = 5 } = req.body;

    if (!medicine_name) {
      return res.status(400).json({ message: 'Medicine name is required' });
    }

    // Fetch drug summary for the medicine
    const summary = await fetchDrugSummary(medicine_name);
    
    if (!summary || summary === 'No data found.') {
      return res.status(404).json({ 
        message: 'Summary not found for the requested medicine' 
      });
    }

    // Perform vector search
    const results = await vectorSearch(summary, top_k);

    res.json(results);
  } catch (error) {
    console.error('Error searching similar medicines:', error);
    res.status(500).json({ 
      message: 'Error searching similar medicines', 
      error: error.message 
    });
  }
};

module.exports = {
  searchSimilarMedicines
};
