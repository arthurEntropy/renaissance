import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRollsStore = defineStore('rolls', () => {
  // Current roll result displayed in DiceRollResults
  const latestRoll = ref(null)

  // Last target number used in skill checks (for defaulting next roll)
  const lastTargetNumber = ref(null)

  // Set the latest roll result
  function setRoll(rollResult) {
    latestRoll.value = rollResult
  }

  // Update the last target number used
  function setLastTargetNumber(targetNumber) {
    lastTargetNumber.value = targetNumber
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
      const { skill, character, targetNumber } = currentRoll._rerollData
      const module = await import('@/services/rolls/skillCheckService')
      const rollResult = module.default.makeSkillCheck(skill, character, targetNumber)
      latestRoll.value = rollResult
    } else if (currentRoll.type === 'custom_roll') {
      const { dicePool, modifier, character } = currentRoll._rerollData
      const module = await import('@/services/rolls/customRollService')
      const rollResult = module.default.makeCustomRoll(dicePool, modifier, character)
      latestRoll.value = rollResult
    } else {
      console.warn(`Reroll not supported for roll type: ${currentRoll.type}`)
    }
  }

  return {
    latestRoll,
    lastTargetNumber,
    setRoll,
    setLastTargetNumber,
    clearRoll,
    reroll
  }
})
