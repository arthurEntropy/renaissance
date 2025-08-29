<template>
    <div class="modal-overlay" @click="closeModal">
        <div class="modal-content opposed-skill-check-modal" @click.stop>
            <!-- Header -->
            <header class="header-row">
                <h2 id="opposed-skill-check-title">Opposed Skill Check</h2>
            </header>

            <!-- Opponent columns -->
            <main class="opposed-columns">
                <!-- User's column -->
                <CharacterColumn v-bind="userColumnProps" />

                <!-- Opponent's column -->
                <CharacterColumn v-bind="opponentColumnProps" />
            </main>

            <!-- Modal actions -->
            <footer class="modal-actions">
                <ActionButton variant="neutral" size="large" text="Cancel" @click="closeModal"
                    v-if="sessionManager.canCancelSession.value" />
                <ActionButton variant="primary" size="large" text="Accept Results" @click="acceptResults"
                    v-if="showResults && sessionManager.canEditResults.value" />
            </footer>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { SESSION_STATUS } from '@shared/constants/sessionStatus'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import CharacterColumn from './components/CharacterColumn.vue'

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

// Use the session manager passed as a prop instead of creating a new one
const sessionManager = props.sessionManager

// Computed properties for column data
const userColumnProps = computed(() => {
    console.log('OpposedSkillCheckModal - userColumnProps:', {
        character: props.character,
        skillCheckConfig: sessionManager.userSkillConfig.value,
        dice: sessionManager.userDice.value,
        rollResults: sessionManager.rollResults.value,
        sessionStatus: sessionManager.sessionStatus.value,
        opponent: sessionManager.opponent.value
    })

    return {
        character: props.character,
        skillCheckConfig: sessionManager.userSkillConfig.value,
        dice: sessionManager.userDice.value || [],
        rollResults: sessionManager.rollResults.value,
        side: 'user',
        isOpponent: false,
        canEdit: sessionManager.canEditResults.value,
        sessionStatus: sessionManager.sessionStatus.value
    }
})

const opponentColumnProps = computed(() => {
    console.log('OpposedSkillCheckModal - opponentColumnProps:', {
        opponent: sessionManager.opponent.value,
        opponentSkillConfig: sessionManager.opponent.value?.skillCheckConfig,
        opponentDice: sessionManager.opponentDice.value,
        rollResults: sessionManager.rollResults.value,
        sessionStatus: sessionManager.sessionStatus.value
    })

    return {
        character: sessionManager.opponent.value?.characterInfo || null,
        skillCheckConfig: sessionManager.opponent.value?.skillCheckConfig || null,
        dice: sessionManager.opponentDice.value || [],
        rollResults: sessionManager.rollResults.value,
        side: 'opponent',
        isOpponent: true,
        canEdit: false,
        sessionStatus: sessionManager.sessionStatus.value
    }
})

// Computed properties for results and state
const showResults = computed(() => {
    return sessionManager.rollResults.value &&
        sessionManager.rollResults.value.session &&
        sessionManager.sessionStatus.value === SESSION_STATUS.COMPLETED
})

// Method handlers
const closeModal = () => {
    // Check if we should show confirmation dialog
    if (sessionManager.shouldShowExitConfirmation.value) {
        if (!confirm('Are you sure you want to leave this opposed skill check?')) {
            return // User cancelled, don't close
        }
    }

    // Clean up and disconnect
    sessionManager.cancelSession()
    sessionManager.disconnect()
    emit('close')
}

const acceptResults = () => {
    if (showResults.value) {
        // Create the final result object
        const result = {
            type: 'OPPOSED_SKILL_CHECK',
            characterName: props.character.name,
            opponentName: sessionManager.opponent.value?.characterInfo?.name,
            skillName: sessionManager.userSkillConfig.value?.name,
            opponentSkillName: sessionManager.opponent.value?.skillCheckConfig?.name,
            userTotal: sessionManager.rollResults.value.session.users.find(u => u.characterInfo.id === props.character.id)?.rollTotal,
            opponentTotal: sessionManager.rollResults.value.session.users.find(u => u.characterInfo.id !== props.character.id)?.rollTotal,
            winner: sessionManager.winner.value,
            timestamp: Date.now(),
            session: sessionManager.rollResults.value.session
        }

        // Emit the result and close
        emit('skill-check-result', result)
        closeModal()
    }
}
</script>

<style scoped>
.opposed-skill-check-modal {
    width: 90vw;
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
    border-bottom: 1px solid var(--color-border-primary);
    background: var(--color-bg-secondary);
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
    gap: 1px;
    background: var(--color-border-primary);
}

.modal-actions {
    display: flex;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-lg);
    border-top: 1px solid var(--color-border-primary);
    background: var(--color-bg-secondary);
}
</style>
