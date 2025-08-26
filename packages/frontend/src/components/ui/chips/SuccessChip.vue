<template>
    <span class="success-chip" :class="{ 'removable': removable }" @mouseenter="startTooltip"
        @mouseleave="clearTooltip">

        <button v-if="removable" class="remove-chip-button" @click="$emit('remove')">
            ✕
        </button>

        {{ success.name }}

        <!-- Integrated Tooltip -->
        <teleport to="body">
            <div v-if="showTooltip" class="success-tooltip"
                :style="{ top: tooltipPosition.y + 'px', left: tooltipPosition.x + 'px' }">
                <div class="tooltip-description">{{ success.description }}</div>
                <div v-if="success.sources && success.sources.length > 0" class="tooltip-source">
                    From: {{ success.sources.join(', ') }}
                </div>
            </div>
        </teleport>
    </span>
</template>

<script setup>
import { ref } from 'vue'

// Props
defineProps({
    success: {
        type: Object,
        required: true
    },
    removable: {
        type: Boolean,
        default: false
    }
})

// Emits
defineEmits(['remove'])

// Tooltip state
const showTooltip = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })

// Tooltip methods
const startTooltip = (event) => {
    const rect = event.target.getBoundingClientRect()
    tooltipPosition.value = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
    }
    showTooltip.value = true
}

const clearTooltip = () => {
    showTooltip.value = false
}
</script>

<style scoped>
.success-chip {
    position: relative;
    background-color: var(--color-gray-dark);
    color: var(--color-text-primary);
    padding: var(--space-xs) 10px;
    border-radius: var(--radius-15);
    font-size: var(--font-size-10);
    text-align: center;
    cursor: help;
    transition: var(--transition-background);
    display: inline-block;
}

.success-chip:hover {
    background-color: var(--color-bg-secondary);
}

.success-chip.removable {
    padding-left: 18px;
}

.remove-chip-button {
    position: absolute;
    top: -5px;
    left: -5px;
    width: 14px;
    height: 14px;
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

.success-tooltip {
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
    text-align: left;
}

.tooltip-description {
    margin-bottom: 8px;
}

.tooltip-source {
    color: var(--color-primary);
    font-size: var(--font-size-10);
    font-style: italic;
}
</style>
