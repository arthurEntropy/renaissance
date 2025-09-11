<template>
    <div class="modal-overlay" @click="closeModal">
        <div class="modal-content engagement-roll-modal" @click.stop>

            <header class="header-row">
                <h2>Engagement</h2>
            </header>

            <ResultIndicators v-if="sessionManager.shouldShowComparisons" :dicePairs="dicePairs"
                :winner="engagementWinner" :can-edit="sessionManager.canEditResults.value"
                @toggle-result="toggleResult" />

            <main class="engagement-columns">
                <EngagementCharacterColumn v-bind="userColumnProps" @reroll="rerollDie"
                    @success-drop="handleSuccessDrop" @remove-success-assignment="removeSuccessAssignment" />
                <EngagementCharacterColumn v-bind="opponentColumnProps" />
            </main>

            <footer class="modal-actions">
                <!-- Cancel button while waiting -->
                <ActionButton v-if="!sessionManager.opponent" variant="neutral" size="small" text="Cancel"
                    @click="closeModal" />

                <RollResolution v-if="sessionManager.shouldShowResolution" mode="engagement" :winner="engagementWinner"
                    :user-accepted="sessionManager.userAccepted.value"
                    :opponent-accepted="sessionManager.opponentAccepted.value"
                    :can-accept="sessionManager.showResults.value" :character-name="character.name"
                    :opponent-name="sessionManager.opponent.value?.characterInfo?.name || 'Opponent'"
                    @toggle-user-accept="toggleUserAccept" />
            </footer>

        </div>
    </div>
</template>

<script setup>
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import EngagementCharacterColumn from './EngagementCharacterColumn.vue'
import ResultIndicators from './ResultIndicators.vue'
import RollResolution from './RollResolution.vue'
import { computed, onMounted, onBeforeUnmount, toRef } from 'vue'
import { SESSION_STATUS } from '@shared/constants/sessionStatus.js'
import { useEngagementSession } from '@/composables/useEngagementSession'
import { useSuccessAssignment } from '@/composables/useSuccessAssignment'
import { useEngagementDice } from '@/composables/useEngagementDice'
import { useEngagementSuccesses } from '@/composables/useEngagementSuccesses'

const props = defineProps({
    character: {
        type: Object,
        required: true,
    },
    selectedDice: {
        type: Array,
        required: true,
    },
    allEngagementSuccesses: {
        type: Array,
        default: () => []
    },
    allEquipment: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['close', 'engagement-committed', 'engagement-results'])

const sessionManager = useEngagementSession()
const successManager = useSuccessAssignment()
const diceManager = useEngagementDice()
const engagementSuccesses = useEngagementSuccesses(toRef(props, 'character'), toRef(props, 'allEquipment'))

onMounted(async () => {
    await engagementSuccesses.fetchEngagementSuccesses()
})

const characterSuccesses = computed(() => {
    return engagementSuccesses.allOwnedEngagementSuccesses.value
})

const dicePairs = computed(() => {
    return diceManager.getDicePairs(sessionManager, props.character, toRef(props, 'selectedDice'))
})

const engagementWinner = computed(() => {
    return diceManager.getEngagementWinner(sessionManager, props.character, toRef(props, 'selectedDice'))
})

const winCounts = computed(() => {
    return diceManager.getWinCounts(sessionManager, props.character, toRef(props, 'selectedDice'))
})

const userWinCount = computed(() => winCounts.value.userWins)
const opponentWinCount = computed(() => winCounts.value.opponentWins)
const drawCount = computed(() => winCounts.value.draws)

const columnProps = computed(() => {
    return diceManager.generateColumnProps(
        sessionManager,
        successManager,
        props.character,
        toRef(props, 'selectedDice'),
        characterSuccesses.value,
        props.allEngagementSuccesses
    )
})

const userColumnProps = computed(() => columnProps.value.userColumnProps)
const opponentColumnProps = computed(() => columnProps.value.opponentColumnProps)

const closeModal = () => {
    // Check if we should show confirmation dialog
    if (sessionManager.shouldShowExitConfirmation.value) {
        if (!confirm('Are you sure you want to leave this engagement?')) {
            return // User cancelled, don't close
        }
    }

    // Clean up and disconnect
    sessionManager.cancelSession()
    sessionManager.disconnect()

    emit('close')
}

const toggleResult = diceManager.createToggleResultHandler(sessionManager, props.character, toRef(props, 'selectedDice'))
const rerollDie = diceManager.createRerollDieHandler(sessionManager, props.character, toRef(props, 'selectedDice'), successManager)

const handleSuccessDrop = (player, diceIndex, successData) => {
    successManager.handleSuccessDrop(player, diceIndex, successData, props.character.id)
}

const removeSuccessAssignment = (player, diceIndex) => {
    successManager.clearSuccessAssignment(player, diceIndex, props.character.id)
}

const toggleUserAccept = () => {
    const newAccepted = !sessionManager.userAccepted.value
    sessionManager.updateUserAcceptance(props.character.id, newAccepted)

    if (sessionManager.bothUsersAccepted.value) {
        emitEngagementResults()
    }
}

const emitEngagementResults = () => {
    const engagementResult = sessionManager.generateEngagementResults(
        engagementWinner.value,
        userWinCount.value,
        opponentWinCount.value,
        drawCount.value,
        props.character,
        sessionManager.opponent.value
    )

    if (engagementResult) {
        emit('engagement-results', engagementResult)
    }
}

const handleDiceComparisonIndicatorUpdated = ({ index, state }) => {
    diceManager.handleRemoteResultUpdate(index, state)
}

const handleDieRerolled = ({ player, diceIndex, newValue, characterId }) => {
    if (characterId === props.character.id) return // Don't process our own rerolls

    const sortedOpponentDice = diceManager.getSortedOpponentDice(
        sessionManager.opponent.value,
        sessionManager.sessionData?.value,
        sessionManager.rollResults.value,
        props.character.id
    )

    diceManager.handleRemoteDieReroll(
        player,
        diceIndex,
        newValue,
        characterId,
        props.character.id,
        sortedOpponentDice,
        sessionManager.rollResults.value,
        sessionManager.opponent.value,
        diceManager.DICE_ROLL_DURATION,
        { startRerolling: diceManager.startRerolling, stopRerolling: diceManager.stopRerolling }
    )
}

const handleSuccessAssignmentUpdated = ({ characterId, player, diceIndex, successId }) => {
    successManager.handleRemoteSuccessAssignment(
        characterId,
        player,
        diceIndex,
        successId,
        props.character.id,
        sessionManager.opponent.value
    )
}

const handleRollResults = ({ session }) => {
    sessionManager.rollResults.value = { session }
    sessionManager.sessionStatus.value = SESSION_STATUS.COMPLETED // Set status to completed

    // Emit event to notify parent that engagement is now committed
    emit('engagement-committed')

    // Reset dice and success state for new results
    diceManager.resetSortingState()
    successManager.resetAssignments()
}

onMounted(() => {
    sessionManager.initializeSession(
        props.character,
        props.selectedDice,
        characterSuccesses.value.map(s => s.id),
        handleDiceComparisonIndicatorUpdated,
        handleDieRerolled,
        handleSuccessAssignmentUpdated,
        handleRollResults
    )
})

onBeforeUnmount(() => {
    sessionManager.disconnect()
})
</script>

<style scoped>
.engagement-roll-modal {
    width: 400px;
    max-width: 90vw;
    max-height: 85vh;
    overflow-y: auto;
    position: relative;
    background-color: var(--color-bg-primary);
}

.header-row {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: var(--space-lg);
    position: relative;
}

.header-row h2 {
    text-align: center;
    margin: 0;
    color: var(--color-text-primary);
}

.engagement-columns {
    display: flex;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    min-height: 350px;
    align-items: stretch;
}

.modal-actions {
    display: flex;
    justify-content: center;
    gap: var(--space-lg);
    margin-top: var(--space-lg);
}
</style>
