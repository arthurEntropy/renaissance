import { computed, onMounted } from 'vue'
import { useActionCostsStore } from '@/stores/actionCostsStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import { useAuthStore } from '@/stores/authStore'
import { useArtPlaceholdersStore } from '@/stores/artPlaceholdersStore'

export function useCharactersLayout(charactersStore, equipmentStore, abilitiesStore, characterService, options = {}) {
  const { beastMode = false, adminOnlySelect = false } = options

  const actionTypesStore = useActionCostsStore()
  const abilitySchoolsStore = useAbilitySchoolsStore()
  const { open: openCharacterSheet } = useAppCharacterSheetModal()
  const authStore = useAuthStore()
  const artPlaceholdersStore = useArtPlaceholdersStore()

  /** Overrides the featuredArtUrls of an entity with a random placeholder if one is available. */
  const withRandomPlaceholder = (entity) => {
    const url = artPlaceholdersStore.getRandomUrl()
    return url ? { ...entity, featuredArtUrls: [url] } : entity
  }
  const characters = computed(() => 
    beastMode 
      ? (charactersStore.filteredBeasts || [])
      : (charactersStore.filteredCharacters || [])
  )

  const applyCharacterTypeDefaults = (entity) => {
    if (!beastMode) return entity

    entity.characterType = 'beast'
    entity.name = 'New Beast'
    return entity
  }

  const createCharacter = async () => {
    const defaultEntity = withRandomPlaceholder(applyCharacterTypeDefaults(characterService.getDefaultEntity()))
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
      abilitySchoolsStore.fetch(),
      artPlaceholdersStore.fetch(),
    ])
  }

  onMounted(() => {
    refreshData()
  })

  const layoutProps = computed(() => ({
    concepts: characters.value,
    selectedItem: charactersStore.selectedCharacter,
    storageKey: beastMode ? 'bestiary' : 'characters',
    stickySelection: true,
    showExpansionFilter: false,
    modalComponent: 'CharacterSheetModal',
    useExternalModal: true,
    emptyStateLabel: beastMode ? null : 'Create your first character',
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
    const defaultEntity = withRandomPlaceholder(applyCharacterTypeDefaults(characterService.getDefaultEntity()))
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
