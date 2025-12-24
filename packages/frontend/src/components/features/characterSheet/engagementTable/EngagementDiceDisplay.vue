<template>
    <div class="engagement-dice-display">
        <!-- Dice Display -->
        <div v-if="diceData.length > 0 || isEditMode" class="dice-display">

            <div v-for="(diceInfo) in diceData" :key="diceInfo.statusKey" class="dice-icon-container"
                :class="{ 'user-added-die': diceInfo.isUserAdded }">

                <FloatingActionButton v-if="isEditMode && diceInfo.isUserAdded" type="delete" size="small"
                    visibility="always" @click="removeUserAddedDie(diceInfo.userAddedIndex)"
                    class="remove-die-button" />

                <span class="dice-icon" :class="diceInfo.status" role="button" tabindex="0"
                    :aria-label="`d${diceInfo.die} from ${diceInfo.name} - ${diceInfo.status}`"
                    @click="toggleDiceStatus(diceInfo)" @keydown.enter.prevent="toggleDiceStatus(diceInfo)"
                    @keydown.space.prevent="toggleDiceStatus(diceInfo)" @mouseenter="startDiceTooltip(diceInfo, $event)"
                    @mouseleave="clearDiceTooltip">
                    <i :class="getDiceFontMaxClass(diceInfo.die)"></i>
                </span>
            </div>

            <div v-if="isEditMode" class="add-die-container">
                <FloatingActionButton type="add" visibility="always" @click="toggleDropdown" />
            </div>
        </div>

        <div v-else-if="!isEditMode" class="no-dice-message">
            No engagement dice available
        </div>

        <!-- Dice Selection Dropdown -->
        <ItemDropdown ref="dropdownRef" :show="dropdown.isVisible.value" :position="dropdown.position.value"
            :items="diceOptions" item-key="value" item-label="value" custom-class="dice-grid" @select="handleSelectDie">
            <template #item="{ item }">
                <i :class="getDiceFontMaxClass(item)"></i>
            </template>
        </ItemDropdown>

        <!-- Dice Tooltip -->
        <div v-if="tooltipDice" class="chip-tooltip" :style="tooltipStyle">
            <div class="tooltip-source">
                From: {{ tooltipDice.name }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useTooltip, useFloatingElement } from '@/composables/useFloatingElement'
import { useEngagementRoll } from '@/composables/useEngagementRoll'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ItemDropdown from '@/components/ui/dropdowns/ItemDropdown.vue'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { STANDARD_DIE_SIZES } from '@shared/constants/dice'

defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

const diceManager = useEngagementRoll()
const diceData = diceManager.allOwnedEngagementDice
const toggleDiceStatus = diceManager.toggleDiceStatus
const addUserAddedDie = diceManager.addUserAddedDie
const removeUserAddedDie = diceManager.removeUserAddedDie
const diceOptions = STANDARD_DIE_SIZES

const dropdown = useFloatingElement({
    closeOnOutsideClick: true,
    closeOnScroll: true,
    adjustToViewport: true
})
const dropdownRef = ref(null)

const { content: tooltipDice, style: tooltipStyle, show, hide } = useTooltip()

const toggleDropdown = async (event) => {
    const triggerEl = event.target.closest('button')
    if (!triggerEl) return

    dropdown.show(null, triggerEl)
    await nextTick()
    if (dropdownRef.value?.$el) {
        dropdown.show(null, triggerEl, dropdownRef.value.$el)
    }
}

const handleSelectDie = (die) => {
    addUserAddedDie(die)
    dropdown.hide()
}

const startDiceTooltip = (diceInfo, event) => {
    show(diceInfo, event)
}

const clearDiceTooltip = () => {
    hide()
}
</script>

<style scoped>
.engagement-dice-display {
    width: 100%;
}

.dice-display {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin-top: var(--space-sm);
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
    z-index: 1;
}

.dice-icon:hover {
    text-shadow: var(--shadow-glow-sm);
}

.remove-die-button {
    position: absolute;
    top: calc(-1 * var(--space-xs));
    left: calc(-1 * var(--space-xs));
    z-index: 2;
}

.add-die-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: var(--space-xs);
}

.add-die-container :deep(.fab) {
    border-color: var(--color-text-primary) !important;
}

:deep(.dice-grid) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-xs);
}

:deep(.dice-grid .item-option) {
    padding: var(--space-xs) var(--space-md);
}

:deep(.dice-grid .item-option i) {
    font-size: var(--font-size-36);
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

.chip-tooltip {
    position: fixed;
    z-index: var(--z-tooltip);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    padding: var(--space-sm);
    border-radius: var(--radius-5);
    font-size: var(--font-size-14);
    pointer-events: none;
    border: 1px solid var(--color-text-primary);
    box-shadow: var(--shadow-elevation-md);
    max-width: 260px;
    transform: translateX(-50%);
    white-space: pre-line;
}

.tooltip-source {
    color: var(--color-text-secondary);
    font-size: var(--font-size-10);
    font-style: italic;
}
</style>
