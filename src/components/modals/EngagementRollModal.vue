<template>
    <div class="modal-overlay" @click="closeModal">
        <div class="modal-content engagement-roll-modal" @click.stop>
            <!-- Header -->
            <div class="header-row">
                <h2>Engagement</h2>
            </div>

            <!-- Floating comparison indicators -->
            <ResultIndicators v-if="shouldShowComparisons" :comparisons="diceComparisons" :result="engagementResult" />

            <!-- Engagement columns -->
            <div class="engagement-columns">
                <!-- User's column -->
                <CharacterColumn v-bind="userColumnProps" @show-reroll-hover="showRerollHover" @reroll-die="rerollDie"
                    @success-drop="handleSuccessDrop" @remove-success-assignment="removeSuccessAssignment"
                    @start-success-tooltip="startSuccessTooltip" @clear-success-tooltip="clearSuccessTooltip" />

                <!-- Opponent's column -->
                <CharacterColumn v-bind="opponentColumnProps" @start-success-tooltip="startSuccessTooltip"
                    @clear-success-tooltip="clearSuccessTooltip" />
            </div>

            <!-- Modal actions -->
            <div class="modal-actions">
                <!-- Cancel button while waiting -->
                <button v-if="shouldShowCancelButton" class="button button-secondary" @click="closeModal">
                    Cancel
                </button>

                <!-- Engagement resolution -->
                <EngagementResolution v-if="shouldShowResolution" :winner="engagementWinner"
                    :user-accepted="userAccepted" :opponent-accepted="opponentAccepted" :can-accept="showResults"
                    :character-name="character.name" :opponent-name="opponent.characterInfo.name"
                    @toggle-user-accept="toggleUserAccept" />
            </div>

            <!-- Success tooltip -->
            <SuccessTooltip v-if="tooltipSuccess" :success="tooltipSuccess" :position="tooltipPosition" />
        </div>
    </div>
</template>

<script>
import EngagementRollService from '@/services/EngagementRollService';
import CharacterColumn from '@/components/engagement/CharacterColumn.vue';
import ResultIndicators from '@/components/engagement/ResultIndicators.vue';
import EngagementResolution from '@/components/engagement/EngagementResolution.vue';
import SuccessTooltip from '@/components/engagement/SuccessTooltip.vue';
import { useEngagementSession } from '@/composables/useEngagementSession';
import { useSuccessAssignment } from '@/composables/useSuccessAssignment';
import { useEngagementDice } from '@/composables/useEngagementDice';
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import SessionStatus from '@/constants/sessionStatus';
import PlayerSides from '@/constants/playerSides';
import RollTypes from '@/constants/rollTypes';
import EngagementResultTypes from '@/constants/engagementResultTypes';
import EngagementWinnerTypes from '@/constants/engagementWinnerTypes';
import { ref, reactive } from 'vue';


export default {
    components: {
        CharacterColumn,
        ResultIndicators,
        EngagementResolution,
        SuccessTooltip
    },
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
    emits: ['close', 'engagement-committed', 'engagement-results'],
    setup(props, { emit }) {
        // UI Constants
        const DICE_REROLL_ANIMATION_DURATION = 1500 // 1.5 seconds
        const SUCCESS_TOOLTIP_DELAY = 1000 // 1 second

        // Initialize composables
        const sessionManager = useEngagementSession()
        const successManager = useSuccessAssignment()
        const diceManager = useEngagementDice()

        // Tooltip state
        const tooltipTimer = ref(null)
        const tooltipSuccess = ref(null)
        const tooltipPosition = reactive({ x: 0, y: 0 })

        // Computed properties for character art
        const characterArtUrl = computed(() => {
            return (props.character.artUrls && props.character.artUrls.length > 0)
                ? props.character.artUrls[0]
                : props.defaultArtUrl;
        })

        const opponentArtUrl = computed(() => {
            if (!sessionManager.opponent.value || !sessionManager.opponent.value.characterInfo) return props.defaultArtUrl;

            return (sessionManager.opponent.value.characterInfo.artUrls && sessionManager.opponent.value.characterInfo.artUrls.length > 0)
                ? sessionManager.opponent.value.characterInfo.artUrls[0]
                : props.defaultArtUrl;
        })

        // Computed properties for dice
        const sortedSelectedDice = computed(() => {
            return diceManager.getSortedDice(
                props.selectedDice,
                sessionManager.rollResults.value,
                props.character.id,
                PlayerSides.USER
            )
        })

        const sortedOpponentDice = computed(() => {
            if (!sessionManager.opponent.value) return []

            return diceManager.getSortedDice(
                sessionManager.opponent.value.selectedDice,
                sessionManager.rollResults.value,
                props.character.id,
                PlayerSides.OPPONENT,
                sessionManager.opponent.value
            )
        })

        // Computed properties for successes
        const characterSuccesses = computed(() => {
            if (!props.character) return []

            let successIds = []

            // Add user-added engagement successes
            if (props.character.engagementSuccesses && Array.isArray(props.character.engagementSuccesses)) {
                successIds = [...props.character.engagementSuccesses]
            }

            // Add engagement successes from equipment
            if (props.character.equipment && Array.isArray(props.character.equipment) && props.allEquipment && Array.isArray(props.allEquipment)) {
                props.character.equipment.forEach(characterEquipmentItem => {
                    const fullEquipmentItemObject = props.allEquipment.find(eq => eq.id === characterEquipmentItem.id)
                    const isCarriedAndWielded = characterEquipmentItem.isCarried !== false && characterEquipmentItem.isWielding !== false
                    if (isCarriedAndWielded && fullEquipmentItemObject && fullEquipmentItemObject.engagementSuccesses && fullEquipmentItemObject.engagementSuccesses.length > 0) {
                        successIds.push(...fullEquipmentItemObject.engagementSuccesses)
                    }
                })
            }

            // Remove duplicates and map to success objects
            const uniqueSuccessIds = [...new Set(successIds)]
            return uniqueSuccessIds
                .map(id => props.allEngagementSuccesses.find(success => success.id === id))
                .filter(success => success)
                .sort((a, b) => a.name.localeCompare(b.name))
        })

        // Computed properties for template conditional logic
        const shouldShowComparisons = computed(() => {
            return showResults.value && sessionManager.opponent.value
        })

        const shouldShowResolution = computed(() => {
            return sessionManager.opponent.value
        })

        const shouldShowCancelButton = computed(() => {
            return !sessionManager.opponent.value
        })

        // Computed properties for common props to reduce template repetition
        const commonColumnProps = computed(() => ({
            assignedSuccesses: successManager.assignedSuccesses,
            showResults: showResults.value,
            rerollingDice: diceManager.rerollingDice,
            hoverStates: diceManager.hoverStates,
            defaultArtUrl: props.defaultArtUrl,
            allEngagementSuccesses: props.allEngagementSuccesses,
            winner: engagementWinner.value
        }))

        const userColumnProps = computed(() => ({
            ...commonColumnProps.value,
            character: props.character,
            dice: sortedSelectedDice.value,
            successes: characterSuccesses.value,
            side: PlayerSides.USER,
            isOpponent: false,
            canEdit: sessionManager.canEditResults.value
        }))

        const opponentColumnProps = computed(() => ({
            ...commonColumnProps.value,
            character: sessionManager.opponent.value?.characterInfo || null,
            dice: sortedOpponentDice.value,
            successes: [], // Opponent successes are shown only when assigned to dice
            side: PlayerSides.OPPONENT,
            isOpponent: true,
            canEdit: false
        }))

        // Computed properties for results and comparisons
        const showResults = computed(() => {
            return sessionManager.rollResults.value &&
                sessionManager.rollResults.value.session &&
                sessionManager.sessionStatus.value === SessionStatus.COMPLETED
        })

        const diceComparisons = computed(() => {
            if (!showResults.value || !sessionManager.opponent.value) {
                return []
            }

            return diceManager.calculateDiceComparisons(
                sortedSelectedDice.value,
                sortedOpponentDice.value,
                props.character.id,
                sessionManager.opponent.value.characterInfo.id
            )
        })

        const engagementWinner = computed(() => {
            if (!showResults.value || !sessionManager.opponent.value) {
                return null
            }

            return diceManager.determineEngagementWinner(
                diceComparisons.value,
                sortedSelectedDice.value,
                sortedOpponentDice.value
            )
        })

        const winnerText = computed(() => {
            if (!engagementWinner.value) {
                return ''
            }

            switch (engagementWinner.value) {
                case EngagementWinnerTypes.USER:
                    return `${props.character.name} wins`
                case EngagementWinnerTypes.OPPONENT:
                    return `${sessionManager.opponent.value.characterInfo.name} wins`
                case EngagementWinnerTypes.TIE:
                    return 'Draw'
                default:
                    return ''
            }
        })

        const userWinCount = computed(() => {
            if (!showResults.value || diceComparisons.value.length === 0) {
                return 0
            }

            return diceManager.countWins(
                diceComparisons.value,
                PlayerSides.USER,
                props.character.id,
                sessionManager.opponent.value?.characterInfo?.id
            )
        })

        const opponentWinCount = computed(() => {
            if (!showResults.value || diceComparisons.value.length === 0) {
                return 0
            }

            return diceManager.countWins(
                diceComparisons.value,
                PlayerSides.OPPONENT,
                props.character.id,
                sessionManager.opponent.value?.characterInfo?.id
            )
        })

        const drawCount = computed(() => {
            if (!showResults.value || diceComparisons.value.length === 0) {
                return 0
            }

            return diceManager.countTies(diceComparisons.value)
        })

        // Method handlers
        const closeModal = () => {
            // Check if we should show confirmation dialog
            if (sessionManager.shouldShowExitConfirmation.value) {
                if (!confirm('Are you sure you want to leave this engagement?')) {
                    return // User cancelled, don't close
                }
            }

            // Clean up and disconnect
            sessionManager.cancelSession()
            sessionManager.disconnect()

            emit('close')
        }

        const toggleResult = (index) => {
            if (!sessionManager.opponent.value) return

            diceManager.toggleResult(
                index,
                diceComparisons.value,
                props.character.id,
                sessionManager.opponent.value.characterInfo.id
            )
        }

        const showRerollHover = (index, show, player = PlayerSides.USER) => {
            if (!showResults.value) return
            diceManager.showRerollHover(index, show, player)
        }

        const rerollDie = async (player, index) => {
            if (!sessionManager.opponent.value) return

            await diceManager.rerollDie(
                player,
                index,
                props.character.id,
                sortedSelectedDice.value,
                sessionManager.rollResults.value,
                sessionManager.opponent.value,
                successManager.clearSuccessAssignment,
                DICE_REROLL_ANIMATION_DURATION
            )
        }

        const handleSuccessDrop = (player, diceIndex, successData) => {
            successManager.handleSuccessDrop(player, diceIndex, successData, props.character.id)
        }

        const removeSuccessAssignment = (player, diceIndex) => {
            successManager.clearSuccessAssignment(player, diceIndex, props.character.id)
        }

        const startSuccessTooltip = (success, event) => {
            clearTimeout(tooltipTimer.value)
            tooltipTimer.value = setTimeout(() => {
                tooltipSuccess.value = success
                tooltipPosition.x = event.clientX + 12
                tooltipPosition.y = event.clientY + 12
            }, SUCCESS_TOOLTIP_DELAY)
        }

        const clearSuccessTooltip = () => {
            clearTimeout(tooltipTimer.value)
            tooltipSuccess.value = null
        }

        const toggleUserAccept = () => {
            const newAccepted = !sessionManager.userAccepted.value
            sessionManager.updateUserAcceptance(props.character.id, newAccepted)

            // Check if both users have now accepted and emit results
            if (sessionManager.bothUsersAccepted.value) {
                emitEngagementResults()
            }
        }

        const emitEngagementResults = () => {
            if (!sessionManager.opponent.value || !showResults.value) return

            // Determine the result from the user's perspective
            let result
            switch (engagementWinner.value) {
                case EngagementWinnerTypes.USER:
                    result = EngagementResultTypes.WIN
                    break
                case EngagementWinnerTypes.OPPONENT:
                    result = EngagementResultTypes.LOSS
                    break
                case EngagementWinnerTypes.TIE:
                    result = EngagementResultTypes.DRAW
                    break
                default:
                    result = EngagementResultTypes.DRAW
            }

            // Format the engagement result
            const engagementResult = {
                type: RollTypes.ENGAGEMENT,
                characterName: props.character.name,
                opponentName: sessionManager.opponent.value.characterInfo.name,
                result: result,
                userWins: userWinCount.value,
                opponentWins: opponentWinCount.value,
                drawCount: drawCount.value,
                timestamp: Date.now()
            }

            emit('engagement-results', engagementResult)

            // Send engagement results to Discord
            EngagementRollService.sendEngagementResultsToServer(engagementResult)
        }

        // Event handlers for WebSocket events
        const handleDiceComparisonIndicatorUpdated = ({ index, state }) => {
            diceManager.handleRemoteResultUpdate(index, state)
        }

        const handleDieRerolled = ({ player, diceIndex, newValue, characterId }) => {
            if (characterId === props.character.id) return // Don't process our own rerolls

            diceManager.handleRemoteDieReroll(
                player,
                diceIndex,
                newValue,
                characterId,
                props.character.id,
                sortedOpponentDice.value,
                sessionManager.rollResults.value,
                sessionManager.opponent.value,
                DICE_REROLL_ANIMATION_DURATION
            )
        }

        const handleSuccessAssignmentUpdated = ({ characterId, player, diceIndex, successId }) => {
            successManager.handleRemoteSuccessAssignment(
                characterId,
                player,
                diceIndex,
                successId,
                props.character.id,
                sessionManager.opponent.value
            )
        }

        const handleRollResults = ({ session }) => {
            sessionManager.rollResults.value = { session }
            sessionManager.sessionStatus.value = SessionStatus.COMPLETED // Set status to completed

            // Emit event to notify parent that engagement is now committed
            emit('engagement-committed')

            // Reset dice and success state for new results
            diceManager.performInitialSort()
            successManager.resetAssignments()
        }

        // Lifecycle hooks
        onMounted(() => {
            // Initialize session with all handlers
            sessionManager.initializeSession(
                props.character,
                props.selectedDice,
                characterSuccesses.value.map(s => s.id),
                handleDiceComparisonIndicatorUpdated,
                handleDieRerolled,
                handleSuccessAssignmentUpdated,
                handleRollResults
            )
        })

        onBeforeUnmount(() => {
            sessionManager.disconnect()
        })

        // Watch for props changes
        watch(() => props.selectedDice, () => {
            // Handle selected dice changes if needed
        }, { immediate: true })

        return {
            // State from composables
            sessionId: sessionManager.sessionId,
            sessionStatus: sessionManager.sessionStatus,
            opponent: sessionManager.opponent,
            rollResults: sessionManager.rollResults,
            userAccepted: sessionManager.userAccepted,
            opponentAccepted: sessionManager.opponentAccepted,
            assignedSuccesses: successManager.assignedSuccesses,
            tooltipSuccess,
            tooltipPosition,
            rerollingDice: diceManager.rerollingDice,
            hoverStates: diceManager.hoverStates,

            // Computed properties
            characterArtUrl,
            opponentArtUrl,
            sortedSelectedDice,
            sortedOpponentDice,
            characterSuccesses,
            showResults,
            diceComparisons,
            engagementWinner,
            winnerText,
            userWinCount,
            opponentWinCount,
            drawCount,
            canEditResults: sessionManager.canEditResults,

            // Template helper computed properties
            shouldShowComparisons,
            shouldShowResolution,
            shouldShowCancelButton,
            commonColumnProps,
            userColumnProps,
            opponentColumnProps,

            // Methods
            closeModal,
            toggleResult,
            showRerollHover,
            rerollDie,
            handleSuccessDrop,
            removeSuccessAssignment,
            startSuccessTooltip,
            clearSuccessTooltip,
            toggleUserAccept
        }
    }
}
</script>

<style scoped>
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
    margin: 0;
}

.engagement-columns {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    min-height: 350px;
    align-items: stretch;
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

.button-secondary {
    background-color: #ddd;
    color: #333;
}
</style>
