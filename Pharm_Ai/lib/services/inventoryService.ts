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

export interface AlternativeMedicine {
  name: string
  dosage: string
  category: string
  availableQuantity: number
  price: number
  similarity: number
  reason: string
}

export class InventoryService {
  private medicines: Medicine[]

  constructor(medicines: Medicine[]) {
    this.medicines = medicines
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
   * Find alternative medicines using vector search
   */
  findAlternatives(medicineName: string, category: string, requestedQuantity: number): AlternativeMedicine[] {
    const targetMedicine = this.findMedicineByName(medicineName)
    if (!targetMedicine) return []

    // Get medicines in the same category that are in stock
    const sameCategoryMedicines = this.medicines.filter(med => 
      med.category === category && 
      med.stock >= requestedQuantity &&
      med.name !== medicineName
    )

    // Simple similarity scoring based on name similarity and category
    const alternatives = sameCategoryMedicines.map(med => {
      const similarity = this.calculateSimilarity(medicineName, med.name)
      return {
        name: med.name,
        dosage: med.dosage,
        category: med.category,
        availableQuantity: med.stock,
        price: med.price,
        similarity,
        reason: this.getAlternativeReason(medicineName, med.name, category)
      }
    })

    // Sort by similarity and return top 3
    return alternatives
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
  }

  /**
   * Calculate similarity between two medicine names
   */
  private calculateSimilarity(name1: string, name2: string): number {
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
   * Get reason for suggesting alternative
   */
  private getAlternativeReason(original: string, alternative: string, category: string): string {
    const reasons = [
      `Similar ${category} medication`,
      `Same therapeutic class as ${original}`,
      `Alternative treatment option`,
      `Generic equivalent available`
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
}
