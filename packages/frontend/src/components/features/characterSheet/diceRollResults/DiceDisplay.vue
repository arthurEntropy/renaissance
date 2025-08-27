<template>
    <div v-if="shouldShowDice" class="roll-dice">
        <span v-for="(die, index) in truncatedDice.dice" :key="index" class="dice-symbol" :class="{
            'dropped-die': !isRolling && die.dropped,
            'max-value-die': !isRolling && die.isMaxValue,
            'dice-rolling': isRolling,
        }" :style="{ animationDelay: `${index * 50}ms` }">
            <i :class="die.class"></i>
            <span v-if="!isRolling && die.emoji && !isCustomRoll" class="dice-emoji">{{
                die.emoji
                }}</span>
        </span>
        <span v-if="truncatedDice.showEllipsis" class="dice-ellipsis" @click="openModal">
            ...
        </span>

        <!-- Modal for showing all dice -->
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>All Dice Results</h3>
                    <button class="close-button" @click="closeModal">×</button>
                </div>
                <div class="modal-dice-display">
                    <span v-for="(die, index) in displayDice" :key="index" class="modal-dice-symbol" :class="{
                        'dropped-die': die.dropped,
                        'max-value-die': die.isMaxValue,
                    }">
                        <i :class="die.class"></i>
                        <span v-if="die.emoji && !isCustomRoll" class="dice-emoji">{{
                            die.emoji
                            }}</span>
                    </span>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="engagement-dice-placeholder"></div>
</template>

<script setup>
import { computed, watch, onMounted, ref } from 'vue'
import { useDiceAnimation } from '@/composables/useDiceAnimation'
import { RollTypes } from '@/constants/rollTypes'

// Props
const props = defineProps({
    rollData: {
        type: Object,
        default: null,
    },
    isEngagement: {
        type: Boolean,
        default: false,
    },
})

// Composables
const { isRolling, startRollAnimation, getDisplayDice } = useDiceAnimation()

// Modal state
const showModal = ref(false)

// Computed properties
const isCustomRoll = computed(() => {
    return props.rollData?.type === RollTypes.CUSTOM_ROLL
})
const maxDiceForTwoLines = computed(() => {
    // Estimate based on container width (250px) and dice size + gap
    const containerWidth = 250
    const gapSize = 8 // var(--space-xs)
    const diceSize = displayDice.value?.length >= 8 ? 24 : displayDice.value?.length >= 6 ? 30 : 36
    const diceWithGap = diceSize + gapSize
    const dicePerLine = Math.floor(containerWidth / diceWithGap)
    return dicePerLine * 2 // Two lines
})

const displayDice = computed(() => {
    return getDisplayDice(props.rollData?.diceResults)
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
    return !props.isEngagement
})

// Helper function to trigger animation
const triggerRollAnimation = () => {
    startRollAnimation(props.rollData, props.isEngagement)
}

// Modal methods
const openModal = () => {
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
}// Watchers
watch(() => props.rollData, (newValue, oldValue) => {
    if (
        newValue &&
        (!oldValue || newValue.timestamp !== oldValue.timestamp)
    ) {
        triggerRollAnimation()
    }
})

// Lifecycle
onMounted(() => {
    if (props.rollData) {
        triggerRollAnimation()
    }
})

// Expose isRolling state to parent
defineExpose({
    isRolling
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
    overflow: hidden;
    position: relative;
}

.engagement-dice-placeholder {
    padding: var(--space-xs) 0;
    height: 46px;
}

.dice-symbol {
    font-size: var(--font-size-36);
    flex-shrink: 1;
    position: relative;
    opacity: 1;
    text-decoration: none;
}

/* When there are many dice, make them smaller */
.roll-dice:has(.dice-symbol:nth-child(n + 6)) .dice-symbol {
    font-size: var(--font-size-30);
}

.roll-dice:has(.dice-symbol:nth-child(n + 8)) .dice-symbol {
    font-size: var(--font-size-24);
}

/* Define transition for all dice */
.dice-symbol:not(.dice-rolling) {
    transition:
        color 0.8s ease-in,
        text-shadow 0.8s ease-in,
        opacity 0.8s ease-in;
}

/* Keyframes for max value glow effect */
@keyframes fadeInGlow {
    0% {
        color: var(--color-white);
        text-shadow: var(--shadow-none);
    }

    100% {
        color: var(--color-accent-gold);
        text-shadow: var(--shadow-glow-gold-sm);
    }
}

/* Apply animation to max value dice */
.max-value-die {
    animation: fadeInGlow 0.8s ease-in forwards;
    animation-delay: 0.1s;
}

/* Keyframes for dropped die effect */
@keyframes fadeInStrikethrough {
    0% {
        color: var(--color-white);
        opacity: 1;
    }

    100% {
        color: var(--color-gray-medium);
        opacity: 0.7;
    }
}

/* Apply animation to dropped dice */
.dropped-die {
    animation: fadeInStrikethrough 0.8s ease-in forwards;
    animation-delay: 0.1s;
}

/* Keyframes for dropped die line */
@keyframes fadeInLine {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

/* Add diagonal line with animation */
.dropped-die::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--color-danger);
    transform: translateY(-50%) rotate(-45deg);
    pointer-events: none;
    z-index: var(--z-overlay);
    opacity: 0;
    animation: fadeInLine 0.8s ease-in forwards;
    animation-delay: 0.3s;
}

.dice-emoji {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: var(--font-size-16);
    transform: translate(5px, 5px);
    opacity: 0;
    animation: fadeIn 0.5s ease-in forwards;
    animation-delay: 0.4s;
}

.dice-ellipsis {
    font-size: var(--font-size-36);
    color: var(--color-gray-medium);
    flex-shrink: 0;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1em;
    transition: color 0.2s ease;
}

.dice-ellipsis:hover {
    color: var(--color-text-primary);
}

/* Adjust ellipsis size when dice are smaller */
.roll-dice:has(.dice-symbol:nth-child(n + 6)) .dice-ellipsis {
    font-size: var(--font-size-30);
}

.roll-dice:has(.dice-symbol:nth-child(n + 8)) .dice-ellipsis {
    font-size: var(--font-size-24);
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: var(--z-modal);
}

.modal-content {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow-elevation-lg);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
}

.modal-header h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-18);
}

.close-button {
    background: none;
    border: none;
    font-size: var(--font-size-24);
    color: var(--color-gray-medium);
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-5);
    transition: color 0.2s ease, background-color 0.2s ease;
}

.close-button:hover {
    color: var(--color-text-primary);
    background-color: var(--color-gray-dark);
}

.modal-dice-display {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-xs);
    padding: var(--space-md) 0;
}

.modal-dice-symbol {
    font-size: var(--font-size-36);
    position: relative;
    transition:
        color 0.8s ease-in,
        text-shadow 0.8s ease-in,
        opacity 0.8s ease-in;
}

.modal-dice-symbol.max-value-die {
    color: var(--color-accent-gold);
    text-shadow: var(--shadow-glow-gold-sm);
}

.modal-dice-symbol.dropped-die {
    color: var(--color-gray-medium);
    opacity: 0.7;
}

.modal-dice-symbol.dropped-die::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--color-danger);
    transform: translateY(-50%) rotate(-45deg);
    pointer-events: none;
    z-index: 1;
}

@keyframes fadeIn {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

@keyframes rollDice {
    0% {
        transform: translateY(-15px) rotate(0deg);
        opacity: 0.7;
    }

    10% {
        transform: translateY(5px) rotate(180deg);
    }

    20% {
        transform: translateY(-8px) rotate(360deg);
    }

    30% {
        transform: translateY(6px) rotate(450deg);
    }

    40% {
        transform: translateY(-6px) rotate(540deg);
    }

    50% {
        transform: translateY(4px) rotate(630deg);
    }

    60% {
        transform: translateY(-4px) rotate(720deg);
    }

    75% {
        transform: translateY(3px) rotate(1020deg);
    }

    85% {
        transform: translateY(-1px) rotate(1060deg);
    }

    95% {
        transform: translateY(0.5px) rotate(1076deg);
    }

    100% {
        transform: translateY(0) rotate(1080deg);
        opacity: 1;
    }
}

.dice-rolling {
    animation: rollDice 1.5s ease-out;
    perspective: 1000px;
    transform-style: preserve-3d;
    display: inline-block;
}
</style>
