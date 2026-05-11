import { watch, onUnmounted } from 'vue'
import * as CharacterUtils from '@shared/utils/characterUtils'
import { useCharactersStore } from '@/stores/charactersStore'

const SAVE_DEBOUNCE_MS = 500

export function useCharacterStatWatchers(selectedCharacter, allEquipment) {
  const charactersStore = useCharactersStore()

  // Main character save watcher with debouncing
  let saveTimeout = null
  let isSaving = false
  
  watch(selectedCharacter, (newCharacter) => {
    if (!newCharacter || isSaving) return
    
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    // Set new timeout for saving
    saveTimeout = setTimeout(async () => {
      isSaving = true
      try {
        await charactersStore.update(newCharacter)
      } finally {
        isSaving = false
        saveTimeout = null
      }
    }, SAVE_DEBOUNCE_MS)
  }, { 
    deep: true,
    flush: 'post' // Run after component updates to batch changes
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
  })

  // Core stats watchers
  watch(() => selectedCharacter.value?.body, () => {
    if (!selectedCharacter.value || selectedCharacter.value.body === undefined) return
    if (selectedCharacter.value.autoCalculations?.states ?? true) {
      CharacterUtils.handleBodyChange(selectedCharacter.value, {
        calcMax: selectedCharacter.value.autoCalculations?.baseEndurance ?? true
      })
    }
  })

  watch(() => selectedCharacter.value?.heart, () => {
    if (!selectedCharacter.value || selectedCharacter.value.heart === undefined) return
    if (selectedCharacter.value.autoCalculations?.states ?? true) {
      CharacterUtils.handleHeartChange(selectedCharacter.value, {
        calcMax: selectedCharacter.value.autoCalculations?.baseHope ?? true
      })
    }
  })

  watch(() => selectedCharacter.value?.wits, () => {
    if (!selectedCharacter.value || selectedCharacter.value.wits === undefined) return
    if (selectedCharacter.value.autoCalculations?.states ?? true) {
      CharacterUtils.handleWitsChange(selectedCharacter.value, {
        calcMax: selectedCharacter.value.autoCalculations?.baseDefense ?? true
      })
    }
  })

  // Derived stats watchers
  watch(() => selectedCharacter.value?.endurance, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.endurance) return
    const equipment = allEquipment.value || []
    if (!Array.isArray(equipment)) return
    // Check both load and states flags
    const autoLoad = selectedCharacter.value.autoCalculations?.load ?? true
    const autoStates = selectedCharacter.value.autoCalculations?.states ?? true
    if (autoLoad || autoStates) {
      CharacterUtils.handleEnduranceChange(selectedCharacter.value, equipment)
    }
  }, { deep: true })

  watch(() => selectedCharacter.value?.hope, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.hope) return
    if (selectedCharacter.value.autoCalculations?.states ?? true) {
      CharacterUtils.handleHopeChange(selectedCharacter.value)
    }
  }, { deep: true })

  watch(() => selectedCharacter.value?.defense, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.defense) return
    if (selectedCharacter.value.autoCalculations?.states ?? true) {
      CharacterUtils.handleDefenseChange(selectedCharacter.value)
    }
  }, { deep: true })

  watch(() => selectedCharacter.value?.load, () => {
    if (!selectedCharacter.value || selectedCharacter.value.load === undefined) return
    if (selectedCharacter.value.autoCalculations?.states ?? true) {
      CharacterUtils.handleLoadChange(selectedCharacter.value)
    }
  })

  watch(() => selectedCharacter.value?.shadow, () => {
    if (!selectedCharacter.value || selectedCharacter.value.shadow === undefined) return
    if (selectedCharacter.value.autoCalculations?.states ?? true) {
      CharacterUtils.handleShadowChange(selectedCharacter.value)
    }
  })

  watch(() => selectedCharacter.value?.injury, () => {
    if (!selectedCharacter.value || selectedCharacter.value.injury === undefined) return
    if (selectedCharacter.value.autoCalculations?.states ?? true) {
      CharacterUtils.handleInjuryChange(selectedCharacter.value)
    }
  })

  // Complex state watchers
  watch(() => selectedCharacter.value?.states, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.states) return
    if (selectedCharacter.value.autoCalculations?.states ?? true) {
      CharacterUtils.handleStatesChange(selectedCharacter.value)
    }
  }, { deep: true })

  watch(() => selectedCharacter.value?.conditions, () => {
    if (!selectedCharacter.value || !selectedCharacter.value.conditions) return
    if (selectedCharacter.value.autoCalculations?.states ?? true) {
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
