<template>
    <div class="engagement-column" :class="columnClasses">
        <div v-if="character" class="character-info">
            <h3>{{ character.name }}</h3>
            <div class="character-art">
                <img :src="characterArtUrl" alt="Character Art" class="character-art-thumbnail">
            </div>
        </div>

        <div v-if="character" class="dice-section">
            <div class="dice-list">
                <div v-if="dice.length === 0" class="no-dice-message">
                    No dice selected
                </div>
                <div v-for="(die, index) in dice" :key="index" class="dice-container"
                    @mouseenter="!isOpponent ? $emit('show-reroll-hover', index, true) : null"
                    @mouseleave="!isOpponent ? $emit('show-reroll-hover', index, false) : null">

                    <!-- Success assignment drop zone (left side for user) -->
                    <div v-if="die.isMax && showResults && !isOpponent" class="success-drop-zone left-side"
                        :class="{ disabled: !canEdit }" @drop="canEdit ? onSuccessDrop($event, index) : null"
                        @dragover.prevent @dragenter.prevent>
                        <div v-if="assignedSuccesses[`${side}-${index}`]" class="assigned-success-pill"
                            @mouseenter="$emit('start-success-tooltip', getSuccessById(assignedSuccesses[`${side}-${index}`]), $event)"
                            @mouseleave="$emit('clear-success-tooltip')">
                            {{ getSuccessName(assignedSuccesses[`${side}-${index}`]) }}
                            <span v-if="canEdit" class="remove-success-btn"
                                @click.stop="$emit('remove-success-assignment', side, index)">×</span>
                        </div>
                        <div v-else class="success-outline"></div>
                    </div>

                    <span class="dice-symbol" :class="getDiceClasses(die, index)">
                        <i :class="die.class"></i>
                        <span v-if="die.isMax && !isRerolling(index)" class="max-indicator">✨</span>
                    </span>

                    <!-- Reroll hover link - only for user's own dice -->
                    <div v-if="showResults && !die.isRolling && !isRerolling(index) &&
                        hoverStates[`${side}-${index}`] && canEdit && !isOpponent" class="reroll-hover"
                        @click="$emit('reroll-die', side, index)">
                        Reroll
                    </div>

                    <!-- Success assignment display (right side for opponent) -->
                    <div v-if="die.isMax && showResults && isOpponent" class="success-display-zone right-side">
                        <div v-if="assignedSuccesses[`${side}-${index}`]" class="assigned-success-pill"
                            @mouseenter="$emit('start-success-tooltip', getSuccessById(assignedSuccesses[`${side}-${index}`]), $event)"
                            @mouseleave="$emit('clear-success-tooltip')">
                            {{ getSuccessName(assignedSuccesses[`${side}-${index}`]) }}
                        </div>
                        <div v-else class="success-outline"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Engagement Successes Section -->
        <div v-if="character" class="engagement-successes-section" :class="{ 'opponent-successes-hidden': isOpponent }">
            <div class="engagement-successes-list">
                <div v-if="successes.length === 0" class="no-successes-message">
                    No engagement successes available
                </div>
                <div v-else class="success-pills">
                    <span v-for="success in successes" :key="success.id"
                        class="engagement-success-pill draggable-success" :draggable="canEdit && !isOpponent"
                        @dragstart="!isOpponent ? onSuccessDragStart($event, success) : null"
                        @mouseenter="$emit('start-success-tooltip', success, $event)"
                        @mouseleave="$emit('clear-success-tooltip')">
                        {{ success.name }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Waiting for opponent placeholder -->
        <div v-else class="waiting-for-opponent">
            <div class="placeholder-message">
                <div class="waiting-animation">
                    <div class="pulse-dot"></div>
                    <div class="pulse-dot"></div>
                    <div class="pulse-dot"></div>
                </div>
                <p>Waiting for an opponent to join...</p>
            </div>
        </div>
    </div>
</template>

<script>
import EngagementWinnerTypes from '@/constants/engagementWinnerTypes'

export default {
    name: 'CharacterColumn',
    props: {
        character: {
            type: Object,
            default: null
        },
        dice: {
            type: Array,
            default: () => []
        },
        successes: {
            type: Array,
            default: () => []
        },
        assignedSuccesses: {
            type: Object,
            default: () => ({})
        },
        side: {
            type: String,
            required: true // 'user' or 'opponent'
        },
        isOpponent: {
            type: Boolean,
            default: false
        },
        canEdit: {
            type: Boolean,
            default: true
        },
        showResults: {
            type: Boolean,
            default: false
        },
        rerollingDice: {
            type: Set,
            default: () => new Set()
        },
        hoverStates: {
            type: Object,
            default: () => ({})
        },
        defaultArtUrl: {
            type: String,
            default: '/img/default-character.png'
        },
        allEngagementSuccesses: {
            type: Array,
            default: () => []
        },
        winner: {
            type: String,
            default: null // 'user', 'opponent', 'tie', null
        }
    },

    emits: [
        'show-reroll-hover',
        'reroll-die',
        'success-drop',
        'remove-success-assignment',
        'start-success-tooltip',
        'clear-success-tooltip'
    ],

    computed: {
        characterArtUrl() {
            if (!this.character) return this.defaultArtUrl;
            return (this.character.artUrls && this.character.artUrls.length > 0)
                ? this.character.artUrls[0]
                : this.defaultArtUrl;
        },

        columnClasses() {
            const classes = [];

            if (this.isOpponent) {
                classes.push('opponent-column');
            } else {
                classes.push('user-column');
            }

            if (this.showResults && this.winner) {
                if ((this.winner === EngagementWinnerTypes.USER && !this.isOpponent) ||
                    (this.winner === EngagementWinnerTypes.OPPONENT && this.isOpponent)) {
                    classes.push('winner-column');
                } else if (this.winner !== EngagementWinnerTypes.TIE) {
                    classes.push('loser-column');
                }
            }

            return classes;
        }
    },

    methods: {
        getDiceClasses(die, index) {
            const classes = [];

            if (die.isRolling || this.isRerolling(index)) {
                classes.push(`rolling-die-${(index % 3) + 1}`);
            } else {
                classes.push('result-die');
            }

            if (die.isMax) {
                classes.push('max-result');
            }

            if (this.isRerolling(index)) {
                classes.push('rerolling');
            }

            return classes;
        },

        isRerolling(index) {
            return this.rerollingDice.has(`${this.side}-${index}`);
        },

        getSuccessById(successId) {
            return this.allEngagementSuccesses.find(s => s.id === successId);
        },

        getSuccessName(successId) {
            const success = this.getSuccessById(successId);
            return success ? success.name : 'Unknown Success';
        },

        onSuccessDragStart(event, success) {
            if (!this.canEdit) {
                event.preventDefault();
                return;
            }
            event.dataTransfer.setData('application/json', JSON.stringify(success));
            event.dataTransfer.effectAllowed = 'copy';
        },

        onSuccessDrop(event, diceIndex) {
            event.preventDefault();
            try {
                const successData = JSON.parse(event.dataTransfer.getData('application/json'));
                this.$emit('success-drop', this.side, diceIndex, successData);
            } catch (error) {
                console.error('Error handling success drop:', error);
            }
        }
    }
}
</script>

<style scoped>
.engagement-column {
    flex: 1;
    border: 2px solid #666;
    border-radius: 5px;
    padding: 15px;
    background-color: rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
}

.user-column {
    background-color: rgba(0, 80, 150, 0.05);
}

.opponent-column {
    background-color: rgba(150, 30, 0, 0.05);
}

.character-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 15px;
}

.character-art-thumbnail {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 50%;
    margin: 10px 0;
    border: 2px solid #333;
}

.dice-section {
    margin-top: 10px;
    flex: 1;
}

.dice-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
    padding-bottom: 10px;
}

.dice-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.success-drop-zone,
.success-display-zone {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 60px;
    height: 24px;
    overflow: visible;
}

.success-drop-zone.left-side {
    right: 100%;
    margin-right: 8px;
}

.success-display-zone.right-side {
    left: 100%;
    margin-left: 8px;
}

.success-outline {
    width: 50px;
    height: 20px;
    border: 2px dashed rgba(212, 182, 106, 0.6);
    border-radius: 10px;
    background-color: rgba(212, 182, 106, 0.1);
    transition: all 0.2s ease;
}

.success-drop-zone.disabled {
    pointer-events: none;
    opacity: 0.5;
}

.success-drop-zone.disabled .success-outline {
    border-color: rgba(128, 128, 128, 0.4);
    background-color: rgba(128, 128, 128, 0.1);
}

.success-drop-zone:hover .success-outline {
    border-color: rgba(212, 182, 106, 0.9);
    background-color: rgba(212, 182, 106, 0.2);
}

.assigned-success-pill {
    background-color: rgb(212, 182, 106);
    color: #000;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
    text-align: center;
    max-width: 50px;
    overflow: visible;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    cursor: help;
    transition: background-color 0.2s;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.assigned-success-pill:hover {
    background-color: rgba(212, 182, 106, 0.8);
}

.remove-success-btn {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 14px;
    height: 14px;
    background-color: #ff4444;
    color: white;
    border-radius: 50%;
    font-size: 10px;
    font-weight: bold;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.assigned-success-pill:hover .remove-success-btn {
    display: flex;
}

.remove-success-btn:hover {
    background-color: #cc0000;
    transform: scale(1.1);
}

.draggable-success {
    cursor: grab;
    transition: transform 0.2s ease;
}

.draggable-success:hover {
    transform: scale(1.05);
}

.draggable-success:active {
    cursor: grabbing;
    transform: scale(0.95);
}

.draggable-success[draggable="false"] {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none !important;
}

.dice-symbol {
    font-size: 36px;
    display: inline-block;
    position: relative;
    color: inherit;
    margin: 0 5px;
    transform: scale(1.2);
    height: 36px;
    line-height: 1;
}

.reroll-hover {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(212, 182, 106, 0.95);
    color: #000;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    z-index: 20;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    text-shadow: none;
}

.reroll-hover:hover {
    background-color: rgb(212, 182, 106);
    transform: translate(-50%, -50%) scale(1.1);
}

.dice-symbol i {
    font-family: 'dicefont' !important;
    font-style: normal;
}

/* Animation for rolling dice */
.rolling-die-1 {
    animation: roll-1 0.9s linear infinite;
}

.rolling-die-2 {
    animation: roll-2 1.2s linear infinite;
}

.rolling-die-3 {
    animation: roll-3 0.7s linear infinite;
}

.dice-symbol.rerolling {
    animation: reroll-spin 0.15s linear infinite !important;
}

@keyframes roll-1 {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes roll-2 {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes roll-3 {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes reroll-spin {
    0% {
        transform: scale(1.2) rotate(0deg);
    }

    100% {
        transform: scale(1.2) rotate(360deg);
    }
}

.result-die {
    animation: none;
    transition: transform 0.3s ease;
}

.max-result {
    color: rgb(212, 182, 106);
    position: relative;
    text-shadow:
        0 0 5px rgba(212, 182, 106, 0.8),
        0 0 10px rgba(212, 182, 106, 0.6);
    animation: fadeInGlow 0.8s ease-in forwards;
    animation-delay: 0.1s;
}

.max-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: 16px;
    transform: translate(5px, 5px);
    opacity: 0;
    animation: fadeIn 0.5s ease-in forwards;
    animation-delay: 0.4s;
}

@keyframes fadeInGlow {
    0% {
        color: white;
        text-shadow: none;
    }

    100% {
        color: rgb(212, 182, 106);
        text-shadow:
            0 0 5px rgba(212, 182, 106, 0.8),
            0 0 10px rgba(212, 182, 106, 0.6);
    }
}

@keyframes fadeIn {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

.no-dice-message,
.no-successes-message {
    text-align: center;
    color: #999;
    margin-top: 10px;
    font-style: italic;
}

.engagement-successes-section {
    margin-top: 20px;
    padding-top: 15px;
    margin-top: auto;
}

.engagement-successes-section.opponent-successes-hidden {
    visibility: hidden;
}

.engagement-successes-list {
    margin-top: 10px;
}

.success-pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
}

.engagement-success-pill {
    background-color: rgb(61, 61, 61);
    color: white;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 10px;
    text-align: center;
    cursor: help;
    transition: background-color 0.2s;
    display: inline-block;
}

.engagement-success-pill:hover {
    background-color: rgba(64, 64, 64, 0.4);
}

.waiting-for-opponent {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.placeholder-message {
    padding: 40px 20px;
    text-align: center;
    color: #888;
    font-style: italic;
}

.waiting-animation {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 15px;
}

.pulse-dot {
    width: 12px;
    height: 12px;
    background-color: #777;
    border-radius: 50%;
    animation: pulse 1.5s infinite ease-in-out;
}

.pulse-dot:nth-child(2) {
    animation-delay: 0.5s;
}

.pulse-dot:nth-child(3) {
    animation-delay: 1s;
}

@keyframes pulse {
    0% {
        transform: scale(0.7);
        opacity: 0.5;
    }

    50% {
        transform: scale(1);
        opacity: 1;
    }

    100% {
        transform: scale(0.7);
        opacity: 0.5;
    }
}

/* Winner/Loser Column Styling */
.winner-column {
    border: 2px solid #4caf50 !important;
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
}

.loser-column {
    border: 2px solid #f44336 !important;
    box-shadow: 0 0 15px rgba(244, 67, 54, 0.3);
}

h3 {
    margin: 0;
    text-align: center;
    margin-bottom: 10px;
}
</style>
