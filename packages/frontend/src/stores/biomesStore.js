import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import BiomeService from '@/services/entities/biomeService'

export const useBiomesStore = defineStore('biomes', () => {
  const base = useCrudEntityStore(BiomeService, 'biomes')

  return {
    items: base.items,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
