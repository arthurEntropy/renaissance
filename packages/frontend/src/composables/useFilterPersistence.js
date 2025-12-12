import { watch } from 'vue'

// Persists filter states to browser localStorage across sessions.
export function useFilterPersistence(storageKey, filters) {
  const STORAGE_PREFIX = 'renaissance-filters-'
  const fullKey = STORAGE_PREFIX + storageKey

  const loadFilters = () => {
    try {
      const stored = localStorage.getItem(fullKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        
        // Apply stored values to refs
        Object.keys(parsed).forEach(key => {
          if (filters[key] !== undefined) {
            filters[key].value = parsed[key]
          }
        })
      }
    } catch (error) {
      console.error(`Error loading filters for ${storageKey}:`, error)
    }
  }

  const saveFilters = () => {
    try {
      const toStore = {}
      
      // Extract values from refs
      Object.keys(filters).forEach(key => {
        toStore[key] = filters[key].value
      })
      
      localStorage.setItem(fullKey, JSON.stringify(toStore))
    } catch (error) {
      console.error(`Error saving filters for ${storageKey}:`, error)
    }
  }

  const setupWatchers = () => {
    Object.values(filters).forEach(filterRef => {
      watch(filterRef, saveFilters, { deep: true })
    })
  }

  // Auto-initialize immediately
  loadFilters()
  setupWatchers()
}
