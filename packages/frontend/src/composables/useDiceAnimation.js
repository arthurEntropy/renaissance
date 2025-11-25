import { ref } from 'vue'
import { DICE_ROLL_DURATION } from '@/constants/animationDurations'
import { getRandomDiceFontClass } from '@/utils/diceFontUtils'

export function useDiceAnimation() {
  // Animation state
  const isRolling = ref(false)
  const rollStartTime = ref(null)
  const rollDuration = ref(DICE_ROLL_DURATION)
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
      // Generate random value for initial animation
      const randomValue = Math.floor(Math.random() * die.dieSides) + 1
      return {
        ...die,
        dieRollValue: randomValue,
        displayValue: randomValue,
        cssClass: getRandomDiceFontClass(die.dieSides),
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
      // Continue animation - cycle through random values
      animatedDice.value = animatedDice.value.map((die, index) => {
        // Change the die value frequently to create cycling effect
        // More frequent changes early in the animation
        const changeFrequency = 0.3 + (progress * 0.3) // 0.3 to 0.6
        
        if (Math.random() < changeFrequency) {
          const randomValue = Math.floor(Math.random() * die.dieSides) + 1
          return {
            ...die,
            dieRollValue: randomValue,
            displayValue: randomValue,
            cssClass: getRandomDiceFontClass(die.dieSides),
            isRolling: true,
          }
        }

        // As we get closer to the end (70%+), occasionally show the real value
        if (progress > 0.7 && Math.random() < (progress - 0.7) / 0.3) {
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
