<template>
    <button type="button" :disabled="disabled" :class="buttonClasses" :title="tooltipText" @click="handleClick">
        {{ displayText }}
    </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
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

    isEditMode: {
        type: Boolean,
        default: false
    },

    isEditing: {
        type: Boolean,
        default: false
    },

    disabled: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
    const isInEditMode = props.isEditMode || props.isEditing
    return [
        'edit-btn',
        `edit-btn--${props.size}`,
        `edit-btn--${props.visibility}`,
        {
            'edit-btn--edit-mode': isInEditMode,
            'edit-btn--disabled': props.disabled
        }
    ].filter(Boolean)
})

const displayText = computed(() => {
    const isInEditMode = props.isEditMode || props.isEditing
    return isInEditMode ? '✓' : '✎'
})

const tooltipText = computed(() => {
    const isInEditMode = props.isEditMode || props.isEditing
    return isInEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'
})

const handleClick = (event) => {
    if (!props.disabled) {
        emit('click', event)
    }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

/* === BASE EDIT BUTTON STYLES === */
.edit-btn {
    /* Layout */
    display: inline-flex;
    align-items: center;
    justify-content: center;

    /* Typography */
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    white-space: nowrap;
    line-height: var(--line-height-none);

    /* Appearance */
    background: var(--overlay-black-medium);
    border: 1px solid var(--overlay-black-medium);
    color: var(--color-white);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    user-select: none;

    /* Transitions */
    transition: var(--transition-all);
}

.edit-btn:hover:not(.edit-btn--disabled) {
    background: var(--overlay-black-heavy);
    border-color: var(--overlay-black-heavy);
    color: var(--color-white);
    box-shadow: var(--shadow-md);
}

/* === SIZE VARIANTS === */
.edit-btn--small {
    padding: 0;
    font-size: var(--font-size-14);
    min-width: 28px;
    min-height: 28px;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
}

.edit-btn--large {
    padding: 0;
    font-size: var(--font-size-16);
    min-width: 32px;
    min-height: 32px;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
}

/* === VISIBILITY VARIANTS === */
.edit-btn--on-hover {
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-normal), transform var(--transition-normal);
}

/* When in edit mode (checkmark), always show the button */
.edit-btn--on-hover.edit-btn--edit-mode {
    opacity: 1;
    pointer-events: auto;
}

.edit-btn--always {
    opacity: 0.7;
}

.edit-btn--always:hover:not(.edit-btn--disabled) {
    opacity: 1;
}

/* === EDIT MODE STATES === */
.edit-btn--edit-mode {
    /* Green background with white checkmark when in edit mode */
    background: var(--color-success);
    border-color: var(--color-success);
    color: var(--color-white);
}

.edit-btn--edit-mode:hover:not(.edit-btn--disabled) {
    background: var(--color-success-hover);
    border-color: var(--color-success-hover);
    color: var(--color-white);
}

/* === DISABLED STATE === */
.edit-btn--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
}

/* === FOCUS STYLES === */
.edit-btn:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.edit-btn:focus:not(:focus-visible) {
    outline: none;
}

/* === HOVER TRIGGER CLASSES === */
/* These classes should be added to parent containers to trigger hover visibility */
.edit-trigger:hover .edit-btn--on-hover,
.edit-trigger.hover .edit-btn--on-hover {
    opacity: 1;
    pointer-events: auto;
}

/* For specific use cases where the hover area is different */
.edit-hover-area:hover .edit-btn--on-hover,
.edit-hover-area.hover .edit-btn--on-hover {
    opacity: 1;
    pointer-events: auto;
}

/* === RESPONSIVE ADJUSTMENTS === */
@media (max-width: 768px) {

    /* Make on-hover buttons always visible on touch devices */
    .edit-btn--on-hover {
        opacity: 0.6;
        pointer-events: auto;
    }

    /* Slightly larger touch targets */
    .edit-btn--small {
        min-width: 32px;
        min-height: 32px;
        width: 32px;
        height: 32px;
    }

    .edit-btn--large {
        min-width: 36px;
        min-height: 36px;
        width: 36px;
        height: 36px;
    }
}

/* === REDUCED MOTION === */
@media (prefers-reduced-motion: reduce) {
    .edit-btn {  transition: none;
    }
}
</style>
