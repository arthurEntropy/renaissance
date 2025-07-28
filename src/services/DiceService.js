import axios from 'axios'

class DiceService {
  static latestRollResult = null

  static getLatestRollResult() {
    return this.latestRollResult
  }

  static makeSkillCheck(skill, character, targetNumber) {
    // Prepare the dice pool based on the skill and roll the dice.
    const dice = this.prepareDicePool(skill)
    const results = this.rollDice(dice)

    // Check for twice miserable condition and handle auto-fail if applicable.
    if (
      character.states.twiceMiserable &&
      this.checkAndHandleAutoFailForTwiceMiserable(
        results,
        skill.isFavored,
        skill.name,
        character,
        targetNumber,
      )
    ) {
      return
    }

    // Handle favored and ill-favored logic and append favored/ill-favored status to skill name for output.
    const skillModifier = this.handleFavoredAndIllFavored(results, skill)
    const skillName = skill.name + skillModifier

    // Calculate the total sum of the rolled dice and determine success.
    const totalSum = this.calculateTotalSum(
      results,
      character.states.twiceWeary,
    )
    const success = this.determineSuccess(totalSum, targetNumber)

    // Generate the footer text based on character conditions and states.
    const footer = this.generateFooter(character.conditions, character.states)

    // Mark max value dice (12 for d12, 6 for d6)
    results.forEach((r) => {
      r.isMaxValue =
        (r.die === 12 && r.roll === 12) || (r.die === 6 && r.roll === 6)
      r.dropped = r.roll === 0 // Any dice with roll=0 were dropped by favored/ill-favored logic
    })

    // Create roll result object to be used in-app and sent to Discord.
    const rollResult = {
      characterName: character.name,
      skillName: skillName,
      baseSkillName: skill.name,
      total: totalSum,
      targetNumber: targetNumber,
      success: success,
      diceSymbols: results.map((r) => r.symbol),
      diceResults: results.map((r) => ({
        type: r.die, // 12 or 6
        value: r.roll, // The actual number rolled (0 for dropped dice)
        symbol: r.symbol, // Symbol for Discord ouput
        isMaxValue:
          (r.die === 12 && r.roll === 12) || (r.die === 6 && r.roll === 6),
        emoji: this.getDiceEmoji(r.die, r.roll === 0 ? r.originalRoll : r.roll),
        dropped: r.roll === 0, // Was this die dropped by favored/ill-favored logic
        displayValue: r.roll === 0 ? r.originalRoll : r.roll,
        class: `df-d${r.die}-${r.roll === 0 ? r.originalRoll : r.roll}`, // For in-app display using DiceFont
      })),
      favoredStatus: skill.isFavored
        ? 'favored'
        : skill.isIllFavored
          ? 'ill-favored'
          : null,
      footer: footer,
      timestamp: Date.now(),
    }

    // Store latest roll
    this.latestRollResult = rollResult

    // Send to Discord
    // TODO: Make this optional
    this.sendRollResultsToServer(
      results.map((r) => r.symbol),
      totalSum,
      success,
      skillName,
      footer,
      character.artUrls[0],
      targetNumber,
      character.name,
    )

    return rollResult
  }

  static prepareDicePool(skill) {
    const dice = [{ sides: 12 }]

    if (skill.isFavored || skill.isIllFavored) {
      dice.push({ sides: 12 })
    }

    let totalD6 = skill.ranks + skill.diceMod
    if (totalD6 < 0) totalD6 = 0

    for (let i = 0; i < totalD6; i++) {
      dice.push({ sides: 6 })
    }

    return dice
  }

  static rollDice(dice) {
    return dice.map((die) => {
      const roll = Math.floor(Math.random() * die.sides) + 1
      let symbol
      if (die.sides === 12) {
        if (roll === 12) {
          symbol = '⭓12🌞'
        } else if (roll === 11) {
          symbol = '⭓11💀'
        } else {
          symbol = `⭓${roll}`
        }
      } else if (die.sides === 6 && roll === 6) {
        symbol = `◽️6✨`
      } else {
        symbol = `◽️${roll}`
      }

      return { die: die.sides, roll: roll, symbol: symbol }
    })
  }

  static checkAndHandleAutoFailForTwiceMiserable(
    results,
    isFavored,
    skillName,
    character,
    targetNumber,
  ) {
    const d12Rolls = results.filter((r) => r.die === 12).map((r) => r.roll)
    const autoFail = isFavored
      ? d12Rolls.filter((roll) => roll === 11).length === 2
      : d12Rolls.includes(11)

    if (autoFail) {
      this.sendRollResultsToServer(
        results.map((r) => r.symbol),
        0,
        false,
        skillName,
        this.generateFooter(character.conditions, character.states),
        character.artUrl,
        targetNumber,
        character.name,
      )
    }

    return autoFail
  }

  static handleFavoredAndIllFavored(results, skill) {
    if (!(skill.isFavored && skill.isIllFavored)) {
      if (skill.isFavored) {
        this.handleFavored(results)
        return ' (favored)' // Return string to append to skill name
      }
      if (skill.isIllFavored) {
        this.handleIllFavored(results)
        return ' (ill-favored)' // Return string to append to skill name
      }
    }
    return '' // No favored/ill-favored status to append
  }

  static handleFavored(results) {
    const d12Results = results.filter((r) => r.die === 12)
    const d12Rolls = d12Results.map((r) => r.roll)

    const highestD12Roll = d12Rolls.reduce((max, roll) => {
      if (roll === 11) return max
      return max === 11 || roll > max ? roll : max
    }, 11)

    let keptOne = false
    d12Results.forEach((r) => {
      if (r.roll === highestD12Roll && !keptOne) {
        keptOne = true
      } else {
        r.originalRoll = r.roll // Preserve the original roll
        r.roll = 0 // Mark as not contributing to total
      }
    })
  }

  static handleIllFavored(results) {
    // Filter to get only d12 results
    const d12Results = results.filter((r) => r.die === 12)
    const d12Rolls = d12Results.map((r) => r.roll)

    // Find the lowest roll, but if 11 is present, treat it as the lowest
    const lowestD12Roll = d12Rolls.includes(11) ? 11 : Math.min(...d12Rolls)

    // Find the first occurrence of the lowest roll and set it to 0
    let keptOne = false
    d12Results.forEach((r) => {
      if (r.roll === lowestD12Roll && !keptOne) {
        keptOne = true
      } else {
        r.originalRoll = r.roll // Preserve the original roll
        r.roll = 0 // Mark as not contributing to total
      }
    })
  }

  static calculateTotalSum(results, isTwiceWeary) {
    return results.reduce((sum, r) => {
      // If it's a d12 with value 11, treat it as 0
      if (r.die === 12 && r.roll === 11) {
        return sum
      }

      // If dice were dropped due to favored/ill-favored (roll = 0), don't add
      if (r.roll === 0) {
        return sum
      }

      // Apply Twice Weary rule (d6 rolls of 1-3 don't count toward total)
      if (r.die === 6 && r.roll <= 3 && isTwiceWeary) {
        return sum
      }

      // Otherwise, add the roll to the total
      return sum + r.roll
    }, 0)
  }

  static determineSuccess(totalSum, targetNumber) {
    return totalSum >= targetNumber
  }

  static generateFooter(conditions, states) {
    const footerText = []

    // Add conditions to footer text
    Object.keys(conditions).forEach((condition) => {
      if (conditions[condition]) {
        footerText.push(condition.charAt(0).toUpperCase() + condition.slice(1))
      }
    })

    // Add states to footer text
    const formattedStateNames = {
      twiceWeary: 'Twice Weary',
      twiceMiserable: 'Twice Miserable',
      twiceHelpless: 'Twice Helpless',
    }
    Object.keys(states).forEach((state) => {
      if (states[state]) {
        footerText.push(
          formattedStateNames[state] ||
            state.charAt(0).toUpperCase() + state.slice(1),
        )
      }
    })

    // Concatenate conditions and states as a comma-separated string
    return footerText.join(', ') || ''
  }

  static getDiceEmoji(dieType, value) {
    if (dieType === 12) {
      if (value === 12) return '🌞' // For 'Sol'
      if (value === 11) return '💀' // For 'Morte'
    } else if (dieType === 6 && value === 6) {
      return '✨' // For successes on success dice
    }
    return null
  }

  static async sendRollResultsToServer(
    rollResults,
    totalSum,
    success,
    skillName,
    footer,
    image,
    targetNumber,
    characterName,
  ) {
    try {
      await axios.post('http://localhost:3000/send-discord-message', {
        rollResults,
        total: totalSum,
        targetNumber,
        name: characterName || 'Unnamed Character',
        skill: skillName,
        success,
        footer,
        image,
      })
    } catch (error) {
      console.error('Error sending roll:', error)
      alert('Failed to send roll. Check your connection or server.')
    }
  }

  static async sendEngagementResultsToServer(engagementResults) {
    try {
      await axios.post('http://localhost:3000/send-discord-message', {
        type: 'engagement',
        ...engagementResults
      })
    } catch (error) {
      console.error('Error sending engagement results:', error)
      alert('Failed to send engagement results. Check your connection or server.')
    }
  }

  // ===== ENGAGEMENT DICE METHODS =====

  /**
   * Roll a single die and return the result
   * @param {number} dieSize - The number of sides on the die
   * @returns {number} The rolled value (1 to dieSize)
   */
  static rollSingleDie(dieSize) {
    return Math.floor(Math.random() * dieSize) + 1
  }

  /**
   * Sort dice from highest to lowest value, maintaining original index tracking
   * @param {Array} diceArray - Array of dice with die size and values
   * @param {Array} rollResults - Array of roll results corresponding to dice
   * @returns {Array} Sorted dice objects with value, class, and originalIndex
   */
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
          class: `df-d${die}-${value}`,
          isRolling: false,
          isMax: isMax,
          originalIndex: index
        }
      } else {
        // No results yet - show rolling state with max die face
        return {
          die: die,
          value: die, // Show max face while rolling
          class: `df-d${die}-${die}`,
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

  /**
   * Calculate dice comparisons between two players' dice
   * @param {Array} userDice - User's sorted dice array
   * @param {Array} opponentDice - Opponent's sorted dice array
   * @param {string} userCharacterId - User's character ID
   * @param {string} opponentCharacterId - Opponent's character ID
   * @param {Array} manualResults - Array of manual result overrides
   * @returns {Array} Array of comparison results
   */
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

  /**
   * Determine the overall engagement winner based on dice comparisons
   * @param {Array} diceComparisons - Array of dice comparison results
   * @param {Array} userDice - User's dice array (for length check)
   * @param {Array} opponentDice - Opponent's dice array (for length check)
   * @returns {string|null} 'user', 'opponent', 'tie', or null
   */
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

  /**
   * Count wins for a specific side in dice comparisons
   * @param {Array} diceComparisons - Array of dice comparison results
   * @param {string} side - 'user' or 'opponent'
   * @param {string} userCharacterId - User's character ID
   * @param {string} opponentCharacterId - Opponent's character ID
   * @returns {number} Number of wins for the specified side
   */
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

  /**
   * Count ties (draws) in dice comparisons
   * @param {Array} diceComparisons - Array of dice comparison results
   * @returns {number} Number of ties
   */
  static countTies(diceComparisons) {
    if (!diceComparisons || diceComparisons.length === 0) {
      return 0
    }

    return diceComparisons.filter(comparison => {
      return comparison.tie || !comparison.winnerCharacterId
    }).length
  }

  /**
   * Update roll results after a die reroll
   * @param {Object} rollResults - The session roll results object
   * @param {string} player - 'user' or 'opponent'
   * @param {number} diceIndex - Index of the rerolled die in sorted array
   * @param {number} newValue - New die value after reroll
   * @param {string} characterId - Character ID of the rerolling player
   * @param {string} opponentSocketId - Socket ID of the opponent (for opponent player)
   * @param {Array} sortedDice - The sorted dice array to find original index
   * @returns {boolean} True if update was successful
   */
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
}

export default DiceService
