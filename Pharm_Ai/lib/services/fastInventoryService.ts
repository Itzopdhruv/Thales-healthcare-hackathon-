import { Medicine } from './database'

export interface InventoryCheck {
  medicineName: string
  requestedQuantity: number
  availableQuantity: number
  isAvailable: boolean
  shortage: number
  price: number
  category: string
}

export interface FastAlternativeMedicine {
  name: string
  dosage: string
  category: string
  availableQuantity: number
  price: number
  similarity: number
  reason: string
}

export class FastInventoryService {
  private medicines: Medicine[]
  private categoryMap: Map<string, Medicine[]> = new Map()

  constructor(medicines: Medicine[]) {
    this.medicines = medicines
    this.buildCategoryMap()
  }

  /**
   * Build category map for fast lookups
   */
  private buildCategoryMap(): void {
    this.medicines.forEach(medicine => {
      if (!this.categoryMap.has(medicine.category)) {
        this.categoryMap.set(medicine.category, [])
      }
      this.categoryMap.get(medicine.category)!.push(medicine)
    })
  }

  /**
   * Fast inventory availability check
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
   * Fast alternative search using category and name matching
   */
  findAlternatives(
    medicineName: string,
    category: string,
    requestedQuantity: number,
    maxResults: number = 3
  ): FastAlternativeMedicine[] {
    try {
      const categoryMedicines = this.categoryMap.get(category) || []
      
      // Filter medicines in same category that are in stock and not the same medicine
      const alternatives = categoryMedicines
        .filter(med => 
          med.stock > 0 && // Has some stock (even if less than requested)
          !med.name.toLowerCase().includes(medicineName.toLowerCase()) &&
          medicineName.toLowerCase() !== med.name.toLowerCase()
        )
        .map(med => ({
          name: med.name,
          dosage: med.dosage,
          category: med.category,
          availableQuantity: med.stock,
          price: med.price,
          similarity: this.calculateBasicSimilarity(medicineName, med.name),
          reason: this.getBasicReason(medicineName, med.name, category)
        }))
        .sort((a, b) => {
          // Prioritize medicines with sufficient stock
          const aHasEnoughStock = a.availableQuantity >= requestedQuantity
          const bHasEnoughStock = b.availableQuantity >= requestedQuantity
          
          if (aHasEnoughStock && !bHasEnoughStock) return -1
          if (!aHasEnoughStock && bHasEnoughStock) return 1
          
          // If both have same stock status, sort by similarity
          return b.similarity - a.similarity
        })
        .slice(0, maxResults)

      return alternatives
    } catch (error) {
      console.error('Error finding alternatives:', error)
      return []
    }
  }

  /**
   * Basic similarity calculation using name matching
   */
  private calculateBasicSimilarity(name1: string, name2: string): number {
    const words1 = name1.toLowerCase().split(/\s+/)
    const words2 = name2.toLowerCase().split(/\s+/)
    
    let matches = 0
    const totalWords = Math.max(words1.length, words2.length)
    
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
          matches++
          break
        }
      }
    }
    
    return matches / totalWords
  }

  /**
   * Get basic reason for alternative suggestion
   */
  private getBasicReason(original: string, alternative: string, category: string): string {
    const reasons = [
      `Alternative ${category} medication`,
      `Similar therapeutic class as ${original}`,
      `Same category - ${category}`,
      `Replacement for ${original}`
    ]
    
    return reasons[Math.floor(Math.random() * reasons.length)]
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
   * Calculate total prescription cost
   */
  calculatePrescriptionCost(medicines: Array<{name: string, quantity: number}>): number {
    return medicines.reduce((total, med) => {
      const medicine = this.findMedicineByName(med.name)
      return total + (medicine ? medicine.price * med.quantity : 0)
    }, 0)
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
}
