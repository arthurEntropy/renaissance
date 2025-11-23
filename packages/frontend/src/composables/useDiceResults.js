import { ref } from 'vue'
import SkillCheckService from '@/services/rolls/skillCheckService'
import CustomRollService from '@/services/rolls/customRollService'
import OpposedSkillCheckService from '@/services/rolls/opposedSkillCheckService'

/**
 * Composable for managing dice roll results across all roll types
 * Handles latest roll tracking and result display
 */
export function useDiceResults() {
  const latestRoll = ref(null)

  const updateLatestRoll = () => {
    // Check skill check, opposed skill check, and custom roll services for latest results
    const skillCheckResult = SkillCheckService.getLatestRollResult()
    const opposedSkillCheckResult = OpposedSkillCheckService.getLatestRollResult()
    const customRollResult = CustomRollService.getLatestRollResult()
    
    // Collect all existing results
    const results = [skillCheckResult, opposedSkillCheckResult, customRollResult].filter(Boolean)
    
    if (results.length === 0) {
      latestRoll.value = null
    } else {
      // Use the most recent roll based on timestamp
      latestRoll.value = results.reduce((latest, current) => 
        current.timestamp > latest.timestamp ? current : latest
      )
    }
  }

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
    updateLatestRoll,
    handleSkillCheckResult,
    handleEngagementResult,
    handleOpposedSkillCheckResult,
    handleCustomRollResult
  }
}
