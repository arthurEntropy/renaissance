import { computed, onMounted } from 'vue'

export function useCharactersLayout(charactersStore, equipmentStore, abilitiesStore, characterService, options = {}) {
  const { isBeast = false } = options
  
  const characters = computed(() => 
    isBeast 
      ? (charactersStore.filteredBeasts || [])
      : (charactersStore.filteredCharacters || [])
  )
  const allEquipment = computed(() => equipmentStore.equipment || [])
  const allAbilities = computed(() => abilitiesStore.abilities || [])

  const createCharacter = async () => {
    const defaultEntity = characterService.getDefaultEntity()
    if (isBeast) {
      defaultEntity.isBeast = true
      defaultEntity.name = 'New Beast'
    }
    const newCharacter = await characterService.create(defaultEntity)
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

  onMounted(() => {
    refreshData()
  })

  const layoutProps = computed(() => ({
    concepts: characters.value,
    createConceptFn: createCharacter,
    updateConceptFn: updateCharacter,
    deleteConceptFn: deleteCharacter,
    refreshDataFn: refreshData,
    showFilters: false,
    modalComponent: 'CharacterSheetModal',
    customModalProps: {
      allEquipment: allEquipment.value || [],
      allAbilities: allAbilities.value || [],
    }
  }))

  return {
    characters,
    allEquipment,
    allAbilities,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    refreshData,
    layoutProps
  }
}
