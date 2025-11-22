<template>
    <BaseCharacterColumn :character="character" :is-opponent="isOpponent"
        :show-results="sessionStatus === SESSION_STATUS.COMPLETED" :is-winner="isWinner" :is-loser="isLoser">

        <!-- Skill info -->
        <template #additional-character-info>
            <div v-if="skillCheckConfig" class="skill-info">
                <span class="skill-name">{{ skillCheckConfig.name }}</span>
                <span class="favored-status" :class="{
                    'favored': favoredStatus === 'favored',
                    'ill-favored': favoredStatus === 'ill-favored',
                    'placeholder': !favoredStatus
                }">
                    <span v-if="favoredStatus">({{ favoredStatus }})</span>
                    <span v-else>&nbsp;</span>
                </span>
            </div>
        </template>

        <!-- Dice and total -->
        <template #content>
            <div class="dice-section">
                <DiceDisplay ref="diceDisplayRef" :rollData="rollData" :isEngagement="false"
                    :canReroll="canEdit && !isOpponent" :isOpponent="isOpponent" :state="diceDisplayState"
                    :waitingDice="allDice" @reroll-all-dice="emit('reroll-all-dice', side)" />

                <!-- Total display (only show when completed and not rolling) -->
                <div v-if="sessionStatus === SESSION_STATUS.COMPLETED && !isRolling" class="total-display">
                    <div class="total-value" :class="totalClass">{{ displayTotal }}</div>
                </div>

                <!-- Total placeholder while waiting, rolling, or during animation -->
                <div v-else-if="sessionStatus === SESSION_STATUS.WAITING || sessionStatus === SESSION_STATUS.ROLLING || (sessionStatus === SESSION_STATUS.COMPLETED && isRolling)"
                    class="total-display">
                    <div class="total-placeholder"></div>
                </div>
            </div>
        </template>

    </BaseCharacterColumn>
</template>

<script setup>
import { computed, ref } from 'vue'
import { SESSION_STATUS } from '@shared/constants/sessionStatus'
import { getDiceFontClass } from '@/utils/diceFontUtils'
import { useSkillDice } from '@/composables/useSkillDice'
import BaseCharacterColumn from './BaseCharacterColumn.vue'
import DiceDisplay from '@/components/features/characterSheet/diceRollResults/DiceDisplay.vue'

const props = defineProps({
    character: {
        type: Object,
        default: null
    },
    skillCheckConfig: {
        type: Object,
        default: null
    },
    rollResults: {
        type: Object,
        default: null
    },
    sessionStatus: {
        type: String,
        default: SESSION_STATUS.WAITING
    },
    side: {
        type: String,
        required: true
    },
    isOpponent: {
        type: Boolean,
        default: false
    },
    canEdit: {
        type: Boolean,
        default: true
    },
    winner: {
        type: String,
        default: null
    },
    isRerolling: {
        type: Boolean,
        default: false
    },
    rerollingCharacterId: {
        type: String,
        default: null
    }
})

const emit = defineEmits([
    'reroll-all-dice'
])

const { buildDiceSet, processDiceResults } = useSkillDice()

const diceDisplayRef = ref(null)

const isRolling = computed(() => {
    return diceDisplayRef.value?.isRolling || false
})

const isThisCharacterRerolling = computed(() => {
    return props.isRerolling && props.rerollingCharacterId === String(props.character?.id)
})

const isWinner = computed(() => {
    if (props.sessionStatus !== SESSION_STATUS.COMPLETED || !props.winner || isRolling.value) {
        return false
    }
    return (props.winner === 'user' && !props.isOpponent) ||
        (props.winner === 'opponent' && props.isOpponent)
})

const isLoser = computed(() => {
    if (props.sessionStatus !== SESSION_STATUS.COMPLETED || !props.winner || isRolling.value) {
        return false
    }
    return props.winner !== 'tie' && !isWinner.value
})

const favoredStatus = computed(() => {
    if (!props.skillCheckConfig) return null
    if (props.skillCheckConfig.isFavored) return 'favored'
    if (props.skillCheckConfig.isIllFavored) return 'ill-favored'
    return null
})

const allDice = computed(() => {
    return buildDiceSet(props.skillCheckConfig)
})

const sortedDice = computed(() => {
    // Early return if no roll results available
    if (!props.rollResults?.session) {
        return []
    }

    // For completed sessions, process and sort the dice
    if (props.sessionStatus === SESSION_STATUS.COMPLETED) {
        return processDiceResults(props.rollResults, props.character?.id, getDiceFontClass)
    }

    // For non-completed sessions (waiting, rolling), return empty array
    return []
})

const displayTotal = computed(() => {
    if (!props.rollResults?.session || props.sessionStatus !== SESSION_STATUS.COMPLETED) {
        return 0
    }

    const userSession = props.rollResults.session.users.find(u =>
        u.characterInfo.id === props.character?.id
    )

    return userSession?.rollTotal || 0
})

const totalClass = computed(() => {
    if (props.sessionStatus !== SESSION_STATUS.COMPLETED || !props.winner) return ''

    if (isWinner.value) return 'winner'
    if (isLoser.value) return 'loser'
    if (props.winner === 'tie') return 'tie'

    return ''
})

const diceDisplayState = computed(() => {
    switch (props.sessionStatus) {
        case SESSION_STATUS.WAITING:
            return 'waiting'
        case SESSION_STATUS.ROLLING:
            return 'rolling'
        case SESSION_STATUS.COMPLETED:
            return 'completed'
        default:
            return 'waiting'
    }
})

const rollData = computed(() => {
    // For animation purposes, we need dice data even during rerolls
    // Use allDice (from skill config) if we're rerolling or have no results yet
    let diceResults

    if (props.sessionStatus === SESSION_STATUS.COMPLETED && sortedDice.value.length > 0 && !isThisCharacterRerolling.value) {
        // Use actual results if we have them and not rerolling
        diceResults = sortedDice.value
    } else {
        // Use skill config dice for animation (during rerolls or when no results)
        diceResults = allDice.value.map(die => ({
            dieSides: die.dieSides,
            dieRollValue: die.dieSides, // Use max value for animation placeholder
            displayDieRollValue: die.dieSides,
            isDropped: false,
            rolledMaxValue: true,
            poolIndex: 0,
            emoji: null,
            cssClass: getDiceFontClass(die.dieSides, die.dieSides) // Max value class for animation
        }))
    }

    // Always return an object, even if no results yet
    return {
        type: 'OPPOSED_SKILL_CHECK',
        diceResults: diceResults,
        characterName: props.character?.name || 'Unknown',
        skillName: props.skillCheckConfig?.name || 'Unknown Skill'
    }
})

// Expose method to trigger rolling animation
const triggerRollingAnimation = () => {
    if (diceDisplayRef.value) {
        diceDisplayRef.value.triggerRollAnimation()
    }
}

// Expose the method and rolling state so parent components can access them
defineExpose({
    triggerRollingAnimation,
    isRolling
})
</script>

<style scoped>
.skill-info {
    text-align: center;
    margin-top: var(--space-sm);
}

.skill-name {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
}

.dice-section {
    margin-top: var(--space-sm);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: var(--space-md);
}

.total-display {
    margin-top: var(--space-lg);
    text-align: center;
    padding: var(--space-md);
    border-radius: var(--radius-5);
}

.total-placeholder {
    font-size: 3rem;
    font-weight: var(--font-weight-bold);
    height: 3rem;
    line-height: 1;
    opacity: 0;
    min-height: 3rem;
}
</style>
