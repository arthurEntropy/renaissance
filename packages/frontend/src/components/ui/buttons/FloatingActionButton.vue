<template>
    <button type="button" :disabled="disabled" :class="buttonClasses" :title="tooltip" @click="$emit('click', $event)">
        <component :is="iconComponent" :class="iconClass" />
    </button>
</template>

<script setup>
import { computed } from 'vue'
import { PlusIcon, DocumentDuplicateIcon, PencilIcon, CheckIcon, XMarkIcon, Bars3Icon } from '@heroicons/vue/24/outline'

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['edit', 'add', 'duplicate', 'delete', 'drag'].includes(value)
    },

    size: {
        type: String,
        default: 'small',
        validator: (value) => ['small', 'large'].includes(value)
    },

    visibility: {
        type: String,
        default: 'on-hover',
        validator: (value) => ['always', 'on-hover'].includes(value)
    },

    // Only used for edit type - indicates active/editing state
    isActive: {
        type: Boolean,
        default: false
    },

    disabled: {
        type: Boolean,
        default: false
    }
})

defineEmits(['click'])

const buttonClasses = computed(() => {
    return [
        'fab',
        `fab--${props.type}`,
        `fab--${props.size}`,
        `fab--${props.visibility}`,
        {
            'fab--active': props.isActive && props.type === 'edit',
            'fab--disabled': props.disabled
        }
    ].filter(Boolean)
})

const iconComponent = computed(() => {
    if (props.type === 'edit') {
        return props.isActive ? CheckIcon : PencilIcon
    } else if (props.type === 'add') {
        return PlusIcon
    } else if (props.type === 'duplicate') {
        return DocumentDuplicateIcon
    } else if (props.type === 'delete') {
        return XMarkIcon
    } else {
        return Bars3Icon
    }
})

const iconClass = computed(() => {
    return props.size === 'small' ? 'fab__icon--small' : 'fab__icon--large'
})

const tooltip = computed(() => {
    if (props.type === 'edit') {
        return props.isActive ? 'Exit Edit Mode' : 'Enter Edit Mode'
    } else if (props.type === 'add') {
        return 'Add'
    } else if (props.type === 'duplicate') {
        return 'Duplicate'
    } else if (props.type === 'delete') {
        return 'Delete'
    } else {
        return 'Drag to reorder'
    }
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

/* === BASE FAB STYLES === */
.fab {
    /* Layout */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;

    /* Typography */
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    white-space: nowrap;
    line-height: var(--line-height-none);

    /* Appearance */
    background: var(--overlay-black-medium);
    border: 1px solid var(--overlay-black-medium);
    border-radius: var(--radius-full);
    color: var(--color-white);
    cursor: pointer;
    user-select: none;

    /* Transitions */
    transition: var(--transition-all);
}

.fab:hover:not(.fab--disabled) {
    background: var(--overlay-black-heavy);
    border-color: var(--overlay-black-heavy);
    color: var(--color-white);
}

/* === SIZE VARIANTS === */
.fab--small {
    min-width: var(--btn-min-height-sm);
    min-height: var(--btn-min-height-sm);
    width: var(--btn-min-height-sm);
    height: var(--btn-min-height-sm);
}

.fab--large {
    min-width: var(--btn-min-height-md);
    min-height: var(--btn-min-height-md);
    width: var(--btn-min-height-md);
    height: var(--btn-min-height-md);
}

/* === ICON SIZES === */
.fab__icon--small {
    width: 14px;
    height: 14px;
}

.fab__icon--large {
    width: 18px;
    height: 18px;
}

/* === TYPE VARIANTS === */
.fab--add {
    background: var(--color-primary);
    border-color: var(--color-primary);
}

.fab--add:hover:not(.fab--disabled) {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
}

.fab--drag {
    cursor: move;
}

/* === VISIBILITY VARIANTS === */
.fab--on-hover {
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-normal), transform var(--transition-normal);
}

/* When edit button is active (checkmark), always show it */
.fab--on-hover.fab--active {
    opacity: 1;
    pointer-events: auto;
}

.fab--always {
    opacity: 0.7;
}

.fab--always:hover:not(.fab--disabled) {
    opacity: 1;
}

/* === ACTIVE STATE (Edit type) === */
.fab--active {
    background: var(--color-success);
    border-color: var(--color-success);
    color: var(--color-white);
}

.fab--active:hover:not(.fab--disabled) {
    background: var(--color-success-hover);
    border-color: var(--color-success-hover);
    color: var(--color-white);
}

/* === DISABLED STATE === */
.fab--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
}

/* === FOCUS STYLES === */
.fab:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.fab:focus:not(:focus-visible) {
    outline: none;
}

/* === HOVER TRIGGER CLASSES === */
/* Parent containers can use these classes to trigger hover visibility */
.edit-trigger:hover .fab--on-hover,
.edit-trigger.hover .fab--on-hover {
    opacity: 1;
    pointer-events: auto;
}

.edit-hover-area:hover .fab--on-hover,
.edit-hover-area.hover .fab--on-hover {
    opacity: 1;
    pointer-events: auto;
}

/* === RESPONSIVE ADJUSTMENTS === */
@media (max-width: var(--breakpoint-md)) {

    /* Make on-hover buttons always visible on touch devices */
    .fab--on-hover {
        opacity: 0.6;
        pointer-events: auto;
    }

    /* Slightly larger touch targets */
    .fab--small {
        min-width: 32px;
        min-height: 32px;
        width: 32px;
        height: 32px;
    }

    .fab--large {
        min-width: 36px;
        min-height: 36px;
        width: 36px;
        height: 36px;
    }
}

/* === REDUCED MOTION === */
@media (prefers-reduced-motion: reduce) {
    .fab {
        transition: none;
    }
}
</style>
