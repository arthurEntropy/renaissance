<template>
    <div class="modal-overlay" @click="closeModal">
        <div class="modal-content opposed-skill-check-modal" @click.stop>

            <header class="header-row">
                <h2 id="opposed-skill-check-title">Opposed Skill Check</h2>
            </header>

            <main class="opposed-columns">
                <SkillCheckCharacterColumn ref="userColumnRef" v-bind="userColumnProps"
                    @reroll-all-dice="rerollAllDice" />
                <SkillCheckCharacterColumn ref="opponentColumnRef" v-bind="opponentColumnProps"
                    @reroll-all-dice="rerollAllDice" />
            </main>

            <footer class="modal-actions">
                <RollResolution v-if="showResults && sessionManager.winner?.value" mode="opposed-skill-check"
                    :winner="sessionManager.winner.value" :user-accepted="userAccepted"
                    :opponent-accepted="opponentAccepted" :can-accept="showResults" :character-name="character.name"
                    :opponent-name="sessionManager.opponent.value?.characterInfo?.name || 'Opponent'"
                    @toggle-user-accept="toggleUserAccept" />
            </footer>

        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { SESSION_STATUS } from '@shared/constants/sessionStatus'
import SkillCheckCharacterColumn from './SkillCheckCharacterColumn.vue'
import RollResolution from './RollResolution.vue'

const props = defineProps({
    character: {
        type: Object,
        required: true
    },
    sessionManager: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['close', 'skill-check-result'])

const sessionManager = props.sessionManager

// Component refs for triggering animations
const userColumnRef = ref(null)
const opponentColumnRef = ref(null)

// Extract reactive state
const userAccepted = sessionManager.userAccepted || { value: false }
const opponentAccepted = sessionManager.opponentAccepted || { value: false }

// Computed properties for column data
const userColumnProps = computed(() => ({
    character: props.character,
    skillCheckConfig: sessionManager.userSkillConfig?.value,
    rollResults: sessionManager.rollResults.value,
    side: 'user',
    isOpponent: false,
    canEdit: sessionManager.canEditResults?.value || false,
    sessionStatus: sessionManager.sessionStatus.value,
    winner: sessionManager.winner?.value || null,
    isRerolling: sessionManager.isRerolling?.value || false,
    rerollingCharacterId: sessionManager.rerollingCharacterId?.value || null
}))

const opponentColumnProps = computed(() => ({
    character: sessionManager.opponent.value?.characterInfo || null,
    skillCheckConfig: sessionManager.opponent.value?.skillCheckConfig || null,
    rollResults: sessionManager.rollResults.value,
    side: 'opponent',
    isOpponent: true,
    canEdit: false,
    sessionStatus: sessionManager.sessionStatus.value,
    winner: sessionManager.winner?.value || null,
    isRerolling: sessionManager.isRerolling?.value || false,
    rerollingCharacterId: sessionManager.rerollingCharacterId?.value || null
}))

const showResults = computed(() => {
    return sessionManager.rollResults.value &&
        sessionManager.rollResults.value.session &&
        sessionManager.sessionStatus.value === SESSION_STATUS.COMPLETED
})

const closeModal = () => {
    // Check if we should show confirmation dialog
    if (sessionManager.shouldShowExitConfirmation?.value) {
        if (!confirm('Are you sure you want to leave this opposed skill check?')) {
            return // User cancelled, don't close
        }
    }

    // Reset acceptance state to prevent persistence across sessions
    if (sessionManager.resetAcceptanceState) {
        sessionManager.resetAcceptanceState()
    }

    // Clean up and disconnect
    sessionManager.cancelSession()
    sessionManager.disconnect()
    emit('close')
}

const toggleUserAccept = () => {
    if (sessionManager.updateUserAcceptance) {
        const newAccepted = !sessionManager.userAccepted.value
        sessionManager.updateUserAcceptance(props.character.id, newAccepted)
    }
}

const rerollAllDice = (side) => {
    // Trigger a skill check reroll (preserves the other player's results)
    // The animation will be triggered automatically when rerollingCharacterId changes
    if (sessionManager.rerollAllDice) {
        sessionManager.rerollAllDice(side, null, null, null)
    }
}

// Register animation triggers with the session manager when component mounts
onMounted(() => {
    if (sessionManager.setAnimationTrigger) {
        sessionManager.setAnimationTrigger('user', () => {
            if (userColumnRef.value) {
                userColumnRef.value.triggerRollingAnimation()
            }
        })
        sessionManager.setAnimationTrigger('opponent', () => {
            if (opponentColumnRef.value) {
                opponentColumnRef.value.triggerRollingAnimation()
            }
        })
    }
})
</script>

<style scoped>
.opposed-skill-check-modal {
    width: 700px;
    max-width: 1200px;
    min-height: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-primary);
    border-radius: var(--radius-10);
    overflow: hidden;
}

.header-row {
    padding: var(--space-lg);
    text-align: center;
}

.header-row h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-24);
}

.opposed-columns {
    display: flex;
    flex: 1;
    min-height: 0;
    gap: var(--space-lg);
}

.modal-actions {
    display: flex;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-lg);
}
</style>
