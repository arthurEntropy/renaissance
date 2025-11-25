import { computed, watch } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import CharacterService from '@/services/entities/characterService'
import * as CharacterUtils from '@shared/types/entities/characterUtils'

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

  const createCharacter = async () => {
    const createdCharacter = await CharacterService.create()
    await characterStore.fetchCharacters()
    return createdCharacter
  }

  const deleteCharacter = (character) => {
    CharacterService.delete(character)
  }

  // Centralized character stat watchers
  const watchCharacterStats = () => {
    // Main character save watcher with debouncing
    watch(selectedCharacter, (newCharacter) => {
      if (!newCharacter) return
      const timeoutId = setTimeout(() => {
        CharacterService.update(newCharacter)
      }, 500) // Only save after 0.5 seconds to avoid too many saves
      
      // Store timeout for potential cleanup
      return () => clearTimeout(timeoutId)
    }, { deep: true })

    // Core stats watchers
    watch(() => selectedCharacter.value?.body, () => {
      if (!selectedCharacter.value || selectedCharacter.value.body === undefined) return
      CharacterUtils.handleBodyChange(selectedCharacter.value)
    })

    watch(() => selectedCharacter.value?.heart, () => {
      if (!selectedCharacter.value || selectedCharacter.value.heart === undefined) return
      CharacterUtils.handleHeartChange(selectedCharacter.value)
    })

    watch(() => selectedCharacter.value?.wits, () => {
      if (!selectedCharacter.value || selectedCharacter.value.wits === undefined) return
      CharacterUtils.handleWitsChange(selectedCharacter.value)
    })

    // Derived stats watchers
    watch(() => selectedCharacter.value?.endurance, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.endurance) return
      if (!allEquipment.value || !Array.isArray(allEquipment.value)) return
      CharacterUtils.handleEnduranceChange(
        selectedCharacter.value,
        allEquipment.value
      )
    }, { deep: true })

    watch(() => selectedCharacter.value?.hope, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.hope) return
      CharacterUtils.handleHopeChange(selectedCharacter.value)
    }, { deep: true })

    watch(() => selectedCharacter.value?.defense, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.defense) return
      CharacterUtils.handleDefenseChange(selectedCharacter.value)
    }, { deep: true })

    watch(() => selectedCharacter.value?.load, () => {
      if (!selectedCharacter.value || selectedCharacter.value.load === undefined) return
      CharacterUtils.handleLoadChange(selectedCharacter.value)
    })

    watch(() => selectedCharacter.value?.shadow, () => {
      if (!selectedCharacter.value || selectedCharacter.value.shadow === undefined) return
      CharacterUtils.handleShadowChange(selectedCharacter.value)
    })

    watch(() => selectedCharacter.value?.injury, () => {
      if (!selectedCharacter.value || selectedCharacter.value.injury === undefined) return
      CharacterUtils.handleInjuryChange(selectedCharacter.value)
    })

    // Complex state watchers
    watch(() => selectedCharacter.value?.states, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.states) return
      CharacterUtils.handleStatesChange(selectedCharacter.value)
    }, { deep: true })

    watch(() => selectedCharacter.value?.conditions, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.conditions) return
      CharacterUtils.handleConditionsChange(selectedCharacter.value)
    }, { deep: true })

    watch(() => selectedCharacter.value?.equipment, () => {
      if (!selectedCharacter.value || !selectedCharacter.value.equipment || !allEquipment.value || !Array.isArray(allEquipment.value)) return
      CharacterUtils.handleEquipmentChange(
        selectedCharacter.value,
        allEquipment.value
      )
    }, { deep: true })
  }

  const addAbilityToCharacter = (ability) => {
    const char = selectedCharacter.value
    if (!char || !ability || !ability.id) return false
    if (!Array.isArray(char.abilities)) char.abilities = []
    if (char.abilities.includes(ability.id)) return false
    char.abilities.push(ability.id)
    CharacterService.update(char)
    return true
  }

  const addEquipmentToCharacter = (equipment) => {
    const char = selectedCharacter.value
    if (!char || !equipment || !equipment.id) return false
    if (!Array.isArray(char.equipment)) char.equipment = []
    if (char.equipment.some(item => item.id === equipment.id)) return false
    char.equipment.push({ id: equipment.id, quantity: 1, isCarried: true })
    CharacterService.update(char)
    return true
  }

  return {
    selectedCharacter,
    selectCharacter,
    deselectCharacter,
    updateCharacter,
    createCharacter,
    deleteCharacter,
    watchCharacterStats,
    addAbilityToCharacter,
    addEquipmentToCharacter
  }
}
