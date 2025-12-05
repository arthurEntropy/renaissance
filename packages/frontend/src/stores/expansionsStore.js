import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import ExpansionService from '@/services/entities/expansionService'

export const useExpansionsStore = defineStore('expansions', () => {
  const base = useCrudEntityStore(ExpansionService, 'expansions')

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
