'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Package,
  Star,
  Zap,
  Shield,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SearchResult {
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

interface SemanticSearchProps {
  onMedicineSelect?: (medicine: SearchResult) => void
  placeholder?: string
  maxResults?: number
}

const SemanticSearch: React.FC<SemanticSearchProps> = ({
  onMedicineSelect,
  placeholder = "Search medicines by name, symptoms, or description...",
  maxResults = 10
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setHasSearched(true)

    try {
      const response = await fetch('/api/medicines/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          maxResults
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.data.results)
      } else {
        toast.error(data.error || 'Search failed')
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search medicines')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.8) return 'text-green-600 bg-green-100'
    if (similarity > 0.6) return 'text-blue-600 bg-blue-100'
    if (similarity > 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getSimilarityText = (similarity: number) => {
    if (similarity > 0.8) return 'Very High'
    if (similarity > 0.6) return 'High'
    if (similarity > 0.4) return 'Medium'
    return 'Low'
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <motion.button
            type="submit"
            disabled={isSearching || !query.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Search'
            )}
          </motion.button>
        </div>
      </form>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mr-3" />
              <span className="text-gray-600">Searching medicines...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Search Results ({results.length})
                </h3>
                <span className="text-sm text-gray-500">
                  Powered by AI semantic search
                </span>
              </div>

              <div className="grid gap-4">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => onMedicineSelect?.(result)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{result.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSimilarityColor(result.similarity)}`}>
                            {getSimilarityText(result.similarity)} Match
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Dosage</p>
                            <p className="font-medium">{result.dosage}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Category</p>
                            <p className="font-medium">{result.category}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Price</p>
                            <p className="font-medium">${result.price.toFixed(2)}</p>
                          </div>
                        </div>

                        {result.activeIngredients.length > 0 && (
                          <div className="mt-2">
                            <p className="text-gray-600 text-sm">Active Ingredients</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.activeIngredients.map((ingredient, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {ingredient}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 mt-3">
                          {result.therapeuticMatch && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <Shield className="w-4 h-4" />
                              <span className="text-sm">Therapeutic Match</span>
                            </div>
                          )}
                          {result.ingredientMatch && (
                            <div className="flex items-center space-x-1 text-blue-600">
                              <Zap className="w-4 h-4" />
                              <span className="text-sm">Ingredient Match</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Package className="w-4 h-4" />
                            <span className="text-sm">{result.availableQuantity} in stock</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-2">{result.reason}</p>
                      </div>

                      <div className="ml-4 flex flex-col items-end">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {Math.round(result.similarity * 100)}%
                          </p>
                          <p className="text-sm text-gray-500">Similarity</p>
                        </div>
                        {onMedicineSelect && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-2 px-3 py-1 bg-primary-600 text-white text-sm rounded-md flex items-center space-x-1"
                          >
                            <span>Select</span>
                            <ArrowRight className="w-3 h-3" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">Try searching with different keywords or check your spelling</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SemanticSearch
