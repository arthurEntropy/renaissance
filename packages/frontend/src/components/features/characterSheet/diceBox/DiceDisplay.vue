<template>
    <div v-if="shouldShowDice" class="roll-dice">
        <!-- Waiting/Rolling state -->
        <WaitingDiceDisplay v-if="state === 'waiting' || state === 'rolling'" :waiting-dice="waitingDiceDisplay"
            :state="state" />

        <!-- Completed state -->
        <CompletedDiceDisplay v-else :truncated-dice="truncatedDice" :dice-size="diceSize" :is-rolling="isRolling"
            :is-custom-roll="isCustomRoll" :can-show-reroll="canReroll && !isOpponent && !isEngagementOrOpposedRoll"
            @reroll-all="emit('reroll-all-dice')" @open-modal="openModal" />

        <!-- Modal for showing all dice -->
        <AllDiceModal v-if="showModal" :display-dice="displayDice" :is-custom-roll="isCustomRoll" @close="closeModal" />
    </div>

    <div v-else class="engagement-dice-placeholder"></div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { RollTypes } from '@/constants/rollTypes'
import { getDiceFontClass, getRandomDiceFontClass } from '@/utils/diceFontUtils'
import { DICE_ROLL_DURATION } from '@/constants/animationDurations'
import WaitingDiceDisplay from './WaitingDiceDisplay.vue'
import CompletedDiceDisplay from './CompletedDiceDisplay.vue'
import AllDiceModal from './AllDiceModal.vue'

// Dice roll animation behavior constants
const DICE_ANIMATION = {
    CHANGE_FREQUENCY_BASE: 0.3,     // Base frequency for dice value changes during animation
    CHANGE_FREQUENCY_RANGE: 0.3,    // Additional frequency as animation progresses
    SETTLE_START_PROGRESS: 0.7,     // Progress point (0-1) when dice start settling to final values
    SETTLE_PROBABILITY_FACTOR: 0.3, // Factor for calculating settle probability
}

const props = defineProps({
    rollData: {
        type: Object,
        default: null,
    },
    isEngagement: {
        type: Boolean,
        default: false,
    },
    canReroll: {
        type: Boolean,
        default: false,
    },
    isOpponent: {
        type: Boolean,
        default: false,
    },
    state: {
        type: String,
        default: 'completed',
        validator: (value) => ['waiting', 'rolling', 'completed'].includes(value)
    },
    waitingDice: {
        type: Array,
        default: () => []
    },
    containerWidth: {
        type: Number,
        default: 250,
    },
    skipAnimation: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['reroll-all-dice'])

const isRolling = ref(false)
const rollStartTime = ref(null)
const rollDuration = ref(DICE_ROLL_DURATION)
const animatedDice = ref([])
const lastRollId = ref(null)

const startRollAnimation = (rollData, skipAnimation = false) => {
    if (skipAnimation || !rollData || !rollData.diceResults || rollData.diceResults.length === 0) {
        isRolling.value = false
        return
    }

    const currentRollId = Date.now()
    lastRollId.value = currentRollId

    animatedDice.value = rollData.diceResults.map((die) => {
        const randomValue = Math.floor(Math.random() * die.dieSize) + 1
        return {
            ...die,
            dieRollValue: randomValue,
            displayValue: randomValue,
            cssClass: getRandomDiceFontClass(die.dieSize),
            isRolling: true,
        }
    })

    isRolling.value = true
    rollStartTime.value = Date.now()

    animateRoll(currentRollId, rollData.diceResults)
}

const animateRoll = (rollId, finalDiceResults) => {
    if (rollId !== lastRollId.value) return

    const elapsed = Date.now() - rollStartTime.value
    const progress = Math.min(elapsed / rollDuration.value, 1)

    if (progress < 1) {
        animatedDice.value = animatedDice.value.map((die, index) => {
            const changeFrequency = DICE_ANIMATION.CHANGE_FREQUENCY_BASE +
                (progress * DICE_ANIMATION.CHANGE_FREQUENCY_RANGE)

            if (Math.random() < changeFrequency) {
                const randomValue = Math.floor(Math.random() * die.dieSize) + 1
                return {
                    ...die,
                    dieRollValue: randomValue,
                    displayValue: randomValue,
                    cssClass: getRandomDiceFontClass(die.dieSize),
                    isRolling: true,
                }
            }

            if (progress > DICE_ANIMATION.SETTLE_START_PROGRESS &&
                Math.random() < (progress - DICE_ANIMATION.SETTLE_START_PROGRESS) /
                DICE_ANIMATION.SETTLE_PROBABILITY_FACTOR) {
                const actualDie = finalDiceResults[index]
                return {
                    ...actualDie,
                    isRolling: true,
                }
            }

            return die
        })

        requestAnimationFrame(() => animateRoll(rollId, finalDiceResults))
    } else {
        isRolling.value = false
    }
}

const getDisplayDice = (finalDiceResults = []) => {
    return isRolling.value ? animatedDice.value : finalDiceResults
}

const DICE_SIZES = {
    LARGE: 36,  // var(--font-size-36)
    MEDIUM: 30, // var(--font-size-30)
    SMALL: 24   // var(--font-size-24)
}

const DICE_SIZE_THRESHOLDS = {
    MEDIUM: 6,  // 6+ dice use medium size
    SMALL: 8    // 8+ dice use small size
}

const GAP_SIZE = 8 // Gap between dice in pixels
const MAX_LINES = 2 // Number of lines before truncation

const showModal = ref(false)

const isCustomRoll = computed(() => {
    return props.rollData?.type === RollTypes.CUSTOM_ROLL
})

const isEngagementOrOpposedRoll = computed(() => {
    return props.rollData?.type === RollTypes.ENGAGEMENT ||
        props.rollData?.type === RollTypes.OPPOSED_SKILL_CHECK
})

const diceSize = computed(() => {
    const diceCount = displayDice.value?.length || 0
    if (diceCount >= DICE_SIZE_THRESHOLDS.SMALL) return DICE_SIZES.SMALL
    if (diceCount >= DICE_SIZE_THRESHOLDS.MEDIUM) return DICE_SIZES.MEDIUM
    return DICE_SIZES.LARGE
})

const maxDiceForTwoLines = computed(() => {
    const containerWidth = props.containerWidth
    const diceWithGap = diceSize.value + GAP_SIZE
    const dicePerLine = Math.floor(containerWidth / diceWithGap)
    return dicePerLine * MAX_LINES
})

const displayDice = computed(() => {
    return getDisplayDice(props.rollData?.diceResults)
})

const waitingDiceDisplay = computed(() => {
    if (!props.waitingDice || props.waitingDice.length === 0) return []

    return props.waitingDice.map((die, index) => ({
        dieSize: die.dieSize,
        cssClass: getDiceFontClass(die.dieSize, die.dieSize), // Use the die type as the value for consistent display
        poolIndex: index
    }))
})

const truncatedDice = computed(() => {
    const dice = displayDice.value
    if (!dice || dice.length <= maxDiceForTwoLines.value) {
        return { dice, showEllipsis: false }
    }

    // Reserve space for ellipsis by showing one less die
    const maxToShow = maxDiceForTwoLines.value - 1
    return {
        dice: dice.slice(0, maxToShow),
        showEllipsis: true,
        hiddenCount: dice.length - maxToShow
    }
})

const shouldShowDice = computed(() => {
    // Show dice if diceResults are available
    // Previously engagement didn't have diceResults, but now it does
    return props.rollData?.diceResults && props.rollData.diceResults.length > 0
})

const triggerRollAnimation = () => {
    startRollAnimation(props.rollData, props.isEngagement || props.skipAnimation)
}

const openModal = () => {
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
}

watch(() => props.rollData, (newValue, oldValue) => {
    if (
        newValue &&
        (!oldValue || newValue.timestamp !== oldValue.timestamp)
    ) {
        triggerRollAnimation()
    }
}, { immediate: true })

defineExpose({
    isRolling,
    triggerRollAnimation
})
</script>

<style scoped>
.roll-dice {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-xs);
    padding: var(--space-xs) 0;
    max-height: calc(2 * (var(--font-size-36) + var(--space-xs) + 4px));
    overflow: visible;
    position: relative;
}

.engagement-dice-placeholder {
    padding: var(--space-xs) 0;
    height: 46px;
}
</style>
