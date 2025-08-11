import { ref } from 'vue'
import { getRandomDiceFontClass } from '../../utils/diceFontUtils'

export function useDiceAnimation() {
  // Animation state
  const isRolling = ref(false)
  const rollStartTime = ref(null)
  const rollDuration = ref(1500) // 1.5 seconds
  const animatedDice = ref([])
  const lastRollId = ref(null)

  /**
   * Start the dice rolling animation
   * @param {Object} rollData - The roll data containing diceResults
   * @param {boolean} skipAnimation - Whether to skip animation (e.g., for engagement rolls)
   */
  const startRollAnimation = (rollData, skipAnimation = false) => {
    // Skip animation if requested or no dice to animate
    if (skipAnimation) {
      isRolling.value = false
      return
    }

    if (
      !rollData ||
      !rollData.diceResults ||
      rollData.diceResults.length === 0
    ) {
      isRolling.value = false
      return
    }

    // Generate a unique ID for this roll
    const currentRollId = Date.now()
    lastRollId.value = currentRollId

    // Initialize animated dice array with random initial values
    animatedDice.value = rollData.diceResults.map((die) => {
      return {
        ...die,
        class: getRandomDiceFontClass(die.type),
        isRolling: true,
      }
    })
    
    isRolling.value = true
    rollStartTime.value = Date.now()

    // Start animation frames
    animateRoll(currentRollId, rollData.diceResults)
  }

  /**
   * Handle the animation frame updates
   * @param {number} rollId - The unique ID for this roll
   * @param {Array} finalDiceResults - The final dice results to animate towards
   */
  const animateRoll = (rollId, finalDiceResults) => {
    if (rollId !== lastRollId.value) return // Stop if a new roll has started

    const elapsed = Date.now() - rollStartTime.value
    const progress = Math.min(elapsed / rollDuration.value, 1)

    if (progress < 1) {
      // Continue animation
      animatedDice.value = animatedDice.value.map((die, index) => {
        // Determine if we should change the die face
        // Change it every 20% of the time, but more frequently at the start
        if (Math.random() < 0.5 / (progress * 5 + 0.5)) {
          return {
            ...die,
            class: getRandomDiceFontClass(die.type),
          }
        }

        // As we get closer to the end, start showing the real values more often
        if (progress > 0.7 && Math.random() < progress) {
          const actualDie = finalDiceResults[index]
          return {
            ...actualDie,
            isRolling: true,
          }
        }

        return die
      })

      // Schedule next animation frame
      requestAnimationFrame(() => animateRoll(rollId, finalDiceResults))
    } else {
      // Animation complete, show final results
      isRolling.value = false
    }
  }

  /**
   * Get the display dice (either animated or final results)
   * @param {Array} finalDiceResults - The final dice results
   * @returns {Array} The dice to display
   */
  const getDisplayDice = (finalDiceResults = []) => {
    return isRolling.value ? animatedDice.value : finalDiceResults
  }

  /**
   * Reset the animation state
   */
  const resetAnimation = () => {
    isRolling.value = false
    rollStartTime.value = null
    animatedDice.value = []
    lastRollId.value = null
  }

  return {
    // State
    isRolling,
    rollDuration,
    
    // Methods
    startRollAnimation,
    getDisplayDice,
    resetAnimation,
  }
}
