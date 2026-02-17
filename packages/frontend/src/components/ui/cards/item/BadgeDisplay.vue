<template>
    <div v-if="showBadge" :class="badgeClass" @click.stop="handleClick" @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave">
        <template v-if="type === 'keeping'">
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
    return !!props.value
})

// Badge should only be interactive if it's marked as interactive AND not owned
const isActuallyInteractive = computed(() => {
    return props.isInteractive && !props.isOwned
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

    // Owned badge styling
    if (props.isOwned) {
        classes.push('badge-owned')
    }

    // Interactive badge styling
    if (isActuallyInteractive.value) {
        const interactiveClass = isHovering.value ? 'badge-interactive-available-hover' : 'badge-interactive-available'
        classes.push('badge-interactive', interactiveClass, 'improvement-badge-unowned')
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

.badge-bottom-left {
    bottom: 0;
    left: 0;
    border-top-right-radius: var(--radius-10);
    border-bottom-left-radius: var(--radius-5);
}

.badge-bottom-left.improvement-badge {
    bottom: calc(-1 * var(--space-md));
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
