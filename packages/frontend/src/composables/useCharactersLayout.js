import { computed, onMounted } from 'vue'

export function useCharactersLayout(charactersStore, equipmentStore, abilitiesStore, characterService, options = {}) {
  const { isBeast = false } = options
  
  const characters = computed(() => 
    isBeast 
      ? (charactersStore.filteredBeasts || [])
      : (charactersStore.filteredCharacters || [])
  )

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
    selectedItem: charactersStore.selectedCharacter,
    storageKey: isBeast ? 'bestiary' : 'characters',
    stickySelection: true,
    showExpansionFilter: false,
    modalComponent: 'CharacterSheetModal'
  }))

  // Event handlers for ConceptsLayout
  const handleSelect = (character) => {
    charactersStore.selectCharacter(character)
  }

  const handleDeselect = () => {
    // Characters don't deselect (sticky selection)
  }

  const handleCreate = async () => {
    const defaultEntity = characterService.getDefaultEntity()
    if (isBeast) {
      defaultEntity.isBeast = true
      defaultEntity.name = 'New Beast'
    }
    const newCharacter = await characterService.create(defaultEntity)
    await charactersStore.fetch()
    
    // Select the newly created character
    charactersStore.selectCharacter(newCharacter)
  }

  return {
    characters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    refreshData,
    layoutProps,
    handleSelect,
    handleDeselect,
    handleCreate
  }
}
