<template>
    <BaseModal title="Engagement" width="min(450px, 90vw)" @close="closeModal">

        <!-- Main engagement display -->
        <ResultIndicators v-if="shouldShowComparisons" :can-edit="canEditResults" />
        <main class="engagement-columns">
            <EngagementCharacterColumn :is-opponent="false" />
            <EngagementCharacterColumn :is-opponent="true" />
        </main>

        <template #actions>
            <div class="modal-actions">
                <ActionButton v-if="!opponent" variant="neutral" size="large" text="Cancel" @click="closeModal" />
                <RollResolution v-if="shouldShowResolution" mode="engagement" :user-accepted="userAccepted"
                    :opponent-accepted="opponentAccepted" :can-accept="showResults" :character-name="character.name"
                    :opponent-name="opponentName" @toggle-user-accept="toggleUserAccept" />
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
import { computed, onMounted, onBeforeUnmount } from 'vue'

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
    shouldShowExitConfirmation,
    userAccepted,
    opponentAccepted,
    showResults,
    bothUsersAccepted
} = sessionManager

const opponentName = computed(() =>
    opponent.value?.characterInfo?.name || 'Opponent'
)

onMounted(() => {
    sessionManager.initialize(character.value, diceManager.committedDice.value)
})

onBeforeUnmount(() => {
    sessionManager.cleanup()
})

const closeModal = () => {
    if (shouldShowExitConfirmation.value) {
        if (!confirm('Are you sure you want to leave this engagement?')) {
            return
        }
    }
    sessionManager.cancelSession()
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
}

:deep(.base-modal-footer) {
    justify-content: center;
}
</style>
