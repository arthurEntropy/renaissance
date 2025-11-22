import { getDiceFontClass, getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { rollSingleDie, formatDiceResults, getFavoredStatus } from '@/utils/diceUtils'
import RollTypes from '@/constants/rollTypes'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class OpposedSkillCheckService {
  static latestRollResult = null

  static getLatestRollResult() {
    return this.latestRollResult
  }

  static rollSingleDie(dieSize) {
    return rollSingleDie(dieSize)
  }

  static sortSkillCheckDice(diceArray, rollResults) {
    if (!diceArray || !Array.isArray(diceArray) || diceArray.length === 0) {
      return []
    }

    // Sort skill check dice (includes dropped dice)
    const diceWithResults = diceArray.map((die, index) => {
      if (!rollResults) {
        // No results yet - show rolling state
        return {
          dieSides: die,
          dieRollValue: die,
          cssClass: getDiceFontMaxClass(die),
          isRolling: true,
          rolledMaxValue: false,
          poolIndex: index,
          isDropped: false
        }
      } else {
        // Handle complex format with potential drops for skill checks
        let value, isDropped = false
        
        if (rollResults[index] && typeof rollResults[index] === 'object') {
          const result = rollResults[index]
          value = result.dieRollValue
          isDropped = value === 0
          // For display, show original roll if dropped
          value = isDropped ? result.originalDieRollValue : value
        } else {
          // Simple number result
          value = rollResults[index] || 1
        }
        
        const rolledMaxValue = value === die && value > 0 && !isDropped
        
        return {
          dieSides: die,
          dieRollValue: value,
          cssClass: getDiceFontClass(die, value),
          isRolling: false,
          rolledMaxValue: rolledMaxValue,
          poolIndex: index,
          isDropped: isDropped
        }
      }
    })

    // Include dropped dice for skill checks
    // Sort by die type first (d12s first), then by value (highest first)
    return diceWithResults.sort((a, b) => {
      // First sort by die type (d12s before d6s)
      if (a.dieSides !== b.dieSides) {
        return b.dieSides - a.dieSides
      }
      // Then sort by value (highest first)
      return b.dieRollValue - a.dieRollValue
    })
  }

  static determineOpposedWinner(userTotal, opponentTotal) {
    if (userTotal > opponentTotal) {
      return 'user'
    } else if (opponentTotal > userTotal) {
      return 'opponent'
    } else {
      return 'tie'
    }
  }

  static createOpposedSkillCheckResult(session, userCharacterId, opponentCharacterId) {
    const userSession = session.users.find(u => u.characterInfo.id === userCharacterId)
    const opponentSession = session.users.find(u => u.characterInfo.id === opponentCharacterId)
    
    if (!userSession || !opponentSession) {
      return null
    }

    // Use server's winner determination instead of client-side calculation
    let winner = 'tie'
    if (session.winner !== null && session.winner !== undefined) {
      // Server winner is 0-indexed: 0 = first user, 1 = second user
      const winnerIndex = session.winner
      const winnerUser = session.users[winnerIndex]
      
      if (winnerUser) {
        // Determine winner relative to current user
        if (winnerUser.characterInfo.id === userCharacterId) {
          winner = 'user'
        } else {
          winner = 'opponent'
        }
      }
    } else {
      // Fallback to client-side calculation if server doesn't provide winner
      winner = this.determineOpposedWinner(userSession.rollTotal, opponentSession.rollTotal)
    }
    
    const result = {
      type: RollTypes.OPPOSED_SKILL_CHECK,
      characterName: userSession.characterInfo.name,
      opponentName: opponentSession.characterInfo.name,
      skillName: userSession.skillCheckConfig.name,
      opponentSkillName: opponentSession.skillCheckConfig.name,
      userTotal: userSession.rollTotal,
      opponentTotal: opponentSession.rollTotal,
      winner: winner,
      userDiceResults: formatDiceResults(userSession.rollResults),
      opponentDiceResults: formatDiceResults(opponentSession.rollResults),
      userFavoredStatus: getFavoredStatus(userSession.skillCheckConfig),
      opponentFavoredStatus: getFavoredStatus(opponentSession.skillCheckConfig),
      timestamp: Date.now(),
      session: session
    }

    this.latestRollResult = result
    return result
  }

  static updateRollResultsAfterReroll(rollResults, player, diceIndex, newValue, characterId, opponentSocketId, sortedDice) {
    // Update roll results after a reroll for skill checks
    if (!rollResults || !rollResults.session || !rollResults.session.users) {
      return rollResults
    }

    // Find the target user
    const targetUser = rollResults.session.users.find(user => 
      (player === 'user' && user.id === characterId) ||
      (player === 'opponent' && user.id !== characterId)
    )

    if (targetUser && targetUser.rollResults && sortedDice && sortedDice[diceIndex]) {
      const rerolledDie = sortedDice[diceIndex]
      
      if (rerolledDie.poolIndex !== undefined) {
        if (typeof targetUser.rollResults[rerolledDie.poolIndex] === 'object') {
          // Complex format - update the roll value
          targetUser.rollResults[rerolledDie.poolIndex].dieRollValue = newValue
        } else {
          // Simple format - update the value directly
          targetUser.rollResults[rerolledDie.poolIndex] = newValue
        }
      }
    }

    return rollResults
  }

  static async sendOpposedSkillCheckResultsToServer(opposedSkillCheckResults) {
    try {
      await axios.post(`${API_BASE_URL}/send-discord-message`, {
        type: RollTypes.OPPOSED_SKILL_CHECK,
        ...opposedSkillCheckResults
      })
    } catch (error) {
      console.error('Error sending opposed skill check results:', error)
      alert('Failed to send opposed skill check results. Check your connection or server.')
    }
  }
}

export default OpposedSkillCheckService
