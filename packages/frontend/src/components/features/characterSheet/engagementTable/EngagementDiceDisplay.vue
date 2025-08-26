<template>
    <div class="engagement-dice-content">
        <div v-if="diceData.length > 0 || isEditMode" class="dice-display">

            <div v-for="(diceInfo) in diceData" :key="diceInfo.statusKey" class="dice-icon-container"
                :class="{ 'user-added-die': diceInfo.isUserAdded }">

                <button v-if="isEditMode && diceInfo.isUserAdded" class="remove-die-button"
                    @click="$emit('remove-die', diceInfo.userAddedIndex)">
                    ✕
                </button>

                <span class="dice-icon" :class="diceInfo.status" @click="$emit('toggle-dice', diceInfo)"
                    @mouseenter="startDiceTooltip(diceInfo, $event)" @mouseleave="clearDiceTooltip">
                    <i :class="getDiceFontMaxClass(diceInfo.die)"></i>
                </span>
            </div>

            <div v-if="isEditMode" class="add-die-container">
                <AddButton :show="true" position="inline" title="Add die" @click="$emit('add-die')" />
            </div>
        </div>

        <div v-else-if="!isEditMode" class="no-dice-message">
            No engagement dice available
        </div>

        <!-- Dice Selection Dropdown -->
        <div v-if="showDropdown" class="dice-dropdown"
            :style="{ top: dropdownPosition.y + 'px', left: dropdownPosition.x + 'px' }">
            <button v-for="die in diceOptions" :key="die" class="die-option" @click="$emit('select-die', die)">
                d{{ die }}
            </button>
        </div>

        <!-- Dice Tooltip -->
        <div v-if="tooltipDice" class="dice-tooltip"
            :style="{ top: tooltipPosition.y + 'px', left: tooltipPosition.x + 'px' }">
            <div class="tooltip-source">
                From: {{ tooltipDice.name }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import AddButton from '@/components/ui/buttons/AddButton.vue'
import { getDiceFontMaxClass } from '@shared/utils/diceFontUtils'

// Props
defineProps({
    diceData: {
        type: Array,
        default: () => []
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    showDropdown: {
        type: Boolean,
        default: false
    },
    dropdownPosition: {
        type: Object,
        default: () => ({ x: 0, y: 0 })
    },
    diceOptions: {
        type: Array,
        default: () => [4, 6, 8, 10, 12, 20]
    }
})

// Emits
defineEmits(['toggle-dice', 'remove-die', 'add-die', 'select-die'])

// Tooltip state
const tooltipDice = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

// Tooltip methods
const startDiceTooltip = (diceInfo, event) => {
    const rect = event.target.getBoundingClientRect()
    tooltipPosition.value = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
    }
    tooltipDice.value = diceInfo
}

const clearDiceTooltip = () => {
    tooltipDice.value = null
}
</script>

<style scoped>
.engagement-dice-content {
    width: 100%;
}

.dice-display {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 3px;
    margin-top: 15px;
}

.dice-icon-container {
    position: relative;
}

.dice-icon {
    font-size: var(--font-size-36);
    cursor: pointer;
    transition: var(--transition-all);
    position: relative;
    display: inline-block;
}

.remove-die-button {
    position: absolute;
    top: -2px;
    left: -2px;
    width: 16px;
    height: 16px;
    background-color: var(--color-danger);
    color: var(--color-text-primary);
    border: none;
    border-radius: var(--radius-full);
    font-size: var(--font-size-10);
    line-height: var(--line-height-none);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: var(--z-interactive);
    padding: 0;
}

.add-die-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 5px;
}

.dice-dropdown {
    position: fixed;
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-gray-light);
    border-radius: var(--radius-5);
    padding: var(--space-xs);
    z-index: var(--z-dropdown);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-xs);
    box-shadow: var(--shadow-elevation-sm);
}

.die-option {
    padding: var(--space-xs) 10px;
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border: none;
    border-radius: var(--radius-5);
    cursor: pointer;
    font-family: inherit;
    transition: var(--transition-background);
}

.die-option:hover {
    background-color: var(--color-bg-secondary);
}

.dice-icon.available {
    color: inherit;
}

.dice-icon.selected {
    color: var(--color-accent-gold);
    text-shadow: var(--shadow-glow-gold-sm);
    transform: scale(1.05);
}

.dice-icon.expended {
    color: var(--color-gray-medium);
    opacity: 0.7;
}

.dice-icon.expended::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--color-danger);
    transform: translateY(-50%) rotate(-45deg);
    pointer-events: none;
    z-index: var(--z-overlay);
}

.no-dice-message {
    text-align: center;
    color: var(--color-text-muted);
    margin-top: 10px;
}

.dice-tooltip {
    position: fixed;
    z-index: var(--z-modal);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    padding: 14px;
    border-radius: var(--radius-10);
    font-size: var(--font-size-14);
    pointer-events: none;
    box-shadow: var(--shadow-elevation-lg);
    max-width: 260px;
    white-space: pre-line;
}

.tooltip-source {
    color: var(--color-primary);
    font-size: var(--font-size-10);
    font-style: italic;
}
</style>
