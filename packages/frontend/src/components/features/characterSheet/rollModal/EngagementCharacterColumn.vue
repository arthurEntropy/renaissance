<template>
    <BaseCharacterColumn :character="character" :is-opponent="isOpponent" :show-results="showResults"
        :is-winner="isWinner" :is-loser="isLoser">

        <template #additional-character-info>
            <div class="art-spacer"></div>
        </template>

        <template #content>
            <!-- Engagement Dice -->
            <div class="dice-display">
                <div v-if="dice.length === 0" class="no-dice-message">
                    No dice selected
                </div>
                <EngagementDiceRow v-for="(die, index) in dice" :key="index" :die="die" :index="index" :side="side"
                    :is-opponent="isOpponent" :show-results="showResults" :can-edit="canEdit" />
            </div>

            <!-- Engagement Successes -->
            <div class="engagement-successes-section" :class="{ 'opponent-successes-hidden': isOpponent }">
                <div class="engagement-successes-list">
                    <div v-if="successes.length > 0" class="success-pills">
                        <ChipTag v-for="success in successes" :key="success.id" :text="success.name"
                            :rounded="CHIP_TAG_ROUNDED.FULL"
                            :tooltip="{ description: success.description, sources: success.sources }"
                            class="draggable-success" :draggable="canEdit"
                            @dragstart="onSuccessDragStart($event, success)" />
                    </div>
                </div>
            </div>
        </template>
    </BaseCharacterColumn>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { WINNER } from '@shared/constants/winner.js'
import { PlayerSides } from '@/constants/playerSides'
import { useEngagementSuccesses } from '@/composables/useEngagementSuccesses'
import { useEngagementSession } from '@/composables/useEngagementSession'
import { useEngagementRoll } from '@/composables/useEngagementRoll'
import { useCharactersStore } from '@/stores/charactersStore'
import ChipTag from '@/components/ui/chips/ChipTag.vue'
import { CHIP_TAG_ROUNDED } from '@/constants/chipTag'
import BaseCharacterColumn from './BaseCharacterColumn.vue'
import EngagementDiceRow from './EngagementDiceRow.vue'

const props = defineProps({
    isOpponent: {
        type: Boolean,
        required: true
    },
})

const sessionManager = useEngagementSession()
const diceManager = useEngagementRoll()
const engagementSuccesses = useEngagementSuccesses()
const charactersStore = useCharactersStore()

// Only fetch engagement successes for the user side (not opponent)
onMounted(async () => {
    if (!props.isOpponent) {
        await engagementSuccesses.fetchEngagementSuccesses()
    }
})

// Determine side and character based on isOpponent
const side = computed(() => props.isOpponent ? PlayerSides.OPPONENT : PlayerSides.USER)
const character = computed(() => {
    if (props.isOpponent) {
        return sessionManager.opponent.value?.characterInfo || null
    }
    // When spectating, the modal is shown from the perspective of the spectated character
    return sessionManager.overrideCharacter?.value ?? charactersStore.selectedCharacter
})

// Get dice for this side
const dice = computed(() => {
    const rollResults = sessionManager.rollResults.value

    if (props.isOpponent) {
        const opponentChar = character.value
        if (!opponentChar) return []

        return diceManager.getSortedOpponentDice(
            sessionManager.opponent.value,
            sessionManager.sessionData?.value,
            rollResults,
            opponentChar.id
        )
    }
    // For user, use getSortedDice with USER side
    return diceManager.getSortedDice(
        diceManager.committedDice.value,
        rollResults,
        character.value.id
    )
})

// Get successes for this side
const successes = computed(() => {
    if (props.isOpponent) {
        return []
    }
    return engagementSuccesses.allOwnedEngagementSuccesses.value
})

// Session state
const showResults = computed(() => sessionManager.showResults.value)
const canEdit = computed(() => sessionManager.canEditResults.value && !props.isOpponent)

// Winner is always computed from user's perspective (selectedCharacter)
// This determines UI styling for both user and opponent columns
const winner = computed(() => diceManager.getEngagementWinner(sessionManager, charactersStore.selectedCharacter, diceManager.committedDice.value))

// Winner/loser state for BaseCharacterColumn
const isWinner = computed(() => {
    if (!showResults.value || !winner.value) {
        return false
    }
    return (winner.value === WINNER.USER && !props.isOpponent) ||
        (winner.value === WINNER.OPPONENT && props.isOpponent)
})

const isLoser = computed(() => {
    if (!showResults.value || !winner.value) {
        return false
    }
    return winner.value !== WINNER.TIE && !isWinner.value
})

const onSuccessDragStart = (event, success) => {
    if (!canEdit.value) {
        event.preventDefault()
        return
    }
    event.dataTransfer.setData('application/json', JSON.stringify(success))
    event.dataTransfer.effectAllowed = 'copy'
}
</script>

<style scoped>
.art-spacer {
    height: calc(105px + 2 * var(--space-md));
}

.dice-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
}

.no-dice-message {
    text-align: center;
    color: var(--color-text-muted);
    margin-top: var(--space-sm);
    font-style: italic;
}

.engagement-successes-section {
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
