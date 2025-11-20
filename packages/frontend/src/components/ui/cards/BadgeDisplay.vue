<template>
    <div v-if="showBadge" :class="badgeClass" :title="computedTitle" @click.stop="handleClick"
        @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        {{ displayText }}
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['xp', 'keeping', 'custom'].includes(value)
    },
    value: {
        type: [String, Number],
        required: true
    },
    condition: {
        type: Boolean,
        default: true
    },
    position: {
        type: String,
        default: 'bottom-left',
        validator: (value) => ['bottom-left', 'bottom-right', 'top-left', 'top-right'].includes(value)
    },
    customClass: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    // Interactive improvement badge props
    interactive: {
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
    return props.condition && props.value
})

const handleClick = () => {
    if (props.interactive && props.improvementId) {
        emit('toggle', props.improvementId)
    }
}

const handleMouseEnter = () => {
    if (props.interactive) {
        isHovering.value = true
    }
}

const handleMouseLeave = () => {
    if (props.interactive) {
        isHovering.value = false
    }
}

const displayText = computed(() => {
    // Interactive improvement badge text
    if (props.interactive) {
        if (isHovering.value) {
            return props.isOwned ? '- Remove' : '+ Add'
        }
        return props.isOwned ? '✓' : `${props.value} XP`
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

const computedTitle = computed(() => {
    if (props.interactive) {
        if (props.isOwned) {
            return isHovering.value ? 'Click to remove this improvement' : 'You have this improvement'
        }
        return isHovering.value ? 'Click to add this improvement' : `Costs ${props.value} XP`
    }
    return props.title
})

const badgeClass = computed(() => {
    const baseClass = 'badge-display'
    let typeClass = `badge-${props.type}`
    const positionClass = `badge-${props.position}`

    // Interactive badge styling
    if (props.interactive) {
        if (props.isOwned) {
            typeClass = isHovering.value ? 'badge-interactive-owned-hover' : 'badge-interactive-owned'
        } else {
            typeClass = isHovering.value ? 'badge-interactive-available-hover' : 'badge-interactive-available'
        }
    }

    return [
        baseClass,
        typeClass,
        positionClass,
        props.customClass,
        props.interactive ? 'badge-interactive' : ''
    ].filter(Boolean).join(' ')
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
}

/* Badge types */
.badge-xp {
    background-color: var(--color-primary);
    color: var(--color-black);
}

.badge-keeping {
    background-color: var(--color-primary);
    color: var(--color-black);
}

/* Interactive badge states */
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

.badge-interactive-owned {
    background-color: var(--color-primary);
    color: var(--color-black);
}

.badge-interactive-owned-hover {
    background-color: var(--color-danger-hover);
    color: var(--color-white);
}

/* Positioning */
.badge-bottom-left {
    bottom: 0;
    left: 0;
    border-top-right-radius: var(--radius-10);
    border-bottom-left-radius: var(--radius-5);
}

.badge-bottom-right {
    bottom: 0;
    right: 0;
    border-top-left-radius: var(--radius-10);
    border-bottom-right-radius: var(--radius-5);
}

.badge-top-left {
    top: 0;
    left: 0;
    border-bottom-right-radius: var(--radius-10);
    border-top-left-radius: var(--radius-5);
}

.badge-top-right {
    top: 0;
    right: 0;
    border-bottom-left-radius: var(--radius-10);
    border-top-right-radius: var(--radius-5);
}

/* Special styling for improvement badges */
.badge-bottom-left.improvement-badge {
    bottom: -10px;
    border-bottom-left-radius: var(--radius-5);
}
</style>
