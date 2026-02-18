import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRollsStore = defineStore('rolls', () => {
  // Current roll result displayed in DiceRollResults
  const latestRoll = ref(null)

  // Last difficulty used in skill checks (for defaulting next roll)
  const lastDifficulty = ref(null)

  // Set the latest roll result
  function setRoll(rollResult) {
    latestRoll.value = rollResult
  }

  // Update the last difficulty used
  function setLastDifficulty(difficulty) {
    lastDifficulty.value = difficulty
  }

  // Clear the current roll
  function clearRoll() {
    latestRoll.value = null
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
      latestRoll.value = rollResult
    } else if (currentRoll.type === 'custom_roll') {
      const { dicePool, modifier, character } = currentRoll._rerollData
      const module = await import('@/services/rolls/customRollService')
      const rollResult = module.default.makeCustomRoll(dicePool, modifier, character)
      latestRoll.value = rollResult
    } else if (currentRoll.type === 'initiative') {
      const { character } = currentRoll._rerollData
      const module = await import('@/services/rolls/initiativeRollService')
      const rollResult = module.default.makeInitiativeRoll(character)
      latestRoll.value = rollResult
    } else if (currentRoll.type === 'injury') {
      const { character } = currentRoll._rerollData
      const module = await import('@/services/rolls/injuryRollService')
      const rollResult = module.default.makeInjuryRoll(character)
      latestRoll.value = rollResult
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
    reroll
  }
})
