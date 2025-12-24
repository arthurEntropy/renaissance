<template>
    <div class="completed-dice-state" @mouseenter="canShowReroll ? showDiceHover = true : null"
        @mouseleave="canShowReroll ? showDiceHover = false : null">
        <span v-for="(die, index) in truncatedDice.dice" :key="index" class="dice-symbol" :class="{
            'dropped-die': !isRolling && die.isDropped,
            'max-value-die': !isRolling && die.rolledMaxValue,
            'dice-rolling': isRolling,
        }" :style="{
            animationDelay: `${index * 50}ms`,
            fontSize: `${diceSize}px`
        }">
            <i :class="die.cssClass"></i>
            <span v-if="!isRolling && die.emoji && !isCustomRoll" class="dice-emoji">{{
                die.emoji
                }}</span>
        </span>
        <span v-if="truncatedDice.showEllipsis" class="dice-ellipsis" :style="{ fontSize: `${diceSize}px` }"
            @click="emit('open-modal')">
            ...
        </span>

        <!-- Reroll button (on hover) -->
        <ActionButton v-if="canShowReroll && showDiceHover && !isRolling" variant="neutral" size="small" text="Reroll"
            class="reroll-hover-all" @click="emit('reroll-all')" />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

defineProps({
    truncatedDice: {
        type: Object,
        required: true,
    },
    diceSize: {
        type: Number,
        required: true,
    },
    isRolling: {
        type: Boolean,
        default: false,
    },
    isCustomRoll: {
        type: Boolean,
        default: false,
    },
    canShowReroll: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['reroll-all', 'open-modal'])

const showDiceHover = ref(false)
</script>

<style scoped>
.completed-dice-state {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
    justify-content: center;
    position: relative;
}

.dice-symbol {
    flex-shrink: 1;
    position: relative;
    opacity: 1;
    text-decoration: none;
}

/* Define transition for all dice */
.dice-symbol:not(.dice-rolling) {
    transition:
        color var(--duration-slow) ease-in,
        text-shadow var(--duration-slow) ease-in,
        opacity var(--duration-slow) ease-in;
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
    animation: fadeInGlow var(--duration-slow) ease-in forwards;
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
    animation: fadeInStrikethrough var(--duration-slow) ease-in forwards;
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
    animation: fadeInLine var(--duration-slow) ease-in forwards;
    animation-delay: 0.3s;
}

.dice-emoji {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: var(--font-size-16);
    transform: translate(5px, 5px);
    opacity: 0;
    animation: fadeIn var(--duration-medium) ease-in forwards;
    animation-delay: 0.4s;
}

.dice-ellipsis {
    color: var(--color-text-primary);
    cursor: pointer;
    font-weight: var(--font-weight-bold);
    user-select: none;
    transition: color var(--duration-fast) ease;
}

.dice-ellipsis:hover {
    color: var(--color-accent-gold);
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
    animation: rollDice var(--duration-dice-roll) ease-out;
    perspective: 1000px;
    transform-style: preserve-3d;
    display: inline-block;
}

/* Reroll button positioning */
.reroll-hover-all {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: var(--z-interactive);
}
</style>
