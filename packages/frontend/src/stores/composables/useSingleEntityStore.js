import { ref } from 'vue'

export function useSingleEntityStore(service, entityName, fetchMethod = 'getCurrentProfile', updateMethod = 'updateCurrentProfile') {
  // State
  const entity = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  
  // Actions
  const fetch = async () => {
    isLoading.value = true
    error.value = null
    try {
      entity.value = await service[fetchMethod]()
    } catch (err) {
      console.error(`Error fetching ${entityName}:`, err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const update = async (updates) => {
    try {
      entity.value = await service[updateMethod](updates)
      return entity.value
    } catch (err) {
      console.error(`Error updating ${entityName}:`, err)
      error.value = err.message
      throw err
    }
  }
  
  return {
    entity,
    isLoading,
    error,
    fetch,
    update,
  }
}
