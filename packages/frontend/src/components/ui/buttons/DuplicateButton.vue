<template>
    <button type="button" :disabled="disabled" :class="buttonClasses" :title="tooltipText" @click="handleClick">
        <DocumentDuplicateIcon class="duplicate-icon" />
    </button>
</template>

<script setup>
import { computed } from 'vue'
import { DocumentDuplicateIcon } from '@heroicons/vue/24/outline'

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

    disabled: {
        type: Boolean,
        default: false
    },

    title: {
        type: String,
        default: 'Duplicate item'
    }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
    return [
        'duplicate-btn',
        `duplicate-btn--${props.size}`,
        `duplicate-btn--${props.visibility}`,
        {
            'duplicate-btn--disabled': props.disabled
        }
    ].filter(Boolean)
})

const tooltipText = computed(() => {
    return props.title
})

const handleClick = (event) => {
    if (!props.disabled) {
        emit('click', event)
    }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

/* === BASE DUPLICATE BUTTON STYLES === */
.duplicate-btn {
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
    cursor: pointer;
    user-select: none;

    /* Transitions */
    transition: var(--transition-all);
}

.duplicate-btn:hover:not(.duplicate-btn--disabled) {
    background: var(--overlay-black-heavy);
    border-color: var(--overlay-black-heavy);
    color: var(--color-white);
}

/* === SIZE VARIANTS === */
.duplicate-btn--small {
    padding: 0;
    min-width: 28px;
    min-height: 28px;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
}

.duplicate-btn--large {
    padding: 0;
    min-width: 32px;
    min-height: 32px;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
}

/* === ICON STYLES === */
.duplicate-icon {
    width: 16px;
    height: 16px;
}

.duplicate-btn--large .duplicate-icon {
    width: 18px;
    height: 18px;
}

/* === VISIBILITY VARIANTS === */
.duplicate-btn--on-hover {
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.duplicate-btn--always {
    opacity: 0.7;
}

.duplicate-btn--always:hover:not(.duplicate-btn--disabled) {
    opacity: 1;
}

/* === DISABLED STATE === */
.duplicate-btn--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
}

/* === FOCUS STYLES === */
.duplicate-btn:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.duplicate-btn:focus:not(:focus-visible) {
    outline: none;
}

/* === HOVER TRIGGER CLASSES === */
/* These classes should be added to parent containers to trigger hover visibility */
.edit-trigger:hover .duplicate-btn--on-hover,
.edit-trigger.hover .duplicate-btn--on-hover {
    opacity: 1;
    pointer-events: auto;
}

/* For specific use cases where the hover area is different */
.edit-hover-area:hover .duplicate-btn--on-hover,
.edit-hover-area.hover .duplicate-btn--on-hover {
    opacity: 1;
    pointer-events: auto;
}

/* === RESPONSIVE ADJUSTMENTS === */
@media (max-width: var(--breakpoint-md)) {

    /* Make on-hover buttons always visible on touch devices */
    .duplicate-btn--on-hover {
        opacity: 0.6;
        pointer-events: auto;
    }

    /* Slightly larger touch targets */
    .duplicate-btn--small {
        min-width: 32px;
        min-height: 32px;
        width: 32px;
        height: 32px;
    }

    .duplicate-btn--large {
        min-width: 36px;
        min-height: 36px;
        width: 36px;
        height: 36px;
    }
}

/* === REDUCED MOTION === */
@media (prefers-reduced-motion: reduce) {
    .duplicate-btn {
        transition: none;
    }
}
</style>