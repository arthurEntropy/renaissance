<template>
    <div class="engagement-resolution">
        <div class="result-label">Result:</div>
        <div class="result-row">
            <button class="button accept-btn user-accept" :class="getUserAcceptClasses" :disabled="!canAccept"
                @click="emit('toggle-user-accept')">
                {{ userAccepted ? '✓' : 'Accept' }}
            </button>
            <div class="winner-announcement" :class="getWinnerAnnouncementClasses">
                {{ winnerText }}
            </div>
            <button class="button opponent-status-btn" :class="getOpponentStatusClasses" disabled>
                {{ opponentAccepted ? '✓' : 'Waiting...' }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import EngagementWinnerTypes from '@/constants/engagementWinnerTypes'

// Props
const props = defineProps({
    winner: {
        type: String,
        default: null // 'user', 'opponent', 'tie'
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

// Computed properties
const winnerText = computed(() => {
    if (!props.winner) {
        return '';
    }

    switch (props.winner) {
        case EngagementWinnerTypes.USER:
            return `${props.characterName} wins`;
        case EngagementWinnerTypes.OPPONENT:
            return `${props.opponentName} wins`;
        case EngagementWinnerTypes.TIE:
            return 'Draw';
        default:
            return '';
    }
})

const getUserAcceptClasses = computed(() => {
    const classes = ['accepted'];

    if (!props.canAccept) {
        classes.push('disabled');
    }

    if (!props.userAccepted && props.winner === EngagementWinnerTypes.USER) {
        classes.push('win-pale');
    } else if (props.userAccepted && props.winner === EngagementWinnerTypes.USER) {
        classes.push('win-solid');
    } else if (!props.userAccepted && props.winner === EngagementWinnerTypes.OPPONENT) {
        classes.push('loss-pale');
    } else if (props.userAccepted && props.winner === EngagementWinnerTypes.OPPONENT) {
        classes.push('loss-solid');
    } else if (!props.userAccepted && props.winner === EngagementWinnerTypes.TIE) {
        classes.push('draw-pale');
    } else if (props.userAccepted && props.winner === EngagementWinnerTypes.TIE) {
        classes.push('draw-solid');
    }

    return classes;
})

const getOpponentStatusClasses = computed(() => {
    const classes = [];

    if (!props.opponentAccepted) {
        classes.push('waiting');
    } else {
        if (props.winner === EngagementWinnerTypes.OPPONENT) {
            classes.push('opponent-win-solid');
        } else if (props.winner === EngagementWinnerTypes.USER) {
            classes.push('opponent-loss-solid');
        } else if (props.winner === EngagementWinnerTypes.TIE) {
            classes.push('opponent-draw-solid');
        }
    }

    return classes;
})

const getWinnerAnnouncementClasses = computed(() => {
    const classes = [];

    if (props.userAccepted && props.opponentAccepted) {
        classes.push('both-accepted');
    }

    if (props.winner === EngagementWinnerTypes.TIE) {
        classes.push('draw-result');
    }

    return classes;
})
</script>

<style scoped>
.engagement-resolution {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 400px;
}

.result-label {
    font-size: 14px;
    color: #666;
    font-weight: bold;
    text-align: center;
}

.result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 15px;
}

.button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}

.accept-btn {
    min-width: 60px;
    width: 80px;
    padding: 6px 12px;
    font-size: 14px;
    flex-shrink: 0;
    transition: all 0.3s ease;
}

/* Win states for user */
.accept-btn.win-pale {
    background-color: rgba(76, 175, 80, 0.4);
    color: white;
    border: 1px solid rgba(76, 175, 80, 0.6);
}

.accept-btn.win-solid {
    background-color: #4caf50;
    color: white;
    border: 1px solid #4caf50;
}

/* Loss states for user */
.accept-btn.loss-pale {
    background-color: rgba(244, 67, 54, 0.4);
    color: white;
    border: 1px solid rgba(244, 67, 54, 0.6);
}

.accept-btn.loss-solid {
    background-color: #f44336;
    color: white;
    border: 1px solid #f44336;
}

/* Draw states for user */
.accept-btn.draw-pale {
    background-color: rgba(255, 235, 59, 0.4);
    color: white;
    border: 1px solid rgba(255, 235, 59, 0.6);
}

.accept-btn.draw-solid {
    background-color: #ffeb3b;
    color: white;
    border: 1px solid #ffeb3b;
}

.accept-btn.disabled {
    background-color: #ccc;
    color: #888;
    cursor: not-allowed;
}

.accept-btn.disabled:hover {
    background-color: #ccc;
}

.opponent-status-btn {
    min-width: 60px;
    width: 80px;
    padding: 6px 12px;
    font-size: 14px;
    flex-shrink: 0;
    background-color: lightgray;
    color: #666;
    font-style: italic;
    font-weight: normal;
    cursor: default;
}

.opponent-status-btn.waiting {
    font-style: italic;
    font-weight: normal;
}

.opponent-status-btn.opponent-win-solid {
    background-color: #4caf50;
    color: white;
    font-style: normal;
    font-weight: bold;
}

.opponent-status-btn.opponent-loss-solid {
    background-color: #f44336;
    color: white;
    font-style: normal;
    font-weight: bold;
}

.opponent-status-btn.opponent-draw-solid {
    background-color: #ffeb3b;
    color: white;
    font-style: normal;
    font-weight: bold;
}

.winner-announcement {
    font-weight: bold;
    font-size: 16px;
    padding: 8px 16px;
    border-radius: 6px;
    transition: all 0.3s ease;
    flex: 1;
    text-align: center;
}

.winner-announcement.both-accepted {
    border: 3px solid #4caf50;
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
    background-color: rgba(76, 175, 80, 0.1);
}

.winner-announcement.draw-result {
    border: 3px solid #ffeb3b;
    box-shadow: 0 0 15px rgba(255, 235, 59, 0.4);
    background-color: rgba(255, 235, 59, 0.1);
}
</style>
