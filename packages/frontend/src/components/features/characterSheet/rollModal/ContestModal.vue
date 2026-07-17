<template>
    <BaseModal title="Contest" width="min(700px, 94vw)" @close="closeModal">

        <main class="contest-columns">
            <SkillCheckCharacterColumn ref="userColumnRef" :is-opponent="false" />
            <SkillCheckCharacterColumn ref="opponentColumnRef" :is-opponent="true" />
        </main>

        <template #actions>
            <div class="modal-actions">
                <ActionButton v-if="!opponent" variant="neutral" size="large" text="Cancel" @click="closeModal" />
                <RollResolution v-if="showResults" mode="contest" :user-accepted="userAccepted"
                    :opponent-accepted="opponentAccepted" :can-accept="showResults && !bothUsersAccepted"
                    :character-name="characterName" :opponent-name="opponentName"
                    @toggle-user-accept="toggleUserAccept" />
            </div>
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import { useContestSession } from '@/composables/useContestSession'
import { useCharactersStore } from '@/stores/charactersStore'
import SkillCheckCharacterColumn from './SkillCheckCharacterColumn.vue'
import RollResolution from './RollResolution.vue'

const sessionManager = useContestSession()
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
        if (!confirm('Are you sure you want to leave this contest?')) {
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
/* ── Box sizing ──────────────────────────────────── */
:deep(.base-modal-box) {
    min-height: min(600px, 80vh);
}

/* ── Two-column layout ───────────────────────────── */
.contest-columns {
    display: flex;
    flex: 1;
    min-height: 0;
    gap: var(--space-lg);
}

.modal-actions {
    display: flex;
    justify-content: center;
    gap: var(--space-md);
    padding-top: var(--space-lg);
    width: 100%;
}

:deep(.base-modal-footer) {
    justify-content: center;
}
</style>
