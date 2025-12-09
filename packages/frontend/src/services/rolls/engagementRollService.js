import { WINNER } from '@shared/constants/winner.js'
import { PlayerSides } from '@/constants/playerSides'
import DiscordAdapter from './utils/DiscordAdapter.js'
import BaseRollService from './baseRollService.js'

class EngagementRollService extends BaseRollService {

  static calculateDiceComparisons(userDice, opponentDice, userCharacterId, opponentCharacterId, manualResults = []) {
    // Determine how many die pairs to compare (based on player with more dice)
    const pairCount = Math.max(userDice.length, opponentDice.length)
    const comparisons = []

    // Compare each die pair
    for (let i = 0; i < pairCount; i++) {

      // If this comparison was manually overridden by the user(s), use that result directly
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

      // Otherwise, get the dice at this position for each player (null if they don't have one)
      const userDie = i < userDice.length ? userDice[i] : null
      const opponentDie = i < opponentDice.length ? opponentDice[i] : null

      // Case 1: Only opponent has a die at this position (opponent wins by default)
      if (!userDie && opponentDie) {
        comparisons.push({
          leftWins: false,
          rightWins: true,
          tie: false,
          index: i,
          winnerCharacterId: opponentCharacterId
        })
      } 
      // Case 2: Only user has a die at this position (user wins by default)
      else if (userDie && !opponentDie) {
        comparisons.push({
          leftWins: true,
          rightWins: false,
          tie: false,
          index: i,
          winnerCharacterId: userCharacterId
        })
      } 
      // Case 3: Both players have dice - compare values (only if both are rolled)
      else if (userDie && opponentDie && !userDie.isRolling && !opponentDie.isRolling &&
               userDie.dieRollValue !== undefined && opponentDie.dieRollValue !== undefined) {
        const userWins = userDie.dieRollValue > opponentDie.dieRollValue
        const opponentWins = opponentDie.dieRollValue > userDie.dieRollValue
        const tie = userDie.dieRollValue === opponentDie.dieRollValue

        // Determine which character won this comparison
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
      // Case 4: Both have dice but they're still rolling - no comparison yet (skip)
    }

    return comparisons
  }

  static determineEngagementWinner(diceComparisons, userDice = [], opponentDice = []) {
    // Deal with cases where one or both players have no dice
    if (userDice.length === 0 && opponentDice.length === 0) {
      return WINNER.TIE
    }

    if (!diceComparisons || diceComparisons.length === 0) {
      return null
    }

    // Tally wins for each side
    let userWins = 0
    let opponentWins = 0

    diceComparisons.forEach(comparison => {
      if (comparison.leftWins) {
        userWins++
      } else if (comparison.rightWins) {
        opponentWins++
      }
    })

    // Determine overall winner
    if (userWins > opponentWins) {
      return WINNER.USER
    } else if (opponentWins > userWins) {
      return WINNER.OPPONENT
    } else {
      return WINNER.TIE
    }
  }

  // For when we need a count of comparison wins, not just determination of overall winner
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

    // Find the user whose die was rerolled
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

    // Update the die value if found
    if (targetUser && targetUser.rollResults && sortedDice && sortedDice[diceIndex]) {
      const rerolledDie = sortedDice[diceIndex]

      if (rerolledDie.poolIndex !== undefined) {
        // Update the DiceResult object
        targetUser.rollResults[rerolledDie.poolIndex].dieRollValue = newValue
        targetUser.rollResults[rerolledDie.poolIndex].originalDieRollValue = newValue
        targetUser.rollResults[rerolledDie.poolIndex].rolledMaxValue = newValue === targetUser.rollResults[rerolledDie.poolIndex].dieSides
        
        // Recalculate total
        targetUser.rollTotal = targetUser.rollResults.reduce((sum, result) => sum + (result.dieRollValue || 0), 0)
        return true
      }
    }

    return false
  }

  static async sendEngagementResultsToServer(engagementResults) {
    return DiscordAdapter.sendEngagement(engagementResults)
  }
}

export default EngagementRollService
