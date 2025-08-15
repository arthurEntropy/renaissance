import { computed, onMounted } from 'vue'

/**
 * Composable for managing concept views with consistent CRUD operations
 * Handles the common pattern of store management, filtering, and service delegation
 */
export function useConceptView(store, service, options = {}) {
  const {
    itemsProperty = 'items',
    fetchMethod = 'fetch',
    filterDeleted = false,
    useSoftDelete = false,
    createMethod = 'create',
    updateMethod = 'update',
    deleteMethod = 'delete'
  } = options

  // Computed property for filtered concepts
  const concepts = computed(() => {
    const items = store[itemsProperty] || []
    return filterDeleted 
      ? items.filter(item => !item.isDeleted)
      : items
  })

  // CRUD operations
  const createNew = async () => {
    return await service[createMethod]()
  }

  const update = async (item) => {
    return await service[updateMethod](item)
  }

  const deleteItem = async (item) => {
    if (useSoftDelete) {
      item.isDeleted = true
      return await service[updateMethod](item)
    } else {
      return await service[deleteMethod](item)
    }
  }

  const refreshData = async () => {
    return await store[fetchMethod]()
  }

  // Auto-fetch on mount
  onMounted(() => {
    refreshData()
  })

  return {
    concepts,
    createNew,
    update,
    deleteItem,
    refreshData
  }
}
