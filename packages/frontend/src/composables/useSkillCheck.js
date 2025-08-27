import { ref } from 'vue'

/**
 * Composable for managing skill check modal state
 * Handles skill check modal open/close and target number tracking
 */
export function useSkillCheck() {
  const showSkillCheckModal = ref(false)
  const selectedSkillName = ref('')
  const lastTargetNumber = ref(null)

  const openSkillCheckModal = (skillName) => {
    selectedSkillName.value = skillName
    showSkillCheckModal.value = true
  }

  const closeSkillCheckModal = () => {
    showSkillCheckModal.value = false
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
    lastTargetNumber,
    openSkillCheckModal,
    closeSkillCheckModal,
    getLastTargetNumber,
    updateLastTargetNumber
  }
}
