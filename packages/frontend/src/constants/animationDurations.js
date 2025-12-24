export const DICE_ROLL_DURATION = 1500 // 1.5 seconds

// Dice roll animation behavior constants
export const DICE_ANIMATION = {
    CHANGE_FREQUENCY_BASE: 0.3,     // Base frequency for dice value changes during animation
    CHANGE_FREQUENCY_RANGE: 0.3,    // Additional frequency as animation progresses
    SETTLE_START_PROGRESS: 0.7,     // Progress point (0-1) when dice start settling to final values
    SETTLE_PROBABILITY_FACTOR: 0.3, // Factor for calculating settle probability
}
