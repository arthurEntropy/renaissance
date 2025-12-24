<template>
    <div class="modal-overlay" @click="closeModal">
        <div class="modal-content engagement-roll-modal" @click.stop>

            <!-- Header -->
            <header class="header-row">
                <h2>Engagement</h2>
                <button class="close-button" @click="closeModal" aria-label="Close modal">
                    <XMarkIcon class="icon" />
                </button>
            </header>

            <!-- Main engagement display -->
            <ResultIndicators v-if="shouldShowComparisons" :can-edit="canEditResults" />
            <main class="engagement-columns">
                <EngagementCharacterColumn :is-opponent="false" />
                <EngagementCharacterColumn :is-opponent="true" />
            </main>

            <!-- Footer actions -->
            <footer class="modal-actions">
                <!-- Cancel button: shown while waiting for opponent to join -->
                <ActionButton v-if="!opponent" variant="neutral" size="small" text="Cancel" @click="closeModal" />

                <!-- Roll resolution: shown once opponent has joined -->
                <RollResolution v-if="shouldShowResolution" mode="engagement" :user-accepted="userAccepted"
                    :opponent-accepted="opponentAccepted" :can-accept="showResults" :character-name="character.name"
                    :opponent-name="opponentName" @toggle-user-accept="toggleUserAccept" />
            </footer>

        </div>
    </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
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
.engagement-roll-modal {
    width: 450px;
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

.close-button {
    position: absolute;
    right: 0;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    transition: var(--transition-normal);
}

.close-button:hover {
    color: var(--color-text-primary);
    transform: scale(1.1);
}

.close-button .icon {
    width: 24px;
    height: 24px;
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
