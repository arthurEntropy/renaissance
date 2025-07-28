import { ref, reactive } from 'vue'
import engagementService from '@/services/EngagementService'

/**
 * Composable for managing engagement success assignments and tooltips
 */
export function useSuccessAssignment() {
  // Success assignment state
  const assignedSuccesses = reactive({})
  
  // Tooltip state
  const tooltipSuccess = ref(null)
  const tooltipPosition = reactive({ x: 0, y: 0 })
  const tooltipTimer = ref(null)

  /**
   * Handle success drop assignment
   * @param {string} player - 'user' or 'opponent'
   * @param {number} diceIndex - Index of the die
   * @param {Object} successData - Success object with id
   * @param {string} characterId - Character ID making the assignment
   */
  function handleSuccessDrop(player, diceIndex, successData, characterId) {
    const key = `${player}-${diceIndex}`
    const previousAssignment = assignedSuccesses[key]
    const newAssignment = successData.id

    // Only update if the assignment is actually changing
    if (previousAssignment !== newAssignment) {
      // Assign the success to this die
      assignedSuccesses[key] = newAssignment

      // Broadcast this assignment with character context
      engagementService.updateSuccessAssignment(characterId, player, diceIndex, newAssignment)
    }
  }

  /**
   * Remove success assignment from a die
   * @param {string} player - 'user' or 'opponent'
   * @param {number} diceIndex - Index of the die
   * @param {string} characterId - Character ID making the removal
   */
  function removeSuccessAssignment(player, diceIndex, characterId) {
    const key = `${player}-${diceIndex}`

    if (assignedSuccesses[key]) {
      // Remove the assignment locally
      delete assignedSuccesses[key]

      // Broadcast the removal to other users
      engagementService.updateSuccessAssignment(characterId, player, diceIndex, null)
    }
  }

  /**
   * Clear success assignment for a specific die (used during rerolls)
   * @param {string} player - 'user' or 'opponent'
   * @param {number} diceIndex - Index of the die
   * @param {string} characterId - Character ID making the change
   */
  function clearSuccessAssignment(player, diceIndex, characterId) {
    const assignmentKey = `${player}-${diceIndex}`
    
    if (assignedSuccesses[assignmentKey]) {
      delete assignedSuccesses[assignmentKey]
      engagementService.updateSuccessAssignment(characterId, player, diceIndex, null)
    }
  }

  /**
   * Handle remote success assignment updates from other players
   * @param {string} characterId - Character ID of the player making the assignment
   * @param {string} player - Original player designation from the assigning player's perspective
   * @param {number} diceIndex - Index of the die
   * @param {string|null} successId - Success ID or null for removal
   * @param {string} currentCharacterId - Current user's character ID
   * @param {Object} opponent - Opponent object with characterInfo
   */
  function handleRemoteSuccessAssignment(characterId, player, diceIndex, successId, currentCharacterId, opponent) {
    // Don't process our own assignments
    if (characterId === currentCharacterId) {
      return
    }

    // Translate the assignment to the correct UI position from this user's perspective
    let targetKey
    if (opponent && characterId === opponent.characterInfo.id) {
      // This is the opponent's assignment - translate to opponent column
      targetKey = `opponent-${diceIndex}`
    } else {
      // Unknown character ID
      console.log('Unknown character ID:', characterId)
      return
    }

    // Update the assigned successes
    if (successId) {
      assignedSuccesses[targetKey] = successId
    } else {
      // Remove assignment if successId is null
      delete assignedSuccesses[targetKey]
    }
  }

  /**
   * Get success name by ID
   * @param {string} successId - Success ID
   * @param {Array} allEngagementSuccesses - Array of all engagement successes
   * @returns {string} Success name or 'Unknown Success'
   */
  function getSuccessName(successId, allEngagementSuccesses) {
    const success = allEngagementSuccesses.find(s => s.id === successId)
    return success ? success.name : 'Unknown Success'
  }

  /**
   * Start success tooltip with delay
   * @param {Object} success - Success object
   * @param {Event} event - Mouse event for positioning
   */
  function startSuccessTooltip(success, event) {
    clearTimeout(tooltipTimer.value)
    tooltipTimer.value = setTimeout(() => {
      tooltipSuccess.value = success
      tooltipPosition.x = event.clientX + 12
      tooltipPosition.y = event.clientY + 12
    }, 1000)
  }

  /**
   * Clear success tooltip
   */
  function clearSuccessTooltip() {
    clearTimeout(tooltipTimer.value)
    tooltipSuccess.value = null
  }

  /**
   * Reset all success assignments (used when new roll results come in)
   */
  function resetAssignments() {
    Object.keys(assignedSuccesses).forEach(key => {
      delete assignedSuccesses[key]
    })
  }

  /**
   * Check if a specific die has an assigned success
   * @param {string} player - 'user' or 'opponent'
   * @param {number} diceIndex - Index of the die
   * @returns {string|null} Success ID or null
   */
  function getDieAssignment(player, diceIndex) {
    const key = `${player}-${diceIndex}`
    return assignedSuccesses[key] || null
  }

  return {
    // State
    assignedSuccesses,
    tooltipSuccess,
    tooltipPosition,
    
    // Methods
    handleSuccessDrop,
    removeSuccessAssignment,
    clearSuccessAssignment,
    handleRemoteSuccessAssignment,
    getSuccessName,
    startSuccessTooltip,
    clearSuccessTooltip,
    resetAssignments,
    getDieAssignment
  }
}
