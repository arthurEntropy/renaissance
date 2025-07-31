import { reactive } from 'vue'
import engagementSessionService from '@/services/EngagementSessionService'

export function useSuccessAssignment() {
  // Success assignment state
  const assignedSuccesses = reactive({})

  function handleSuccessDrop(player, diceIndex, successData, characterId) {
    const key = `${player}-${diceIndex}`
    const previousAssignment = assignedSuccesses[key]
    const newAssignment = successData.id

    // Only update if the assignment is actually changing
    if (previousAssignment !== newAssignment) {
      // Assign the success to this die
      assignedSuccesses[key] = newAssignment

      // Broadcast this assignment with character context
      engagementSessionService.updateSuccessAssignment(characterId, player, diceIndex, newAssignment)
    }
  }

  function clearSuccessAssignment(player, diceIndex, characterId) {
    const key = `${player}-${diceIndex}`
    
    if (assignedSuccesses[key]) {
      delete assignedSuccesses[key]
      
      // Broadcast the removal with null to indicate clearing
      engagementSessionService.updateSuccessAssignment(characterId, player, diceIndex, null)
    }
  }

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

  function getSuccessName(successId, allEngagementSuccesses) {
    const success = allEngagementSuccesses.find(s => s.id === successId)
    return success ? success.name : 'Unknown Success'
  }

  function resetAssignments() {
    Object.keys(assignedSuccesses).forEach(key => {
      delete assignedSuccesses[key]
    })
  }

  function getDieAssignment(player, diceIndex) {
    const key = `${player}-${diceIndex}`
    return assignedSuccesses[key] || null
  }

  return {
    // State
    assignedSuccesses,
    
    // Methods
    handleSuccessDrop,
    clearSuccessAssignment,
    handleRemoteSuccessAssignment,
    getSuccessName,
    resetAssignments,
    getDieAssignment
  }
}
