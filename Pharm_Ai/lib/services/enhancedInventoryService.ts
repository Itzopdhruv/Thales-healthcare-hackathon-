import { Medicine } from './database'
import { VectorSearchService, SemanticSearchResult } from './vectorSearchService'

export interface InventoryCheck {
  medicineName: string
  requestedQuantity: number
  availableQuantity: number
  isAvailable: boolean
  shortage: number
  price: number
  category: string
}

export interface EnhancedAlternativeMedicine {
  name: string
  dosage: string
  category: string
  availableQuantity: number
  price: number
  similarity: number
  reason: string
  therapeuticMatch: boolean
  ingredientMatch: boolean
  activeIngredients: string[]
  therapeuticClass: string
}

export class EnhancedInventoryService {
  private medicines: Medicine[]
  private vectorSearchService: VectorSearchService
  private isInitialized = false

  constructor(medicines: Medicine[]) {
    this.medicines = medicines
    this.vectorSearchService = new VectorSearchService()
  }

  /**
   * Initialize the enhanced inventory service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    console.log('Initializing enhanced inventory service...')
    await this.vectorSearchService.initialize(this.medicines)
    this.isInitialized = true
    console.log('Enhanced inventory service initialized')
  }

  /**
   * Check inventory availability for a list of medicines
   */
  checkInventoryAvailability(medicines: Array<{name: string, quantity: number}>): InventoryCheck[] {
    return medicines.map(med => {
      const medicine = this.findMedicineByName(med.name)
      
      if (!medicine) {
        return {
          medicineName: med.name,
          requestedQuantity: med.quantity,
          availableQuantity: 0,
          isAvailable: false,
          shortage: med.quantity,
          price: 0,
          category: 'Unknown'
        }
      }

      const isAvailable = medicine.stock >= med.quantity
      const shortage = isAvailable ? 0 : med.quantity - medicine.stock

      return {
        medicineName: med.name,
        requestedQuantity: med.quantity,
        availableQuantity: medicine.stock,
        isAvailable,
        shortage,
        price: medicine.price,
        category: medicine.category
      }
    })
  }

  /**
   * Find alternatives using advanced vector search
   */
  async findAlternatives(
    medicineName: string, 
    category: string, 
    requestedQuantity: number,
    maxResults: number = 5
  ): Promise<EnhancedAlternativeMedicine[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // Use vector search to find semantically similar medicines
      const searchResults = await this.vectorSearchService.findSimilarMedicines(
        medicineName,
        category,
        requestedQuantity,
        maxResults * 2 // Get more results to filter
      )

      // Filter results to only include medicines that are in stock
      const availableAlternatives = searchResults
        .filter(result => {
          const medicine = this.findMedicineByName(result.medicine.name)
          return medicine && medicine.stock >= requestedQuantity
        })
        .slice(0, maxResults)

      // Convert to EnhancedAlternativeMedicine format
      return availableAlternatives.map(result => {
        const medicine = this.findMedicineByName(result.medicine.name)!
        
        return {
          name: result.medicine.name,
          dosage: result.medicine.dosage,
          category: result.medicine.category,
          availableQuantity: medicine.stock,
          price: medicine.price,
          similarity: result.similarity,
          reason: result.reason,
          therapeuticMatch: result.therapeuticMatch,
          ingredientMatch: result.ingredientMatch,
          activeIngredients: result.medicine.activeIngredients,
          therapeuticClass: result.medicine.therapeuticClass
        }
      })
    } catch (error) {
      console.error('Error in vector search:', error)
      
      // Fallback to basic search if vector search fails
      return this.fallbackBasicSearch(medicineName, category, requestedQuantity, maxResults)
    }
  }

  /**
   * Fallback basic search when vector search fails
   */
  private fallbackBasicSearch(
    medicineName: string,
    category: string,
    requestedQuantity: number,
    maxResults: number
  ): EnhancedAlternativeMedicine[] {
    const sameCategoryMedicines = this.medicines.filter(med => 
      med.category === category && 
      med.stock >= requestedQuantity &&
      !med.name.toLowerCase().includes(medicineName.toLowerCase())
    )

    return sameCategoryMedicines.slice(0, maxResults).map(med => ({
      name: med.name,
      dosage: med.dosage,
      category: med.category,
      availableQuantity: med.stock,
      price: med.price,
      similarity: 0.3, // Low similarity for fallback
      reason: `Alternative ${category} medication`,
      therapeuticMatch: true,
      ingredientMatch: false,
      activeIngredients: [],
      therapeuticClass: category
    }))
  }

  /**
   * Search medicines by semantic query
   */
  async searchMedicines(query: string, maxResults: number = 10): Promise<EnhancedAlternativeMedicine[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const searchResults = await this.vectorSearchService.searchMedicines(query, maxResults)
      
      return searchResults.map(result => {
        const medicine = this.findMedicineByName(result.medicine.name)!
        
        return {
          name: result.medicine.name,
          dosage: result.medicine.dosage,
          category: result.medicine.category,
          availableQuantity: medicine.stock,
          price: medicine.price,
          similarity: result.similarity,
          reason: result.reason,
          therapeuticMatch: false,
          ingredientMatch: false,
          activeIngredients: result.medicine.activeIngredients,
          therapeuticClass: result.medicine.therapeuticClass
        }
      })
    } catch (error) {
      console.error('Error in semantic search:', error)
      return []
    }
  }

  /**
   * Find medicine by name (case-insensitive)
   */
  private findMedicineByName(name: string): Medicine | undefined {
    return this.medicines.find(med => 
      med.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(med.name.toLowerCase())
    )
  }

  /**
   * Update inventory after prescription processing
   */
  updateInventory(medicines: Array<{name: string, quantity: number}>): Medicine[] {
    const updatedMedicines = [...this.medicines]
    
    medicines.forEach(prescriptionMed => {
      const medicineIndex = updatedMedicines.findIndex(med => 
        med.name.toLowerCase().includes(prescriptionMed.name.toLowerCase())
      )
      
      if (medicineIndex !== -1) {
        updatedMedicines[medicineIndex] = {
          ...updatedMedicines[medicineIndex],
          stock: Math.max(0, updatedMedicines[medicineIndex].stock - prescriptionMed.quantity),
          lastUpdated: new Date().toISOString()
        }
      }
    })
    
    return updatedMedicines
  }

  /**
   * Calculate total prescription cost
   */
  calculatePrescriptionCost(medicines: Array<{name: string, quantity: number}>): number {
    return medicines.reduce((total, med) => {
      const medicine = this.findMedicineByName(med.name)
      return total + (medicine ? medicine.price * med.quantity : 0)
    }, 0)
  }

  /**
   * Get medicine recommendations based on symptoms
   */
  async getRecommendationsBySymptoms(symptoms: string[]): Promise<EnhancedAlternativeMedicine[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const symptomQuery = symptoms.join(' ')
    return await this.searchMedicines(symptomQuery, 5)
  }

  /**
   * Get therapeutic alternatives for a medicine
   */
  async getTherapeuticAlternatives(medicineName: string): Promise<EnhancedAlternativeMedicine[]> {
    const medicine = this.findMedicineByName(medicineName)
    if (!medicine) return []

    return await this.findAlternatives(medicineName, medicine.category, 1, 10)
  }
}
