import { watch, onUnmounted } from 'vue'
import * as CharacterUtils from '@shared/utils/characterUtils'
import { useCharactersStore } from '@/stores/charactersStore'
import { normalizeRollStats } from '@/services/rolls/rollStatsService'

const SAVE_DEBOUNCE_MS = 1500

// WeakMap for pending refunds so callers can pre-register refunds before the
// reactive update triggers the watchers below.
const pendingRefunds = new WeakMap()

/**
 * Call this BEFORE applying a refund to a character's xp or treasure.
 * The stat watchers will treat the matching increase as a reversal of spending
 * rather than new earnings.
 * @param {object} character - the reactive character object
 * @param {{ xp?: number, treasure?: number }} amounts
 */
export function scheduleStatsRefund(character, { xp = 0, treasure = 0 } = {}) {
  if (!character) return
  const current = pendingRefunds.get(character) || { xp: 0, treasure: 0 }
  pendingRefunds.set(character, {
    xp: current.xp + xp,
    treasure: current.treasure + treasure,
  })
}

export function useCharacterStatWatchers(selectedCharacter, allEquipment, { onSaved, onChanged } = {}) {
  const charactersStore = useCharactersStore()

  // Main character save watcher with debouncing and save-locking.
  // Only one save is in flight at a time. If a change arrives while a save is
  // pending, we set hasPendingSave so the next save runs immediately after the
  // current one completes — always sending the latest state to the server.
  // Without this, two concurrent requests could arrive at the server out-of-order
  // and the stale response could overwrite newer data (visible after page reload).
  let saveTimeout = null
  let changeTimeout = null
  let isSaving = false
  let hasPendingSave = false
  // Capture the character at queue time so the correct character is saved even
  // if selectedCharacter changes before the debounce fires (e.g. popup closes).
  let pendingChar = null

  async function performSave() {
    isSaving = true
    const charToSave = pendingChar ?? selectedCharacter.value
    try {
      if (charToSave) {
        await charactersStore.update(charToSave)
        onSaved?.(charToSave)
      }
    } catch (err) {
      console.error('[CharacterWatcher] Failed to save character:', err)
    } finally {
      isSaving = false
      if (hasPendingSave) {
        hasPendingSave = false
        performSave()
      }
    }
  }

  watch(selectedCharacter, (newCharacter) => {
    if (!newCharacter) return
    pendingChar = newCharacter

    // Notify immediately (short debounce batches derived state mutations)
    if (changeTimeout) clearTimeout(changeTimeout)
    changeTimeout = setTimeout(() => {
      changeTimeout = null
      onChanged?.(newCharacter)
    }, 100)

    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      saveTimeout = null
      if (isSaving) {
        hasPendingSave = true
      } else {
        performSave()
      }
    }, SAVE_DEBOUNCE_MS)
  }, {
    deep: true,
    flush: 'post'
  })

  // Cleanup on unmount — flush any pending debounce immediately.
  onUnmounted(() => {
    if (changeTimeout) {
      clearTimeout(changeTimeout)
      changeTimeout = null
    }
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
      if (isSaving) {
        hasPendingSave = true
      } else {
        const char = pendingChar ?? selectedCharacter.value
        if (char) performSave().catch(() => {})
      }
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
      // Pass calcMax:false — CoreAbilityColumn owns defense.base and includes the armor bonus.
      // Recalculating here without the armor bonus would clobber the correct value.
      CharacterUtils.handleWitsChange(selectedCharacter.value, {
        calcMax: false
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

  // XP tracking — increase counts as earned, decrease counts as spent.
  // Refunds (registered via scheduleStatsRefund) are absorbed from the earned delta
  // and instead decrement the spent counter.
  watch(() => selectedCharacter.value?.xp, (newVal, oldVal) => {
    const char = selectedCharacter.value
    if (!char || oldVal === undefined || newVal === oldVal) return
    const delta = (newVal ?? 0) - (oldVal ?? 0)
    if (delta === 0) return
    const pending = pendingRefunds.get(char) || { xp: 0, treasure: 0 }
    const stats = normalizeRollStats(char.rollStats)
    if (delta > 0) {
      const refundPortion = Math.min(pending.xp, delta)
      const earnedPortion = delta - refundPortion
      if (earnedPortion > 0) stats.xpEarned = (stats.xpEarned ?? 0) + earnedPortion
      if (refundPortion > 0) {
        stats.xpSpent = Math.max(0, (stats.xpSpent ?? 0) - refundPortion)
        pendingRefunds.set(char, { ...pending, xp: pending.xp - refundPortion })
      }
    } else {
      stats.xpSpent = (stats.xpSpent ?? 0) + Math.abs(delta)
    }
    char.rollStats = stats
  })

  // Treasure tracking — same pattern as XP tracking above.
  watch(() => selectedCharacter.value?.treasure, (newVal, oldVal) => {
    const char = selectedCharacter.value
    if (!char || oldVal === undefined || newVal === oldVal) return
    const delta = (newVal ?? 0) - (oldVal ?? 0)
    if (delta === 0) return
    const pending = pendingRefunds.get(char) || { xp: 0, treasure: 0 }
    const stats = normalizeRollStats(char.rollStats)
    if (delta > 0) {
      const refundPortion = Math.min(pending.treasure, delta)
      const earnedPortion = delta - refundPortion
      if (earnedPortion > 0) stats.treasureEarned = (stats.treasureEarned ?? 0) + earnedPortion
      if (refundPortion > 0) {
        stats.treasureSpent = Math.max(0, (stats.treasureSpent ?? 0) - refundPortion)
        pendingRefunds.set(char, { ...pending, treasure: pending.treasure - refundPortion })
      }
    } else {
      stats.treasureSpent = (stats.treasureSpent ?? 0) + Math.abs(delta)
    }
    char.rollStats = stats
  })
}
