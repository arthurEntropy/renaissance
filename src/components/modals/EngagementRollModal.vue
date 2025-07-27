<template>
    <div class="modal-overlay" @click="closeModal">
        <div class="modal-content engagement-roll-modal" @click.stop>
            <div class="header-row">
                <h2>Engagement Roll</h2>
            </div>

            <!-- Floating comparison indicators -->
            <div v-if="showResults && opponent" class="floating-comparisons">
                <div v-for="(pair, index) in diceComparisons" :key="index" class="comparison-indicator" :class="{
                    'user-wins-pair': pair.leftWins && engagementWinner === 'user',
                    'opponent-wins-pair': pair.rightWins && engagementWinner === 'opponent',
                    'user-loses-pair': pair.leftWins && engagementWinner === 'opponent',
                    'opponent-loses-pair': pair.rightWins && engagementWinner === 'user',
                    'tie-pair': pair.tie
                }" :style="{ top: `${190 + (pair.index * 48)}px` }">
                    <div class="indicator-circle"
                        :class="{ 'winner': pair.leftWins, 'loser': !pair.leftWins && !pair.tie }"></div>
                    <div class="indicator-caret" @click.stop="canEditResults ? toggleResult(index) : null"
                        :class="{ 'left-wins': pair.leftWins, 'right-wins': pair.rightWins, 'tie': pair.tie, 'clickable': canEditResults }">
                        <span v-if="pair.tie">◉</span>
                        <span v-else-if="pair.leftWins">◀</span>
                        <span v-else>▶</span>
                    </div>
                    <div class="indicator-circle"
                        :class="{ 'winner': pair.rightWins, 'loser': !pair.rightWins && !pair.tie }"></div>
                </div>
            </div>

            <div class="engagement-columns">
                <!-- User's column -->
                <div class="engagement-column user-column" :class="{
                    'winner-column': showResults && engagementWinner === 'user',
                    'loser-column': showResults && engagementWinner === 'opponent'
                }">
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
                            <div v-for="(die, index) in sortedSelectedDice" :key="index" class="dice-container"
                                @mouseenter="showRerollHover(index, true)" @mouseleave="showRerollHover(index, false)">
                                <!-- Success assignment drop zone (left side for user) - positioned absolutely -->
                                <div v-if="die.isMax && showResults" class="success-drop-zone left-side"
                                    :class="{ disabled: !canEditResults }"
                                    @drop="canEditResults ? onSuccessDrop($event, 'user', index) : null"
                                    @dragover.prevent @dragenter.prevent>
                                    <div v-if="assignedSuccesses[`user-${index}`]" class="assigned-success-pill"
                                        @mouseenter="startSuccessTooltip(allEngagementSuccesses.find(s => s.id === assignedSuccesses[`user-${index}`]), $event)"
                                        @mouseleave="clearSuccessTooltip">
                                        {{ getSuccessName(assignedSuccesses[`user-${index}`]) }}
                                        <span v-if="canEditResults" class="remove-success-btn"
                                            @click.stop="removeSuccessAssignment('user', index)">×</span>
                                    </div>
                                    <div v-else class="success-outline"></div>
                                </div>

                                <span class="dice-symbol" :class="{
                                    [`rolling-die-${(index % 3) + 1}`]: die.isRolling || rerollingDice.has(`user-${index}`),
                                    'result-die': !die.isRolling && !rerollingDice.has(`user-${index}`),
                                    'max-result': die.isMax,
                                    'rerolling': rerollingDice.has(`user-${index}`)
                                }">
                                    <i :class="die.class"></i>
                                    <span v-if="die.isMax && !rerollingDice.has(`user-${index}`)"
                                        class="max-indicator">✨</span>
                                </span>
                                <!-- Reroll hover link - only for user's own dice -->
                                <div v-if="showResults && !die.isRolling && !rerollingDice.has(`user-${index}`) && hoverStates[`user-${index}`] && canEditResults"
                                    class="reroll-hover" @click="rerollDie('user', index)">
                                    Reroll
                                </div>
                            </div>
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
                                    class="engagement-success-pill draggable-success" :draggable="canEditResults"
                                    @dragstart="onSuccessDragStart($event, success)"
                                    @mouseenter="startSuccessTooltip(success, $event)"
                                    @mouseleave="clearSuccessTooltip">
                                    {{ success.name }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Opponent's column -->
                <div class="engagement-column opponent-column" :class="{
                    'winner-column': showResults && engagementWinner === 'opponent',
                    'loser-column': showResults && engagementWinner === 'user'
                }">
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
                                <div v-for="(die, index) in sortedOpponentDice" :key="index" class="dice-container">
                                    <span class="dice-symbol" :class="{
                                        [`rolling-die-${(index % 3) + 1}`]: die.isRolling || rerollingDice.has(`opponent-${index}`),
                                        'result-die': !die.isRolling && !rerollingDice.has(`opponent-${index}`),
                                        'max-result': die.isMax,
                                        'rerolling': rerollingDice.has(`opponent-${index}`)
                                    }">
                                        <i :class="die.class"></i>
                                        <span v-if="die.isMax && !rerollingDice.has(`opponent-${index}`)"
                                            class="max-indicator">✨</span>
                                    </span>

                                    <!-- Success assignment display (right side for opponent) - positioned absolutely -->
                                    <div v-if="die.isMax && showResults" class="success-display-zone right-side">
                                        <div v-if="assignedSuccesses[`opponent-${index}`]" class="assigned-success-pill"
                                            @mouseenter="startSuccessTooltip(allEngagementSuccesses.find(s => s.id === assignedSuccesses[`opponent-${index}`]), $event)"
                                            @mouseleave="clearSuccessTooltip">
                                            {{ getSuccessName(assignedSuccesses[`opponent-${index}`]) }}
                                        </div>
                                        <div v-else class="success-outline"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Opponent Engagement Successes Section - Hidden from view but preserve space -->
                        <div class="engagement-successes-section opponent-successes-hidden">
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
                <!-- Show Cancel button only while waiting for opponent -->
                <button v-if="!opponent" class="button button-secondary" @click="closeModal">
                    Cancel
                </button>

                <!-- Show engagement resolution UI when opponent is present -->
                <div v-if="opponent" class="engagement-resolution">
                    <div class="result-label">Result:</div>
                    <div class="result-row">
                        <button class="button button-gold accept-btn user-accept"
                            :class="{ 'accepted': userAccepted, 'disabled': !showResults }" :disabled="!showResults"
                            @click="toggleUserAccept">
                            {{ userAccepted ? '✓' : 'Accept' }}
                        </button>
                        <div class="winner-announcement" :class="{ 'both-accepted': userAccepted && opponentAccepted }">
                            {{ winnerText }}
                        </div>
                        <button class="button opponent-status-btn"
                            :class="{ 'accepted': opponentAccepted, 'waiting': !opponentAccepted }" disabled>
                            {{ opponentAccepted ? '✓' : 'Waiting...' }}
                        </button>
                    </div>
                </div>
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
            tooltipTimer: null,
            manualResults: [], // Array to store manually adjusted results
            isUpdatingResultLocally: false, // Flag to prevent infinite loops
            rerollingDice: new Set(), // Track which dice are currently rerolling
            hoverStates: {}, // Track hover states for reroll buttons
            assignedSuccesses: {}, // Track success assignments to dice: { 'user-0': successId, 'opponent-1': successId }
            // Dice sorting state to maintain order after rerolls
            initialSortDone: false,
            sortedOrder: null,
            opponentInitialSortDone: false,
            opponentSortedOrder: null,
            // Event handler references for cleanup
            sessionCreatedHandler: null,
            sessionUpdatedHandler: null,
            userLeftHandler: null,
            sessionCancelledHandler: null,
            rollResultsHandler: null,
            resultIndicatorUpdatedHandler: null,
            dieRerolledHandler: null,
            successAssignmentUpdatedHandler: null,
            acceptanceStateUpdatedHandler: null,
            // Acceptance tracking
            userAccepted: false,
            opponentAccepted: false
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
                            isMax: isMax,
                            originalIndex: index // Track original position for reroll updates
                        };
                    });

                    // Return sorted order if it exists, otherwise create initial sort
                    if (this.sortedOrder) {
                        // Keep existing order but update values
                        this.sortedOrder.forEach((sortedDie) => {
                            const originalDie = diceWithResults.find(d => d.originalIndex === sortedDie.originalIndex);
                            if (originalDie) {
                                sortedDie.value = originalDie.value;
                                sortedDie.class = originalDie.class;
                                sortedDie.isMax = originalDie.isMax;
                            }
                        });
                        return this.sortedOrder;
                    } else {
                        // Initial sort needed - this should be handled by a method call
                        return diceWithResults.sort((a, b) => b.value - a.value);
                    }
                }
            }

            // Convert plain dice values to objects with class info
            return [...this.selectedDice]
                .sort((a, b) => b - a)
                .map((die) => ({
                    die: die,
                    class: `df-d${die}-${die}`,
                    isRolling: true,
                    originalIndex: this.selectedDice.indexOf(die) // Track original position
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
                            isMax: isMax,
                            originalIndex: index // Track original position for reroll updates
                        };
                    });

                    // Return sorted order if it exists, otherwise create initial sort
                    if (this.opponentSortedOrder) {
                        // Keep existing order but update values
                        this.opponentSortedOrder.forEach((sortedDie) => {
                            const originalDie = diceWithResults.find(d => d.originalIndex === sortedDie.originalIndex);
                            if (originalDie) {
                                sortedDie.value = originalDie.value;
                                sortedDie.class = originalDie.class;
                                sortedDie.isMax = originalDie.isMax;
                            }
                        });
                        return this.opponentSortedOrder;
                    } else {
                        // Initial sort needed - this should be handled by a method call
                        return diceWithResults.sort((a, b) => b.value - a.value);
                    }
                }
            }

            // Convert plain dice values to objects with class info
            return [...this.opponent.selectedDice]
                .sort((a, b) => b - a)
                .map((die) => ({
                    die: die,
                    class: `df-d${die}-${die}`,
                    isRolling: true,
                    originalIndex: this.opponent.selectedDice.indexOf(die) // Track original position
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
                // Check if there's a manual result for this index
                if (this.manualResults[i]) {
                    // Convert character-based result to UI position for this user
                    const manualResult = this.manualResults[i];
                    const leftWins = manualResult.winnerCharacterId === this.character.id;
                    const rightWins = manualResult.winnerCharacterId === this.opponent.characterInfo.id;
                    const tie = !manualResult.winnerCharacterId;

                    comparisons.push({
                        leftWins,
                        rightWins,
                        tie,
                        index: i,
                        winnerCharacterId: manualResult.winnerCharacterId
                    });
                    continue;
                }

                const userDie = i < userDice.length ? userDice[i] : null;
                const opponentDie = i < opponentDice.length ? opponentDice[i] : null;

                // If only one side has a die, that side wins automatically
                if (!userDie && opponentDie) {
                    // Opponent wins this pair
                    comparisons.push({
                        leftWins: false,
                        rightWins: true,
                        tie: false,
                        index: i,
                        winnerCharacterId: this.opponent.characterInfo.id
                    });
                } else if (userDie && !opponentDie) {
                    // User wins this pair
                    comparisons.push({
                        leftWins: true,
                        rightWins: false,
                        tie: false,
                        index: i,
                        winnerCharacterId: this.character.id
                    });
                } else if (userDie && opponentDie && !userDie.isRolling && !opponentDie.isRolling &&
                    userDie.value !== undefined && opponentDie.value !== undefined) {
                    // Both sides have dice with values
                    const userWins = userDie.value > opponentDie.value;
                    const opponentWins = opponentDie.value > userDie.value;
                    const tie = userDie.value === opponentDie.value;

                    let winnerCharacterId = null;
                    if (userWins) {
                        winnerCharacterId = this.character.id;
                    } else if (opponentWins) {
                        winnerCharacterId = this.opponent.characterInfo.id;
                    }

                    comparisons.push({
                        leftWins: userWins,
                        rightWins: opponentWins,
                        tie,
                        index: i,
                        winnerCharacterId
                    });
                }
            }

            return comparisons;
        },

        // Determine who wins the overall engagement based on dice comparisons
        engagementWinner() {
            if (!this.showResults || !this.opponent || this.diceComparisons.length === 0) {
                return null;
            }

            let userWins = 0;
            let opponentWins = 0;

            this.diceComparisons.forEach(comparison => {
                if (comparison.leftWins) {
                    userWins++;
                } else if (comparison.rightWins) {
                    opponentWins++;
                }
                // Ties don't count for either side
            });

            if (userWins > opponentWins) {
                return 'user';
            } else if (opponentWins > userWins) {
                return 'opponent';
            } else {
                return 'tie';
            }
        },

        // Generate winner announcement text
        winnerText() {
            if (!this.engagementWinner) {
                return '';
            }

            switch (this.engagementWinner) {
                case 'user':
                    return `${this.character.name} wins`;
                case 'opponent':
                    return `${this.opponent.characterInfo.name} wins`;
                case 'tie':
                    return 'Draw';
                default:
                    return '';
            }
        },

        // Check if editing is allowed (not locked by either user accepting)
        canEditResults() {
            return !this.userAccepted && !this.opponentAccepted;
        }
    },

    methods: {
        closeModal() {
            // Clean up event listeners first
            this.cleanupEngagementListeners();

            // If in a session, leave it
            if (this.sessionId) {
                engagementService.cancelSession();
            }

            // Only disconnect if no other components are using the service
            // (In practice, this is safe since each modal instance is independent)
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
            // Store references to the bound functions for cleanup
            this.sessionCreatedHandler = ({ sessionId, session }) => {
                this.sessionId = sessionId;
                this.sessionStatus = session.state;
            };

            this.sessionUpdatedHandler = ({ session }) => {
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
            };

            this.userLeftHandler = ({ message }) => {
                this.opponent = null;
                this.sessionStatus = 'waiting';
                alert(message);
            };

            this.sessionCancelledHandler = ({ message }) => {
                alert(message);
                this.sessionId = null;
                this.sessionStatus = 'waiting';
                this.opponent = null;
            };

            this.rollResultsHandler = ({ session }) => {
                this.sessionStatus = 'completed';
                this.rollResults = { session };

                // Reset sorting state to allow initial sort based on roll results
                this.initialSortDone = false;
                this.sortedOrder = null;
                this.opponentInitialSortDone = false;
                this.opponentSortedOrder = null;

                // Reset success assignments when new results come in
                this.assignedSuccesses = {};

                // Perform initial sort now that we have results
                this.performInitialSort();

                // Stop the dice rolling animation and show results
                setTimeout(() => {
                    // Force a re-computation of the sorted dice arrays to show the results
                    // This is needed since Vue might not detect the nested property change
                    this.$forceUpdate();
                }, 100);
            };

            this.resultIndicatorUpdatedHandler = ({ index, state }) => {
                // Prevent infinite loops by checking if this is a remote update
                if (this.isUpdatingResultLocally) {
                    return;
                }

                // Create a new array to ensure reactivity
                const newManualResults = [...this.manualResults];
                // Update the state at the specified index with the character-based state
                newManualResults[index] = state;
                // Replace the entire array to trigger reactivity
                this.manualResults = newManualResults;
            };

            this.dieRerolledHandler = ({ player, diceIndex, newValue, characterId }) => {
                // Don't process our own rerolls
                if (characterId === this.character.id) {
                    return;
                }

                // Find the target dice array and update the rerolled die
                let targetDice, targetArray;

                if (player === 'user' && this.character.id !== characterId) {
                    // This is actually the opponent from our perspective
                    targetArray = this.sortedOpponentDice;
                    targetDice = targetArray[diceIndex];
                } else if (player === 'opponent' && this.opponent && this.opponent.characterInfo.id === characterId) {
                    // This is the opponent rerolling
                    targetArray = this.sortedOpponentDice;
                    targetDice = targetArray[diceIndex];
                }

                if (targetDice) {
                    // Show reroll animation
                    this.rerollingDice.add(`opponent-${diceIndex}`);

                    // Show max value while rerolling
                    const originalDieSize = targetDice.die;
                    targetDice.class = `df-d${originalDieSize}-${originalDieSize}`;
                    targetDice.isMax = false;

                    // After animation, show new result
                    setTimeout(() => {
                        const isNewMax = newValue === originalDieSize;
                        targetDice.value = newValue;
                        targetDice.class = `df-d${originalDieSize}-${newValue}`;
                        targetDice.isMax = isNewMax;

                        // Remove from rerolling set
                        this.rerollingDice.delete(`opponent-${diceIndex}`);

                        // Update the session data
                        this.updateOpponentRollResults(diceIndex, newValue);

                        // Force reactivity update
                        this.$forceUpdate();

                        // Recalculate comparisons
                        this.recalculateComparisons();
                    }, 1500);
                }
            };

            this.successAssignmentUpdatedHandler = ({ characterId, player, diceIndex, successId }) => {
                console.log('Received success assignment update:', { characterId, player, diceIndex, successId, myCharacterId: this.character.id });

                // Don't process our own assignments
                if (characterId === this.character.id) {
                    console.log('Ignoring own assignment update');
                    return;
                }

                // Translate the assignment to the correct UI position from this user's perspective
                let targetKey;
                if (characterId === this.character.id) {
                    // This is our own assignment (shouldn't happen due to check above, but just in case)
                    targetKey = `${player}-${diceIndex}`;
                } else if (this.opponent && characterId === this.opponent.characterInfo.id) {
                    // This is the opponent's assignment - translate to opponent column
                    targetKey = `opponent-${diceIndex}`;
                } else {
                    console.log('Unknown character ID:', characterId);
                    return;
                }

                // Update the assigned successes
                if (successId) {
                    console.log('Adding assignment:', targetKey, successId);
                    this.assignedSuccesses[targetKey] = successId;
                } else {
                    // Remove assignment if successId is null
                    console.log('Removing assignment:', targetKey);
                    delete this.assignedSuccesses[targetKey];
                }

                // Force reactivity update
                this.$forceUpdate();
            };

            this.acceptanceStateUpdatedHandler = ({ characterId, accepted }) => {
                console.log('Received acceptance state update:', { characterId, accepted, myCharacterId: this.character.id });

                // Don't process our own acceptance state updates
                if (characterId === this.character.id) {
                    console.log('Ignoring own acceptance state update');
                    return;
                }

                // Update opponent's acceptance state
                if (this.opponent && characterId === this.opponent.characterInfo.id) {
                    console.log('Updating opponent acceptance state:', accepted);
                    this.opponentAccepted = accepted;
                } else {
                    console.log('Unknown character ID for acceptance:', characterId);
                }
            };

            // Set up event listeners
            engagementService.on('session-created', this.sessionCreatedHandler);
            engagementService.on('session-updated', this.sessionUpdatedHandler);
            engagementService.on('user-left', this.userLeftHandler);
            engagementService.on('session-cancelled', this.sessionCancelledHandler);
            engagementService.on('roll-results', this.rollResultsHandler);
            engagementService.on('result-indicator-updated', this.resultIndicatorUpdatedHandler);
            engagementService.on('die-rerolled', this.dieRerolledHandler);
            engagementService.on('success-assignment-updated', this.successAssignmentUpdatedHandler);
            engagementService.on('acceptance-state-updated', this.acceptanceStateUpdatedHandler);
        },

        cleanupEngagementListeners() {
            if (this.sessionCreatedHandler) {
                engagementService.off('session-created', this.sessionCreatedHandler);
            }
            if (this.sessionUpdatedHandler) {
                engagementService.off('session-updated', this.sessionUpdatedHandler);
            }
            if (this.userLeftHandler) {
                engagementService.off('user-left', this.userLeftHandler);
            }
            if (this.sessionCancelledHandler) {
                engagementService.off('session-cancelled', this.sessionCancelledHandler);
            }
            if (this.rollResultsHandler) {
                engagementService.off('roll-results', this.rollResultsHandler);
            }
            if (this.resultIndicatorUpdatedHandler) {
                engagementService.off('result-indicator-updated', this.resultIndicatorUpdatedHandler);
            }
            if (this.dieRerolledHandler) {
                engagementService.off('die-rerolled', this.dieRerolledHandler);
            }
            if (this.successAssignmentUpdatedHandler) {
                engagementService.off('success-assignment-updated', this.successAssignmentUpdatedHandler);
            }
            if (this.acceptanceStateUpdatedHandler) {
                engagementService.off('acceptance-state-updated', this.acceptanceStateUpdatedHandler);
            }
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
        },

        toggleResult(index) {
            // Prevent concurrent updates
            if (this.isUpdatingResultLocally) {
                return;
            }

            this.isUpdatingResultLocally = true;

            try {
                // Initialize manualResults array if needed
                if (!this.manualResults[index]) {
                    const pair = this.diceComparisons[index];

                    // Create a new array to ensure reactivity
                    const newManualResults = [...this.manualResults];
                    // Initialize with the current state - store character ID instead of UI position
                    newManualResults[index] = {
                        winnerCharacterId: pair.winnerCharacterId,
                        index: pair.index
                    };
                    // Replace the entire array to trigger reactivity
                    this.manualResults = newManualResults;
                }

                // Get the current result state
                const result = this.manualResults[index];
                let newState;

                // Cycle through the states based on character wins: user win -> tie -> opponent win -> tie -> user win
                if (result.winnerCharacterId === this.character.id) {
                    // Change from user win to tie
                    newState = {
                        winnerCharacterId: null, // null means tie
                        index: result.index,
                        wasOpponentWin: false
                    };
                } else if (!result.winnerCharacterId) {
                    // Currently tied - check if we were cycling from user or opponent
                    if (!result.wasOpponentWin) {
                        // Go to opponent win
                        newState = {
                            winnerCharacterId: this.opponent.characterInfo.id,
                            index: result.index,
                            wasOpponentWin: true
                        };
                    } else {
                        // Go back to user win
                        newState = {
                            winnerCharacterId: this.character.id,
                            index: result.index
                        };
                    }
                } else if (result.winnerCharacterId === this.opponent.characterInfo.id) {
                    // Change from opponent win to tie
                    newState = {
                        winnerCharacterId: null, // null means tie
                        index: result.index,
                        wasOpponentWin: true
                    };
                }

                // Create a new array to ensure reactivity
                const newManualResults = [...this.manualResults];
                // Update the state at the specified index
                newManualResults[index] = newState;
                // Replace the entire array to trigger reactivity
                this.manualResults = newManualResults;

                // Broadcast the change to other users
                engagementService.updateResultIndicator(index, newState);
            } finally {
                // Always reset the flag, even if an error occurs
                setTimeout(() => {
                    this.isUpdatingResultLocally = false;
                }, 100);
            }
        },

        showRerollHover(index, show, player = 'user') {
            // Only show reroll hover if we have results and dice aren't rolling
            if (!this.showResults) return;

            const key = `${player}-${index}`;
            // In Vue 3, we can directly assign to reactive objects
            this.hoverStates[key] = show;
        },

        rerollDie(player, index) {
            const rerollKey = `${player}-${index}`;
            const assignmentKey = `${player}-${index}`;

            // Clear any assigned success for this die since it's being rerolled
            if (this.assignedSuccesses[assignmentKey]) {
                delete this.assignedSuccesses[assignmentKey];
                // Broadcast the assignment removal to other users
                engagementService.updateSuccessAssignment(this.character.id, player, index, null);
            }

            // Mark this die as rerolling
            this.rerollingDice.add(rerollKey);

            // Update the die to show max value while spinning
            let targetDice, originalDieSize;

            if (player === 'user') {
                targetDice = this.sortedSelectedDice[index];
                originalDieSize = targetDice.die;
            } else {
                targetDice = this.sortedOpponentDice[index];
                originalDieSize = targetDice.die;
            }

            // Show max value while rerolling
            targetDice.class = `df-d${originalDieSize}-${originalDieSize}`;
            targetDice.isMax = false; // Hide the sparkle during reroll

            // Roll new value immediately
            const newValue = Math.floor(Math.random() * originalDieSize) + 1;
            const isNewMax = newValue === originalDieSize;

            // Broadcast the reroll to other users immediately
            engagementService.rerollDie(player, index, newValue, this.character.id);

            // After animation completes, show new result
            setTimeout(() => {
                // Update the die with new result (but keep it in the same position)
                targetDice.value = newValue;
                targetDice.class = `df-d${originalDieSize}-${newValue}`;
                targetDice.isMax = isNewMax;

                // Remove from rerolling set
                this.rerollingDice.delete(rerollKey);

                // Update the roll results in the session data
                this.updateRollResultsAfterReroll(player, index, newValue);

                // Force reactivity update
                this.$forceUpdate();

                // Clear any manual results for affected comparisons and recalculate
                this.recalculateComparisons();

            }, 1500); // 1.5 second animation
        },

        updateRollResultsAfterReroll(player, diceIndex, newValue) {
            if (!this.rollResults || !this.rollResults.session) return;

            let targetUser;

            if (player === 'user') {
                targetUser = this.rollResults.session.users.find(
                    user => user.characterInfo.id === this.character.id
                );
            } else {
                targetUser = this.rollResults.session.users.find(
                    user => user.socketId === this.opponent.socketId
                );
            }

            if (targetUser && targetUser.rollResults) {
                const sortedArray = player === 'user' ? this.sortedSelectedDice : this.sortedOpponentDice;

                // Get the die that was rerolled from the sorted array
                const rerolledDie = sortedArray[diceIndex];

                // Find the original index of this specific die instance
                // We need to track which original die this sorted position represents
                if (rerolledDie && rerolledDie.originalIndex !== undefined) {
                    // Update the roll result at the original index
                    targetUser.rollResults[rerolledDie.originalIndex] = newValue;

                    // Recalculate total
                    targetUser.rollTotal = targetUser.rollResults.reduce((sum, value) => sum + value, 0);
                } else {
                    // Fallback: find matching die size (this is less precise but works for simple cases)
                    const originalArray = player === 'user' ? this.selectedDice : this.opponent.selectedDice;
                    const targetDieSize = rerolledDie.die;

                    let originalIndex = -1;
                    for (let i = 0; i < originalArray.length; i++) {
                        if (originalArray[i] === targetDieSize && targetUser.rollResults[i] === rerolledDie.value) {
                            originalIndex = i;
                            break;
                        }
                    }

                    if (originalIndex !== -1) {
                        targetUser.rollResults[originalIndex] = newValue;
                        targetUser.rollTotal = targetUser.rollResults.reduce((sum, value) => sum + value, 0);
                    }
                }
            }
        },

        updateOpponentRollResults(diceIndex, newValue) {
            if (!this.rollResults || !this.rollResults.session || !this.opponent) return;

            const opponentUser = this.rollResults.session.users.find(
                user => user.socketId === this.opponent.socketId
            );

            if (opponentUser && opponentUser.rollResults) {
                const rerolledDie = this.sortedOpponentDice[diceIndex];

                if (rerolledDie && rerolledDie.originalIndex !== undefined) {
                    // Update the roll result at the original index
                    opponentUser.rollResults[rerolledDie.originalIndex] = newValue;

                    // Recalculate total
                    opponentUser.rollTotal = opponentUser.rollResults.reduce((sum, value) => sum + value, 0);
                }
            }
        },

        recalculateComparisons() {
            // Clear manual results to force recalculation based on new die values
            this.manualResults = [];

            // Force the diceComparisons computed property to recalculate
            this.$nextTick(() => {
                this.$forceUpdate();
            });
        },

        onSuccessDragStart(event, success) {
            // Prevent drag if editing is locked
            if (!this.canEditResults) {
                event.preventDefault();
                return;
            }

            // Store the success data for the drop event
            event.dataTransfer.setData('application/json', JSON.stringify(success));
            event.dataTransfer.effectAllowed = 'copy';
        },

        onSuccessDrop(event, player, diceIndex) {
            event.preventDefault();

            try {
                const successData = JSON.parse(event.dataTransfer.getData('application/json'));
                const key = `${player}-${diceIndex}`;

                // Check if there's already an assignment and it's different
                const previousAssignment = this.assignedSuccesses[key];
                const newAssignment = successData.id;

                console.log('Success drop:', { key, previousAssignment, newAssignment, characterId: this.character.id });

                // Only update if the assignment is actually changing
                if (previousAssignment !== newAssignment) {
                    // Assign the success to this die
                    this.assignedSuccesses[key] = newAssignment;

                    // Broadcast this assignment with character context
                    console.log('Broadcasting success assignment:', { key, newAssignment, characterId: this.character.id });
                    engagementService.updateSuccessAssignment(this.character.id, player, diceIndex, newAssignment);
                }

            } catch (error) {
                console.error('Error handling success drop:', error);
            }
        },

        removeSuccessAssignment(player, diceIndex) {
            const key = `${player}-${diceIndex}`;

            if (this.assignedSuccesses[key]) {
                // Remove the assignment locally
                delete this.assignedSuccesses[key];

                // Broadcast the removal to other users via WebSocket
                engagementService.updateSuccessAssignment(this.character.id, player, diceIndex, null);
            }
        },

        performInitialSort() {
            // Perform initial sort for user dice
            if (this.rollResults && this.rollResults.session && !this.initialSortDone) {
                const userResults = this.rollResults.session.users.find(
                    user => user.characterInfo.id === this.character.id
                );

                if (userResults && userResults.rollResults) {
                    const diceWithResults = [...this.selectedDice].map((die, index) => {
                        const value = userResults.rollResults[index] || 1;
                        const isMax = value === die;
                        return {
                            die: die,
                            value: value,
                            class: `df-d${die}-${value}`,
                            isRolling: false,
                            isMax: isMax,
                            originalIndex: index
                        };
                    });

                    this.sortedOrder = diceWithResults.sort((a, b) => b.value - a.value);
                    this.initialSortDone = true;
                }
            }

            // Perform initial sort for opponent dice
            if (this.rollResults && this.rollResults.session && !this.opponentInitialSortDone && this.opponent) {
                const opponentResults = this.rollResults.session.users.find(
                    user => user.socketId === this.opponent.socketId
                );

                if (opponentResults && opponentResults.rollResults) {
                    const diceWithResults = [...this.opponent.selectedDice].map((die, index) => {
                        const value = opponentResults.rollResults[index] || 1;
                        const isMax = value === die;
                        return {
                            die: die,
                            value: value,
                            class: `df-d${die}-${value}`,
                            isRolling: false,
                            isMax: isMax,
                            originalIndex: index
                        };
                    });

                    this.opponentSortedOrder = diceWithResults.sort((a, b) => b.value - a.value);
                    this.opponentInitialSortDone = true;
                }
            }
        },

        acceptResult(side) {
            if (side === 'user') {
                this.userAccepted = true;
            } else if (side === 'opponent') {
                this.opponentAccepted = true;
            }

            // TODO: Add WebSocket broadcasting for acceptance state
            // For now, just handle local state
        },

        toggleUserAccept() {
            this.userAccepted = !this.userAccepted;

            // Broadcast the acceptance state to other users
            console.log('Broadcasting acceptance state:', { characterId: this.character.id, accepted: this.userAccepted });
            engagementService.updateAcceptanceState(this.character.id, this.userAccepted);
        }
    },

    mounted() {
        // Initialize the session when the component mounts
        this.initSession();
    },

    beforeUnmount() {
        // Clean up event listeners first
        this.cleanupEngagementListeners();
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
    /* Fixed height for better alignment */
    line-height: 1;
    /* Make all dice the same size as result dice */
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

/* Rerolling animation - faster spin */
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

.button-gold {
    background-color: #d4b666;
    color: #000;
    transition: background-color 0.3s ease;
}

.button-gold:hover {
    background-color: #c9a84d;
}

.button-gold.accepted {
    background-color: #4caf50;
    color: white;
}

.button-secondary {
    background-color: #ddd;
    color: #333;
}

/* Engagement Resolution Styling */
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

.accept-btn {
    min-width: 60px;
    width: 80px;
    padding: 6px 12px;
    font-size: 14px;
    flex-shrink: 0;
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

.opponent-status-btn.accepted {
    background-color: #4caf50;
    color: white;
    font-style: normal;
    font-weight: bold;
}

.opponent-status-btn.waiting {
    font-style: italic;
    font-weight: normal;
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

/* Winner Column Styling */
.winner-column {
    border: 2px solid #4caf50 !important;
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
}

/* Loser Column Styling */
.loser-column {
    border: 2px solid #f44336 !important;
    box-shadow: 0 0 15px rgba(244, 67, 54, 0.3);
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
    border: 2px solid #666;
    border-radius: 15px;
    padding: 3px 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    height: 28px;
    left: -7px;
}

.comparison-indicator.user-wins-pair,
.comparison-indicator.opponent-wins-pair {
    border: 2px solid #4caf50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
}

.comparison-indicator.user-loses-pair,
.comparison-indicator.opponent-loses-pair {
    border: 2px solid #f44336;
    box-shadow: 0 0 10px rgba(244, 67, 54, 0.4);
}

.comparison-indicator.tie-pair {
    border: 2px solid #ffeb3b;
    box-shadow: 0 0 10px rgba(255, 235, 59, 0.4);
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
    padding: 0px 5px;
    color: #ffffff;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
}

.indicator-caret.clickable {
    cursor: pointer;
    pointer-events: auto;
}

.indicator-caret.clickable:hover {
    transform: scale(1.2);
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
}

.indicator-caret.tie {
    color: #ffeb3b;
    text-shadow: 0 0 5px rgba(255, 235, 59, 0.8);
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
