import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useBaseEntityStore } from './composables/useBaseEntityStore'
import KeepingService from '@/services/entities/keepingService'

export const useKeepingStore = defineStore('keeping', () => {
  const { items: keeping, fetch, getById } = useBaseEntityStore(
    KeepingService,
    'keeping'
  )

  // Sorted keeping options by cost (low to high)
  const sortedKeeping = computed(() => {
    return [...keeping.value].sort((a, b) => a.cost - b.cost)
  })

  return {
    keeping: sortedKeeping,
    fetch,
    getById,
  }
})
