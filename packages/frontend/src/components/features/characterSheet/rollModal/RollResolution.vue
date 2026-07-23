<template>
    <section class="roll-resolution">

        <!-- Result label -->
        <div class="result-label">Result:</div>

        <div class="result-row">

            <!-- User accept button -->
            <ActionButton :variant="getAcceptButtonVariant" size="large" :disabled="!canAccept"
                @click="emit('toggle-user-accept')" class="accept-btn">
                <template v-if="userAccepted">
                    <CheckIcon class="check-icon" />
                </template>
                <template v-else>
                    Accept
                </template>
            </ActionButton>

            <!-- Winner announcement -->
            <div class="winner-announcement" :class="getWinnerAnnouncementClasses">
                {{ winnerText }}
            </div>

            <!-- Opponent status button -->
            <ActionButton :variant="getOpponentButtonVariant" size="large" :disabled="true" class="opponent-status-btn">
                <template v-if="opponentAccepted">
                    <CheckIcon class="check-icon" />
                </template>
                <template v-else>
                    Waiting...
                </template>
            </ActionButton>
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue'
import { CheckIcon } from '@heroicons/vue/24/solid'
import { WINNER } from '@shared/constants/winner.js'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useEngagementSession } from '@/composables/useEngagementSession'
import { useEngagementRoll } from '@/composables/useEngagementRoll'
import { useCharactersStore } from '@/stores/charactersStore'

const props = defineProps({
    userAccepted: {
        type: Boolean,
        default: false
    },
    opponentAccepted: {
        type: Boolean,
        default: false
    },
    canAccept: {
        type: Boolean,
        default: false
    },
    characterName: {
        type: String,
        default: ''
    },
    opponentName: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['toggle-user-accept'])

const sessionManager = useEngagementSession()
const diceManager = useEngagementRoll()
const charactersStore = useCharactersStore()

// Get winner from engagement composable
const winner = computed(() => {
    return diceManager.getEngagementWinner(
        sessionManager,
        charactersStore.selectedCharacter,
        diceManager.committedDice.value
    )
})

const winnerText = computed(() => {
    const winnerValue = winner.value

    if (!winnerValue) {
        return 'Calculating...'
    }

    switch (winnerValue) {
        case WINNER.USER:
            return `${props.characterName} wins`
        case WINNER.OPPONENT:
            return `${props.opponentName} wins`
        case WINNER.TIE:
            return 'Draw'
        default:
            return 'Calculating...'
    }
})

const getAcceptButtonVariant = computed(() => {
    if (!props.canAccept) {
        return 'neutral'
    }

    switch (winner.value) {
        case WINNER.USER:
            return 'success'
        case WINNER.OPPONENT:
            return 'danger'
        case WINNER.TIE:
            return 'primary'
        default:
            return 'neutral'
    }
})

const getOpponentButtonVariant = computed(() => {
    if (!props.opponentAccepted || (props.userAccepted && props.opponentAccepted)) {
        return 'neutral'
    }

    // From opponent's perspective
    switch (winner.value) {
        case WINNER.OPPONENT:
            return 'success'
        case WINNER.USER:
            return 'danger'
        case WINNER.TIE:
            return 'neutral'
        default:
            return 'neutral'
    }
})

const getWinnerAnnouncementClasses = computed(() => {
    const classes = []

    if (props.userAccepted && props.opponentAccepted) {
        classes.push('both-accepted')
    }

    if (winner.value === WINNER.TIE) {
        classes.push('draw-result')
    }

    return classes
})
</script>

<style scoped>
.roll-resolution {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 400px;
}

.result-label {
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
    font-weight: var(--font-weight-bold);
    text-align: center;
}

.result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: var(--space-lg);
}

.accept-btn,
.opponent-status-btn {
    width: 100px;
}

.winner-announcement {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-16);
    flex: 1;
    text-align: center;
    color: var(--color-text-primary);
}

.winner-announcement.both-accepted {
    color: var(--color-success);
}

.winner-announcement.draw-result {
    color: var(--color-warning);
}

.check-icon {
    width: 14px;
    height: 14px;
}
</style>
