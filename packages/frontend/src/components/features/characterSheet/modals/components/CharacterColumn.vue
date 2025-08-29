<template>
    <div class="character-column" :class="columnClasses">
        <!-- Character info header -->
        <div class="character-info">
            <div class="character-name">
                {{ character?.name || 'Waiting for opponent...' }}
            </div>
            <div v-if="skillCheckConfig" class="skill-info">
                <span class="skill-name">{{ skillCheckConfig.name }}</span>
                <span v-if="favoredStatus" class="favored-status" :class="{
                    'favored': favoredStatus === 'favored',
                    'ill-favored': favoredStatus === 'ill-favored'
                }">
                    ({{ favoredStatus }})
                </span>
            </div>
        </div>

        <!-- Dice display -->
        <div class="dice-section">
            <div v-if="sessionStatus === SESSION_STATUS.WAITING" class="waiting-state">
                <div class="spinner"></div>
                <div class="waiting-text">Configuring skill check...</div>
            </div>

            <div v-else-if="sessionStatus === SESSION_STATUS.ROLLING" class="rolling-state">
                <div class="dice-grid">
                    <div v-for="(die, index) in allDice" :key="`rolling-${index}`" class="die rolling"
                        :class="getDieClass(die)">
                        <i :class="getDieFontClass(die.type, die.type)"></i>
                    </div>
                </div>
                <div class="rolling-text">Rolling dice...</div>
            </div>

            <div v-else-if="sessionStatus === SESSION_STATUS.COMPLETED" class="results-state">
                <div class="dice-grid">
                    <div v-for="(die, index) in sortedDice" :key="`result-${index}`" class="die result"
                        :class="getDieClass(die)" @click="canEdit && handleDieClick(die, index)">
                        <i :class="die.class"></i>
                        <div v-if="die.dropped" class="dropped-indicator">✕</div>
                    </div>
                </div>

                <!-- Total display -->
                <div class="total-display">
                    <div class="total-label">Total:</div>
                    <div class="total-value" :class="totalClass">{{ displayTotal }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { getDiceFontClass } from '@shared/utils/diceFontUtils'
import { SESSION_STATUS } from '@shared/constants/sessionStatus'

const props = defineProps({
    character: {
        type: Object,
        default: null
    },
    skillCheckConfig: {
        type: Object,
        default: null
    },
    dice: {
        type: Array,
        default: () => []
    },
    rollResults: {
        type: Object,
        default: null
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
        default: false
    },
    sessionStatus: {
        type: String,
        default: SESSION_STATUS.WAITING
    }
})

const emit = defineEmits(['die-click', 'reroll-die'])

// Computed properties
const columnClasses = computed(() => ({
    'user-column': props.side === 'user',
    'opponent-column': props.side === 'opponent',
    'can-edit': props.canEdit
}))

const favoredStatus = computed(() => {
    if (!props.skillCheckConfig) return null
    if (props.skillCheckConfig.isFavored) return 'favored'
    if (props.skillCheckConfig.isIllFavored) return 'ill-favored'
    return null
})

const allDice = computed(() => {
    console.log('CharacterColumn - allDice computed:', {
        skillCheckConfig: props.skillCheckConfig,
        sessionStatus: props.sessionStatus,
        rollResults: props.rollResults,
        side: props.side
    })

    if (!props.skillCheckConfig) return []

    const dice = []

    // Add d12 dice (1 for flat, 2 for favored/ill-favored)
    const d12Count = props.skillCheckConfig.isFavored || props.skillCheckConfig.isIllFavored ? 2 : 1
    for (let i = 0; i < d12Count; i++) {
        dice.push({ type: 12, category: 'd12' })
    }

    // Add d6 dice based on ranks and dice mod
    const baseRanks = props.skillCheckConfig.ranks || 0
    const diceMod = props.skillCheckConfig.diceMod || 0
    const effectiveRanks = Math.max(0, baseRanks + Math.max(0, diceMod))

    for (let i = 0; i < effectiveRanks; i++) {
        const isSubtracted = diceMod < 0 && i >= baseRanks + diceMod
        dice.push({
            type: 6,
            category: 'd6',
            isSubtracted
        })
    }

    console.log('CharacterColumn - Generated dice:', dice)
    return dice
})

const sortedDice = computed(() => {
    console.log('CharacterColumn - sortedDice computed:', {
        rollResults: props.rollResults,
        sessionStatus: props.sessionStatus,
        side: props.side,
        character: props.character?.id
    })

    if (!props.rollResults?.session || props.sessionStatus !== SESSION_STATUS.COMPLETED) {
        console.log('CharacterColumn - No results or not completed, returning empty array')
        return []
    }

    const userSession = props.rollResults.session.users.find(u => {
        // Both sides should find the session that matches their respective character
        // props.character is different for each side (user vs opponent character)
        return u.characterInfo.id === props.character?.id
    })

    console.log('CharacterColumn - Found user session:', userSession)
    console.log('CharacterColumn - Looking for character ID:', props.character?.id)
    console.log('CharacterColumn - Side:', props.side)
    console.log('CharacterColumn - All users in session:', props.rollResults.session.users.map(u => ({ id: u.characterInfo.id, name: u.characterInfo.name })))

    if (!userSession?.rollResults) {
        console.log('CharacterColumn - No roll results in user session')
        return []
    }

    const diceResults = userSession.rollResults.map((result, index) => ({
        type: result.die,
        value: result.roll === 0 ? result.originalRoll : result.roll,
        displayValue: result.roll === 0 ? result.originalRoll : result.roll,
        dropped: result.roll === 0,
        isMax: result.die === result.roll && result.roll > 0,
        class: getDiceFontClass(result.die, result.roll === 0 ? result.originalRoll : result.roll),
        originalIndex: index
    })).sort((a, b) => {
        // Sort by value (highest first), but dropped dice go to end
        if (a.dropped && !b.dropped) return 1
        if (!a.dropped && b.dropped) return -1
        if (a.dropped && b.dropped) return 0

        if (b.value !== a.value) {
            return b.value - a.value
        }
        return b.type - a.type
    })

    console.log('CharacterColumn - Sorted dice results:', diceResults)
    return diceResults
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
    if (!props.rollResults?.session) return ''

    const users = props.rollResults.session.users
    if (users.length !== 2) return ''

    const currentUserTotal = users.find(u => u.characterInfo.id === props.character?.id)?.rollTotal
    const otherUserTotal = users.find(u => u.characterInfo.id !== props.character?.id)?.rollTotal

    if (currentUserTotal > otherUserTotal) return 'winner'
    if (currentUserTotal < otherUserTotal) return 'loser'
    return 'tie'
})

// Methods
const getDieClass = (die) => {
    const classes = [`d${die.type}`]

    if (die.isMax) classes.push('max-value')
    if (die.dropped) classes.push('dropped')
    if (die.isSubtracted) classes.push('subtracted')
    if (props.skillCheckConfig?.isFavored && die.category === 'd12') classes.push('favored')
    if (props.skillCheckConfig?.isIllFavored && die.category === 'd12') classes.push('ill-favored')

    return classes
}

const getDieFontClass = (dieType, value) => {
    return getDiceFontClass(dieType, value)
}

const handleDieClick = (die, index) => {
    if (props.canEdit && props.sessionStatus === SESSION_STATUS.COMPLETED) {
        emit('die-click', die, index)
    }
}
</script>

<style scoped>
.character-column {
    flex: 1;
    background: var(--color-bg-primary);
    display: flex;
    flex-direction: column;
    min-height: 500px;
}

.character-info {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border-primary);
    background: var(--color-bg-secondary);
}

.character-name {
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-sm);
}

.skill-info {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
}

.skill-name {
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
}

.favored-status.favored {
    color: var(--color-success);
    font-weight: var(--font-weight-bold);
}

.favored-status.ill-favored {
    color: var(--color-danger);
    font-weight: var(--font-weight-bold);
}

.dice-section {
    flex: 1;
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.waiting-state,
.rolling-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-border-primary);
    border-top: 4px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.waiting-text,
.rolling-text {
    color: var(--color-text-secondary);
    font-style: italic;
}

.dice-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    justify-content: center;
    margin-bottom: var(--space-lg);
}

.die {
    position: relative;
    font-size: var(--font-size-32);
    color: var(--color-text-primary);
    transition: var(--transition-all);
    cursor: default;
}

.die.rolling {
    animation: bounce 0.6s ease-in-out infinite alternate;
}

@keyframes bounce {
    from {
        transform: translateY(0px);
    }

    to {
        transform: translateY(-10px);
    }
}

.can-edit .die.result {
    cursor: pointer;
}

.can-edit .die.result:hover {
    transform: scale(1.1);
    filter: brightness(1.2);
}

.die.max-value {
    color: var(--color-success);
    text-shadow: var(--shadow-glow-success-sm);
}

.die.dropped {
    opacity: 0.5;
    color: var(--color-danger);
}

.die.subtracted {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-danger-sm);
}

.die.favored {
    color: var(--color-success);
    text-shadow: var(--shadow-glow-success-sm);
}

.die.ill-favored {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-danger-sm);
}

.dropped-indicator {
    position: absolute;
    top: -5px;
    right: -5px;
    color: var(--color-danger);
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-bold);
}

.total-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
}

.total-label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.total-value {
    font-size: var(--font-size-36);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
}

.total-value.winner {
    color: var(--color-success);
    text-shadow: var(--shadow-glow-success);
}

.total-value.loser {
    color: var(--color-danger);
    text-shadow: var(--shadow-glow-danger);
}

.total-value.tie {
    color: var(--color-warning);
    text-shadow: var(--shadow-glow-warning);
}

.user-column {
    border-right: 1px solid var(--color-border-primary);
}

.opponent-column {
    border-left: 1px solid var(--color-border-primary);
}
</style>
