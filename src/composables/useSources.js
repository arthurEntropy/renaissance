import { ref, computed } from 'vue'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'

// Global state for sources to share across all instances
let globalSources = null
let isLoading = ref(false)
let hasLoaded = ref(false)

/**
 * Composable for managing sources data and utilities across the application
 * Centralizes fetching, combining, and resolving sources from multiple stores
 * Automatically fetches sources on first use and caches them globally
 */
export function useSources() {
  const equipmentStore = useEquipmentStore()
  const abilitiesStore = useAbilitiesStore()
  
  // Initialize global sources if not already done
  if (!globalSources) {
    globalSources = ref({
      ancestries: [],
      cultures: [],
      mestieri: [],
      worldElements: []
    })
  }

  // Computed to provide reactive access to sources
  const sources = computed(() => globalSources.value)

  // Fetch sources for both abilities and equipment
  const fetchSources = async (force = false) => {
    // Skip if already loaded and not forcing a refresh
    if (hasLoaded.value && !force) {
      return
    }

    // Skip if already loading
    if (isLoading.value) {
      return
    }

    isLoading.value = true
    
    try {
      // Fetch ability sources from abilitiesStore
      await abilitiesStore.fetchAllSources()

      // Fetch equipment sources from equipmentStore
      await equipmentStore.fetchAllSources()

      // Combine sources from both stores to ensure we have all sources
      // We'll prioritize the equipment store's sources but merge in any unique sources from abilities
      globalSources.value = {
        ancestries: [...equipmentStore.sources.ancestries],
        cultures: [...equipmentStore.sources.cultures],
        mestieri: [...equipmentStore.sources.mestieri],
        worldElements: [...equipmentStore.sources.worldElements]
      }
      
      hasLoaded.value = true
    } catch (error) {
      console.error('Error fetching sources:', error)
      throw error // Re-throw to allow caller to handle
    } finally {
      isLoading.value = false
    }
  }

  // Auto-fetch sources on first access if not already loaded
  if (!hasLoaded.value && !isLoading.value) {
    fetchSources().catch(error => {
      console.error('Auto-fetch sources failed:', error)
    })
  }

  // Source utility functions
  const getSourceById = (sourceId) => {
    if (!sourceId) return null

    // Search through all source types
    return (
      globalSources.value.ancestries.find((item) => item.id === sourceId) ||
      globalSources.value.cultures.find((item) => item.id === sourceId) ||
      globalSources.value.mestieri.find((item) => item.id === sourceId) ||
      globalSources.value.worldElements.find((item) => item.id === sourceId) ||
      // Fallback to store methods if not found in local sources
      equipmentStore.getSourceById?.(sourceId) ||
      abilitiesStore.getSourceById?.(sourceId)
    )
  }

  const getSourceName = (sourceId) => {
    if (sourceId === 'general') return 'General'
    if (sourceId === 'custom') return 'Custom Items'

    const source = getSourceById(sourceId)
    return source ? source.name : 'General'
  }

  const getSourceType = (sourceId) => {
    if (!sourceId) return 'general'
    if (sourceId === 'general') return 'general'
    if (sourceId === 'custom') return 'custom'

    // Check which array the source belongs to
    if (globalSources.value.ancestries.find(item => item.id === sourceId)) return 'ancestry'
    if (globalSources.value.cultures.find(item => item.id === sourceId)) return 'culture'
    if (globalSources.value.mestieri.find(item => item.id === sourceId)) return 'mestiere'
    if (globalSources.value.worldElements.find(item => item.id === sourceId)) return 'worldElement'

    return 'general'
  }

  return {
    sources,
    fetchSources,
    getSourceById,
    getSourceName,
    getSourceType,
    isLoading: computed(() => isLoading.value),
    hasLoaded: computed(() => hasLoaded.value)
  }
}
