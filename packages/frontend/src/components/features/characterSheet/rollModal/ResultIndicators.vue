<template>
    <div class="result-indicators-container">
        <div v-for="(dicePair, index) in dicePairs" :key="index" class="result-indicator"
            :class="getComparisonClasses(dicePair)" :style="{ top: getIndicatorPosition(dicePair) }">
            <div class="indicator-circle"
                :class="{ 'winner': dicePair.leftWins, 'loser': !dicePair.leftWins && !dicePair.tie }">
            </div>
            <div class="indicator-caret" @click.stop="canEdit ? $emit('toggle-result', index) : null"
                :class="getCaretClasses(dicePair)">
                <span v-if="dicePair.tie">◉</span>
                <span v-else-if="dicePair.leftWins">◀</span>
                <span v-else>▶</span>
            </div>
            <div class="indicator-circle"
                :class="{ 'winner': dicePair.rightWins, 'loser': !dicePair.rightWins && !dicePair.tie }">
            </div>
        </div>
    </div>
</template>

<script setup>
import EngagementWinnerTypes from '@/constants/engagementWinnerTypes'

// TODO: Make these calulated based on height of character info section of column
const INDICATOR_BASE_OFFSET = 225 // Base top position in pixels
const INDICATOR_SPACING = 48 // Vertical spacing between indicators in pixels

const props = defineProps({
    dicePairs: { type: Array, default: () => [] },
    canEdit: { type: Boolean, default: false },
    winner: { type: String, default: null },
})

defineEmits(['toggle-result'])

function getIndicatorPosition(dicePair) {
    return `${INDICATOR_BASE_OFFSET + (dicePair.index * INDICATOR_SPACING)}px`
}

function getComparisonClasses(comparison) {
    const classes = []

    if (comparison.leftWins && props.winner === EngagementWinnerTypes.USER) {
        classes.push('user-wins-pair')
    } else if (comparison.rightWins && props.winner === EngagementWinnerTypes.OPPONENT) {
        classes.push('opponent-wins-pair')
    } else if (comparison.leftWins && props.winner === EngagementWinnerTypes.OPPONENT) {
        classes.push('user-loses-pair')
    } else if (comparison.rightWins && props.winner === EngagementWinnerTypes.USER) {
        classes.push('opponent-loses-pair')
    } else if (comparison.tie) {
        classes.push('tie-pair')
    }

    return classes
}

function getCaretClasses(comparison) {
    const classes = []

    if (props.canEdit) {
        classes.push('clickable')
    }

    if (comparison.tie) {
        classes.push('tie')
    } else if (comparison.leftWins) {
        classes.push('left-wins')
    } else if (comparison.rightWins) {
        classes.push('right-wins')
    }

    return classes
}
</script>

<style scoped>
.result-indicators-container {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-interactive);
    pointer-events: none;
    width: 100px;
}

.result-indicator {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 80px;
    background-color: var(--color-black);
    border: 2px solid var(--color-gray-light);
    border-radius: var(--radius-15);
    padding: 3px 15px;
    box-shadow: var(--shadow-elevation-sm);
    height: 28px;
    left: -7px;
}

.result-indicator.user-wins-pair,
.result-indicator.opponent-wins-pair {
    border: 2px solid var(--color-success);
    box-shadow: var(--shadow-glow-success-lg);
}

.result-indicator.user-loses-pair,
.result-indicator.opponent-loses-pair {
    border: 2px solid var(--color-danger);
    box-shadow: var(--shadow-glow-danger-sm);
}

.result-indicator.tie-pair {
    border: 2px solid var(--color-warning);
    box-shadow: var(--shadow-glow-warning-sm);
}

.indicator-circle {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-white);
}

.indicator-circle.winner {
    background-color: var(--color-white);
    box-shadow: var(--shadow-glow-lg);
    animation: pulse-win var(--duration-dice-roll) infinite;
}

.indicator-circle.loser {
    background-color: transparent;
}

.indicator-caret {
    padding: 0 var(--space-xs);
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-bold);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-top: 2px;
}

.indicator-caret.clickable {
    cursor: pointer;
    pointer-events: auto;
}

.indicator-caret.clickable:hover {
    transform: scale(1.2);
    text-shadow: var(--shadow-glow-sm);
}

.indicator-caret.tie {
    color: var(--color-warning);
    text-shadow: var(--shadow-glow-warning-sm);
}

.indicator-caret.left-wins {
    color: var(--color-text-primary);
}

.indicator-caret.right-wins {
    color: var(--color-text-primary);
}

@keyframes pulse-win {
    0% {
        box-shadow: var(--shadow-glow-success-sm);
    }

    50% {
        box-shadow: var(--shadow-glow-success-lg);
    }

    100% {
        box-shadow: var(--shadow-glow-success-sm);
    }
}
</style>
