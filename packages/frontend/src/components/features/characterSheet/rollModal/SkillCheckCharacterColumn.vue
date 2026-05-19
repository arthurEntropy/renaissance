<template>
    <BaseCharacterColumn :character="character" :is-opponent="isOpponent" :show-results="showResults"
        :is-winner="isWinner" :is-loser="isLoser">

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
                    :waitingDice="allDice" @reroll-all-dice="sessionManager.rerollAllDice(side, null, null, null)" />

                <!-- Total display -->
                <div v-if="showTotalValue" class="total-display">
                    <div class="total-value" :class="totalClass">{{ displayTotal }}</div>
                </div>

                <!-- Total placeholder -->
                <div v-else-if="showTotalPlaceholder" class="total-display">
                    <div class="total-placeholder"></div>
                </div>
            </div>
        </template>

    </BaseCharacterColumn>
</template>

<script setup>
import { computed, ref } from 'vue'
import { SESSION_STATUS } from '@shared/constants/sessionStatus'
import { WINNER } from '@shared/constants/winner.js'
import { PlayerSides } from '@/constants/playerSides'
import { getDiceFontClass } from '@/utils/diceFontUtils'
import { buildDiceSetForSkill } from '@/utils/skillDiceUtils'
import { useOpposedSkillCheckSession } from '@/composables/useOpposedSkillCheckSession'
import { useCharactersStore } from '@/stores/charactersStore'
import BaseCharacterColumn from './BaseCharacterColumn.vue'
import DiceDisplay from '@/components/features/characterSheet/diceBox/DiceDisplay.vue'

const props = defineProps({
    isOpponent: {
        type: Boolean,
        required: true
    }
})

const sessionManager = useOpposedSkillCheckSession()
const charactersStore = useCharactersStore()

const diceDisplayRef = ref(null)

// Determine side and character based on isOpponent
const side = computed(() => props.isOpponent ? PlayerSides.OPPONENT : PlayerSides.USER)
const character = computed(() => {
    if (props.isOpponent) {
        return sessionManager.opponent.value?.characterInfo || null
    }
    return charactersStore.selectedCharacter
})

const skillCheckConfig = computed(() => {
    if (props.isOpponent) {
        return sessionManager.opponent.value?.skillCheckConfig || null
    }
    return sessionManager.userSkillConfig.value
})

const sessionStatus = computed(() => sessionManager.sessionStatus.value)
const showResults = computed(() => sessionStatus.value === SESSION_STATUS.COMPLETED)
const canEdit = computed(() => sessionManager.canEditResults.value && !props.isOpponent)

// Winner is always computed from user's perspective (selectedCharacter)
// This determines UI styling for both user and opponent columns
const winner = computed(() => sessionManager.winner.value)

// Get this character's session data from roll results
const userSession = computed(() => {
    if (!sessionManager.rollResults.value?.session || !showResults.value) {
        return null
    }
    return sessionManager.rollResults.value.session.users.find(u => u.characterInfo.id === character.value?.id)
})

const isRolling = computed(() => {
    return diceDisplayRef.value?.isRolling || false
})

const isWinner = computed(() => {
    if (!showResults.value || !winner.value) {
        return false
    }
    return (winner.value === WINNER.USER && !props.isOpponent) ||
        (winner.value === WINNER.OPPONENT && props.isOpponent)
})

const isLoser = computed(() => {
    if (!showResults.value || !winner.value) {
        return false
    }
    return winner.value !== WINNER.TIE && !isWinner.value
})

const favoredStatus = computed(() => {
    if (!skillCheckConfig.value) return null
    if (skillCheckConfig.value.isFavored) return 'favored'
    if (skillCheckConfig.value.isIllFavored) return 'ill-favored'
    return null
})

const allDice = computed(() => {
    return buildDiceSetForSkill(skillCheckConfig.value)
})

const sortedDice = computed(() => {
    return userSession.value?.rollResults || []
})

const displayTotal = computed(() => {
    return userSession.value?.rollTotal || 0
})

const totalClass = computed(() => {
    if (!showResults.value || !winner.value) return ''

    if (isWinner.value) return 'winner'
    if (isLoser.value) return 'loser'
    if (winner.value === WINNER.TIE) return 'tie'

    return ''
})

const diceDisplayState = computed(() => {
    switch (sessionStatus.value) {
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

const showTotalValue = computed(() => showResults.value && !isRolling.value)
const showTotalPlaceholder = computed(() => !showResults.value || isRolling.value)

const rollData = computed(() => {
    // DiceDisplay requires dice data for rolling animation
    // Use skill config dice as placeholders when results aren't available yet
    let diceResults

    if (showResults.value && sortedDice.value.length > 0) {
        // Use actual results from session
        diceResults = sortedDice.value
    } else {
        // Use skill config dice as placeholders for animation
        diceResults = allDice.value.map(die => ({
            dieSize: die.dieSize,
            dieRollValue: die.dieSize,
            displayDieRollValue: die.dieSize,
            isDropped: false,
            rolledMaxValue: true,
            poolIndex: 0,
            emoji: null,
            cssClass: getDiceFontClass(die.dieSize, die.dieSize)
        }))
    }

    return {
        type: 'OPPOSED_SKILL_CHECK',
        diceResults: diceResults,
        characterName: character.value?.name || 'Unknown',
        skillName: skillCheckConfig.value?.name || 'Unknown Skill'
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
    color: var(--color-primary);
}

.favored-status {
    display: inline-block;
    margin-left: var(--space-xs);
    font-size: var(--font-size-12);
}

.favored-status.favored {
    color: var(--color-success);
}

.favored-status.ill-favored {
    color: var(--color-danger);
}

.favored-status.placeholder {
    opacity: 0;
}

.dice-section {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
}

.total-display {
    margin-top: var(--space-lg);
    text-align: center;
    padding: var(--space-md);
    border-radius: var(--radius-5);
}

.total-value {
    font-size: var(--font-size-100);
    font-weight: var(--font-weight-bold);
    line-height: 1;
    color: var(--color-text-primary);
}

.total-value.winner {
    color: var(--color-success);
}

.total-value.loser {
    color: var(--color-danger);
}

.total-value.tie {
    color: var(--color-warning);
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
