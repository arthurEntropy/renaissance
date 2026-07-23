<template>
    <BaseModal title="Engagement" width="min(525px, 90vw)" @close="closeModal">

        <!-- Main engagement display -->
        <ResultIndicators v-if="shouldShowComparisons" :can-edit="canEditResults" />
        <main class="engagement-columns">
            <EngagementCharacterColumn :is-opponent="false" />
            <EngagementCharacterColumn :is-opponent="true" />
        </main>

        <template #actions>
            <div class="modal-actions">
                <ActionButton v-if="!opponent" variant="neutral" size="large" text="Cancel" @click="closeModal" />
                <div v-if="opponent" :style="{ visibility: shouldShowResolution ? 'visible' : 'hidden' }">
                    <RollResolution :user-accepted="userAccepted" :opponent-accepted="opponentAccepted"
                        :can-accept="showResults && !isAutoClosing" :character-name="character.name"
                        :opponent-name="opponentName" @toggle-user-accept="toggleUserAccept" />
                </div>
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

const emit = defineEmits(['close'])

const charactersStore = useCharactersStore()
const character = computed(() => charactersStore.selectedCharacter)

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
    sessionManager.initialize(character.value, diceManager.committedDice.value)
})

onBeforeUnmount(() => {
    clearTimeout(autoCloseTimer)
    sessionManager.cleanup()
})

// Auto-close after both sides have accepted (or one left and the other accepted)
watch(bothUsersAccepted, (bothAccepted) => {
    if (bothAccepted && !isAutoClosing.value) {
        sessionManager.generateResultsOnAccept(character.value, opponent.value)
        isAutoClosing.value = true
        autoCloseTimer = setTimeout(() => {
            emit('close')
        }, 2000)
    }
})

const closeModal = () => {
    if (showResults.value && !userAccepted.value) {
        // Treat closing after the roll as accepting the result
        sessionManager.updateUserAcceptance(character.value.id, true)
    }
    if (!bothUsersAccepted.value) {
        sessionManager.cancelSession()
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
