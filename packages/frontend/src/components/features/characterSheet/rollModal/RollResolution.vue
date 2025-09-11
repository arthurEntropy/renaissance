<template>
    <section class="roll-resolution">
        <div class="result-label">{{ resultLabel }}:</div>
        <div class="result-row">
            <ActionButton :variant="getAcceptButtonVariant" size="large" :disabled="!canAccept"
                :text="userAccepted ? '✓' : acceptButtonText" @click="emit('toggle-user-accept')" class="accept-btn" />
            <div class="winner-announcement" :class="getWinnerAnnouncementClasses">
                {{ winnerText }}
            </div>
            <ActionButton :variant="getOpponentButtonVariant" size="large" :text="opponentAccepted ? '✓' : waitingText"
                :disabled="true" class="opponent-status-btn" />
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

// Props
const props = defineProps({
    // Common props for both modes
    mode: {
        type: String,
        required: true,
        validator: (value) => ['engagement', 'opposed-skill-check'].includes(value)
    },
    winner: {
        type: String,
        default: null // 'user', 'opponent', 'tie'/'draw'
    },
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

// Emits
const emit = defineEmits(['toggle-user-accept'])

// Mode-specific text constants
const modeConfig = computed(() => {
    if (props.mode === 'engagement') {
        return {
            resultLabel: 'Result',
            acceptButton: 'Accept',
            waitingText: 'Waiting...',
            winText: 'wins',
            tieText: 'Draw'
        }
    } else {
        return {
            resultLabel: 'Result',
            acceptButton: 'Accept',
            waitingText: 'Waiting...',
            winText: 'wins',
            tieText: 'Tie'
        }
    }
})

// Computed properties for text
const resultLabel = computed(() => modeConfig.value.resultLabel)
const acceptButtonText = computed(() => modeConfig.value.acceptButton)
const waitingText = computed(() => modeConfig.value.waitingText)

const winnerText = computed(() => {
    if (!props.winner) {
        return '';
    }

    const config = modeConfig.value;

    switch (props.winner) {
        case 'user':
            return props.mode === 'engagement'
                ? `${props.characterName} ${config.winText}`
                : `${props.characterName} ${config.winText}`;
        case 'opponent':
            return props.mode === 'engagement'
                ? `${props.opponentName} ${config.winText}`
                : `${props.opponentName} ${config.winText}`;
        case 'tie':
        case 'draw':
            return config.tieText;
        default:
            return '';
    }
})

// Helper function to normalize winner types
const normalizeWinner = (winner) => {
    if (winner === 'draw') return 'tie'
    if (winner === 'tie') return 'tie'
    return winner
}

const getAcceptButtonVariant = computed(() => {
    if (!props.canAccept) {
        return 'neutral'
    }

    const normalizedWinner = normalizeWinner(props.winner)

    switch (normalizedWinner) {
        case 'user':
            return 'success'
        case 'opponent':
            return 'danger'
        case 'tie':
            return 'primary'
        default:
            return 'neutral'
    }
})

const getOpponentButtonVariant = computed(() => {
    if (!props.opponentAccepted) {
        return 'neutral' // Waiting state
    }

    const normalizedWinner = normalizeWinner(props.winner)

    // From opponent's perspective: if opponent won, it's success; if user won, it's danger; tie is neutral
    switch (normalizedWinner) {
        case 'opponent':
            return 'success' // Opponent won
        case 'user':
            return 'danger'  // Opponent lost
        case 'tie':
            return 'neutral' // Draw/tie
        default:
            return 'neutral'
    }
})

const getWinnerAnnouncementClasses = computed(() => {
    const classes = [];
    const normalizedWinner = normalizeWinner(props.winner);

    if (props.userAccepted && props.opponentAccepted) {
        classes.push('both-accepted');
    }

    if (normalizedWinner === 'tie') {
        classes.push('draw-result');
    }

    return classes;
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
</style>
