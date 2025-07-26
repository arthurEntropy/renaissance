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
                        <h4>Selected Dice</h4>
                        <div class="dice-list">
                            <div v-if="sortedSelectedDice.length === 0" class="no-dice-message">
                                No dice selected
                            </div>
                            <span v-for="(die, index) in sortedSelectedDice" :key="index" class="dice-symbol"
                                :class="[`rolling-die-${(index % 3) + 1}`]">
                                <i :class="die.class"></i>
                            </span>
                        </div>
                    </div>

                    <!-- Engagement Successes Section -->
                    <div class="engagement-successes-section">
                        <h4>Engagement Successes</h4>
                        <div class="engagement-successes-list">
                            <div v-if="characterSuccesses.length === 0" class="no-successes-message">
                                No engagement successes available
                            </div>
                            <div v-else class="success-pills">
                                <span v-for="success in characterSuccesses" :key="success.id"
                                    class="engagement-success-pill">
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
                            <h4>Selected Dice</h4>
                            <div class="dice-list">
                                <div v-if="!opponent.selectedDice || opponent.selectedDice.length === 0"
                                    class="no-dice-message">
                                    No dice selected
                                </div>
                                <span v-for="(die, index) in sortedOpponentDice" :key="index" class="dice-symbol"
                                    :class="[`rolling-die-${(index % 3) + 1}`]">
                                    <i :class="die.class"></i>
                                </span>
                            </div>
                        </div>

                        <!-- Opponent Engagement Successes Section -->
                        <div class="engagement-successes-section">
                            <h4>Engagement Successes</h4>
                            <div class="engagement-successes-list">
                                <div v-if="!opponent.engagementSuccesses || opponent.engagementSuccesses.length === 0"
                                    class="no-successes-message">
                                    No engagement successes available
                                </div>
                                <div v-else class="success-pills">
                                    <span v-for="(successId, idx) in opponent.engagementSuccesses" :key="idx"
                                        class="engagement-success-pill">
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
            showResults: false
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

            // Convert plain dice values to objects with class info
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

            // Connect to the WebSocket server
            engagementService.connect();

            // Set up event listeners
            this.setupEngagementListeners();

            // Auto-join or create a session
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
            engagementService.on('roll-results', ({ session: sessionData }) => {
                this.sessionStatus = 'completed';
                this.rollResults = sessionData;
                this.showResults = true;

                // Handle roll results display (to be implemented)
            });
        },

        getSuccessName(successId) {
            const success = this.allEngagementSuccesses.find(s => s.id === successId);
            return success ? success.name : 'Unknown Success';
        }
    },

    mounted() {
        // Initialize the session when the component mounts
        this.initSession();
    },

    beforeUnmount() {
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
    gap: 20px;
    margin-bottom: 20px;
}

.engagement-column {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 15px;
    background-color: rgba(0, 0, 0, 0.05);
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
}

.dice-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
}

.dice-symbol {
    font-size: 36px;
    display: inline-block;
    position: relative;
    color: inherit;
    margin: 0 5px;
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
    border-top: 1px solid #ddd;
    padding-top: 15px;
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
    display: inline-block;
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
</style>
