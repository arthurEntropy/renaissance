import { computed, watch } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import CharacterService from '@/services/characterService'

/**
 * Composable for managing character selection, updates, and stat watching
 * Centralizes character-related business logic and state management
 */
export function useCharacterManagement(allEquipment) {
  const characterStore = useCharactersStore()

  // Character selection management
  const selectedCharacter = computed({
    get() {
      return characterStore.selectedCharacter
    },
    set(value) {
      characterStore.selectedCharacter = value
    }
  })

  const selectCharacter = (character) => {
    selectedCharacter.value = character
    characterStore.selectedCharacter = character
  }

  const deselectCharacter = () => {
    selectedCharacter.value = null
    characterStore.selectedCharacter = null
    characterStore.fetchCharacters()
  }

  const updateCharacter = (updatedCharacter) => {
    selectedCharacter.value = { ...updatedCharacter }
  }

  const createNewCharacter = async () => {
    const createdCharacter = await CharacterService.createCharacter()
    await characterStore.fetchCharacters()
    const newCharacter = characterStore.characters.find(
      (character) => character.id === createdCharacter.id
    )
    selectCharacter(newCharacter)
  }

  const deleteCharacter = (character) => {
    CharacterService.deleteCharacter(character)
    deselectCharacter()
  }

  // Centralized character stat watchers
  const watchCharacterStats = () => {
    // Main character save watcher with debouncing
    watch(selectedCharacter, (newCharacter) => {
      if (!newCharacter) return
      const timeoutId = setTimeout(() => {
        CharacterService.saveCharacter(newCharacter)
      }, 500) // Only save after 0.5 seconds to avoid too many saves
      
      // Store timeout for potential cleanup
      return () => clearTimeout(timeoutId)
    }, { deep: true })

    // Core stats watchers
    watch(() => selectedCharacter.value?.body, () => {
      if (!selectedCharacter.value || selectedCharacter.value.body === undefined) return
      CharacterService.handleBodyChange(selectedCharacter.value)
    })

    watch(() => selectedCharacter.value?.heart, () => {
      if (!selectedCharacter.value || selectedCharacter.value.heart === undefined) return
      CharacterService.handleHeartChange(selectedCharacter.value)
    })

    watch(() => selectedCharacter.value?.wits, () => {
      if (!selectedCharacter.value || selectedCharacter.value.wits === undefined) return
      CharacterService.handleWitsChange(selectedCharacter.value)
    })

    // Derived stats watchers
    watch(() => selectedCharacter.value?.endurance, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.endurance) return
      CharacterService.handleEnduranceChange(
        selectedCharacter.value,
        allEquipment.value
      )
    }, { deep: true })

    watch(() => selectedCharacter.value?.hope, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.hope) return
      CharacterService.handleHopeChange(selectedCharacter.value)
    }, { deep: true })

    watch(() => selectedCharacter.value?.defense, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.defense) return
      CharacterService.handleDefenseChange(selectedCharacter.value)
    }, { deep: true })

    watch(() => selectedCharacter.value?.load, () => {
      if (!selectedCharacter.value || selectedCharacter.value.load === undefined) return
      CharacterService.handleLoadChange(selectedCharacter.value)
    })

    watch(() => selectedCharacter.value?.shadow, () => {
      if (!selectedCharacter.value || selectedCharacter.value.shadow === undefined) return
      CharacterService.handleShadowChange(selectedCharacter.value)
    })

    watch(() => selectedCharacter.value?.injury, () => {
      if (!selectedCharacter.value || selectedCharacter.value.injury === undefined) return
      CharacterService.handleInjuryChange(selectedCharacter.value)
    })

    // Complex state watchers
    watch(() => selectedCharacter.value?.states, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.states) return
      CharacterService.handleStatesChange(selectedCharacter.value)
    }, { deep: true })

    watch(() => selectedCharacter.value?.conditions, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.conditions) return
      CharacterService.handleConditionsChange(selectedCharacter.value)
    }, { deep: true })

    watch(() => selectedCharacter.value?.equipment, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.equipment || !allEquipment.value) return
      CharacterService.handleEquipmentChange(
        selectedCharacter.value,
        allEquipment.value
      )
    }, { deep: true })
  }

  return {
    selectedCharacter,
    selectCharacter,
    deselectCharacter,
    updateCharacter,
    createNewCharacter,
    deleteCharacter,
    watchCharacterStats
  }
}
