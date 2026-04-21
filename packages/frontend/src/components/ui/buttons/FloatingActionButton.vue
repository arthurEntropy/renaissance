<template>
    <button type="button" :disabled="disabled" :class="buttonClasses" :title="tooltip" @click="handleClick"
        @mousedown="handleMouseDown" @mouseup="handleMouseUp" @mouseleave="handleMouseUp" @touchstart="handleTouchStart"
        @touchend="handleTouchEnd" @touchcancel="handleTouchEnd">
        <span v-if="isAutoCalcText" class="auto-text">AUTO</span>
        <span v-else-if="isImageIcon" :class="[iconClass, 'fab__icon--image']" :style="imageIconStyle"></span>
        <component v-else :is="iconComponent" :class="iconClass" />
    </button>
</template>

<script setup>
import { computed, ref } from 'vue'
import { PlusIcon, DocumentDuplicateIcon, PencilIcon, CheckIcon, XMarkIcon, Bars3Icon, Cog6ToothIcon, ArrowPathIcon, BookOpenIcon, CalculatorIcon, ChevronDoubleDownIcon, ChevronDoubleUpIcon } from '@heroicons/vue/24/outline'
import crossedSwordsIcon from '@/assets/icons/crossed_swords.png'
import dieIcon from '@/assets/icons/die.png'
import injuryIcon from '@/assets/icons/injury.png'

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['edit', 'add', 'duplicate', 'delete', 'drag', 'settings', 'refresh', 'dice', 'initiative', 'injury', 'notes', 'auto-calc', 'expand-all', 'collapse-all'].includes(value)
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
    // For auto-calc type - indicates auto mode (true) vs manual mode (false)
    isActive: {
        type: Boolean,
        default: false
    },

    // Overrides visibility='on-hover' to always show the button, controlled by the parent.
    forceVisible: {
        type: Boolean,
        default: false
    },

    disabled: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['click', 'long-press'])

// Long-press detection
const LONG_PRESS_DURATION = 500
let longPressTimer = null
const isLongPress = ref(false)

const handleClick = (e) => {
    if (!isLongPress.value) {
        emit('click', e)
    }
}

const startLongPress = () => {
    isLongPress.value = false
    longPressTimer = setTimeout(() => {
        isLongPress.value = true
        emit('long-press')
    }, LONG_PRESS_DURATION)
}

const cancelLongPress = () => {
    if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
    }
}

const handleMouseDown = () => {
    if (props.type === 'auto-calc') {
        startLongPress()
    }
}

const handleMouseUp = () => {
    if (props.type === 'auto-calc') {
        cancelLongPress()
        setTimeout(() => {
            isLongPress.value = false
        }, 50)
    }
}

const handleTouchStart = (e) => {
    if (props.type === 'auto-calc') {
        e.preventDefault()
        startLongPress()
    }
}

const handleTouchEnd = (e) => {
    if (props.type === 'auto-calc') {
        e.preventDefault()
        cancelLongPress()
        if (!isLongPress.value) {
            emit('click', e)
        }
        setTimeout(() => {
            isLongPress.value = false
        }, 50)
    }
}

const buttonClasses = computed(() => {
    return [
        'fab',
        `fab--${props.type}`,
        `fab--${props.size}`,
        `fab--${props.forceVisible ? 'always' : props.visibility}`,
        {
            'fab--active': props.isActive && props.type === 'edit',
            'fab--disabled': props.disabled
        }
    ].filter(Boolean)
})

const isAutoCalcText = computed(() => {
    return props.type === 'auto-calc' && props.isActive
})

const isImageIcon = computed(() => {
    return ['dice', 'initiative', 'injury'].includes(props.type)
})

const imageIconStyle = computed(() => {
    if (props.type === 'dice') {
        return {
            maskImage: `url(${dieIcon})`,
            WebkitMaskImage: `url(${dieIcon})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center'
        }
    } else if (props.type === 'initiative') {
        return {
            maskImage: `url(${crossedSwordsIcon})`,
            WebkitMaskImage: `url(${crossedSwordsIcon})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center'
        }
    } else if (props.type === 'injury') {
        return {
            maskImage: `url(${injuryIcon})`,
            WebkitMaskImage: `url(${injuryIcon})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center'
        }
    }
    return {}
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
    } else if (props.type === 'settings') {
        return Cog6ToothIcon
    } else if (props.type === 'refresh') {
        return ArrowPathIcon
    } else if (props.type === 'notes') {
        return BookOpenIcon
    } else if (props.type === 'auto-calc') {
        return CalculatorIcon
    } else if (props.type === 'expand-all') {
        return ChevronDoubleDownIcon
    } else if (props.type === 'collapse-all') {
        return ChevronDoubleUpIcon
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
    } else if (props.type === 'settings') {
        return 'Settings'
    } else if (props.type === 'duplicate') {
        return 'Duplicate'
    } else if (props.type === 'delete') {
        return 'Delete'
    } else if (props.type === 'refresh') {
        return 'Reset to maximum'
    } else if (props.type === 'dice') {
        return 'Custom Dice Roll'
    } else if (props.type === 'initiative') {
        return 'Roll Initiative'
    } else if (props.type === 'injury') {
        return 'Roll Injury'
    } else if (props.type === 'notes') {
        return 'Bio & Notes'
    } else if (props.type === 'auto-calc') {
        return props.isActive ? 'Auto mode (long-press to toggle)' : 'Manual mode (click to calculate, long-press to toggle)'
    } else if (props.type === 'expand-all') {
        return 'Expand all'
    } else if (props.type === 'collapse-all') {
        return 'Collapse all'
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
    font-size: 11px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary);
}

.fab__icon--large {
    width: 18px;
    height: 18px;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary);
}

/* === IMAGE ICON STYLES === */
.fab__icon--image {
    background-color: var(--color-primary);
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

.fab--auto-calc {
    /* Same styling as other FABs */
}

.auto-text {
    font-size: 7px;
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    letter-spacing: 0.3px;
    line-height: 1;
}

.fab--auto-calc:not(.fab--active) .fab__icon--small {
    color: var(--color-primary);
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
