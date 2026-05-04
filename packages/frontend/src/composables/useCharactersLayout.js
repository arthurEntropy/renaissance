import { computed, onMounted } from 'vue'
import { useActionTypesStore } from '@/stores/actionTypesStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import { useAuthStore } from '@/stores/authStore'

export function useCharactersLayout(charactersStore, equipmentStore, abilitiesStore, characterService, options = {}) {
  const { isBeast = false, adminOnlySelect = false } = options

  const actionTypesStore = useActionTypesStore()
  const abilitySchoolsStore = useAbilitySchoolsStore()
  const { open: openCharacterSheet } = useAppCharacterSheetModal()
  const authStore = useAuthStore()
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
      abilitiesStore.fetch(),
      actionTypesStore.fetch(),
      abilitySchoolsStore.fetch()
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
    modalComponent: 'CharacterSheetModal',
    useExternalModal: true,
  }))

  // Event handlers for ConceptsLayout
  const handleSelect = (character) => {
    const persistSelection = !adminOnlySelect || authStore.isAdmin
    openCharacterSheet(character, { persistSelection })
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
    
    // Open the character sheet for the newly created character
    openCharacterSheet(newCharacter)
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
