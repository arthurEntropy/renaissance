<template>
    <BaseModal title="Engagement" width="min(525px, 90vw)" @close="closeModal">

        <!-- Spectator banner -->
        <div v-if="isSpectatorMode" class="spectator-banner">
            Spectating
        </div>

        <!-- Main engagement display -->
        <ResultIndicators v-if="shouldShowComparisons" :can-edit="canEditResults" />
        <main class="engagement-columns">
            <EngagementCharacterColumn :is-opponent="false" />
            <EngagementCharacterColumn :is-opponent="true" />
        </main>

        <template #actions>
            <div class="modal-actions">
                <!-- Spectators only get a close button -->
                <ActionButton v-if="isSpectatorMode" variant="neutral" size="large" text="Close" @click="closeModal" />
                <template v-else>
                    <ActionButton v-if="!opponent" variant="neutral" size="large" text="Cancel" @click="closeModal" />
                    <div v-if="opponent" :style="{ visibility: shouldShowResolution ? 'visible' : 'hidden' }">
                        <RollResolution :user-accepted="userAccepted" :opponent-accepted="opponentAccepted"
                            :can-accept="showResults && !isAutoClosing" :character-name="character.name"
                            :opponent-name="opponentName" @toggle-user-accept="toggleUserAccept" />
                    </div>
                </template>
            </div>
        </template>
    </BaseModal>
</template>

<script setup>
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import EngagementCharacterColumn from './EngagementCharacterColumn.vue'
import ResultIndicators from './ResultIndicators.vue'
import RollResolution from './RollResolution.vue'
import { computed, onMounted, onBeforeUnmount, watch, ref } from 'vue'

import { useEngagementSession } from '@/composables/useEngagementSession'
import { useEngagementRoll } from '@/composables/useEngagementRoll'
import { useCharactersStore } from '@/stores/charactersStore'

const props = defineProps({
    /**
     * When provided, the modal opens in spectator (read-only) mode, showing
     * the engagement from this character's perspective.
     * The `sessionId` must be supplied alongside this prop.
     */
    spectatorCharacter: { type: Object, default: null },
    /** ID of the engagement session to spectate. Required when spectatorCharacter is set. */
    spectatorSessionId: { type: String, default: null },
})

const emit = defineEmits(['close'])

const isSpectatorMode = computed(() => !!props.spectatorCharacter)

const charactersStore = useCharactersStore()
const character = computed(() =>
    isSpectatorMode.value ? props.spectatorCharacter : charactersStore.selectedCharacter
)

const sessionManager = useEngagementSession()
const diceManager = useEngagementRoll()

const {
    opponent,
    shouldShowComparisons,
    shouldShowResolution,
    canEditResults,
    userAccepted,
    opponentAccepted,
    showResults,
    bothUsersAccepted
} = sessionManager

const opponentName = computed(() =>
    opponent.value?.characterInfo?.name || 'Opponent'
)

// Track whether we are in the 2-second auto-close window after both accept
const isAutoClosing = ref(false)
let autoCloseTimer = null

onMounted(() => {
    if (isSpectatorMode.value) {
        sessionManager.spectate(props.spectatorCharacter, props.spectatorSessionId)
    } else {
        sessionManager.initialize(character.value, diceManager.committedDice.value)
    }
})

onBeforeUnmount(() => {
    clearTimeout(autoCloseTimer)
    sessionManager.cleanup()
})

// Auto-close after both sides have accepted (participant mode only)
watch(bothUsersAccepted, (bothAccepted) => {
    if (!isSpectatorMode.value && bothAccepted && !isAutoClosing.value) {
        sessionManager.generateResultsOnAccept(character.value, opponent.value)
        isAutoClosing.value = true
        autoCloseTimer = setTimeout(() => {
            emit('close')
        }, 2000)
    }
})

const closeModal = () => {
    if (!isSpectatorMode.value) {
        if (showResults.value && !userAccepted.value) {
            // Treat closing after the roll as accepting the result
            sessionManager.updateUserAcceptance(character.value.id, true)
        }
        if (!bothUsersAccepted.value) {
            sessionManager.cancelSession()
        }
    }
    emit('close')
}

const toggleUserAccept = () => {
    sessionManager.updateUserAcceptance(character.value.id, !userAccepted.value)

    if (bothUsersAccepted.value) {
        // Results are automatically saved to rollsStore by sessionManager
        sessionManager.generateResultsOnAccept(character.value, opponent.value)
    }
}

</script>

<style scoped>
.spectator-banner {
    text-align: center;
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: var(--space-sm);
    padding: var(--space-xs) var(--space-md);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
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
    width: 100%;
}

:deep(.base-modal-footer) {
    justify-content: center;
}
</style>
