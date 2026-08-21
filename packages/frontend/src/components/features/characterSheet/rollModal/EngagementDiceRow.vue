<template>
    <div class="dice-row" @mouseenter="setHoverState(index, true)" @mouseleave="setHoverState(index, false)">

        <!-- Success assignment drop zone/display (left side for user) -->
        <div v-if="die.rolledMaxValue && showResults && !isOpponent" class="success-drop-zone left-side"
            :class="{ disabled: !canEdit }" @drop="onSuccessDrop" @dragover.prevent @dragenter.prevent>
            <div v-if="assignedSuccess" class="assigned-success-container">
                <ChipTag :text="assignedSuccess.name" :rounded="CHIP_TAG_ROUNDED.FULL"
                    :variant="CHIP_TAG_VARIANTS.PRIMARY" :tooltip="{
                        description: assignedSuccess.description,
                        sources: assignedSuccess.sources
                    }" :removable="canEdit" @remove="handleRemoveSuccess" />
            </div>
            <div v-else-if="!hasNoSuccesses" class="success-outline"></div>
        </div>

        <!-- Die display -->
        <span class="dice-symbol" :class="getDiceClasses(die, index)">
            <i :class="die.cssClass"></i>
            <SparklesIcon v-if="die.rolledMaxValue && !isRerolling(index)" class="max-indicator" />
        </span>

        <!-- Reroll hover button - only for user's own dice -->
        <ActionButton v-if="showRerollButton" variant="neutral" size="small" text="Reroll" class="reroll-hover"
            @click="handleReroll" />

        <!-- Success assignment display (right side for opponent) -->
        <div v-if="die.rolledMaxValue && showResults && isOpponent" class="success-display-zone right-side">
            <div v-if="assignedSuccess" class="assigned-success-container">
                <ChipTag :text="assignedSuccess.name" :rounded="CHIP_TAG_ROUNDED.FULL"
                    :variant="CHIP_TAG_VARIANTS.PRIMARY" :tooltip="{
                        description: assignedSuccess.description,
                        sources: assignedSuccess.sources
                    }" />
            </div>
            <div v-else class="success-outline"></div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { SparklesIcon } from '@heroicons/vue/24/outline'
import { useEngagementSuccesses } from '@/composables/useEngagementSuccesses'
import { useEngagementSession } from '@/composables/useEngagementSession'
import { useEngagementRoll } from '@/composables/useEngagementRoll'
import { useCharactersStore } from '@/stores/charactersStore'
import ChipTag from '@/components/ui/chips/ChipTag.vue'
import { CHIP_TAG_VARIANTS, CHIP_TAG_ROUNDED } from '@/constants/chipTag'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const engagementSuccesses = useEngagementSuccesses()
const sessionManager = useEngagementSession()
const diceManager = useEngagementRoll()
const charactersStore = useCharactersStore()

const character = computed(() => charactersStore.selectedCharacter)

const props = defineProps({
    die: {
        type: Object,
        required: true
    },
    index: {
        type: Number,
        required: true
    },
    side: {
        type: String,
        required: true
    },
    isOpponent: {
        type: Boolean,
        default: false
    },
    showResults: {
        type: Boolean,
        default: false
    },
    canEdit: {
        type: Boolean,
        default: true
    }
})

const hoveredDiceIndex = ref(null)

// Computed: no successes available to assign (user side only)
const hasNoSuccesses = computed(() =>
    !props.isOpponent && engagementSuccesses.allOwnedEngagementSuccesses.value.length === 0
)

// Computed: Get assigned success with null safety
const assignedSuccess = computed(() => {
    const successId = engagementSuccesses.assignedSuccesses[`${props.side}-${props.index}`]
    if (!successId) return null
    return engagementSuccesses.allEngagementSuccesses.value.find(s => s.id === successId) || null
})

// Computed: Show reroll button when all conditions met
const showRerollButton = computed(() => {
    return props.showResults &&
        !props.die.isRolling &&
        !isRerolling(props.index) &&
        isHovered(props.index) &&
        props.canEdit &&
        !props.isOpponent
})

// Create reroll handler
const rerollDie = diceManager.createRerollDieHandler(
    sessionManager,
    character.value,
    diceManager.committedDice.value,
    { assignedSuccesses: engagementSuccesses.assignedSuccesses }
)

// Handle reroll for this die
const handleReroll = () => {
    rerollDie(props.side, props.index)
}

// Handle success drop
const handleSuccessDrop = (successData) => {
    engagementSuccesses.assignSuccess(props.side, props.index, successData, character.value.id)
}

// Handle removing success assignment
const handleRemoveSuccess = () => {
    engagementSuccesses.clearAssignment(props.side, props.index, character.value.id)
}

const getDiceClasses = (die, index) => {
    const classes = []

    if (die.isRolling || isRerolling(index)) {
        classes.push(`rolling-die-${(index % 3) + 1}`) // Cycle through 3 rolling animations
    } else {
        classes.push('result-die')
    }

    if (die.rolledMaxValue) {
        classes.push('max-result')
    }

    if (isRerolling(index)) {
        classes.push('rerolling')
    }

    return classes
}

const isRerolling = (index) => {
    const key = `${props.side}-${index}`
    // Vue doesn't track Set.has() calls natively, so we access .size to trigger reactivity
    // This ensures the component re-renders when the Set changes
    const _ = diceManager.rerollingDice.value.size
    return diceManager.rerollingDice.value.has(key)
}

const setHoverState = (index, isHovered) => {
    if (!props.isOpponent) {
        hoveredDiceIndex.value = isHovered ? index : null
    }
}

const isHovered = (index) => {
    return hoveredDiceIndex.value === index
}

const onSuccessDrop = (event) => {
    if (!props.canEdit) return
    event.preventDefault()
    try {
        const successData = JSON.parse(event.dataTransfer.getData('application/json'))
        handleSuccessDrop(successData)
    } catch (error) {
        console.error('Error handling success drop:', error)
    }
}
</script>

<style scoped>
.dice-row {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
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
    margin-right: var(--space-xs);
}

.success-display-zone.right-side {
    left: 100%;
    margin-left: var(--space-xs);
}

.success-outline {
    width: 50px;
    height: 20px;
    border: 2px dashed var(--color-accent-gold);
    border-radius: var(--radius-10);
    background-color: transparent;
    transition: var(--transition-normal);
}

.success-outline.no-successes {
    border-color: var(--color-gray-medium);
    cursor: not-allowed;
}

.success-drop-zone.disabled {
    pointer-events: none;
    opacity: 0.5;
}

.success-drop-zone.disabled .success-outline {
    border-color: var(--color-gray-medium);
    background-color: var(--overlay-white-subtle);
}

.success-drop-zone:hover .success-outline {
    background-color: var(--overlay-white-subtle);
}

.dice-symbol {
    font-size: var(--font-size-36);
    display: inline-block;
    position: relative;
    color: inherit;
    margin: 0 5px;
    transform: scale(1.2);
    height: 36px;
    line-height: var(--line-height-none);
}

.reroll-hover {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: var(--z-interactive);
}

.dice-symbol i {
    font-family: var(--font-family-dice) !important;
    font-style: normal;
}

/* Rolling animations */
.rolling-die-1 {
    animation: roll-1 0.9s linear infinite;
}

.rolling-die-2 {
    animation: roll-2 1.2s linear infinite;
}

.rolling-die-3 {
    animation: roll-3 0.7s linear infinite;
}

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

.max-indicator {
    position: absolute;
    top: -3px;
    right: -3px;
    width: 16px;
    height: 16px;
    color: var(--color-accent-gold);
    animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.7;
        transform: scale(1.2);
    }
}

.max-result {
    color: var(--color-accent-gold);
    text-shadow: 0 0 8px var(--color-accent-gold);
}

.result-die {
    transition: var(--transition-normal);
}

.result-die:hover {
    transform: scale(1.3);
}
</style>
