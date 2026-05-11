import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from '@/stores/composables/useBaseEntityStore'
import ActionCostService from '@/services/entities/actionCostService'

export const useActionCostsStore = defineStore('actionCosts', () => {
  const base = useCrudEntityStore(ActionCostService, 'actionCost')

  // Sorted computed property
  const actionCosts = computed(() => {
    return [...base.items.value].sort((a, b) => a.index - b.index)
  })

  return {
    items: actionCosts,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
