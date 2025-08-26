import { computed, onMounted } from 'vue'

/**
 * Composable for managing concept layouts with consistent CRUD operations
 */
export function useConceptsLayout(store, service, options = {}) {
  const { conceptsProperty = 'concepts' } = options

  const concepts = computed(() => store[conceptsProperty] || [])

  const createConcept = async (concept) => {
    const newConcept = await service.create(concept)
    await store.fetch()
    return newConcept
  }

  const updateConcept = async (concept) => {
    const updatedConcept = await service.update(concept)
    await store.fetch()
    return updatedConcept
  }

  const deleteConcept = async (concept) => {
    await service.delete(concept)
    await store.fetch()
  }

  const refreshData = async () => {
    await store.fetch()
  }

  // Auto-fetch data when component mounts
  onMounted(() => {
    refreshData()
  })

  // Computed props for ConceptsLayout
  const layoutProps = computed(() => ({
    concepts: concepts.value,
    createConceptFn: createConcept,
    updateConceptFn: updateConcept,
    deleteConceptFn: deleteConcept,
    refreshDataFn: refreshData
  }))

  return {
    // For direct use
    concepts,
    createConcept,
    updateConcept,
    deleteConcept,
    refreshData,
    
    // For ConceptsLayout props (can be spread with v-bind)
    layoutProps
  }
}
