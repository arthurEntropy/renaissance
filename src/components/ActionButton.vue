<template>
    <button :type="type" :disabled="disabled || loading" :class="buttonClasses" @click="handleClick">
        <!-- Loading spinner -->
        <span v-if="loading" class="action-btn__spinner">
            <svg class="action-btn__spinner-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25" />
                <path fill="currentColor" opacity="0.75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
        </span>

        <!-- Icon (left side) -->
        <span v-if="icon" class="action-btn__icon action-btn__icon--left">
            {{ icon }}
        </span>

        <!-- Button text -->
        <span v-if="!loading" class="action-btn__text">
            <slot>{{ text }}</slot>
        </span>
    </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    variant: {
        type: String,
        default: 'neutral',
        validator: (value) => ['primary', 'neutral', 'danger', 'success'].includes(value)
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

    icon: {
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
            'action-btn--with-icon': props.icon
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
/* Import design tokens */
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
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    white-space: nowrap;

    /* Appearance */
    border: none;
    border-radius: var(--radius-sm);
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

/* === ICON STYLING === */
.action-btn__icon {
    flex-shrink: 0;
    line-height: 1;
}

.action-btn__icon--left {
    margin-right: calc(var(--space-sm) * -0.5);
}

/* === LOADING SPINNER === */
.action-btn__spinner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.action-btn__spinner-icon {
    width: 1em;
    height: 1em;
    animation: action-btn-spin 1s linear infinite;
}

@keyframes action-btn-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
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
@media (max-width: 768px) {

    /* Slightly larger touch targets on mobile */
    .action-btn--small {
        min-height: calc(var(--btn-min-height-sm) + 0.25rem);
    }

    .action-btn--large {
        min-height: calc(var(--btn-min-height-md) + 0.25rem);
    }
}

/* === REDUCED MOTION === */
@media (prefers-reduced-motion: reduce) {
    .action-btn__spinner-icon {
        animation: none;
    }
}
</style>
