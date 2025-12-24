<template>
    <span class="chip" :class="[variant, rounded]" @mouseenter="startTooltip" @mouseleave="clearTooltip">

        <span class="chip-text">{{ displayText }}</span>

        <button v-if="removable" class="remove-button" @click="$emit('remove')" type="button" aria-label="Remove">
            <XMarkIcon class="remove-icon" />
        </button>

        <!-- Tooltip -->
        <teleport to="body" v-if="tooltip">
            <div v-if="showTooltip" class="chip-tooltip" :style="tooltipStyle">
                <div v-if="tooltipContent?.description" class="tooltip-description">{{ tooltipContent.description }}
                </div>
                <div v-if="tooltipContent?.sources && tooltipContent.sources.length > 0" class="tooltip-source">
                    From: {{ tooltipContent.sources.join(', ') }}
                </div>
            </div>
        </teleport>
    </span>
</template>

<script>
export default {
    name: 'ChipTag'
}
</script>

<script setup>
import { computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useTooltip } from '@/composables/useFloatingElement'

const props = defineProps({
    // Display text (direct or via sourceId lookup)
    text: {
        type: String,
        default: null
    },
    sourceId: {
        type: String,
        default: null
    },
    // Styling
    variant: {
        type: String,
        default: 'gray',
        validator: (value) => ['primary', 'secondary', 'gray', 'success'].includes(value)
    },
    rounded: {
        type: String,
        default: 'normal',
        validator: (value) => ['normal', 'full'].includes(value)
    },
    // States
    removable: {
        type: Boolean,
        default: false
    },
    // Tooltip (optional)
    tooltip: {
        type: Object,
        default: null,
        validator: (value) => {
            return !value || (typeof value.description === 'string' || Array.isArray(value.sources))
        }
    }
})

defineEmits(['remove'])

const sourcesStore = useSourcesStore()

// Compute display text
const displayText = computed(() => {
    if (props.text) {
        return props.text
    }
    if (props.sourceId) {
        const source = sourcesStore.getSourceById(props.sourceId)
        return source ? source.name : 'Unknown'
    }
    return ''
})

const { content: tooltipContent, style: tooltipStyle, isVisible: showTooltip, show, hide } = useTooltip()

const startTooltip = (event) => {
    if (!props.tooltip) return
    show(props.tooltip, event)
}

const clearTooltip = () => {
    hide()
}
</script>

<style scoped>
.chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    cursor: help;
    transition: var(--transition-background);
}

/* Variants */
.chip.gray {
    background-color: var(--color-gray-dark);
    color: var(--color-text-primary);
}

.chip.primary {
    background: var(--color-primary);
    color: var(--color-primary-text);
}

.chip.secondary {
    background: var(--color-gray-dark);
    color: var(--color-text-secondary);
}

.chip.success {
    background-color: var(--color-accent-gold);
    color: var(--color-black);
    text-shadow: 0 0 8px var(--color-accent-gold);
}

/* Rounded variants */
.chip.normal {
    border-radius: var(--radius-5);
}

.chip.full {
    border-radius: var(--radius-15);
}

/* Hover */
.chip:hover {
    text-shadow: var(--shadow-glow-lg);
}

/* Text */
.chip-text {
    line-height: 1;
}

/* Remove button */
.remove-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: inherit;
    transition: var(--transition-opacity);
}

.remove-button:hover {
    opacity: 0.7;
}

.remove-icon {
    width: 14px;
    height: 14px;
}

/* Tooltip */
.chip-tooltip {
    position: fixed;
    z-index: var(--z-tooltip);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    padding: var(--space-sm);
    border-radius: var(--radius-5);
    border: 1px solid var(--color-text-primary);
    box-shadow: var(--shadow-elevation-md);
    max-width: 260px;
    transform: translateX(-50%);
    pointer-events: none;
}

.tooltip-description {
    font-size: var(--font-size-12);
    margin-bottom: var(--space-xs);
    line-height: var(--line-height-normal);
}

.tooltip-source {
    font-size: var(--font-size-10);
    font-style: italic;
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
}
</style>
