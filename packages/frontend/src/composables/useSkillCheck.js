import { ref } from 'vue'
import SkillCheckService from '@/services/skillCheckService'

/**
 * Composable for managing skill checks and dice roll results
 * Handles skill check modal state and latest roll tracking
 */
export function useSkillCheck() {
  const showSkillCheckModal = ref(false)
  const selectedSkillName = ref('')
  const latestRoll = ref(null)
  const lastTargetNumber = ref(null)

  const openSkillCheckModal = (skillName) => {
    selectedSkillName.value = skillName
    showSkillCheckModal.value = true
  }

  const closeSkillCheckModal = () => {
    showSkillCheckModal.value = false
    updateLatestRoll() // Get latest roll when modal closes
  }

  const updateLatestRoll = () => {
    latestRoll.value = SkillCheckService.getLatestRollResult()
  }

  const handleEngagementResults = (engagementResult) => {
    console.log('Received engagement results:', engagementResult)
    latestRoll.value = engagementResult
  }

  const getLastTargetNumber = () => {
    return lastTargetNumber.value
  }

  const updateLastTargetNumber = (targetNumber) => {
    lastTargetNumber.value = targetNumber
  }

  return {
    showSkillCheckModal,
    selectedSkillName,
    latestRoll,
    lastTargetNumber,
    openSkillCheckModal,
    closeSkillCheckModal,
    updateLatestRoll,
    handleEngagementResults,
    getLastTargetNumber,
    updateLastTargetNumber
  }
}
