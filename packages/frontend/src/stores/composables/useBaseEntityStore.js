import { ref, computed } from 'vue'

export function useBaseEntityStore(service, entityName) {
  // State
  const allItems = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastFetch = ref(null)
  
  // Computed property to filter out deleted items
  const items = computed(() => {
    return allItems.value.filter(item => !item.isDeleted)
  })
  
  // Clear error state
  const clearError = () => {
    error.value = null
  }
  
  // Actions
  const fetch = async (force = false) => {
    // Skip if recently fetched (unless forced)
    if (!force && lastFetch.value && Date.now() - lastFetch.value < 30000) {
      return
    }

    isLoading.value = true
    error.value = null // Clear error on new request
    try {
      allItems.value = await service.getAll()
      lastFetch.value = Date.now()
    } catch (err) {
      console.error(`Error fetching ${entityName}:`, err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Invalidate cache and refetch
  const refresh = async () => {
    return fetch(true)
  }
  
  // Getters
  const getById = (id) => {
    return items.value.find(item => item.id === id)
  }
  
  return {
    allItems,
    items,
    isLoading,
    error,
    lastFetch,
    fetch,
    refresh,
    getById,
    clearError,
  }
}

export function useCrudEntityStore(service, entityName) {
  // Base functionality
  const base = useBaseEntityStore(service, entityName)
  
  // CRUD operations with optimistic updates
  const create = async (entity) => {
    base.error.value = null // Clear error on new operation
    try {
      const newEntity = await service.create(entity)
      base.allItems.value.push(newEntity)
      base.lastFetch.value = Date.now() // Update cache timestamp
      return newEntity
    } catch (err) {
      console.error(`Error creating ${entityName}:`, err)
      base.error.value = err.message
      throw err
    }
  }
  
  const update = async (entity) => {
    base.error.value = null // Clear error on new operation
    
    // Store original for rollback
    const index = base.allItems.value.findIndex(item => item.id === entity.id)
    const original = index !== -1 ? { ...base.allItems.value[index] } : null
    
    // Optimistic update
    if (index !== -1) {
      base.allItems.value[index] = entity
    }
    
    try {
      const updated = await service.update(entity)
      // Update with server response
      if (index !== -1) {
        base.allItems.value[index] = updated
      }
      base.lastFetch.value = Date.now() // Update cache timestamp
      return updated
    } catch (err) {
      // Rollback on error
      if (index !== -1 && original) {
        base.allItems.value[index] = original
      }
      console.error(`Error updating ${entityName}:`, err)
      base.error.value = err.message
      throw err
    }
  }
  
  const remove = async (entity) => {
    base.error.value = null // Clear error on new operation
    
    // Optimistic update - mark as deleted
    const index = base.allItems.value.findIndex(item => item.id === entity.id)
    const original = index !== -1 ? { ...base.allItems.value[index] } : null
    
    if (index !== -1) {
      base.allItems.value[index] = { ...entity, isDeleted: true }
    }
    
    try {
      await service.delete(entity)
      base.lastFetch.value = Date.now() // Update cache timestamp
    } catch (err) {
      // Rollback on error
      if (index !== -1 && original) {
        base.allItems.value[index] = original
      }
      console.error(`Error deleting ${entityName}:`, err)
      base.error.value = err.message
      throw err
    }
  }
  
  return {
    ...base,
    create,
    update,
    remove,
  }
}
