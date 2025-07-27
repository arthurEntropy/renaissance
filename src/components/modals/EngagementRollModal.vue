<template>
    <div class="modal-overlay" @click="closeModal">
        <div class="modal-content engagement-roll-modal" @click.stop>
            <div class="header-row">
                <h2>Engagement Roll</h2>
                <button class="close-button" @click="closeModal">×</button>
            </div>

            <div v-if="sessionMode" class="session-info">
                <div class="session-status" :class="sessionStatusClass">
                    {{ sessionStatusText }}
                </div>
            </div>

            <!-- Floating comparison indicators -->
            <div v-if="showResults && opponent" class="floating-comparisons">
                <div v-for="(pair, index) in diceComparisons" :key="index" class="comparison-indicator"
                    :style="{ top: `${190 + (pair.index * 48)}px` }">
                    <div class="indicator-circle"
                        :class="{ 'winner': pair.leftWins, 'loser': !pair.leftWins && !pair.tie }"></div>
                    <div class="indicator-caret"
                        :class="{ 'left-wins': pair.leftWins, 'right-wins': pair.rightWins, 'tie': pair.tie }">
                        <span v-if="pair.tie">•</span>
                        <span v-else-if="pair.leftWins">◀</span>
                        <span v-else>▶</span>
                    </div>
                    <div class="indicator-circle"
                        :class="{ 'winner': pair.rightWins, 'loser': !pair.rightWins && !pair.tie }"></div>
                </div>
            </div>

            <div class="engagement-columns">
                <!-- User's column -->
                <div class="engagement-column user-column">
                    <div class="character-info">
                        <h3>{{ character.name }}</h3>
                        <div class="character-art">
                            <img :src="characterArtUrl" alt="Character Art" class="character-art-thumbnail">
                        </div>
                    </div>

                    <div class="dice-section">
                        <div class="dice-list">
                            <div v-if="sortedSelectedDice.length === 0" class="no-dice-message">
                                No dice selected
                            </div>
                            <span v-for="(die, index) in sortedSelectedDice" :key="index" class="dice-symbol"
                                :class="{ [`rolling-die-${(index % 3) + 1}`]: die.isRolling, 'result-die': !die.isRolling, 'max-result': die.isMax }">
                                <i :class="die.class"></i>
                                <span v-if="die.isMax" class="max-indicator">✨</span>
                            </span>
                        </div>
                    </div>

                    <!-- Engagement Successes Section -->
                    <div class="engagement-successes-section">
                        <div class="engagement-successes-list">
                            <div v-if="characterSuccesses.length === 0" class="no-successes-message">
                                No engagement successes available
                            </div>
                            <div v-else class="success-pills">
                                <span v-for="success in characterSuccesses" :key="success.id"
                                    class="engagement-success-pill" @mouseenter="startSuccessTooltip(success, $event)"
                                    @mouseleave="clearSuccessTooltip">
                                    {{ success.name }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Opponent's column -->
                <div class="engagement-column opponent-column">
                    <div v-if="opponent" class="opponent-info">
                        <div class="character-info">
                            <h3>{{ opponent.characterInfo.name }}</h3>
                            <div class="character-art">
                                <img :src="opponentArtUrl" alt="Opponent Character Art" class="character-art-thumbnail">
                            </div>
                        </div>

                        <div class="dice-section">
                            <div class="dice-list">
                                <div v-if="!opponent.selectedDice || opponent.selectedDice.length === 0"
                                    class="no-dice-message">
                                    No dice selected
                                </div>
                                <span v-for="(die, index) in sortedOpponentDice" :key="index" class="dice-symbol"
                                    :class="{ [`rolling-die-${(index % 3) + 1}`]: die.isRolling, 'result-die': !die.isRolling, 'max-result': die.isMax }">
                                    <i :class="die.class"></i>
                                    <span v-if="die.isMax" class="max-indicator">✨</span>
                                </span>
                            </div>
                        </div>

                        <!-- Opponent Engagement Successes Section -->
                        <div class="engagement-successes-section">
                            <div class="engagement-successes-list">
                                <div v-if="!opponent.engagementSuccesses || opponent.engagementSuccesses.length === 0"
                                    class="no-successes-message">
                                    No engagement successes available
                                </div>
                                <div v-else class="success-pills">
                                    <span v-for="(successId, idx) in opponent.engagementSuccesses" :key="idx"
                                        class="engagement-success-pill"
                                        @mouseenter="startSuccessTooltip(allEngagementSuccesses.find(s => s.id === successId), $event)"
                                        @mouseleave="clearSuccessTooltip">
                                        {{ getSuccessName(successId) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
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
            </div>

            <div class="modal-actions">
                <button class="button button-secondary" @click="closeModal">
                    Cancel
                </button>
            </div>

            <!-- Tooltip for engagement success descriptions -->
            <div v-if="tooltipSuccess" class="success-tooltip"
                :style="{ top: tooltipPosition.y + 'px', left: tooltipPosition.x + 'px' }">
                <div class="tooltip-description">{{ tooltipSuccess.description }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import engagementService from '@/services/EngagementService';

export default {
    props: {
        character: {
            type: Object,
            required: true,
        },
        selectedDice: {
            type: Array,
            required: true,
        },
        defaultArtUrl: {
            type: String,
            default: '/img/default-character.png'
        },
        allEngagementSuccesses: {
            type: Array,
            default: () => []
        },
        allEquipment: {
            type: Array,
            default: () => []
        }
    },

    data() {
        return {
            sessionId: null,
            sessionStatus: 'waiting',
            opponent: null,
            sessionMode: false,
            rollResults: null,
            tooltipSuccess: null,
            tooltipPosition: { x: 0, y: 0 },
            tooltipTimer: null
        };
    },

    // Watch for changes to selectedDice prop
    watch: {
        selectedDice: {
            immediate: true,
            handler() {
                // Watch for changes to selected dice
            }
        }
    },

    emits: ['close', 'confirm-roll'],

    computed: {
        characterArtUrl() {
            return (this.character.artUrls && this.character.artUrls.length > 0)
                ? this.character.artUrls[0]
                : this.defaultArtUrl;
        },

        opponentArtUrl() {
            if (!this.opponent || !this.opponent.characterInfo) return this.defaultArtUrl;

            return (this.opponent.characterInfo.artUrls && this.opponent.characterInfo.artUrls.length > 0)
                ? this.opponent.characterInfo.artUrls[0]
                : this.defaultArtUrl;
        },

        // Sort dice from highest to lowest and prepare for display
        sortedSelectedDice() {
            // Check if selectedDice is empty or not an array
            if (!this.selectedDice || !Array.isArray(this.selectedDice) || this.selectedDice.length === 0) {
                return [];
            }

            // If we have roll results, use those values
            if (this.rollResults && this.rollResults.session) {
                // Find the user's results in the session
                const userResults = this.rollResults.session.users.find(
                    user => user.characterInfo.id === this.character.id
                );

                if (userResults && userResults.rollResults) {
                    // Create array with die info including roll results
                    const diceWithResults = [...this.selectedDice].map((die, index) => {
                        const value = userResults.rollResults[index] || 1;
                        const isMax = value === die; // Check if roll is maximum possible value for that die
                        return {
                            die: die,
                            value: value,
                            class: `df-d${die}-${value}`,
                            isRolling: false,
                            isMax: isMax
                        };
                    });

                    // Sort by rolled value (highest to lowest)
                    return diceWithResults.sort((a, b) => b.value - a.value);
                }
            }

            // Convert plain dice values to objects with class info
            return [...this.selectedDice]
                .sort((a, b) => b - a)
                .map(die => ({
                    die: die,
                    class: `df-d${die}-${die}`,
                    isRolling: true
                }));
        },

        // Sort opponent's dice from highest to lowest and prepare for display
        sortedOpponentDice() {
            if (!this.opponent || !this.opponent.selectedDice || !Array.isArray(this.opponent.selectedDice) || this.opponent.selectedDice.length === 0) {
                return [];
            }

            // If we have roll results, use those values
            if (this.rollResults && this.rollResults.session) {
                // Find the opponent's results in the session
                const opponentResults = this.rollResults.session.users.find(
                    user => user.socketId === this.opponent.socketId
                );

                if (opponentResults && opponentResults.rollResults) {
                    // Create array with die info including roll results
                    const diceWithResults = [...this.opponent.selectedDice].map((die, index) => {
                        const value = opponentResults.rollResults[index] || 1;
                        const isMax = value === die; // Check if roll is maximum possible value for that die
                        return {
                            die: die,
                            value: value,
                            class: `df-d${die}-${value}`,
                            isRolling: false,
                            isMax: isMax
                        };
                    });

                    // Sort by rolled value (highest to lowest)
                    return diceWithResults.sort((a, b) => b.value - a.value);
                }
            }            // Convert plain dice values to objects with class info
            return [...this.opponent.selectedDice]
                .sort((a, b) => b - a)
                .map(die => ({
                    die: die,
                    class: `df-d${die}-${die}`,
                    isRolling: true
                }));
        },

        // Get all character engagement successes
        characterSuccesses() {
            // Return empty array if no character or engagement successes
            if (!this.character) return [];

            // Combine equipment engagement successes and custom successes
            let successIds = [];

            // Add custom engagement successes if available
            if (this.character.engagementSuccesses && Array.isArray(this.character.engagementSuccesses)) {
                successIds = [...this.character.engagementSuccesses];
            }

            // Add equipment engagement successes if available
            if (this.character.equipment && Array.isArray(this.character.equipment) && this.allEquipment && Array.isArray(this.allEquipment)) {
                this.character.equipment.forEach(characterEquip => {
                    const fullEquipment = this.allEquipment.find(eq => eq.id === characterEquip.id);
                    const isActive = characterEquip.isCarried !== false && characterEquip.isWielding !== false;
                    if (isActive && fullEquipment && fullEquipment.engagementSuccesses && fullEquipment.engagementSuccesses.length > 0) {
                        successIds.push(...fullEquipment.engagementSuccesses);
                    }
                });
            }

            // Remove duplicates
            const uniqueSuccessIds = [...new Set(successIds)];

            // Map success IDs to success objects with details
            return uniqueSuccessIds
                .map(id => this.allEngagementSuccesses.find(success => success.id === id))
                .filter(success => success) // Remove undefined values
                .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
        },

        sessionStatusText() {
            switch (this.sessionStatus) {
                case 'waiting':
                    return 'Waiting for opponent to join...';
                case 'ready':
                    return 'Both users ready! Preparing roll...';
                case 'rolling':
                    return 'Rolling dice...';
                case 'completed':
                    return 'Roll completed!';
                default:
                    return 'Session active';
            }
        },

        sessionStatusClass() {
            return `status-${this.sessionStatus}`;
        },

        showResults() {
            return this.rollResults && this.rollResults.session && this.sessionStatus === 'completed';
        },

        diceComparisons() {
            // Only show comparisons when we have results
            if (!this.rollResults || !this.rollResults.session || !this.opponent) {
                return [];
            }

            const userDice = this.sortedSelectedDice;
            const opponentDice = this.sortedOpponentDice;

            // Get the maximum length of both dice arrays to compare pairs
            const pairCount = Math.max(userDice.length, opponentDice.length);

            // Create comparison objects for each pair
            const comparisons = [];
            for (let i = 0; i < pairCount; i++) {
                const userDie = i < userDice.length ? userDice[i] : null;
                const opponentDie = i < opponentDice.length ? opponentDice[i] : null;

                // If only one side has a die, that side wins automatically
                if (!userDie && opponentDie) {
                    // Opponent wins this pair
                    comparisons.push({
                        leftWins: false,
                        rightWins: true,
                        tie: false,
                        index: i
                    });
                } else if (userDie && !opponentDie) {
                    // User wins this pair
                    comparisons.push({
                        leftWins: true,
                        rightWins: false,
                        tie: false,
                        index: i
                    });
                } else if (userDie && opponentDie && !userDie.isRolling && !opponentDie.isRolling &&
                    userDie.value !== undefined && opponentDie.value !== undefined) {
                    // Both sides have dice with values
                    const leftWins = userDie.value > opponentDie.value;
                    const rightWins = opponentDie.value > userDie.value;
                    const tie = userDie.value === opponentDie.value;

                    comparisons.push({
                        leftWins,
                        rightWins,
                        tie,
                        index: i
                    });
                }
            }

            return comparisons;
        }
    },

    methods: {
        closeModal() {
            // If in a session, leave it
            if (this.sessionId) {
                engagementService.cancelSession();
            }

            // Disconnect from WebSocket when closing
            engagementService.disconnect();

            this.$emit('close');
        },

        confirmRoll() {
            if (this.sessionMode) {
                // In session mode, this is handled by the WebSocket events
                return;
            }

            this.$emit('confirm-roll', this.sortedSelectedDice);
            this.closeModal();
        },

        initSession() {
            this.sessionMode = true;
            console.log('Initializing engagement session');

            // Connect to the WebSocket server
            engagementService.connect();
            console.log('WebSocket connection established');

            // Set up event listeners
            this.setupEngagementListeners();
            console.log('Event listeners set up');

            // Auto-join or create a session
            console.log('Auto-joining or creating session with character:', this.character.name);
            engagementService.autoJoinOrCreate(
                this.character,
                this.selectedDice,
                this.characterSuccesses.map(s => s.id)
            );
        },

        setupEngagementListeners() {
            // Session created
            engagementService.on('session-created', ({ sessionId, session }) => {
                this.sessionId = sessionId;
                this.sessionStatus = session.state;
            });

            // Session updated
            engagementService.on('session-updated', ({ session }) => {
                this.sessionId = session.id;
                this.sessionStatus = session.state;

                // Find opponent (the other user in the session)
                if (session.users && session.users.length === 2) {
                    const otherUser = session.users.find(user =>
                        user.characterInfo.id !== this.character.id);

                    if (otherUser) {
                        this.opponent = otherUser;
                    }
                }
            });

            // User left
            engagementService.on('user-left', ({ message }) => {
                this.opponent = null;
                this.sessionStatus = 'waiting';
                alert(message);
            });

            // Session cancelled
            engagementService.on('session-cancelled', ({ message }) => {
                alert(message);
                this.sessionId = null;
                this.sessionStatus = 'waiting';
                this.opponent = null;
            });

            // Roll results
            engagementService.on('roll-results', ({ session }) => {
                console.log('Roll results received from server:', session);
                this.sessionStatus = 'completed';
                this.rollResults = { session };

                // Stop the dice rolling animation and show results
                setTimeout(() => {
                    console.log('Forcing update to display roll results');
                    // Force a re-computation of the sorted dice arrays to show the results
                    // This is needed since Vue might not detect the nested property change
                    this.$forceUpdate();
                }, 100);
            });
        },

        getSuccessName(successId) {
            const success = this.allEngagementSuccesses.find(s => s.id === successId);
            return success ? success.name : 'Unknown Success';
        },

        startSuccessTooltip(success, event) {
            clearTimeout(this.tooltipTimer);
            this.tooltipTimer = setTimeout(() => {
                this.tooltipSuccess = success;
                this.tooltipPosition = {
                    x: event.clientX + 12,
                    y: event.clientY + 12,
                };
            }, 1000);
        },

        clearSuccessTooltip() {
            clearTimeout(this.tooltipTimer);
            this.tooltipSuccess = null;
        }
    },

    mounted() {
        // Initialize the session when the component mounts
        this.initSession();
    },

    beforeUnmount() {
        console.log('Component unmounting, cleaning up WebSocket connection');
        // Clean up WebSocket connection when component is destroyed
        engagementService.disconnect();
    }
}
</script>

<style scoped>
/* Use the global modal styles for consistency */
.engagement-roll-modal {
    width: 400px;
    max-width: 90vw;
    max-height: 85vh;
    overflow-y: auto;
    position: relative;
    /* Needed for absolute positioning of comparison indicators */
}

.header-row {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
}

.header-row h2 {
    text-align: center;
}

.close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #888;
    position: absolute;
    right: 0;
}

.close-button:hover {
    color: #333;
}

.engagement-columns {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    min-height: 350px;
    /* Give enough space for content */
    align-items: stretch;
}

.engagement-column {
    flex: 1;
    border: 1px solid #ddd;
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

.opponent-info {
    display: flex;
    flex-direction: column;
    height: 100%;
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
    /* Consistent spacing for dice rows */
    margin-top: 10px;
    padding-bottom: 10px;
}

.dice-symbol {
    font-size: 36px;
    display: inline-block;
    position: relative;
    color: inherit;
    margin: 0 5px;
    transform: scale(1.2);
    height: 36px;
    /* Fixed height for better alignment */
    line-height: 1;
    /* Make all dice the same size as result dice */
}

.dice-symbol i {
    font-family: 'dicefont' !important;
    font-style: normal;
}

/* Animation for rolling dice with different but constant speeds */
.rolling-die-1 {
    animation: roll-1 0.9s linear infinite;
}

.rolling-die-2 {
    animation: roll-2 1.2s linear infinite;
}

.rolling-die-3 {
    animation: roll-3 0.7s linear infinite;
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

.placeholder-message {
    padding: 40px 20px;
    text-align: center;
    color: #888;
    font-style: italic;
}

.modal-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 20px;
}

.button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}

.button-primary {
    background-color: #005499;
    color: white;
}

.button-secondary {
    background-color: #ddd;
    color: #333;
}

h2,
h3,
h4 {
    margin: 0;
}

h4 {
    text-align: center;
    margin-bottom: 10px;
}

.no-dice-message,
.no-successes-message {
    text-align: center;
    color: #999;
    margin-top: 10px;
    font-style: italic;
}

/* Engagement Successes Styling */
.engagement-successes-section {
    margin-top: 20px;
    padding-top: 15px;
    margin-top: auto;
    /* Push to bottom */
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

/* Session Information Styling */
.session-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 15px;
    padding: 10px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 5px;
}

.session-id {
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.session-code {
    font-weight: bold;
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
}

.copy-button {
    background-color: #555;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 12px;
    cursor: pointer;
}

.session-status {
    margin-top: 8px;
    padding: 5px 10px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: bold;
}

.status-waiting {
    background-color: #ffeeba;
    color: #856404;
}

.status-ready {
    background-color: #cce5ff;
    color: #004085;
}

.status-rolling {
    background-color: #d1ecf1;
    color: #0c5460;
}

.status-completed {
    background-color: #d4edda;
    color: #155724;
}

/* Join Session Form */
.join-session-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.join-form-content {
    width: 90%;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.input-group {
    display: flex;
    gap: 5px;
}

.input-group input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.or-divider {
    position: relative;
    text-align: center;
    margin: 15px 0;
    color: #888;
}

.or-divider::before,
.or-divider::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background-color: #ddd;
}

.or-divider::before {
    left: 0;
}

.or-divider::after {
    right: 0;
}

.opponent-info {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.waiting-for-opponent {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
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

/* Result dice styling */
.result-die {
    animation: none;
    transition: transform 0.3s ease;
}

/* Maximum roll styling */
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

/* Success tooltip styling */
.success-tooltip {
    position: fixed;
    z-index: 1000;
    background: rgba(30, 30, 30, 0.97);
    color: #fff;
    padding: 14px;
    border-radius: 8px;
    font-size: 12px;
    pointer-events: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
    max-width: 260px;
    white-space: pre-line;
}

.tooltip-description {
    margin-bottom: 8px;
}

.tooltip-source {
    color: #aaa;
    font-size: 10px;
    font-style: italic;
}

/* Floating comparison indicators styling */
.floating-comparisons {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    pointer-events: none;
    /* Allow clicking through the indicators */
    width: 100px;
    margin-top: 12px;
}

.comparison-indicator {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 80px;
    background-color: #000000;
    border: 1px solid #ffffff;
    border-radius: 15px;
    padding: 3px 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.indicator-circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid #ffffff;
}

.indicator-circle.winner {
    background-color: #4caf50;
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.9);
    animation: pulse-win 1.5s infinite;
}

.indicator-circle.loser {
    background-color: transparent;
    box-shadow: none;
}

.indicator-caret {
    padding: 0 5px;
    color: #ffffff;
    font-size: 14px;
    font-weight: bold;
}

.indicator-caret.tie {
    color: #ffffff;
}

.indicator-caret.left-wins {
    color: #ffffff;
}

.indicator-caret.right-wins {
    color: #ffffff;
}

@keyframes pulse-win {
    0% {
        box-shadow: 0 0 5px rgba(76, 175, 80, 0.7);
    }

    50% {
        box-shadow: 0 0 15px rgba(76, 175, 80, 1);
    }

    100% {
        box-shadow: 0 0 5px rgba(76, 175, 80, 0.7);
    }
}
</style>
