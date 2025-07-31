import axios from 'axios'
import { getDiceFontClass, getDiceFontMaxClass } from '../../utils/diceFontUtils'
import { RollTypes } from '../constants/rollTypes'

class EngagementRollService {

  static rollSingleDie(dieSize) {
    return Math.floor(Math.random() * dieSize) + 1
  }

  static sortEngagementDice(diceArray, rollResults) {
    if (!diceArray || !Array.isArray(diceArray) || diceArray.length === 0) {
      return []
    }

    // Create dice objects with roll results and metadata
    const diceWithResults = diceArray.map((die, index) => {
      if (rollResults) {
        // We have actual roll results
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
      } else {
        // No results yet - show rolling state with max die face
        return {
          die: die,
          value: die, // Show max face while rolling
          class: getDiceFontMaxClass(die),
          isRolling: true,
          isMax: false, // Not actually max until rolled
          originalIndex: index
        }
      }
    })

    // Sort by value (highest first), then by die size for ties
    return diceWithResults.sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value
      }
      return b.die - a.die // Favor larger dice in ties
    })
  }

  static calculateDiceComparisons(userDice, opponentDice, userCharacterId, opponentCharacterId, manualResults = []) {
    const pairCount = Math.max(userDice.length, opponentDice.length)
    const comparisons = []

    for (let i = 0; i < pairCount; i++) {
      // Check for manual override first
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

      // Handle cases where one side has no die
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
        // Both sides have dice with values
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
    // Special case: if both players have no dice, it's a tie
    if (userDice.length === 0 && opponentDice.length === 0) {
      return 'tie'
    }

    // If no comparisons exist, return null
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
      // Ties don't count for either side
    })

    if (userWins > opponentWins) {
      return 'user'
    } else if (opponentWins > userWins) {
      return 'opponent'
    } else {
      return 'tie'
    }
  }

  static countSideWins(diceComparisons, side, userCharacterId, opponentCharacterId) {
    if (!diceComparisons || diceComparisons.length === 0) {
      return 0
    }

    return diceComparisons.filter(comparison => {
      if (side === 'user') {
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

      // Find the original index of this specific die instance
      if (rerolledDie.originalIndex !== undefined) {
        // Update the roll result at the original index
        targetUser.rollResults[rerolledDie.originalIndex] = newValue

        // Recalculate total
        targetUser.rollTotal = targetUser.rollResults.reduce((sum, value) => sum + value, 0)
        return true
      }
    }

    return false
  }

  static async sendEngagementResultsToServer(engagementResults) {
    try {
      await axios.post('http://localhost:3000/send-discord-message', {
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
