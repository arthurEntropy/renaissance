<template>
    <button type="button" :disabled="disabled" :class="[
        'action-btn',
        `action-btn--${props.variant}`,
        `action-btn--${props.size}`,
        {
            'action-btn--disabled': props.disabled
        }
    ]">
        <span class="action-btn__text">
            <slot>{{ text }}</slot>
        </span>
    </button>
</template>

<script setup>
import { ACTION_BUTTON_VARIANTS, ACTION_BUTTON_SIZES } from '@/constants/actionButton'

const props = defineProps({
    variant: {
        type: String,
        default: ACTION_BUTTON_VARIANTS.NEUTRAL,
        validator: (value) => Object.values(ACTION_BUTTON_VARIANTS).includes(value)
    },

    size: {
        type: String,
        default: ACTION_BUTTON_SIZES.LARGE,
        validator: (value) => Object.values(ACTION_BUTTON_SIZES).includes(value)
    },

    text: {
        type: String,
        default: ''
    },

    disabled: {
        type: Boolean,
        default: false
    }
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

/* === BASE BUTTON STYLES === */
.action-btn {
    --action-btn-bg: transparent;
    --action-btn-text: var(--color-text-primary);
    --action-btn-bg-hover: var(--action-btn-bg);
    --action-btn-text-hover: var(--action-btn-text);
    --action-btn-bg-active: var(--action-btn-bg-hover);
    --action-btn-text-active: var(--action-btn-text-hover);
    --action-btn-border-width: 0;
    --action-btn-border-color: transparent;
    --action-btn-border-color-hover: var(--action-btn-border-color);
    --action-btn-border-color-active: var(--action-btn-border-color-hover);

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
    background-color: var(--action-btn-bg);
    color: var(--action-btn-text);
    border: var(--action-btn-border-width) solid var(--action-btn-border-color);
    border-radius: var(--radius-5);
    cursor: pointer;
    user-select: none;

    /* Transitions */
    transition: var(--transition-normal);

    /* Prevent double-tap zoom on mobile */
    touch-action: manipulation;
}

.action-btn:hover:not(.action-btn--disabled) {
    background-color: var(--action-btn-bg-hover);
    color: var(--action-btn-text-hover);
    border-color: var(--action-btn-border-color-hover);
}

.action-btn:active:not(.action-btn--disabled) {
    background-color: var(--action-btn-bg-active);
    color: var(--action-btn-text-active);
    border-color: var(--action-btn-border-color-active);
}

/* === SIZE VARIANTS === */
.action-btn--small {
    padding: 2px var(--space-sm);
    font-size: var(--font-size-12);
    min-height: var(--btn-min-height-sm);
}

.action-btn--large {
    padding: var(--space-sm) var(--space-lg);
    font-size: var(--font-size-14);
    min-height: var(--btn-min-height-lg);
}

/* === COLOR VARIANTS === */

/* Primary (Gold) */
.action-btn--primary {
    --action-btn-bg: var(--color-primary);
    --action-btn-text: var(--color-primary-text);
    --action-btn-bg-hover: var(--color-primary-hover);
    --action-btn-bg-active: var(--color-primary-active);
}

/* Secondary (Gray) */
.action-btn--neutral {
    --action-btn-bg: var(--color-neutral);
    --action-btn-text: var(--color-neutral-text);
    --action-btn-bg-hover: var(--color-neutral-hover);
    --action-btn-bg-active: var(--color-neutral-active);
}

/* Danger (Red) */
.action-btn--danger {
    --action-btn-bg: var(--color-danger);
    --action-btn-text: var(--color-danger-text);
    --action-btn-bg-hover: var(--color-danger-hover);
    --action-btn-bg-active: var(--color-danger-active);
}

/* Success (Green) */
.action-btn--success {
    --action-btn-bg: var(--color-success);
    --action-btn-text: var(--color-success-text);
    --action-btn-bg-hover: var(--color-success-hover);
    --action-btn-bg-active: var(--color-success-active);
}

/* Outline */
.action-btn--outline {
    --action-btn-bg: var(--color-bg-secondary);
    --action-btn-text: var(--color-text-primary);
    --action-btn-bg-hover: var(--color-primary-hover);
    --action-btn-bg-active: var(--color-primary);
    --action-btn-text-active: var(--color-primary-text);
    --action-btn-border-width: 1px;
    --action-btn-border-color: var(--color-gray-medium);
    --action-btn-border-color-active: var(--color-primary);
}

/* === STATE VARIANTS === */

/* Disabled */
.action-btn--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

/* === FOCUS STYLES === */
.action-btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}
</style>
