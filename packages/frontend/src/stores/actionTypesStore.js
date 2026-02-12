import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from '@/stores/composables/useBaseEntityStore'
import ActionTypeService from '@/services/entities/actionTypeService'

export const useActionTypesStore = defineStore('actionTypes', () => {
  const base = useCrudEntityStore(ActionTypeService, 'actionType')

  // Sorted computed property
  const actionTypes = computed(() => {
    return [...base.items.value].sort((a, b) => a.index - b.index)
  })

  return {
    items: actionTypes,
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    getById: base.getById,
    create: base.create,
    update: base.update,
    remove: base.remove,
  }
})
