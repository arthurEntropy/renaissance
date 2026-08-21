<template>
    <div class="roll-outcome-container">
        <!-- Roll Numbers -->
        <div class="roll-numbers">
            <div class="roll-numbers-content" :class="{ 'roll-numbers-content--hidden': shouldHideRollNumbers }">
                <span v-if="isEngagement" class="engagement-score">
                    <span class="roll-number user-wins" :class="outcomeClass">{{ rollData.userWins }}</span>
                    <span class="score-separator">to</span>
                    <span class="roll-number opponent-wins">{{ rollData.opponentWins }}</span>
                    <span v-if="rollData.drawCount && rollData.drawCount > 0" class="draw-count">
                        , <span class="roll-number draw-number">{{ rollData.drawCount }}</span> {{
                            rollData.drawCount
                                === 1 ? 'draw'
                                : 'draws' }}
                    </span>
                </span>
                <span v-else-if="isCustomRoll || isDamage || isInitiative || isInjury">
                    <span class="roll-number roll-total custom-roll">{{ rollData.total }}</span>
                    <span v-if="rollData.modifier !== 0" class="roll-breakdown">
                        ({{ rollData.diceTotal }}{{ rollData.modifier >= 0 ? '+' : '' }}{{ rollData.modifier }})
                    </span>
                </span>
                <span v-else class="skill-check-result">
                    <span ref="skillCheckTotalRef" class="roll-number roll-total"
                        :class="[hasDifficulty && outcomeClass, { 'roll-total--clickable': skillCheckSuccessCount > 0 && !shouldHideRollNumbers }]"
                        @click="skillCheckSuccessCount > 0 && !shouldHideRollNumbers && handleSuccessClick()">{{
                        rollData.total }}</span>
                    <span v-if="skillCheckSuccessCount > 0 && !shouldHideRollNumbers" class="skill-check-successes"
                        @click="handleSuccessClick">{{ '\u2728'.repeat(skillCheckSuccessCount) }}</span>
                    <span v-if="hasDifficulty" class="roll-separator"> / </span>
                    <span v-if="hasDifficulty" class="roll-number roll-difficulty">{{ rollData.difficulty }}</span>
                </span>
            </div>
        </div>

        <!-- Roll Footer -->
        <div v-if="!isEngagement && rollData.footer" class="roll-footer"
            :class="{ 'roll-footer--hidden': shouldHideRollNumbers }">
            {{ rollData.footer }}
        </div>
    </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { EngagementResultTypes } from '@/constants/engagementResultTypes'
import { RollTypes } from '@/constants/rollTypes'

const REVEAL_FALLBACK_DELAY = 75

const props = defineProps({
    rollData: {
        type: Object,
        required: true
    },
    isEngagement: {
        type: Boolean,
        required: true
    },
    isCustomRoll: {
        type: Boolean,
        required: true
    },
    isDamage: {
        type: Boolean,
        default: false
    },
    isInitiative: {
        type: Boolean,
        default: false
    },
    isInjury: {
        type: Boolean,
        default: false
    },
    isRolling: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['open-success-popup'])

const skillCheckTotalRef = ref(null)

const skillCheckSuccessCount = computed(() => {
    if (props.isEngagement || props.isCustomRoll || props.isDamage || props.isInitiative || props.isInjury) return 0
    if (props.rollData?.type !== RollTypes.SKILL_CHECK) return 0
    return (props.rollData.diceResults ?? []).filter(d => d.rolledMaxValue && d.die?.dieSize === 6).length
})

function handleSuccessClick() {
    emit('open-success-popup', { successCount: skillCheckSuccessCount.value, anchorEl: skillCheckTotalRef.value })
}

const hasDifficulty = computed(() => {
    return props.rollData.difficulty !== null && props.rollData.difficulty !== undefined
})

const pendingReveal = ref(false)
const rollStarted = ref(false)
let revealFallbackTimer = null

const clearRevealFallbackTimer = () => {
    if (revealFallbackTimer) {
        clearTimeout(revealFallbackTimer)
        revealFallbackTimer = null
    }
}

const shouldHideRollNumbers = computed(() => {
    return props.isRolling || pendingReveal.value
})

const outcomeClass = computed(() => {
    if (props.isEngagement) {
        return {
            success: props.rollData.result === EngagementResultTypes.WIN,
            failure: props.rollData.result === EngagementResultTypes.LOSS,
            draw: props.rollData.result === EngagementResultTypes.DRAW
        }
    }

    return {
        success: props.rollData.success,
        failure: !props.rollData.success
    }
})

watch(() => props.rollData?.timestamp, (timestamp) => {
    clearRevealFallbackTimer()

    if (!timestamp || props.isEngagement) {
        pendingReveal.value = false
        rollStarted.value = false
        return
    }

    pendingReveal.value = true
    rollStarted.value = false

    revealFallbackTimer = setTimeout(() => {
        if (!rollStarted.value && !props.isRolling) {
            pendingReveal.value = false
        }
    }, REVEAL_FALLBACK_DELAY)
}, { immediate: true })

watch(() => props.isRolling, (isCurrentlyRolling) => {
    if (isCurrentlyRolling) {
        rollStarted.value = true
        return
    }

    if (rollStarted.value) {
        pendingReveal.value = false
        clearRevealFallbackTimer()
    }
}, { immediate: true })

onUnmounted(() => {
    clearRevealFallbackTimer()
})
</script>

<style scoped>
.roll-outcome-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.roll-numbers-content {
    display: flex;
    justify-content: center;
    gap: var(--space-xs);
    align-items: center;
    transition: var(--transition-opacity);
}

.roll-numbers-content--hidden {
    opacity: 0;
    transition: none;
}

.roll-number {
    font-size: var(--font-size-48);
    font-weight: var(--font-weight-bold);
}

.roll-total {
    transition: var(--transition-fast);
}

.skill-check-result {
    display: flex;
    align-items: center;
}

.skill-check-successes {
    font-size: var(--font-size-32);
    line-height: 1;
    cursor: pointer;
    user-select: none;
    margin-left: 2px;
}

.roll-total--clickable {
    cursor: pointer;
}

.roll-separator {
    font-size: var(--font-size-16);
    color: var(--color-gray-medium);
    margin: 0 var(--space-2xs);
}

.roll-difficulty {
    color: var(--color-gray-light);
}

.roll-breakdown {
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
    font-style: italic;
    margin-left: var(--space-xs);
}

.engagement-score {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.user-wins,
.opponent-wins,
.draw-number {
    color: var(--color-white);
    transition: var(--transition-fast);
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

.success {
    color: var(--color-success);
    text-shadow: var(--glow-success-sm);
}

.failure {
    color: var(--color-danger);
    text-shadow: var(--glow-danger-sm);
}

.draw {
    color: var(--color-warning);
    text-shadow: var(--glow-warning-sm);
}

.roll-footer {
    font-size: var(--font-size-14);
    color: var(--color-danger);
    font-style: italic;
    text-align: center;
    border-top: 1px solid var(--color-gray-medium);
    padding-top: var(--space-xs);
    transition: var(--transition-opacity);
}

.roll-footer--hidden {
    opacity: 0;
    transition: none;
}
</style>
