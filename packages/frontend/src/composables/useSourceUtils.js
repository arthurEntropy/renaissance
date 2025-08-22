import { useSourcesStore } from '@/stores/sourcesStore'

/**
 * Composable for source management utilities
 * Provides consistent source helper functions across components
 */
export function useSourceUtils() {
  const sourcesStore = useSourcesStore()
  
  const sources = sourcesStore.sources
  
  const sourceUtils = {
    getSourceById: sourcesStore.getSourceById,
    getSourceName: sourcesStore.getSourceName,
    getSourceType: sourcesStore.getSourceType,
  }

  return {
    sources,
    sourceUtils
  }
}
