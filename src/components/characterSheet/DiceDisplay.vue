<template>
    <!-- Dice display (for skill checks, not engagement) -->
    <div v-if="shouldShowDice" class="roll-dice">
        <span v-for="(die, index) in displayDice" :key="index" class="dice-symbol" :class="{
            'dropped-die': !isRolling && die.dropped,
            'max-value-die': !isRolling && die.isMaxValue,
            'dice-rolling': isRolling,
        }" :style="{ animationDelay: `${index * 50}ms` }">
            <i :class="die.class"></i>
            <span v-if="!isRolling && die.emoji" class="dice-emoji">{{
                die.emoji
                }}</span>
        </span>
    </div>

    <!-- Empty space for engagement to maintain layout consistency -->
    <div v-else class="engagement-dice-placeholder"></div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useDiceAnimation } from '../../composables/useDiceAnimation'

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

// Computed properties
const displayDice = computed(() => {
    return getDisplayDice(props.rollData?.diceResults)
})

const shouldShowDice = computed(() => {
    return !props.isEngagement
})

// Helper function to trigger animation
const triggerRollAnimation = () => {
    startRollAnimation(props.rollData, props.isEngagement)
}

// Watchers
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
    flex-wrap: nowrap;
    justify-content: center;
    gap: 5px;
    padding: 5px 0;
    overflow-x: auto;
}

.engagement-dice-placeholder {
    padding: 5px 0;
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
    /* Slight delay after roll ends */
}

/* Keyframes for dropped die effect */
@keyframes fadeInStrikethrough {
    0% {
        opacity: 1;
        text-decoration: none;
    }

    100% {
        opacity: 0.5;
        text-decoration: line-through;
    }
}

/* Apply animation to dropped dice */
.dropped-die {
    animation: fadeInStrikethrough 0.8s ease-in forwards;
    animation-delay: 0.1s;
    /* Slight delay after roll ends */
}

/* Keyframes for dropped die line */
@keyframes fadeInLine {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 0.7;
    }
}

/* Add line with animation */
.dropped-die::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--color-danger);
    transform: translateY(-50%);
    opacity: 0;
    animation: fadeInLine 0.8s ease-in forwards;
    animation-delay: 0.3s;
    /* Slightly more delay for the line */
}

.dice-emoji {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: var(--font-size-16);
    transform: translate(5px, 5px);
    opacity: 0;
    /* Start invisible */
    animation: fadeIn 0.5s ease-in forwards;
    animation-delay: 0.4s;
    /* Appear after other effects */
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
