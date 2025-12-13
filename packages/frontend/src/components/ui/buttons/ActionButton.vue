<template>
    <button :type="type" :disabled="disabled || loading" :class="buttonClasses" @click="handleClick">
        <!-- Loading spinner -->
        <LoadingSpinner v-if="loading" size="small" />

        <!-- Button text -->
        <span v-if="!loading" class="action-btn__text">
            <slot>{{ text }}</slot>
        </span>
    </button>
</template>

<script setup>
import { computed } from 'vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const props = defineProps({
    variant: {
        type: String,
        default: 'neutral',
        validator: (value) => ['primary', 'neutral', 'danger', 'success', 'outline'].includes(value)
    },

    size: {
        type: String,
        default: 'large',
        validator: (value) => ['small', 'large'].includes(value)
    },

    type: {
        type: String,
        default: 'button',
        validator: (value) => ['button', 'submit', 'reset'].includes(value)
    },

    text: {
        type: String,
        default: ''
    },

    disabled: {
        type: Boolean,
        default: false
    },

    loading: {
        type: Boolean,
        default: false
    },

    selected: {
        // Note: 'selected' styling currently only implemented for variant="outline"
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
    return [
        'action-btn',
        `action-btn--${props.variant}`,
        `action-btn--${props.size}`,
        {
            'action-btn--disabled': props.disabled,
            'action-btn--loading': props.loading,
            'action-btn--selected': props.selected
        }
    ].filter(Boolean)
})

const handleClick = (event) => {
    if (!props.disabled && !props.loading) {
        emit('click', event)
    }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

/* === BASE BUTTON STYLES === */
.action-btn {
    /* Layout */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);

    /* Typography */
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    white-space: nowrap;

    /* Appearance */
    border: none;
    border-radius: var(--radius-5);
    cursor: pointer;
    user-select: none;

    /* Transitions */
    transition: var(--transition-all);

    /* Prevent double-tap zoom on mobile */
    touch-action: manipulation;
}

/* === SIZE VARIANTS === */
.action-btn--small {
    padding: var(--btn-padding-sm);
    font-size: var(--btn-font-size-sm);
    min-height: var(--btn-min-height-sm);
}

.action-btn--large {
    padding: var(--btn-padding-md);
    font-size: var(--btn-font-size-md);
    min-height: var(--btn-min-height-md);
}

/* === COLOR VARIANTS === */

/* Primary (Gold) */
.action-btn--primary {
    background-color: var(--color-primary);
    color: var(--color-primary-text);
}

.action-btn--primary:hover:not(.action-btn--disabled):not(.action-btn--loading) {
    background-color: var(--color-primary-hover);
}

.action-btn--primary:active:not(.action-btn--disabled):not(.action-btn--loading) {
    background-color: var(--color-primary-active);
}

/* Secondary (Gray) */
.action-btn--neutral {
    background-color: var(--color-neutral);
    color: var(--color-neutral-text);
}

.action-btn--neutral:hover:not(.action-btn--disabled):not(.action-btn--loading) {
    background-color: var(--color-neutral-hover);
}

.action-btn--neutral:active:not(.action-btn--disabled):not(.action-btn--loading) {
    background-color: var(--color-neutral-active);
}

/* Danger (Red) */
.action-btn--danger {
    background-color: var(--color-danger);
    color: var(--color-danger-text);
}

.action-btn--danger:hover:not(.action-btn--disabled):not(.action-btn--loading) {
    background-color: var(--color-danger-hover);
}

.action-btn--danger:active:not(.action-btn--disabled):not(.action-btn--loading) {
    background-color: var(--color-danger-active);
}

/* Success (Green) */
.action-btn--success {
    background-color: var(--color-success);
    color: var(--color-success-text);
}

.action-btn--success:hover:not(.action-btn--disabled):not(.action-btn--loading) {
    background-color: var(--color-success-hover);
}

.action-btn--success:active:not(.action-btn--disabled):not(.action-btn--loading) {
    background-color: var(--color-success-active);
}

/* Outline */
.action-btn--outline {
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-gray-medium);
}

.action-btn--outline:hover:not(.action-btn--disabled):not(.action-btn--loading) {
    background-color: var(--color-primary-hover);
}

.action-btn--outline:active:not(.action-btn--disabled):not(.action-btn--loading) {
    background-color: var(--color-primary);
    color: var(--color-primary-text);
    border-color: var(--color-primary);
}

.action-btn--outline.action-btn--selected {
    background-color: var(--color-primary);
    color: var(--color-primary-text);
    border-color: var(--color-primary);
}

/* === STATE VARIANTS === */

/* Disabled */
.action-btn--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

/* Loading */
.action-btn--loading {
    cursor: wait;
    position: relative;
}

/* === FOCUS STYLES === */
.action-btn:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.action-btn:focus:not(:focus-visible) {
    outline: none;
}

/* === RESPONSIVE ADJUSTMENTS === */
@media (max-width: var(--breakpoint-md)) {

    /* Slightly larger touch targets on mobile */
    .action-btn--small {
        min-height: calc(var(--btn-min-height-sm) + 0.25rem);
    }

    .action-btn--large {
        min-height: calc(var(--btn-min-height-md) + 0.25rem);
    }
}
</style>
