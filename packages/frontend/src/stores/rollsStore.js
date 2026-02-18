import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { applyRollToCharacterStats } from '@/services/rolls/rollStatsService'

const ROLL_STATS_PERSIST_DELAY_MS = 250

export const useRollsStore = defineStore('rolls', () => {
  const charactersStore = useCharactersStore()

  let persistTimeout = null
  const displayedRollKeys = new Set()

  // Current roll result displayed in DiceRollResults
  const latestRoll = ref(null)

  // Last difficulty used in skill checks (for defaulting next roll)
  const lastDifficulty = ref(null)

  // Set the latest roll result
  function setRoll(rollResult, characterOverride = null) {
    const targetCharacter = characterOverride || charactersStore.selectedCharacter
    latestRoll.value = {
      ...rollResult,
      rollCharacterId: targetCharacter?.id || null
    }

    if (targetCharacter) {
      applyRollToCharacterStats(targetCharacter, rollResult)

      if (persistTimeout) {
        clearTimeout(persistTimeout)
      }

      persistTimeout = setTimeout(async () => {
        try {
          await charactersStore.update(targetCharacter)
        } catch (error) {
          console.error('Failed to persist roll stats:', error)
        } finally {
          persistTimeout = null
        }
      }, ROLL_STATS_PERSIST_DELAY_MS)
    }
  }

  // Update the last difficulty used
  function setLastDifficulty(difficulty) {
    lastDifficulty.value = difficulty
  }

  // Clear the current roll
  function clearRoll() {
    latestRoll.value = null
  }

  function hasDisplayedRollKey(rollKey) {
    if (!rollKey) return false
    return displayedRollKeys.has(rollKey)
  }

  function markRollKeyDisplayed(rollKey) {
    if (!rollKey) return
    displayedRollKeys.add(rollKey)
  }

  // Reroll the current roll (if reroll data exists)
  async function reroll() {
    const currentRoll = latestRoll.value
    if (!currentRoll || !currentRoll._rerollData) {
      console.warn('Cannot reroll - no reroll data available')
      return
    }

    // Handle different roll types
    if (currentRoll.type === 'skill_check') {
      const { skill, character, difficulty } = currentRoll._rerollData
      const module = await import('@/services/rolls/skillCheckService')
      const rollResult = module.default.makeSkillCheck(skill, character, difficulty)
      setRoll(rollResult)
    } else if (currentRoll.type === 'custom_roll') {
      const { dicePool, modifier, character } = currentRoll._rerollData
      const module = await import('@/services/rolls/customRollService')
      const rollResult = module.default.makeCustomRoll(dicePool, modifier, character)
      setRoll(rollResult)
    } else if (currentRoll.type === 'damage') {
      const { dicePool, modifier, character, rollName, baseSkillName, sourceName, modifierLabel } = currentRoll._rerollData
      const module = await import('@/services/rolls/damageRollService')
      const rollResult = module.default.makeDamageRoll(dicePool, modifier, character, {
        rollName,
        baseSkillName,
        sourceName,
        modifierLabel
      })
      setRoll(rollResult)
    } else if (currentRoll.type === 'initiative') {
      const { character } = currentRoll._rerollData
      const module = await import('@/services/rolls/initiativeRollService')
      const rollResult = module.default.makeInitiativeRoll(character)
      setRoll(rollResult)
    } else if (currentRoll.type === 'injury') {
      const { character } = currentRoll._rerollData
      const module = await import('@/services/rolls/injuryRollService')
      const rollResult = module.default.makeInjuryRoll(character)
      setRoll(rollResult)
    } else {
      console.warn(`Reroll not supported for roll type: ${currentRoll.type}`)
    }
  }

  return {
    latestRoll,
    lastDifficulty,
    setRoll,
    setLastDifficulty,
    clearRoll,
    hasDisplayedRollKey,
    markRollKeyDisplayed,
    reroll
  }
})
