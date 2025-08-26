<template>
    <div class="floating-comparisons">
        <div v-for="(comparison, index) in comparisons" :key="index" class="comparison-indicator"
            :class="getComparisonClasses(comparison)" :style="{ top: `${190 + (comparison.index * 48)}px` }">
            <div class="indicator-circle"
                :class="{ 'winner': comparison.leftWins, 'loser': !comparison.leftWins && !comparison.tie }">
            </div>
            <div class="indicator-caret" @click.stop="canEdit ? $emit('toggle-result', index) : null"
                :class="getCaretClasses(comparison)">
                <span v-if="comparison.tie">◉</span>
                <span v-else-if="comparison.leftWins">◀</span>
                <span v-else>▶</span>
            </div>
            <div class="indicator-circle"
                :class="{ 'winner': comparison.rightWins, 'loser': !comparison.rightWins && !comparison.tie }">
            </div>
        </div>
    </div>
</template>

<script setup>
import EngagementWinnerTypes from '@/constants/engagementWinnerTypes'

const props = defineProps({
    comparisons: { type: Array, default: () => [] },
    canEdit: { type: Boolean, default: false },
    engagementWinner: { type: String, default: null },
})

defineEmits(['toggle-result'])

function getComparisonClasses(comparison) {
    const classes = []

    if (comparison.leftWins && props.engagementWinner === EngagementWinnerTypes.USER) {
        classes.push('user-wins-pair')
    } else if (comparison.rightWins && props.engagementWinner === EngagementWinnerTypes.OPPONENT) {
        classes.push('opponent-wins-pair')
    } else if (comparison.leftWins && props.engagementWinner === EngagementWinnerTypes.OPPONENT) {
        classes.push('user-loses-pair')
    } else if (comparison.rightWins && props.engagementWinner === EngagementWinnerTypes.USER) {
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
.floating-comparisons {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-interactive);
    pointer-events: none;
    width: 100px;
    margin-top: var(--space-md);
}

.comparison-indicator {
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
    margin-top: -3px;
}

.comparison-indicator.user-wins-pair,
.comparison-indicator.opponent-wins-pair {
    border: 2px solid var(--color-success);
    box-shadow: var(--shadow-glow-success-lg);
}

.comparison-indicator.user-loses-pair,
.comparison-indicator.opponent-loses-pair {
    border: 2px solid var(--color-danger);
    box-shadow: var(--shadow-glow-danger-sm);
}

.comparison-indicator.tie-pair {
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
    animation: pulse-win 1.5s infinite;
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
    text-shadow: var(--shadow-glow-sm-warning);
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
