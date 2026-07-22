import { defineStore } from 'pinia'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import BeastTypeService from '@/services/entities/beastTypeService'

export const useBeastTypesStore = defineStore('beastTypes', () => {
  const base = useCrudEntityStore(BeastTypeService, 'beastType')

  return {
    items: base.items,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
