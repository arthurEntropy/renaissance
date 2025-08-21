import { computed, onMounted } from 'vue'

/**
 * Composable for managing character layouts with consistent CRUD operations
 */
export function useCharactersLayout(charactersStore, equipmentStore, abilitiesStore, characterService) {
  const characters = computed(() => charactersStore.filteredCharacters || [])
  const allEquipment = computed(() => equipmentStore.equipment || [])
  const allAbilities = computed(() => abilitiesStore.abilities || [])

  const createCharacter = async () => {
    const newCharacter = await characterService.create({
      name: 'New Character',
      // Add any default character properties here
    })
    await charactersStore.fetch()
    return newCharacter
  }

  const updateCharacter = async (character) => {
    const updatedCharacter = await characterService.update(character)
    await charactersStore.fetch()
    return updatedCharacter
  }

  const deleteCharacter = async (character) => {
    await characterService.delete(character)
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

  // Computed props for ConceptsLayout configured for characters
  const layoutProps = computed(() => ({
    concepts: characters.value,
    createConceptFn: createCharacter,
    updateConceptFn: updateCharacter,
    deleteConceptFn: deleteCharacter,
    refreshDataFn: refreshData,
    // Character-specific customizations
    showFilters: false,
    modalComponent: 'CharacterSheetModal',
    customModalProps: {
      allEquipment: allEquipment.value,
      allAbilities: allAbilities.value,
    }
  }))

  return {
    // For direct use
    characters,
    allEquipment,
    allAbilities,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    refreshData,
    // For ConceptsLayout
    layoutProps
  }
}
