import { ref } from 'vue'

/**
 * Composable for managing dice roll results across all roll types
 * Handles latest roll tracking and result display
 */
export function useDiceResults() {
  const latestRoll = ref(null)

  const handleSkillCheckResult = (skillCheckResult) => {
    latestRoll.value = skillCheckResult
  }

  const handleEngagementResult = (engagementResult) => {
    latestRoll.value = engagementResult
  }

  const handleOpposedSkillCheckResult = (opposedSkillCheckResult) => {
    latestRoll.value = opposedSkillCheckResult
  }

  const handleCustomRollResult = (customRollResult) => {
    latestRoll.value = customRollResult
  }

  return {
    latestRoll,
    handleSkillCheckResult,
    handleEngagementResult,
    handleOpposedSkillCheckResult,
    handleCustomRollResult
  }
}
