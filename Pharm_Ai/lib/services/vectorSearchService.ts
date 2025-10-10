import { faiss } from 'faiss-node'
import OpenAI from 'openai'

export interface MedicineEmbedding {
  id: string
  name: string
  dosage: string
  category: string
  description: string
  activeIngredients: string[]
  therapeuticClass: string
  embedding: number[]
}

export interface SemanticSearchResult {
  medicine: MedicineEmbedding
  similarity: number
  reason: string
  therapeuticMatch: boolean
  ingredientMatch: boolean
}

// Global cache for vector search service
let globalVectorSearchService: VectorSearchService | null = null

export class VectorSearchService {
  private openai: OpenAI
  private index: any
  private medicineEmbeddings: MedicineEmbedding[] = []
  private isInitialized = false

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key'
    })
  }

  /**
   * Get or create global vector search service instance
   */
  static async getInstance(medicines?: any[]): Promise<VectorSearchService> {
    if (!globalVectorSearchService) {
      globalVectorSearchService = new VectorSearchService()
      if (medicines) {
        await globalVectorSearchService.initialize(medicines)
      }
    }
    return globalVectorSearchService
  }

  /**
   * Initialize the vector search service with medicine embeddings
   */
  async initialize(medicines: any[]): Promise<void> {
    if (this.isInitialized) return

    console.log('Initializing vector search service...')
    
    // Create embeddings for all medicines
    this.medicineEmbeddings = await this.createMedicineEmbeddings(medicines)
    
    // Create FAISS index
    await this.createFAISSIndex()
    
    this.isInitialized = true
    console.log(`Vector search service initialized with ${this.medicineEmbeddings.length} medicines`)
  }

  /**
   * Create embeddings for all medicines
   */
  private async createMedicineEmbeddings(medicines: any[]): Promise<MedicineEmbedding[]> {
    const embeddings: MedicineEmbedding[] = []

    for (const medicine of medicines) {
      try {
        // Create comprehensive text for embedding
        const medicineText = this.createMedicineText(medicine)
        
        // Get embedding from OpenAI
        const embedding = await this.getEmbedding(medicineText)
        
        embeddings.push({
          id: medicine.id,
          name: medicine.name,
          dosage: medicine.dosage,
          category: medicine.category,
          description: medicine.description || '',
          activeIngredients: this.extractActiveIngredients(medicine.name),
          therapeuticClass: this.getTherapeuticClass(medicine.category),
          embedding
        })
      } catch (error) {
        console.error(`Error creating embedding for ${medicine.name}:`, error)
        // Create a zero embedding as fallback
        embeddings.push({
          id: medicine.id,
          name: medicine.name,
          dosage: medicine.dosage,
          category: medicine.category,
          description: medicine.description || '',
          activeIngredients: this.extractActiveIngredients(medicine.name),
          therapeuticClass: this.getTherapeuticClass(medicine.category),
          embedding: new Array(1536).fill(0) // OpenAI embedding dimension
        })
      }
    }

    return embeddings
  }

  /**
   * Create comprehensive text for medicine embedding
   */
  private createMedicineText(medicine: any): string {
    const parts = [
      medicine.name,
      medicine.dosage,
      medicine.category,
      medicine.description || '',
      this.extractActiveIngredients(medicine.name).join(' '),
      this.getTherapeuticClass(medicine.category),
      medicine.manufacturer || '',
      medicine.indications?.join(' ') || '',
      medicine.contraindications?.join(' ') || ''
    ].filter(Boolean)

    return parts.join(' ').toLowerCase()
  }

  /**
   * Get embedding from OpenAI
   */
  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      })
      return response.data[0].embedding
    } catch (error) {
      console.error('OpenAI embedding error:', error)
      // Return zero vector as fallback
      return new Array(1536).fill(0)
    }
  }

  /**
   * Create FAISS index for similarity search
   */
  private async createFAISSIndex(): Promise<void> {
    if (this.medicineEmbeddings.length === 0) return

    const dimension = this.medicineEmbeddings[0].embedding.length
    this.index = new faiss.IndexFlatL2(dimension)

    // Add all embeddings to the index
    const vectors = this.medicineEmbeddings.map(med => med.embedding)
    const vectorsArray = new Float32Array(vectors.flat())
    
    this.index.add(vectorsArray)
  }

  /**
   * Find semantically similar medicines
   */
  async findSimilarMedicines(
    queryMedicine: string,
    category: string,
    requestedQuantity: number,
    maxResults: number = 5
  ): Promise<SemanticSearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('Vector search service not initialized')
    }

    // Create query embedding
    const queryText = this.createQueryText(queryMedicine, category)
    const queryEmbedding = await this.getEmbedding(queryText)

    // Search for similar vectors
    const { distances, labels } = this.index.search(
      new Float32Array(queryEmbedding),
      maxResults * 2 // Get more results to filter
    )

    // Process results
    const results: SemanticSearchResult[] = []
    
    for (let i = 0; i < labels.length; i++) {
      const medicineIndex = labels[i]
      const distance = distances[i]
      
      if (medicineIndex >= this.medicineEmbeddings.length) continue
      
      const medicine = this.medicineEmbeddings[medicineIndex]
      
      // Skip if it's the same medicine or not in stock
      if (medicine.name.toLowerCase().includes(queryMedicine.toLowerCase()) ||
          medicine.name.toLowerCase() === queryMedicine.toLowerCase()) {
        continue
      }

      // Calculate similarity score (convert distance to similarity)
      const similarity = Math.max(0, 1 - (distance / 2)) // Normalize distance to 0-1
      
      // Check therapeutic and ingredient matches
      const therapeuticMatch = this.checkTherapeuticMatch(queryMedicine, medicine)
      const ingredientMatch = this.checkIngredientMatch(queryMedicine, medicine)
      
      // Create reason for suggestion
      const reason = this.generateSuggestionReason(
        queryMedicine, 
        medicine, 
        therapeuticMatch, 
        ingredientMatch,
        similarity
      )

      results.push({
        medicine,
        similarity,
        reason,
        therapeuticMatch,
        ingredientMatch
      })
    }

    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults)
  }

  /**
   * Create query text for embedding
   */
  private createQueryText(medicineName: string, category: string): string {
    const activeIngredients = this.extractActiveIngredients(medicineName)
    const therapeuticClass = this.getTherapeuticClass(category)
    
    return [
      medicineName,
      category,
      therapeuticClass,
      activeIngredients.join(' '),
      'medicine drug pharmaceutical',
      'alternative substitute replacement'
    ].join(' ').toLowerCase()
  }

  /**
   * Extract active ingredients from medicine name
   */
  private extractActiveIngredients(medicineName: string): string[] {
    const commonIngredients = [
      'paracetamol', 'acetaminophen', 'ibuprofen', 'aspirin', 'metformin',
      'lisinopril', 'amlodipine', 'atorvastatin', 'omeprazole', 'metoprolol',
      'losartan', 'hydrochlorothiazide', 'sertraline', 'fluoxetine', 'tramadol',
      'codeine', 'morphine', 'fentanyl', 'diazepam', 'lorazepam'
    ]

    const ingredients: string[] = []
    const lowerName = medicineName.toLowerCase()

    for (const ingredient of commonIngredients) {
      if (lowerName.includes(ingredient)) {
        ingredients.push(ingredient)
      }
    }

    return ingredients
  }

  /**
   * Get therapeutic class from category
   */
  private getTherapeuticClass(category: string): string {
    const classMapping: Record<string, string> = {
      'Pain Relief': 'analgesic painkiller',
      'Antibiotic': 'antibacterial antimicrobial',
      'Cardiovascular': 'heart blood pressure',
      'Diabetes': 'antidiabetic glucose',
      'Respiratory': 'bronchodilator asthma',
      'Gastrointestinal': 'antacid digestive',
      'Mental Health': 'antidepressant anxiolytic',
      'Dermatology': 'topical skin',
      'Neurology': 'neurological brain',
      'Oncology': 'anticancer chemotherapy'
    }

    return classMapping[category] || category.toLowerCase()
  }

  /**
   * Check if medicines are in the same therapeutic class
   */
  private checkTherapeuticMatch(queryMedicine: string, targetMedicine: MedicineEmbedding): boolean {
    const queryClass = this.getTherapeuticClass(targetMedicine.category)
    const targetClass = targetMedicine.therapeuticClass
    
    return queryClass === targetClass || 
           queryClass.includes(targetClass) || 
           targetClass.includes(queryClass)
  }

  /**
   * Check if medicines share active ingredients
   */
  private checkIngredientMatch(queryMedicine: string, targetMedicine: MedicineEmbedding): boolean {
    const queryIngredients = this.extractActiveIngredients(queryMedicine)
    const targetIngredients = targetMedicine.activeIngredients
    
    return queryIngredients.some(ingredient => 
      targetIngredients.some(target => 
        ingredient === target || 
        ingredient.includes(target) || 
        target.includes(ingredient)
      )
    )
  }

  /**
   * Generate reason for suggesting alternative
   */
  private generateSuggestionReason(
    queryMedicine: string,
    targetMedicine: MedicineEmbedding,
    therapeuticMatch: boolean,
    ingredientMatch: boolean,
    similarity: number
  ): string {
    if (ingredientMatch) {
      return `Same active ingredient as ${queryMedicine}`
    }
    
    if (therapeuticMatch) {
      return `Same therapeutic class - ${targetMedicine.category}`
    }
    
    if (similarity > 0.7) {
      return `High semantic similarity to ${queryMedicine}`
    }
    
    if (similarity > 0.5) {
      return `Similar medicine in ${targetMedicine.category} category`
    }
    
    return `Alternative ${targetMedicine.category} medication`
  }

  /**
   * Get medicine by ID
   */
  getMedicineById(id: string): MedicineEmbedding | undefined {
    return this.medicineEmbeddings.find(med => med.id === id)
  }

  /**
   * Get all medicines in a category
   */
  getMedicinesByCategory(category: string): MedicineEmbedding[] {
    return this.medicineEmbeddings.filter(med => 
      med.category.toLowerCase() === category.toLowerCase()
    )
  }

  /**
   * Search medicines by text query
   */
  async searchMedicines(query: string, maxResults: number = 10): Promise<SemanticSearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('Vector search service not initialized')
    }

    const queryEmbedding = await this.getEmbedding(query)
    const { distances, labels } = this.index.search(
      new Float32Array(queryEmbedding),
      maxResults
    )

    const results: SemanticSearchResult[] = []
    
    for (let i = 0; i < labels.length; i++) {
      const medicineIndex = labels[i]
      const distance = distances[i]
      
      if (medicineIndex >= this.medicineEmbeddings.length) continue
      
      const medicine = this.medicineEmbeddings[medicineIndex]
      const similarity = Math.max(0, 1 - (distance / 2))
      
      results.push({
        medicine,
        similarity,
        reason: `Search result for "${query}"`,
        therapeuticMatch: false,
        ingredientMatch: false
      })
    }

    return results
  }
}
