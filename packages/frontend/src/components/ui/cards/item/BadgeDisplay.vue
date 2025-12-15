<template>
    <div v-if="showBadge" :class="badgeClass" @click.stop="handleClick" @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave">
        {{ displayText }}
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['xp', 'keeping'].includes(value)
    },
    value: {
        type: [String, Number],
        required: true
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
    }
})

const emit = defineEmits(['toggle'])

// Reactive state for hover
const isHovering = ref(false)

const showBadge = computed(() => {
    return !!props.value
})

const handleClick = () => {
    if (props.isInteractive && props.improvementId) {
        emit('toggle', props.improvementId)
    }
}

const handleMouseEnter = () => {
    if (props.isInteractive) {
        isHovering.value = true
    }
}

const handleMouseLeave = () => {
    if (props.isInteractive) {
        isHovering.value = false
    }
}

const displayText = computed(() => {
    // Interactive badge text (on hover vs normal)
    if (props.isInteractive) {
        return isHovering.value ? '+ Add' : `${props.value} XP`
    }

    // Standard badge text
    switch (props.type) {
        case 'xp':
            return `${props.value} XP`
        case 'keeping':
            return `${props.value} 🪙`
        default:
            return props.value
    }
})

const badgeClass = computed(() => {
    const classes = ['badge-display', 'badge-bottom-left']

    // Interactive badge styling
    if (props.isInteractive) {
        const interactiveClass = isHovering.value ? 'badge-interactive-available-hover' : 'badge-interactive-available'
        classes.push('badge-interactive', interactiveClass)
        // Interactive badges (unowned improvements) get additional styling and positioning
        classes.push('improvement-badge-unowned', 'improvement-badge')
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

.badge-bottom-left {
    bottom: calc(-1 * var(--space-md));
    left: 0;
    border-top-right-radius: var(--radius-10);
    border-bottom-left-radius: var(--radius-5);
}

.badge-bottom-left.improvement-badge {
    bottom: calc(-1 * var(--space-md));
}
</style>
