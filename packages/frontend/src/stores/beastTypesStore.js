import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import BeastTypeService from '@/services/entities/beastTypeService'

export const useBeastTypesStore = defineStore('beastTypes', () => {
  const base = useCrudEntityStore(BeastTypeService, 'beastType')
  const sortedItems = computed(() => [...base.items.value].sort((a, b) => a.name.localeCompare(b.name)))

  return {
    items: sortedItems,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
