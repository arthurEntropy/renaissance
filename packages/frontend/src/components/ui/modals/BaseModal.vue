<template>
    <Teleport to="body">
        <div v-if="open" class="base-modal-overlay" :style="overlayStyle" @click.self="emit('close')">
            <div class="base-modal-box" :class="boxClass" :style="modalBoxStyle">

                <!-- Header: built-in title + close, or custom via #header slot, or hidden -->
                <header v-if="!hideHeader" class="base-modal-header">
                    <slot name="header">
                        <h2 class="base-modal-title">{{ title }}</h2>
                        <button class="base-modal-close" @click="emit('close')" aria-label="Close">
                            <XMarkIcon class="base-modal-close-icon" />
                        </button>
                    </slot>
                </header>

                <!-- Scrollable body -->
                <div class="base-modal-body">
                    <slot />
                </div>

                <!-- Sticky actions footer (rendered only when slot is provided) -->
                <div v-if="$slots.actions" class="base-modal-footer">
                    <slot name="actions" />
                </div>

            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, inject, computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

// Module-level counter so multiple concurrent BaseModal instances coordinate correctly.
// The scroll lock is only applied when the first modal opens and only released when the last closes.
let openModalCount = 0

function lockScroll() {
    if (++openModalCount === 1) {
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
    }
}

function unlockScroll() {
    if (--openModalCount <= 0) {
        openModalCount = 0
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
    }
}

const props = defineProps({
    title: {
        type: String,
        default: '',
    },
    hideHeader: {
        type: Boolean,
        default: false,
    },
    open: {
        type: Boolean,
        default: true,
    },
    width: {
        type: String,
        default: null,
    },
    offsetY: {
        type: String,
        default: null,
    },
    boxClass: {
        type: String,
        default: '',
    },
    boxStyle: {
        type: Object,
        default: null,
    },
    overlayStyle: {
        type: Object,
        default: null,
    },
})

const emit = defineEmits(['close'])

const modalBoxStyle = computed(() => {
    const style = {}
    if (props.width) {
        style.width = props.width
    }
    if (props.offsetY) {
        style.transform = `translateY(${props.offsetY})`
    }
    if (props.boxStyle) {
        Object.assign(style, props.boxStyle)
    }
    return Object.keys(style).length > 0 ? style : undefined
})

const scrollLockDisabled = inject('disableScrollLock', false)

const handleEscape = (e) => {
    if (!props.open) return
    if (e.key === 'Escape') emit('close')
}

watch(
    () => props.open,
    (isOpen, wasOpen) => {
        if (scrollLockDisabled) return
        if (isOpen) lockScroll()
        else if (wasOpen) unlockScroll()
    },
    { immediate: true },
)

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleEscape)
    if (!scrollLockDisabled && props.open) unlockScroll()
})
</script>

<style scoped>
/* Overlay */
.base-modal-overlay {
    position: fixed;
    inset: 0 0 0 0;
    background: var(--overlay-black-heavy);
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg);
    overflow-y: auto;
}

/* Box */
.base-modal-box {
    background: var(--color-bg-secondary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-15);
    padding: var(--space-xl);
    width: min(520px, 90vw);
    max-height: calc(100vh - var(--nav-height) - 4 * var(--space-xl));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
}

/* Header */
.base-modal-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding-bottom: var(--space-lg);
}

.base-modal-title {
    flex: 1;
    text-align: center;
    color: var(--color-primary);
    font-size: var(--font-size-24);
    font-weight: var(--font-weight-semibold);
    margin: 0;
}

.base-modal-close {
    position: absolute;
    right: 0;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-xs);
    color: var(--color-gray-light);
    border-radius: var(--radius-5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition-fast);
}

.base-modal-close:hover {
    color: var(--color-white);
}

.base-modal-close-icon {
    width: 24px;
    height: 24px;
}

/* Body */
.base-modal-body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

/* Uniform form labels inside modal content */
:deep(.base-modal-body label),
:deep(.base-modal-footer label) {
    display: flex;
    align-items: center;
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-xs);
}

/* Shared form layout helpers for BaseModal consumers */
:deep(.form-group) {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-lg);
}

:deep(.form-group.vertical) {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
}

:deep(.form-group.centered) {
    justify-content: center;
    text-align: center;
}

:deep(.form-group.row) {
    display: flex;
    justify-content: space-between;
    gap: var(--space-md);
}

:deep(.left-aligned) {
    text-align: left;
}

/* Uniform input spacing inside modal content */
:deep(.base-modal-body input:not([type='checkbox']):not([type='radio'])),
:deep(.base-modal-body select),
:deep(.base-modal-body textarea),
:deep(.base-modal-footer input:not([type='checkbox']):not([type='radio'])),
:deep(.base-modal-footer select),
:deep(.base-modal-footer textarea) {
    margin-top: var(--space-xs);
    margin-bottom: var(--space-md);
}

/* Override sizing/margin for inputs inside BaseModal (base styles come from modals.css) */
:deep(.base-modal-body .modal-input),
:deep(.base-modal-footer .modal-input) {
    width: 100%;
    margin: var(--space-sm);
    margin-left: 0;
}

/* Normalize native dropdown rendering to align with custom source trigger appearance */
:deep(.base-modal-body select.modal-input),
:deep(.base-modal-footer select.modal-input) {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, var(--color-text-muted) 50%),
        linear-gradient(135deg, var(--color-text-muted) 50%, transparent 50%);
    background-position: calc(100% - 12px) calc(50%), calc(100% - 9px) calc(50%);
    background-size: 3px 3px, 3px 3px;
    background-repeat: no-repeat;
    padding-right: 28px;
}

:deep(.base-modal-body .small-input),
:deep(.base-modal-footer .small-input) {
    width: 80px;
}

/* Footer / Actions */
.base-modal-footer {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    border-top: 1px solid var(--overlay-white-medium);
    padding-top: var(--space-md);
    margin-top: var(--space-md);
}
</style>
