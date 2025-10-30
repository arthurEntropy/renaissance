import { computed, onMounted } from 'vue'

/**
 * Composable for managing bestiary layouts with consistent CRUD operations
 * Similar to useCharactersLayout but filters for beasts (isBeast = true)
 */
export function useBestiaryLayout(charactersStore, equipmentStore, abilitiesStore, characterService) {
  const beasts = computed(() => charactersStore.filteredBeasts || [])
  const allEquipment = computed(() => equipmentStore.equipment || [])
  const allAbilities = computed(() => abilitiesStore.abilities || [])

  const createBeast = async () => {
    const newBeast = characterService.getDefaultEntity()
    newBeast.isBeast = true
    newBeast.name = 'New Beast'
    const createdBeast = await characterService.create(newBeast)
    await charactersStore.fetch()
    return createdBeast
  }

  const updateBeast = async (beast) => {
    const updatedBeast = await characterService.update(beast)
    await charactersStore.fetch()
    return updatedBeast
  }

  const deleteBeast = async (beast) => {
    await characterService.delete(beast)
    await charactersStore.fetch()
  }

  const refreshData = async () => {
    await Promise.all([
      charactersStore.fetch(),
      equipmentStore.fetch(),
      abilitiesStore.fetch()
    ])
  }

  // Auto-fetch data when component mounts
  onMounted(() => {
    refreshData()
  })

  // Computed props for ConceptsLayout configured for beasts
  const layoutProps = computed(() => ({
    concepts: beasts.value,
    createConceptFn: createBeast,
    updateConceptFn: updateBeast,
    deleteConceptFn: deleteBeast,
    refreshDataFn: refreshData,
    // Beast-specific customizations
    showFilters: false,
    modalComponent: 'CharacterSheetModal',
    customModalProps: {
      allEquipment: allEquipment.value || [],
      allAbilities: allAbilities.value || [],
    }
  }))

  return {
    // For direct use
    beasts,
    allEquipment,
    allAbilities,
    createBeast,
    updateBeast,
    deleteBeast,
    refreshData,
    // For ConceptsLayout
    layoutProps
  }
}
