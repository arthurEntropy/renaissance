import axios from 'axios'
import { getDiceFontClass, getDiceFontMaxClass } from '@shared/utils/diceFontUtils'
import { RollTypes } from '@/constants/rollTypes'
import { EngagementWinnerTypes } from '@/constants/engagementWinnerTypes'
import { PlayerSides } from '@/constants/playerSides'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class EngagementRollService {
  static rollSingleDie(dieSize) {
    return Math.floor(Math.random() * dieSize) + 1
  }

  static sortEngagementDice(diceArray, rollResults) {
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
          originalIndex: index
        }
      } else {
        const value = rollResults[index] || 1
        const isMax = value === die
        return {
          die: die,
          value: value,
          class: getDiceFontClass(die, value),
          isRolling: false,
          isMax: isMax,
          originalIndex: index
        }
      }
    })

    return diceWithResults.sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value
      }
      return b.die - a.die
    })
  }

  static calculateDiceComparisons(userDice, opponentDice, userCharacterId, opponentCharacterId, manualResults = []) {
    const pairCount = Math.max(userDice.length, opponentDice.length)
    const comparisons = []

    for (let i = 0; i < pairCount; i++) {
      if (manualResults[i]) {
        const manualResult = manualResults[i]
        const leftWins = manualResult.winnerCharacterId === userCharacterId
        const rightWins = manualResult.winnerCharacterId === opponentCharacterId
        const tie = !manualResult.winnerCharacterId

        comparisons.push({
          leftWins,
          rightWins,
          tie,
          index: i,
          winnerCharacterId: manualResult.winnerCharacterId
        })
        continue
      }

      const userDie = i < userDice.length ? userDice[i] : null
      const opponentDie = i < opponentDice.length ? opponentDice[i] : null

      if (!userDie && opponentDie) {
        comparisons.push({
          leftWins: false,
          rightWins: true,
          tie: false,
          index: i,
          winnerCharacterId: opponentCharacterId
        })
      } else if (userDie && !opponentDie) {
        comparisons.push({
          leftWins: true,
          rightWins: false,
          tie: false,
          index: i,
          winnerCharacterId: userCharacterId
        })
      } else if (!userDie && !opponentDie) {
        comparisons.push({
          leftWins: false,
          rightWins: false,
          tie: true,
          index: i,
          winnerCharacterId: null
        })
      } else if (userDie && opponentDie && !userDie.isRolling && !opponentDie.isRolling &&
                 userDie.value !== undefined && opponentDie.value !== undefined) {
        const userWins = userDie.value > opponentDie.value
        const opponentWins = opponentDie.value > userDie.value
        const tie = userDie.value === opponentDie.value

        let winnerCharacterId = null
        if (userWins) {
          winnerCharacterId = userCharacterId
        } else if (opponentWins) {
          winnerCharacterId = opponentCharacterId
        }

        comparisons.push({
          leftWins: userWins,
          rightWins: opponentWins,
          tie,
          index: i,
          winnerCharacterId
        })
      }
    }

    return comparisons
  }

  static determineEngagementWinner(diceComparisons, userDice = [], opponentDice = []) {
    if (userDice.length === 0 && opponentDice.length === 0) {
      return EngagementWinnerTypes.TIE
    }

    if (!diceComparisons || diceComparisons.length === 0) {
      return null
    }

    let userWins = 0
    let opponentWins = 0

    diceComparisons.forEach(comparison => {
      if (comparison.leftWins) {
        userWins++
      } else if (comparison.rightWins) {
        opponentWins++
      }
    })

    if (userWins > opponentWins) {
      return EngagementWinnerTypes.USER
    } else if (opponentWins > userWins) {
      return EngagementWinnerTypes.OPPONENT
    } else {
      return EngagementWinnerTypes.TIE
    }
  }

  static countSideWins(diceComparisons, side, userCharacterId, opponentCharacterId) {
    if (!diceComparisons || diceComparisons.length === 0) {
      return 0
    }

    return diceComparisons.filter(comparison => {
      if (side === PlayerSides.USER) {
        return comparison.leftWins || comparison.winnerCharacterId === userCharacterId
      } else {
        return comparison.rightWins || comparison.winnerCharacterId === opponentCharacterId
      }
    }).length
  }

  static countTies(diceComparisons) {
    if (!diceComparisons || diceComparisons.length === 0) {
      return 0
    }

    return diceComparisons.filter(comparison => {
      return comparison.tie || !comparison.winnerCharacterId
    }).length
  }

  static updateRollResultsAfterReroll(rollResults, player, diceIndex, newValue, characterId, opponentSocketId, sortedDice) {
    if (!rollResults || !rollResults.session) return false

    let targetUser

    if (player === PlayerSides.USER) {
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
        targetUser.rollResults[rerolledDie.originalIndex] = newValue
        targetUser.rollTotal = targetUser.rollResults.reduce((sum, value) => sum + value, 0)
        return true
      }
    }

    return false
  }

  static async sendEngagementResultsToServer(engagementResults) {
    try {
      await axios.post(`${API_BASE_URL}/send-discord-message`, {
        type: RollTypes.ENGAGEMENT,
        ...engagementResults
      })
    } catch (error) {
      console.error('Error sending engagement results:', error)
      alert('Failed to send engagement results. Check your connection or server.')
    }
  }
}

export default EngagementRollService
