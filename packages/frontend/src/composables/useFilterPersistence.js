import { watch, onMounted } from 'vue'

/**
 * Composable for persisting filter state to localStorage
 * @param {string} storageKey - Unique key for localStorage (e.g., 'abilities-filters')
 * @param {Object} filters - Object containing refs to persist
 * @returns {Object} Methods for managing persistence
 */
export function useFilterPersistence(storageKey, filters) {
  const STORAGE_PREFIX = 'renaissance-filters-'
  const fullKey = STORAGE_PREFIX + storageKey

  /**
   * Load filters from localStorage
   */
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

  /**
   * Save filters to localStorage
   */
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

  /**
   * Clear stored filters
   */
  const clearStoredFilters = () => {
    try {
      localStorage.removeItem(fullKey)
    } catch (error) {
      console.error(`Error clearing filters for ${storageKey}:`, error)
    }
  }

  /**
   * Watch all filter refs and save on changes
   */
  const setupWatchers = () => {
    Object.values(filters).forEach(filterRef => {
      watch(filterRef, saveFilters, { deep: true })
    })
  }

  /**
   * Initialize persistence (load on mount, watch for changes)
   */
  const initialize = () => {
    loadFilters()
    setupWatchers()
  }

  return {
    loadFilters,
    saveFilters,
    clearStoredFilters,
    initialize
  }
}
