import { ref } from 'vue'
import { useOpposedSkillCheckSession } from './useOpposedSkillCheckSession'

export function useOpposedSkillCheck() {
  const showOpposedSkillCheckModal = ref(false)
  const sessionManager = useOpposedSkillCheckSession()

  const openOpposedSkillCheckModal = () => {
    showOpposedSkillCheckModal.value = true
  }

  const closeOpposedSkillCheckModal = () => {
    showOpposedSkillCheckModal.value = false
    sessionManager.disconnect()
  }

  const startOpposedSkillCheck = (character, skillCheckConfig, onResult) => {
    sessionManager.initializeSession(
      character,
      skillCheckConfig,
      null, // resultIndicatorCallback - not needed for basic implementation
      null, // dieRerolledCallback - not needed for basic implementation
      onResult // rollResultsCallback - handles the final result
    )
  }

  return {
    showOpposedSkillCheckModal,
    sessionManager,
    openOpposedSkillCheckModal,
    closeOpposedSkillCheckModal,
    startOpposedSkillCheck
  }
}
