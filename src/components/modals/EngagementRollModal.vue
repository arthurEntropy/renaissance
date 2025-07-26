<template>
    <div class="modal-overlay" @click="closeModal">
        <div class="modal-content engagement-roll-modal" @click.stop>
            <div class="header-row">
                <h2>Engagement Roll</h2>
                <button class="close-button" @click="closeModal">×</button>
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

                <!-- Opponent's column (placeholder for future implementation) -->
                <div class="engagement-column opponent-column">
                    <div class="placeholder-message">
                        Opponent section will be implemented in the future
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

    // Watch for changes to selectedDice prop
    watch: {
        selectedDice: {
            immediate: true,
            handler(newVal) {
                console.log('selectedDice prop changed:', newVal);
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

        // Sort dice from highest to lowest and prepare for display
        sortedSelectedDice() {
            console.log('Modal selectedDice:', this.selectedDice);

            // Check if selectedDice is empty or not an array
            if (!this.selectedDice || !Array.isArray(this.selectedDice) || this.selectedDice.length === 0) {
                return [];
            }

            // Convert plain dice values to objects with class info
            const result = [...this.selectedDice]
                .sort((a, b) => b - a)
                .map(die => ({
                    die: die,
                    class: `df-d${die}-${die}`,
                    isRolling: true
                }));

            console.log('Processed dice:', result);
            return result;
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
        }
    },

    methods: {
        closeModal() {
            this.$emit('close');
        },

        confirmRoll() {
            this.$emit('confirm-roll', this.sortedSelectedDice);
            this.closeModal();
        }
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
</style>
