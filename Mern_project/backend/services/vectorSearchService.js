// Vector Search Service using MongoDB Atlas Search
// This is a simplified implementation - in production, you'd use MongoDB Atlas Search
// or a dedicated vector database like Pinecone, Weaviate, or Qdrant

const { MongoClient } = require('mongodb');

let vectorCollection = null;

// Initialize vector collection
const initializeVectorCollection = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmaassist');
    await client.connect();
    const db = client.db();
    vectorCollection = db.collection('medicine_vectors');
    
    // Create index for vector search (simplified)
    await vectorCollection.createIndex({ "metadata.name": 1 });
    
    console.log('✅ Vector collection initialized');
  } catch (error) {
    console.error('❌ Error initializing vector collection:', error);
  }
};

// Simple embedding function (in production, use OpenAI, Cohere, or similar)
const createSimpleEmbedding = (text) => {
  // This is a very basic hash-based embedding for demonstration
  // In production, use proper embedding models
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  
  words.forEach(word => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const index = Math.abs(hash) % 384;
    embedding[index] += 1;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
};

// Calculate cosine similarity
const cosineSimilarity = (a, b) => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

// Add medicine to vector database
const addToVectorDB = async (medicineId, medicineName, description) => {
  try {
    if (!vectorCollection) {
      await initializeVectorCollection();
    }

    const embedding = createSimpleEmbedding(`${medicineName} ${description}`);
    
    await vectorCollection.replaceOne(
      { medicineId },
      {
        medicineId,
        name: medicineName,
        description: description || '',
        embedding,
        createdAt: new Date()
      },
      { upsert: true }
    );

    console.log(`✅ Added ${medicineName} to vector database`);
  } catch (error) {
    console.error('Error adding to vector DB:', error);
    throw error;
  }
};

// Delete medicine from vector database
const deleteFromVectorDB = async (medicineId) => {
  try {
    if (!vectorCollection) {
      await initializeVectorCollection();
    }

    await vectorCollection.deleteOne({ medicineId });
    console.log(`✅ Removed ${medicineId} from vector database`);
  } catch (error) {
    console.error('Error deleting from vector DB:', error);
    throw error;
  }
};

// Search for similar medicines
const searchSimilarMedicines = async (queryText, topK = 5) => {
  try {
    if (!vectorCollection) {
      await initializeVectorCollection();
    }

    const queryEmbedding = createSimpleEmbedding(queryText);
    
    // Get all vectors and calculate similarity
    const vectors = await vectorCollection.find({}).toArray();
    
    const results = vectors.map(vector => ({
      name: vector.name,
      score: cosineSimilarity(queryEmbedding, vector.embedding)
    }));

    // Sort by similarity (higher is better) and return top K
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, topK);
  } catch (error) {
    console.error('Error searching similar medicines:', error);
    throw error;
  }
};

module.exports = {
  addToVectorDB,
  deleteFromVectorDB,
  searchSimilarMedicines,
  initializeVectorCollection
};
