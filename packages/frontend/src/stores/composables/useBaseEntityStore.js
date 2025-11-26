import { ref, computed } from 'vue'

export function useBaseEntityStore(service, entityName) {
  // State
  const allItems = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  
  // Computed property to filter out deleted items
  const items = computed(() => {
    return allItems.value.filter(item => !item.isDeleted)
  })
  
  // Actions
  const fetch = async () => {
    isLoading.value = true
    error.value = null
    try {
      allItems.value = await service.getAll()
    } catch (err) {
      console.error(`Error fetching ${entityName}:`, err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
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
    fetch,
    getById,
  }
}

export function useCrudEntityStore(service, entityName) {
  // Base functionality
  const base = useBaseEntityStore(service, entityName)
  
  // CRUD operations
  const create = async (entity) => {
    try {
      const newEntity = await service.create(entity)
      base.allItems.value.push(newEntity)
      return newEntity
    } catch (err) {
      console.error(`Error creating ${entityName}:`, err)
      base.error.value = err.message
      throw err
    }
  }
  
  const update = async (entity) => {
    try {
      const updated = await service.update(entity)
      const index = base.allItems.value.findIndex(item => item.id === entity.id)
      if (index !== -1) {
        base.allItems.value[index] = updated
      }
      return updated
    } catch (err) {
      console.error(`Error updating ${entityName}:`, err)
      base.error.value = err.message
      throw err
    }
  }
  
  const remove = async (entity) => {
    try {
      await service.delete(entity)
      await base.fetch() // Refresh list (soft delete changes isDeleted flag)
    } catch (err) {
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
