import axios from 'axios'
import { getDiceFontClass, getDiceFontMaxClass } from '@shared/utils/diceFontUtils'
import { RollTypes } from '@/constants/rollTypes'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class OpposedSkillCheckService {
  static latestRollResult = null

  static getLatestRollResult() {
    return this.latestRollResult
  }

  static rollSingleDie(dieSize) {
    return Math.floor(Math.random() * dieSize) + 1
  }

  static sortSkillCheckDice(diceArray, rollResults) {
    if (!diceArray || !Array.isArray(diceArray) || diceArray.length === 0) {
      return []
    }

    const diceWithResults = diceArray.map((die, index) => {
      if (!rollResults) {
        return {
          die: die,
          value: die,
          class: getDiceFontMaxClass(die),
          isRolling: true,
          isMax: false,
          originalIndex: index,
          dropped: false
        }
      } else {
        const result = rollResults[index]
        const value = result.roll
        const isMax = value === die && value > 0
        const dropped = value === 0
        
        return {
          die: die,
          value: dropped ? result.originalRoll : value,
          class: getDiceFontClass(die, dropped ? result.originalRoll : value),
          isRolling: false,
          isMax: isMax,
          originalIndex: index,
          dropped: dropped
        }
      }
    })

    return diceWithResults.sort((a, b) => {
      // Sort by value (highest first), but dropped dice go to end
      if (a.dropped && !b.dropped) return 1
      if (!a.dropped && b.dropped) return -1
      if (a.dropped && b.dropped) return 0
      
      if (b.value !== a.value) {
        return b.value - a.value
      }
      return b.die - a.die
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

    const winner = this.determineOpposedWinner(userSession.rollTotal, opponentSession.rollTotal)
    
    const result = {
      type: RollTypes.OPPOSED_SKILL_CHECK,
      characterName: userSession.characterInfo.name,
      opponentName: opponentSession.characterInfo.name,
      skillName: userSession.skillCheckConfig.name,
      opponentSkillName: opponentSession.skillCheckConfig.name,
      userTotal: userSession.rollTotal,
      opponentTotal: opponentSession.rollTotal,
      winner: winner,
      userDiceResults: this.formatDiceResults(userSession.rollResults),
      opponentDiceResults: this.formatDiceResults(opponentSession.rollResults),
      userFavoredStatus: this.getFavoredStatus(userSession.skillCheckConfig),
      opponentFavoredStatus: this.getFavoredStatus(opponentSession.skillCheckConfig),
      timestamp: Date.now(),
      session: session
    }

    this.latestRollResult = result
    return result
  }

  static formatDiceResults(rollResults) {
    return rollResults.map(result => ({
      type: result.die,
      value: result.roll,
      displayValue: result.roll === 0 ? result.originalRoll : result.roll,
      symbol: result.symbol,
      isMaxValue: result.die === result.roll && result.roll > 0,
      dropped: result.roll === 0,
      class: getDiceFontClass(result.die, result.roll === 0 ? result.originalRoll : result.roll),
      emoji: this.getDiceEmoji(result.die, result.roll === 0 ? result.originalRoll : result.roll)
    }))
  }

  static getFavoredStatus(skillConfig) {
    if (skillConfig.isFavored) return 'favored'
    if (skillConfig.isIllFavored) return 'ill-favored'
    return null
  }

  static getDiceEmoji(dieSize, roll) {
    if (dieSize === 12) {
      if (roll === 12) return '🌞'
      if (roll === 11) return '💀'
      return null
    } else if (dieSize === 6 && roll === 6) {
      return '✨'
    }
    return null
  }

  static updateRollResultsAfterReroll(rollResults, player, diceIndex, newValue, characterId, opponentSocketId, sortedDice) {
    if (!rollResults || !rollResults.session) return false

    let targetUser

    if (player === 'user') {
      targetUser = rollResults.session.users.find(
        user => user.characterInfo.id === characterId
      )
    } else {
      targetUser = rollResults.session.users.find(
        user => user.socketId === opponentSocketId
      )
    }

    if (targetUser && targetUser.rollResults && sortedDice && sortedDice[diceIndex]) {
      const rerolledDie = sortedDice[diceIndex]

      if (rerolledDie.originalIndex !== undefined) {
        const originalResult = targetUser.rollResults[rerolledDie.originalIndex]
        originalResult.roll = newValue
        originalResult.originalRoll = newValue
        
        // Recalculate total
        targetUser.rollTotal = targetUser.rollResults
          .filter(result => result.roll > 0)
          .reduce((sum, result) => sum + result.roll, 0)
        
        return true
      }
    }

    return false
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
