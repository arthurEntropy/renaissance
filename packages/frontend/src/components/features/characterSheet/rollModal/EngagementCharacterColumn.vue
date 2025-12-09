<template>
    <BaseCharacterColumn :character="character" :is-opponent="isOpponent" :show-results="showResults"
        :is-winner="isWinner" :is-loser="isLoser">

        <template #content>

            <div class="dice-display">
                <div v-if="dice.length === 0" class="no-dice-message">
                    No dice selected
                </div>
                <EngagementDiceRow v-for="(die, index) in dice" :key="index" :die="die" :index="index" :side="side"
                    :is-opponent="isOpponent" :show-results="showResults" :can-edit="canEdit"
                    :assigned-successes="assignedSuccesses" :all-engagement-successes="allEngagementSuccesses"
                    :rerolling-dice="rerollingDice" @reroll="(side, index) => emit('reroll', side, index)"
                    @success-drop="(side, index, successData) => emit('success-drop', side, index, successData)"
                    @remove-success-assignment="(side, index) => emit('remove-success-assignment', side, index)" />
            </div>

            <div class="engagement-successes-section" :class="{ 'opponent-successes-hidden': isOpponent }">
                <div class="engagement-successes-list">
                    <div v-if="successes.length > 0" class="success-pills">
                        <SuccessChip v-for="success in successes" :key="success.id" :success="success"
                            class="draggable-success" :draggable="canEdit && !isOpponent"
                            @dragstart="!isOpponent ? onSuccessDragStart($event, success) : null" />
                    </div>
                </div>
            </div>

        </template>
    </BaseCharacterColumn>
</template>

<script setup>
import { computed } from 'vue'
import { WINNER } from '@shared/constants/winner.js'
import SuccessChip from '@/components/ui/chips/SuccessChip.vue'
import BaseCharacterColumn from './BaseCharacterColumn.vue'
import EngagementDiceRow from './EngagementDiceRow.vue'

const props = defineProps({
    character: {
        type: Object,
        default: null
    },
    dice: {
        type: Array,
        default: () => []
    },
    successes: {
        type: Array,
        default: () => []
    },
    assignedSuccesses: {
        type: Object,
        default: () => ({})
    },
    showResults: {
        type: Boolean,
        default: false
    },
    rerollingDice: {
        type: Set,
        default: () => new Set()
    },
    allEngagementSuccesses: {
        type: Array,
        default: () => []
    },
    winner: {
        type: String,
        default: null
    },
    side: {
        type: String,
        required: true
    },
    isOpponent: {
        type: Boolean,
        default: false
    },
    canEdit: {
        type: Boolean,
        default: true
    },
})

const emit = defineEmits([
    'reroll',
    'success-drop',
    'remove-success-assignment'
])

// Winner/loser state for BaseCharacterColumn
const isWinner = computed(() => {
    if (!props.showResults || !props.winner) {
        return false
    }
    return (props.winner === WINNER.USER && !props.isOpponent) ||
        (props.winner === WINNER.OPPONENT && props.isOpponent)
})

const isLoser = computed(() => {
    if (!props.showResults || !props.winner) {
        return false
    }
    return props.winner !== WINNER.TIE && !isWinner.value
})

const onSuccessDragStart = (event, success) => {
    if (!props.canEdit) {
        event.preventDefault()
        return
    }
    event.dataTransfer.setData('application/json', JSON.stringify(success))
    event.dataTransfer.effectAllowed = 'copy'
}
</script>

<style scoped>
.dice-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
}

.no-dice-message,
.no-successes-message {
    text-align: center;
    color: var(--color-text-muted);
    margin-top: 10px;
    font-style: italic;
}

.engagement-successes-section {
    margin-top: var(--space-lg);
    padding-top: var(--space-md);
    margin-top: auto;
}

.engagement-successes-section.opponent-successes-hidden {
    visibility: hidden;
}

.engagement-successes-list {
    margin-top: var(--space-sm);
}

.success-pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-xs);
}

.draggable-success {
    cursor: grab;
    transition: transform var(--transition-normal);
}

.draggable-success:hover {
    transform: scale(1.05);
}

.draggable-success:active {
    cursor: grabbing;
    transform: scale(0.95);
}

.draggable-success[draggable="false"] {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none !important;
}
</style>
