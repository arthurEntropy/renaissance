import { getDiceFontClass, getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { formatDiceResults, getFavoredStatus } from '@/utils/diceUtils'
import RollTypes from '@/constants/rollTypes'
import BaseRollService from './baseRollService.js'

class OpposedSkillCheckService extends BaseRollService {

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

  static async sendOpposedSkillCheckResultsToServer(opposedSkillCheckResults) {
    return this.sendToDiscord({
      type: RollTypes.OPPOSED_SKILL_CHECK,
      ...opposedSkillCheckResults
    })
  }
}

export default OpposedSkillCheckService
