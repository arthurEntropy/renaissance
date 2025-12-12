import { watch } from 'vue'
import CharacterService from '@/services/entities/characterService'
import * as CharacterUtils from '@shared/types/entities/characterUtils'

export function useCharacterStatWatchers(selectedCharacter, allEquipment) {
  // Main character save watcher with debouncing
  watch(selectedCharacter, (newCharacter) => {
    if (!newCharacter) return
    const timeoutId = setTimeout(() => {
      CharacterService.update(newCharacter)
    }, 500)
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
    const equipment = allEquipment.value || []
    if (!Array.isArray(equipment)) return
    CharacterUtils.handleEnduranceChange(selectedCharacter.value, equipment)
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
    if (!selectedCharacter.value || !selectedCharacter.value.equipment) return
    const equipment = allEquipment.value || []
    if (!Array.isArray(equipment)) return
    CharacterUtils.handleEquipmentChange(selectedCharacter.value, equipment)
  }, { deep: true })
}
