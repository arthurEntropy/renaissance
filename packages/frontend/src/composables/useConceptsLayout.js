import { computed, onMounted } from 'vue'
import { ConceptType } from '@shared/constants/conceptTypes'
import { useArtPlaceholdersStore } from '@/stores/artPlaceholdersStore'

/**
 * Map item names to ConceptType enum values
 */
const ITEM_NAME_TO_CONCEPT_TYPE = {
  'Ancestry': ConceptType.ANCESTRY,
  'Culture': ConceptType.CULTURE,
  'Mestiere': ConceptType.MESTIERE,
  'World Element': ConceptType.WORLD_ELEMENT,
}

/**
 * Composable for managing concept layouts with consistent CRUD operations
 */
export function useConceptsLayout(store, service, options = {}) {
  const { conceptsProperty = 'concepts', itemName = '' } = options
  const artPlaceholdersStore = useArtPlaceholdersStore()

  const withRandomPlaceholder = (entity) => {
    const url = artPlaceholdersStore.getRandomUrl()
    return url ? { ...entity, featuredArtUrls: [url] } : entity
  }

  const concepts = computed(() => store[conceptsProperty] || [])

  const createConcept = async () => {
    const conceptType = ITEM_NAME_TO_CONCEPT_TYPE[itemName]
    const defaultEntity = withRandomPlaceholder(
      conceptType ? service.getDefaultEntity(conceptType) : service.getDefaultEntity()
    )
    const newConcept = await service.create(defaultEntity)
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
    await Promise.all([store.fetch(), artPlaceholdersStore.fetch()])
  }

  // Auto-fetch data when component mounts
  onMounted(() => {
    refreshData()
  })

  // Computed props for ConceptsLayout
  const layoutProps = computed(() => ({
    concepts: concepts.value,
    selectedItem: store.selectedConcept,
    storageKey: conceptsProperty,
    stickySelection: false
  }))

  // Event handlers for ConceptsLayout
  const handleSelect = (concept) => {
    store.selectConcept(concept)
  }

  const handleDeselect = () => {
    store.deselectConcept()
  }

  const handleCreate = async () => {
    const conceptType = ITEM_NAME_TO_CONCEPT_TYPE[itemName]
    const defaultEntity = withRandomPlaceholder(
      conceptType ? service.getDefaultEntity(conceptType) : service.getDefaultEntity()
    )
    const newConcept = await service.create(defaultEntity)
    await store.fetch()
    
    // Select the newly created concept
    store.selectConcept(newConcept)
  }

  return {
    // For direct use
    concepts,
    createConcept,
    updateConcept,
    deleteConcept,
    refreshData,
    
    // For ConceptsLayout props (can be spread with v-bind)
    layoutProps,
    
    // Event handlers
    handleSelect,
    handleDeselect,
    handleCreate
  }
}
