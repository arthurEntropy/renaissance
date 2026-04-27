<template>
    <div class="mana-color-filter">
        <div class="color-options">
            <button v-for="color in availableColors" :key="color" class="color-button"
                :class="{ active: isColorSelected(color) }" :title="getColorTitle(color)" @click="toggleColor(color)">
                <ManaSymbol :color="color" :value="color === ManaColor.COLORLESS ? '0' : ''" />
            </button>
            <div class="clear-button-container">
                <FloatingActionButton v-if="selectedColors.length > 0" :variant="FAB_TYPES.DELETE"
                    :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ALWAYS" @click="clearAll" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import ManaSymbol from '@/components/ui/mana/ManaSymbol.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { ManaColor, MANA_COLOR_ORDER } from '@shared/constants/manaColors'

const props = defineProps({
    modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const availableColors = computed(() => MANA_COLOR_ORDER)

const selectedColors = computed(() => props.modelValue || [])

const isColorSelected = (color) => {
    return selectedColors.value.includes(color)
}

const toggleColor = (color) => {
    const current = [...selectedColors.value]
    const index = current.indexOf(color)

    if (index > -1) {
        current.splice(index, 1)
    } else {
        current.push(color)
    }

    current.sort((a, b) => MANA_COLOR_ORDER.indexOf(a) - MANA_COLOR_ORDER.indexOf(b))
    emit('update:modelValue', current)
}

const clearAll = () => {
    emit('update:modelValue', [])
}

const getColorTitle = (color) => {
    return color.charAt(0).toUpperCase() + color.slice(1)
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.mana-color-filter {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    background-color: var(--overlay-black-medium);
}

.mana-color-filter:focus-within {
    border-color: var(--color-gray-light);
    box-shadow: var(--shadow-glow-sm);
}

.filter-label {
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
    white-space: nowrap;
}

.color-options {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
}

.color-button {
    padding: 0;
    background: none;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.5;
    display: flex;
    align-items: center;
    justify-content: center;
}

.color-button:hover {
    opacity: 0.8;
    transform: scale(1.1);
}

.color-button.active {
    opacity: 1;
    border-color: var(--color-primary);
    transform: scale(1.05);
}

.color-button:focus {
    outline: none;
    opacity: 0.9;
}

.clear-button-container {
    /* Reserve space for the clear button to prevent layout shift */
    min-width: var(--btn-min-height-sm);
    min-height: var(--btn-min-height-sm);
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
