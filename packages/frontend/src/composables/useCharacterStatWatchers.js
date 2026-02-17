import { watch } from 'vue'
import * as CharacterUtils from '@shared/types/entities/characterUtils'
import { useCharactersStore } from '@/stores/charactersStore'

export function useCharacterStatWatchers(selectedCharacter, allEquipment) {
  const charactersStore = useCharactersStore()

  // Main character save watcher with debouncing
  watch(selectedCharacter, (newCharacter) => {
    if (!newCharacter) return
    const timeoutId = setTimeout(() => {
      charactersStore.update(newCharacter)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, { deep: true })

  // Core stats watchers
  watch(() => selectedCharacter.value?.body, () => {
    if (!selectedCharacter.value || selectedCharacter.value.body === undefined) return
    // Only auto-calculate if statesAndEffects is enabled (body change affects states)
    if (selectedCharacter.value.autoCalculations?.statesAndEffects ?? true) {
      CharacterUtils.handleBodyChange(selectedCharacter.value)
    }
  })

  watch(() => selectedCharacter.value?.heart, () => {
    if (!selectedCharacter.value || selectedCharacter.value.heart === undefined) return
    // Only auto-calculate if statesAndEffects is enabled (heart change affects states)
    if (selectedCharacter.value.autoCalculations?.statesAndEffects ?? true) {
      CharacterUtils.handleHeartChange(selectedCharacter.value)
    }
  })

  watch(() => selectedCharacter.value?.wits, () => {
    if (!selectedCharacter.value || selectedCharacter.value.wits === undefined) return
    // Only auto-calculate if statesAndEffects is enabled (wits change affects states)
    if (selectedCharacter.value.autoCalculations?.statesAndEffects ?? true) {
      CharacterUtils.handleWitsChange(selectedCharacter.value)
    }
  })

  // Derived stats watchers
  watch(() => selectedCharacter.value?.endurance, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.endurance) return
    const equipment = allEquipment.value || []
    if (!Array.isArray(equipment)) return
    // Check both load and statesAndEffects flags
    const autoLoad = selectedCharacter.value.autoCalculations?.load ?? true
    const autoStates = selectedCharacter.value.autoCalculations?.statesAndEffects ?? true
    if (autoLoad || autoStates) {
      CharacterUtils.handleEnduranceChange(selectedCharacter.value, equipment)
    }
  }, { deep: true })

  watch(() => selectedCharacter.value?.hope, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.hope) return
    if (selectedCharacter.value.autoCalculations?.statesAndEffects ?? true) {
      CharacterUtils.handleHopeChange(selectedCharacter.value)
    }
  }, { deep: true })

  watch(() => selectedCharacter.value?.defense, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.defense) return
    if (selectedCharacter.value.autoCalculations?.statesAndEffects ?? true) {
      CharacterUtils.handleDefenseChange(selectedCharacter.value)
    }
  }, { deep: true })

  watch(() => selectedCharacter.value?.load, () => {
    if (!selectedCharacter.value || selectedCharacter.value.load === undefined) return
    if (selectedCharacter.value.autoCalculations?.statesAndEffects ?? true) {
      CharacterUtils.handleLoadChange(selectedCharacter.value)
    }
  })

  watch(() => selectedCharacter.value?.shadow, () => {
    if (!selectedCharacter.value || selectedCharacter.value.shadow === undefined) return
    if (selectedCharacter.value.autoCalculations?.statesAndEffects ?? true) {
      CharacterUtils.handleShadowChange(selectedCharacter.value)
    }
  })

  watch(() => selectedCharacter.value?.injury, () => {
    if (!selectedCharacter.value || selectedCharacter.value.injury === undefined) return
    if (selectedCharacter.value.autoCalculations?.statesAndEffects ?? true) {
      CharacterUtils.handleInjuryChange(selectedCharacter.value)
    }
  })

  // Complex state watchers
  watch(() => selectedCharacter.value?.states, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.states) return
    if (selectedCharacter.value.autoCalculations?.statesAndEffects ?? true) {
      CharacterUtils.handleStatesChange(selectedCharacter.value)
    }
  }, { deep: true })

  watch(() => selectedCharacter.value?.conditions, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.conditions) return
    if (selectedCharacter.value.autoCalculations?.statesAndEffects ?? true) {
      CharacterUtils.handleConditionsChange(selectedCharacter.value)
    }
  }, { deep: true })

  watch(() => selectedCharacter.value?.equipment, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.equipment) return
    const equipment = allEquipment.value || []
    if (!Array.isArray(equipment)) return
    if (selectedCharacter.value.autoCalculations?.load ?? true) {
      CharacterUtils.handleEquipmentChange(selectedCharacter.value, equipment)
    }
  }, { deep: true })
}
