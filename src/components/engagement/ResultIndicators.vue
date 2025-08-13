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
    z-index: 10;
    pointer-events: none;
    width: 100px;
    margin-top: 12px;
}

.comparison-indicator {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 80px;
    background-color: var(--color-black);
    border: 2px solid var(--color-gray-light);
    border-radius: 15px;
    padding: 3px 15px;
    box-shadow: 0 2px 8px var(--overlay-white-medium);
    height: 28px;
    left: -7px;
    margin-top: 7px;
}

.comparison-indicator.user-wins-pair,
.comparison-indicator.opponent-wins-pair {
    border: 2px solid var(--color-success);
    box-shadow: 0 0 10px var(--color-success);
}

.comparison-indicator.user-loses-pair,
.comparison-indicator.opponent-loses-pair {
    border: 2px solid var(--color-danger);
    box-shadow: 0 0 10px var(--color-danger);
}

.comparison-indicator.tie-pair {
    border: 2px solid var(--color-warning);
    box-shadow: 0 0 10px var(--color-warning);
}

.indicator-circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid var(--color-white);
}

.indicator-circle.winner {
    background-color: var(--color-white);
    box-shadow: 0 0 12px var(--color-white);
    animation: pulse-win 1.5s infinite;
}

.indicator-circle.loser {
    background-color: transparent;
    box-shadow: none;
}

.indicator-caret {
    padding: 0px 5px;
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: bold;
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
    text-shadow: 0 0 5px var(--color-text-primary);
}

.indicator-caret.tie {
    color: var(--color-warning);
    text-shadow: 0 0 5px var(--color-warning);
}

.indicator-caret.left-wins {
    color: var(--color-text-primary);
}

.indicator-caret.right-wins {
    color: var(--color-text-primary);
}

@keyframes pulse-win {
    0% {
        box-shadow: 0 0 5px var(--color-success);
    }

    50% {
        box-shadow: 0 0 15px var(--color-success);
    }

    100% {
        box-shadow: 0 0 5px var(--color-success);
    }
}
</style>
