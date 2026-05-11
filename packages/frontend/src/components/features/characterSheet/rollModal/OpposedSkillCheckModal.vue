<template>
    <div class="modal-overlay" @click="closeModal">
        <div class="modal-content opposed-skill-check-modal" @click.stop>

            <header class="header-row">
                <h2 id="opposed-skill-check-title">Opposed Skill Check</h2>
                <button class="close-button" @click="closeModal" aria-label="Close modal">
                    <XMarkIcon class="icon" />
                </button>
            </header>

            <main class="opposed-columns">
                <SkillCheckCharacterColumn ref="userColumnRef" :is-opponent="false" />
                <SkillCheckCharacterColumn ref="opponentColumnRef" :is-opponent="true" />
            </main>

            <footer class="modal-actions">
                <RollResolution v-if="showResults" mode="opposed-skill-check" :user-accepted="userAccepted"
                    :opponent-accepted="opponentAccepted" :can-accept="showResults && !bothUsersAccepted"
                    :character-name="characterName" :opponent-name="opponentName"
                    @toggle-user-accept="toggleUserAccept" />
            </footer>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useOpposedSkillCheckSession } from '@/composables/useOpposedSkillCheckSession'
import { useCharactersStore } from '@/stores/charactersStore'
import SkillCheckCharacterColumn from './SkillCheckCharacterColumn.vue'
import RollResolution from './RollResolution.vue'

const sessionManager = useOpposedSkillCheckSession()
const charactersStore = useCharactersStore()

const props = defineProps({
    initialSessionConfig: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['close'])

const {
    opponent,
    shouldShowExitConfirmation,
    userAccepted,
    opponentAccepted,
    showResults,
    bothUsersAccepted,
    opponentLeftAfterBothAccepted
} = sessionManager

const characterName = computed(() => charactersStore.selectedCharacter?.name || '')
const opponentName = computed(() => opponent.value?.characterInfo?.name || 'Opponent')

const userColumnRef = ref(null)
const opponentColumnRef = ref(null)

const closeModal = () => {
    if (shouldShowExitConfirmation.value) {
        if (!confirm('Are you sure you want to leave this opposed skill check?')) {
            return
        }
    }
    sessionManager.cancelSession()
    emit('close')
}

const toggleUserAccept = () => {
    const character = charactersStore.selectedCharacter
    sessionManager.updateUserAcceptance(character.id, !userAccepted.value)

    if (bothUsersAccepted.value) {
        sessionManager.generateResultsOnAccept()
    }
}

onMounted(() => {
    watch(opponentLeftAfterBothAccepted, (newVal) => {
        if (newVal) {
            sessionManager.cleanup()
            emit('close')
        }
    })

    if (props.initialSessionConfig) {
        const { character, skillCheckConfig, sendToDiscord } = props.initialSessionConfig
        sessionManager.startSession(character, skillCheckConfig, { sendToDiscord })
    }

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

onBeforeUnmount(() => {
    sessionManager.cleanup()
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
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
}

.header-row h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-24);
}

.close-button {
    position: absolute;
    right: var(--space-lg);
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
