<template>
    <div v-if="showBadge" :class="badgeClass" @click.stop="handleClick" @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave">
        <template v-if="type === 'keeping' && !isHovering && value !== null && value !== undefined">
            {{ displayValue }}
            <img :src="keepingIcon" alt="keeping" class="keeping-icon" />
        </template>
        <template v-else>
            {{ displayText }}
        </template>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import keepingIcon from '@/assets/icons/keeping.png'

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['xp', 'keeping'].includes(value)
    },
    value: {
        type: [String, Number],
        default: null
    },
    hiddenByDefault: {
        type: Boolean,
        default: false
    },
    isInteractive: {
        type: Boolean,
        default: false
    },
    isOwned: {
        type: Boolean,
        default: false
    },
    improvementId: {
        type: String,
        default: null
    },
    asImprovementBadge: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['toggle'])

// Reactive state for hover
const isHovering = ref(false)

const showBadge = computed(() => {
    // Show when a value is present, OR when interactive (allows a no-cost item "+Add" badge)
    return (props.value !== undefined && props.value !== null) || props.isInteractive
})

// Badge is interactive if marked as interactive (regardless of ownership status)
const isActuallyInteractive = computed(() => {
    return props.isInteractive
})

const handleClick = () => {
    if (isActuallyInteractive.value) {
        emit('toggle', props.improvementId)
    }
}

const handleMouseEnter = () => {
    if (isActuallyInteractive.value) {
        isHovering.value = true
    }
}

const handleMouseLeave = () => {
    if (isActuallyInteractive.value) {
        isHovering.value = false
    }
}

const displayValue = computed(() => {
    return props.value
})

const displayText = computed(() => {
    // Interactive badge text (on hover vs normal)
    if (isActuallyInteractive.value) {
        if (isHovering.value) {
            // Show "- Remove" for owned items, "+ Add" for unowned
            return props.isOwned ? '- Remove' : '+ Add'
        }
        // Free items (no cost): always show "+ Add" as the resting text
        // (the badge is opacity:0 at rest anyway, only revealed on card hover)
        if (props.value === undefined || props.value === null) {
            return '+ Add'
        }
        // Show normal badge text when not hovering
        return props.type === 'xp' ? `${props.value} XP` : props.value
    }

    // Standard badge text
    switch (props.type) {
        case 'xp':
            return `${props.value} XP`
        case 'keeping':
            return props.value
        default:
            return props.value
    }
})

const badgeClass = computed(() => {
    const classes = ['badge-display', 'badge-bottom-left']

    // Improvement badges get special positioning (extending below card)
    if (props.improvementId || props.asImprovementBadge) {
        classes.push('improvement-badge')
    }

    // Interactive badge styling
    if (isActuallyInteractive.value) {
        classes.push('badge-interactive')

        if (props.isOwned) {
            // Owned badges: show owned style when not hovering, warning style when hovering
            if (isHovering.value) {
                classes.push('badge-interactive-remove-hover')
            } else {
                classes.push('badge-owned')
            }
        } else {
            // Unowned badges use primary/accent colors
            const interactiveClass = isHovering.value ? 'badge-interactive-available-hover' : 'badge-interactive-available'
            classes.push(interactiveClass, 'improvement-badge-unowned')
        }
    }

    // Free-item badges are invisible at rest; revealed only when the parent card is hovered
    if (props.hiddenByDefault) {
        classes.push('badge-hidden-until-hover')
    }

    if (!isActuallyInteractive.value && props.isOwned) {
        // Non-interactive owned badges
        classes.push('badge-owned')
    }

    return classes.join(' ')
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.badge-display {
    position: absolute;
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-bold);
    padding: 2px 8px;
    border-top-right-radius: var(--radius-10);
    pointer-events: none;
    z-index: var(--z-interactive);
    background-color: var(--color-primary);
    color: var(--color-black);
}

.badge-owned {
    background-color: var(--color-bg-tertiary);
}

.badge-interactive {
    cursor: pointer;
    transition: var(--transition-all);
    pointer-events: auto;
}

.badge-interactive-available {
    background-color: var(--color-primary);
    color: var(--color-black);
}

.badge-interactive-available-hover {
    background-color: var(--color-accent-gold);
    color: var(--color-black);
}

.badge-interactive-remove-hover {
    background-color: var(--color-danger);
    color: var(--color-danger-text);
}

.badge-bottom-left {
    bottom: 0;
    left: 0;
    border-top-right-radius: var(--radius-10);
    border-bottom-left-radius: var(--radius-5);
}

.badge-bottom-left.improvement-badge {
    bottom: calc(-1 * var(--space-md));
}

.badge-hidden-until-hover {
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-fast);
}

.keeping-icon {
    width: var(--font-size-14);
    height: var(--font-size-14);
    position: relative;
    bottom: 1px;
    margin-left: 2px !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    margin-right: 0 !important;
    vertical-align: middle;
    display: inline-block !important;
}
</style>
