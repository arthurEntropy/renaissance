import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import KeepingService from '@/services/entities/keepingService'

export const useKeepingStore = defineStore('keeping', () => {
  const base = useCrudEntityStore(KeepingService, 'keeping')

  // Sorted keeping options by cost (low to high)
  const sortedKeeping = computed(() => {
    return [...base.items.value].sort((a, b) => a.cost - b.cost)
  })

  return {
    keeping: sortedKeeping,
    items: sortedKeeping,
    fetch: base.fetch,
    getById: base.getById,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
