<template>
    <div class="roll-outcome-container">
        <!-- Roll Numbers -->
        <transition name="simple-fade" appear>
            <div v-if="!isRolling" class="roll-numbers">
                <span v-if="isEngagement" class="engagement-score">
                    <span class="user-wins">{{ rollData.userWins }}</span>
                    <span class="score-separator">to</span>
                    <span class="opponent-wins">{{ rollData.opponentWins }}</span>
                    <span v-if="rollData.drawCount && rollData.drawCount > 0" class="draw-count">
                        , <span class="draw-number">{{ rollData.drawCount }}</span> {{ rollData.drawCount === 1 ? 'draw'
                            : 'draws' }}
                    </span>
                </span>
                <span v-else-if="isOpposedSkillCheck" class="opposed-score">
                    <span class="user-total">{{ rollData.userTotal }}</span>
                    <span class="score-separator">vs</span>
                    <span class="opponent-total">{{ rollData.opponentTotal }}</span>
                </span>
                <span v-else-if="isCustomRoll || isInitiative">
                    <span class="roll-total custom-roll">{{ rollData.total }}</span>
                    <span v-if="rollData.modifier !== 0" class="roll-breakdown">
                        ({{ rollData.diceTotal }}{{ rollData.modifier >= 0 ? '+' : '' }}{{ rollData.modifier }})
                    </span>
                </span>
                <span v-else>
                    <span class="roll-total" :class="{ 'has-target': hasTargetNumber }">{{ rollData.total }}</span>
                    <span v-if="hasTargetNumber" class="roll-target">{{ rollData.targetNumber }}</span>
                </span>
            </div>
        </transition>

        <!-- Roll Outcome Banner -->
        <transition name="outcome-fade" appear>
            <div v-if="!isRolling && !isCustomRoll && !isInitiative && shouldShowOutcome" class="roll-outcome"
                :class="outcomeClass">
                {{ outcomeText }}
            </div>
        </transition>

        <!-- Roll Footer -->
        <div v-if="!isEngagement && rollData.footer" class="roll-footer">
            {{ rollData.footer }}
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { EngagementResultTypes, EngagementResultLabels } from '@/constants/engagementResultTypes'
import { RollOutcome } from '@/constants/rollOutcome'
import { WINNER, WINNER_LABELS } from '@shared/constants/winner.js'

const props = defineProps({
    rollData: {
        type: Object,
        required: true
    },
    isEngagement: {
        type: Boolean,
        required: true
    },
    isOpposedSkillCheck: {
        type: Boolean,
        required: true
    },
    isCustomRoll: {
        type: Boolean,
        required: true
    },
    isInitiative: {
        type: Boolean,
        default: false
    },
    isRolling: {
        type: Boolean,
        required: true
    }
})

const hasTargetNumber = computed(() => {
    return props.rollData.targetNumber !== null && props.rollData.targetNumber !== undefined
})

const shouldShowOutcome = computed(() => {
    // Always show outcome for engagements and opposed skill checks
    if (props.isEngagement || props.isOpposedSkillCheck) {
        return true
    }
    // For regular skill checks, only show if there's a target number
    return hasTargetNumber.value
})

const outcomeClass = computed(() => {
    if (props.isEngagement) {
        return {
            success: props.rollData.result === EngagementResultTypes.WIN,
            failure: props.rollData.result === EngagementResultTypes.LOSS,
            draw: props.rollData.result === EngagementResultTypes.DRAW
        }
    }

    if (props.isOpposedSkillCheck) {
        return {
            success: props.rollData.winner === WINNER.USER,
            failure: props.rollData.winner === WINNER.OPPONENT,
            draw: props.rollData.winner === WINNER.TIE
        }
    }

    return {
        success: props.rollData.success,
        failure: !props.rollData.success
    }
})

const outcomeText = computed(() => {
    if (props.isEngagement) {
        return EngagementResultLabels[props.rollData.result]
    }

    if (props.isOpposedSkillCheck) {
        return WINNER_LABELS[props.rollData.winner]
    }

    return props.rollData.success ? RollOutcome.SUCCESS : RollOutcome.FAILURE
})
</script>

<style scoped>
.roll-outcome-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-height: 59px;
    /* roll-numbers + roll-outcome heights */
}

.roll-numbers {
    display: flex;
    justify-content: center;
    gap: var(--space-xs);
    align-items: center;
    min-height: 30px;
}

.roll-total {
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-bold);
}

.roll-total.has-target::after {
    content: ' / ';
    color: var(--color-gray-medium);
    margin: 0 var(--space-2xs);
}

.roll-target {
    font-size: var(--font-size-20);
    color: var(--color-gray-light);
}

.roll-breakdown {
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
    font-style: italic;
    margin-left: var(--space-xs);
}

.engagement-score,
.opposed-score {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.user-wins,
.opponent-wins,
.draw-number,
.user-total,
.opponent-total {
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-bold);
    color: var(--color-white);
}

.score-separator {
    font-size: var(--font-size-16);
    color: var(--color-gray-light);
}

.draw-count {
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
    font-style: italic;
}

.roll-outcome {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-bold);
    text-align: center;
    padding: var(--space-xs);
    border-radius: var(--radius-5);
    min-height: 29px;
}

.success {
    color: var(--color-success-text);
    background-color: var(--color-success);
}

.failure {
    color: var(--color-danger-text);
    background-color: var(--color-danger);
}

.draw {
    color: var(--color-warning-text);
    background-color: var(--color-warning);
}

.roll-footer {
    font-size: var(--font-size-14);
    color: var(--color-danger);
    font-style: italic;
    text-align: center;
    border-top: 1px solid var(--color-gray-medium);
    padding-top: var(--space-xs);
}

.outcome-fade-enter-active {
    animation: fadeInOutcome 600ms ease-out;
}

.simple-fade-enter-active {
    transition: all 600ms ease-out;
    transition-delay: 0.2s;
}

.simple-fade-enter-from {
    opacity: 0;
    transform: scale(0.95);
}

@keyframes fadeInOutcome {
    0% {
        opacity: 0;
        transform: scale(0.9);
    }

    70% {
        transform: scale(1.05);
    }

    100% {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
