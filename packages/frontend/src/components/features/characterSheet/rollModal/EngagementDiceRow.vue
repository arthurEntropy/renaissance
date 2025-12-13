<template>
    <div class="dice-row" @mouseenter="setHoverState(index, true)" @mouseleave="setHoverState(index, false)">

        <!-- Success assignment drop zone/display (left side for user) -->
        <div v-if="die.rolledMaxValue && showResults && !isOpponent" class="success-drop-zone left-side"
            :class="{ disabled: !canEdit }" @drop="canEdit ? onSuccessDrop($event) : null" @dragover.prevent
            @dragenter.prevent>
            <div v-if="assignedSuccesses[`${side}-${index}`]" class="assigned-success-container">
                <Chip :text="getSuccessById(assignedSuccesses[`${side}-${index}`]).name" rounded="full"
                    variant="success" :tooltip="{
                        description: getSuccessById(assignedSuccesses[`${side}-${index}`]).description,
                        sources: getSuccessById(assignedSuccesses[`${side}-${index}`]).sources
                    }" :removable="canEdit" @remove="$emit('remove-success-assignment', side, index)" />
            </div>
            <div v-else class="success-outline"></div>
        </div>

        <!-- Die display -->
        <span class="dice-symbol" :class="getDiceClasses(die, index)">
            <i :class="die.cssClass"></i>
            <span v-if="die.rolledMaxValue && !isRerolling(index)" class="max-indicator">✨</span>
        </span>

        <!-- Reroll hover button - only for user's own dice -->
        <ActionButton v-if="showResults && !die.isRolling && !isRerolling(index) &&
            isHovered(index) && canEdit && !isOpponent" variant="neutral" size="small" text="Reroll"
            class="reroll-hover" @click="$emit('reroll', side, index)" />

        <!-- Success assignment display (right side for opponent) -->
        <div v-if="die.rolledMaxValue && showResults && isOpponent" class="success-display-zone right-side">
            <div v-if="assignedSuccesses[`${side}-${index}`]" class="assigned-success-container">
                <Chip :text="getSuccessById(assignedSuccesses[`${side}-${index}`]).name" rounded="full"
                    variant="success" :tooltip="{
                        description: getSuccessById(assignedSuccesses[`${side}-${index}`]).description,
                        sources: getSuccessById(assignedSuccesses[`${side}-${index}`]).sources
                    }" />
            </div>
            <div v-else class="success-outline"></div>
        </div>

    </div>
</template>

<script setup>
import { ref } from 'vue'
import Chip from '@/components/ui/chips/Chip.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

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
    },
    assignedSuccesses: {
        type: Object,
        default: () => ({})
    },
    allEngagementSuccesses: {
        type: Array,
        default: () => []
    },
    rerollingDice: {
        type: Set,
        default: () => new Set()
    }
})

const emit = defineEmits([
    'reroll',
    'success-drop',
    'remove-success-assignment'
])

const hoveredDiceIndex = ref(null)

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
    return props.rerollingDice.has(`${props.side}-${index}`)
}

const setHoverState = (index, isHovered) => {
    if (!props.isOpponent) {
        hoveredDiceIndex.value = isHovered ? index : null
    }
}

const isHovered = (index) => {
    return hoveredDiceIndex.value === index
}

const getSuccessById = (successId) => {
    return props.allEngagementSuccesses.find(s => s.id === successId)
}

const onSuccessDrop = (event) => {
    event.preventDefault()
    try {
        const successData = JSON.parse(event.dataTransfer.getData('application/json'))
        emit('success-drop', props.side, props.index, successData)
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
    transition: var(--transition-all);
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
    border-color: var(--color-accent-gold);
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
    font-size: var(--font-size-14);
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
    transition: var(--transition-all);
}

.result-die:hover {
    transform: scale(1.3);
}
</style>
