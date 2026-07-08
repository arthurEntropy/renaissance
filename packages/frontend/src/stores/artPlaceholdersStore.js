import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import ArtPlaceholderService from '@/services/entities/artPlaceholderService'

export const useArtPlaceholdersStore = defineStore('artPlaceholders', () => {
  const base = useCrudEntityStore(ArtPlaceholderService, 'artPlaceholders')

  /**
   * Returns a random placeholder URL from the configured list, or null if none are configured.
   */
  function getRandomUrl() {
    const activeItems = base.items.value
    if (!activeItems.length) return null
    return activeItems[Math.floor(Math.random() * activeItems.length)].url || null
  }

  return {
    items: base.items,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update: base.update,
    remove: base.remove,
    getRandomUrl,
  }
})
