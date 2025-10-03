const axios = require('axios');

// Fetch drug information from Wikipedia
const fetchFromWikipedia = async (drugName) => {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(drugName.replace(/\s+/g, '_'))}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.status === 200) {
      return response.data.extract;
    }
  } catch (error) {
    console.error('Wikipedia API error:', error.message);
  }
  return null;
};

// Fetch drug information from PubChem
const fetchFromPubChem = async (drugName) => {
  try {
    // Get CID (Compound ID)
    const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(drugName)}/cids/JSON`;
    const cidResponse = await axios.get(cidUrl, { timeout: 10000 });
    
    if (cidResponse.data.IdentifierList && cidResponse.data.IdentifierList.CID.length > 0) {
      const cid = cidResponse.data.IdentifierList.CID[0];
      
      // Get description
      const descriptionUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON`;
      const descResponse = await axios.get(descriptionUrl, { timeout: 10000 });
      
      const sections = descResponse.data.Record?.Section || [];
      for (const section of sections) {
        if (section.TOCHeading === 'Description') {
          for (const info of section.Information || []) {
            const value = info.Value?.StringWithMarkup?.[0]?.String;
            if (value) {
              return value;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('PubChem API error:', error.message);
  }
  return null;
};

// Fetch drug information from OpenFDA
const fetchFromOpenFDA = async (drugName) => {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(drugName.toLowerCase())}&limit=1`;
    const response = await axios.get(url, { timeout: 10000 });
    
    const results = response.data.results || [];
    if (results.length > 0) {
      const description = results[0].description;
      if (description && description.length > 0) {
        return description[0];
      }
    }
  } catch (error) {
    console.error('OpenFDA API error:', error.message);
  }
  return null;
};

// Main function to fetch drug summary with fallback
const fetchDrugSummary = async (drugName) => {
  if (!drugName || typeof drugName !== 'string') {
    return 'No data found.';
  }

  try {
    // Try Wikipedia first
    let summary = await fetchFromWikipedia(drugName);
    if (summary) {
      return summary;
    }

    // Try PubChem
    summary = await fetchFromPubChem(drugName);
    if (summary) {
      return summary;
    }

    // Try OpenFDA
    summary = await fetchFromOpenFDA(drugName);
    if (summary) {
      return summary;
    }

    return 'No data found.';
  } catch (error) {
    console.error('Error fetching drug summary:', error);
    return 'No data found.';
  }
};

// Validate medicine name using RxNorm API
const isValidMedicine = async (name) => {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}`;
    const response = await axios.get(url, { timeout: 3000 });
    
    return response.data.idGroup && response.data.idGroup.rxnormId;
  } catch (error) {
    console.error('RxNorm validation error:', error.message);
    return false;
  }
};

module.exports = {
  fetchDrugSummary,
  isValidMedicine,
  fetchFromWikipedia,
  fetchFromPubChem,
  fetchFromOpenFDA
};
