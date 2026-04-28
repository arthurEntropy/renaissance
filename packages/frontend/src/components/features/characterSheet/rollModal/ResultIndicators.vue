<template>
    <div class="result-indicators-container">
        <div v-for="(dicePair, index) in dicePairs" :key="index" class="result-indicator"
            :class="getComparisonClasses(dicePair)" :style="{ top: getIndicatorPosition(dicePair) }">
            <div class="indicator-circle"
                :class="{ 'winner': dicePair.leftWins, 'loser': !dicePair.leftWins && !dicePair.tie }">
            </div>
            <div class="indicator-caret" @click.stop="toggleResult(index)" :class="getCaretClasses(dicePair)">
                <!-- Tie: filled circle -->
                <svg v-if="dicePair.tie" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                    class="caret-icon">
                    <circle cx="12" cy="12" r="6" />
                </svg>
                <!-- Left wins -->
                <ChevronLeftIcon v-else-if="dicePair.leftWins" class="caret-icon" />
                <!-- Right wins -->
                <ChevronRightIcon v-else class="caret-icon" />
            </div>
            <div class="indicator-circle"
                :class="{ 'winner': dicePair.rightWins, 'loser': !dicePair.rightWins && !dicePair.tie }">
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'
import { WINNER } from '@shared/constants/winner.js'
import { useEngagementSession } from '@/composables/useEngagementSession'
import { useEngagementRoll } from '@/composables/useEngagementRoll'
import { useCharactersStore } from '@/stores/charactersStore'

// TODO: Make these calculated based on height of character info section of column
const INDICATOR_BASE_OFFSET = 225 // Base top position in pixels
const INDICATOR_SPACING = 48 // Vertical spacing between indicators in pixels

const props = defineProps({
    canEdit: {
        type: Boolean,
        default: false
    }
})

const charactersStore = useCharactersStore()
const sessionManager = useEngagementSession()
const diceManager = useEngagementRoll()

const character = computed(() => charactersStore.selectedCharacter)

// Compute dice pairs and winner internally
const dicePairs = computed(() => diceManager.getDicePairs(sessionManager, character.value, diceManager.committedDice.value))
const winner = computed(() => diceManager.getEngagementWinner(sessionManager, character.value, diceManager.committedDice.value))

const toggleResult = diceManager.createToggleResultHandler(
    sessionManager,
    character.value,
    diceManager.committedDice.value
)

function getIndicatorPosition(dicePair) {
    return `${INDICATOR_BASE_OFFSET + (dicePair.index * INDICATOR_SPACING)}px`
}

function getComparisonClasses(comparison) {
    const classes = []

    if (comparison.leftWins && winner.value === WINNER.USER) {
        classes.push('user-wins-pair')
    } else if (comparison.rightWins && winner.value === WINNER.OPPONENT) {
        classes.push('opponent-wins-pair')
    } else if (comparison.leftWins && winner.value === WINNER.OPPONENT) {
        classes.push('user-loses-pair')
    } else if (comparison.rightWins && winner.value === WINNER.USER) {
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
    box-shadow: var(--shadow-sm);
    height: 28px;
    left: -7px;
}

.result-indicator.user-wins-pair,
.result-indicator.opponent-wins-pair {
    border: 2px solid var(--color-success);
    box-shadow: var(--glow-success-lg);
}

.result-indicator.user-loses-pair,
.result-indicator.opponent-loses-pair {
    border: 2px solid var(--color-danger);
    box-shadow: var(--glow-danger-sm);
}

.result-indicator.tie-pair {
    border: 2px solid var(--color-warning);
    box-shadow: var(--glow-warning-sm);
}

.indicator-circle {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-white);
}

.indicator-circle.winner {
    background-color: var(--color-white);
    box-shadow: var(--glow-lg);
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

.caret-icon {
    width: 16px;
    height: 16px;
}

.indicator-caret.clickable {
    cursor: pointer;
    pointer-events: auto;
}

.indicator-caret.clickable:hover {
    transform: scale(1.2);
    text-shadow: var(--glow-sm);
}

.indicator-caret.tie {
    color: var(--color-warning);
    text-shadow: var(--glow-warning-sm);
}

.indicator-caret.left-wins,
.indicator-caret.right-wins {
    color: var(--color-text-primary);
}

@keyframes pulse-win {
    0% {
        box-shadow: var(--glow-success-sm);
    }

    50% {
        box-shadow: var(--glow-success-lg);
    }

    100% {
        box-shadow: var(--glow-success-sm);
    }
}
</style>
