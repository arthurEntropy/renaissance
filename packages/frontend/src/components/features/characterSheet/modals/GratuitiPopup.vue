<template>
    <teleport to="body">
        <!-- Backdrop: invisible, just catches outside clicks -->
        <div class="gp-backdrop" @click="$emit('close')" />

        <!-- Popup card positioned relative to the trigger FAB -->
        <div ref="popupEl" class="gp-popup" :style="popupStyle" @click.stop>
            <div class="gp-header">
                <strong>Gratuiti</strong>
            </div>

            <div class="gp-section" v-if="mestiereName || mestiereGratuiti">
                <div class="gp-section-label">{{ mestiereName || 'Mestiere' }}</div>
                <p v-if="mestiereGratuiti" class="gp-text" v-html="safeMestiereGratuiti"></p>
                <p v-else class="gp-empty">None defined.</p>
            </div>

            <div class="gp-section" v-if="keepingName || keepingGratuiti">
                <div class="gp-section-label">{{ keepingName || 'Keeping' }}</div>
                <p v-if="keepingGratuiti" class="gp-text">{{ keepingGratuiti }}</p>
                <p v-else class="gp-empty">Nothing.</p>
            </div>

            <p v-if="!mestiereName && !mestiereGratuiti && !keepingName && !keepingGratuiti" class="gp-empty">
                No gratuiti available.
            </p>
        </div>
    </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const props = defineProps({
    mestiereGratuiti: {
        type: String,
        default: '',
    },
    mestiereName: {
        type: String,
        default: '',
    },
    keepingGratuiti: {
        type: String,
        default: '',
    },
    keepingName: {
        type: String,
        default: '',
    },
    anchorEl: {
        type: Object,
        default: null,
    },
})

const emit = defineEmits(['close'])

const GAP = 8
const VIEWPORT_PADDING = 10

const safeMestiereGratuiti = computed(() => sanitizeHtml(props.mestiereGratuiti))

const popupEl = ref(null)
const positionStyle = ref({})

const calculatePosition = () => {
    if (!props.anchorEl || !popupEl.value) return

    const anchor = props.anchorEl.getBoundingClientRect()
    const popup = popupEl.value.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth

    // Horizontal: right-align popup to anchor's right edge, clamped to viewport
    let right = windowWidth - anchor.right
    if (anchor.right - popup.width < VIEWPORT_PADDING) {
        right = windowWidth - VIEWPORT_PADDING - popup.width
    }

    // Vertical: prefer above, fall back to below
    const hasSpaceAbove = anchor.top >= popup.height + GAP
    const hasSpaceBelow = windowHeight - anchor.bottom >= popup.height + GAP

    let top
    if (hasSpaceAbove) {
        top = anchor.top - popup.height - GAP
    } else if (hasSpaceBelow) {
        top = anchor.bottom + GAP
    } else if (anchor.top >= windowHeight - anchor.bottom) {
        top = Math.max(VIEWPORT_PADDING, anchor.top - popup.height - GAP)
    } else {
        top = anchor.bottom + GAP
    }

    positionStyle.value = {
        top: `${top}px`,
        right: `${right}px`,
    }
}

const popupStyle = computed(() => positionStyle.value)

const onScroll = () => emit('close')

onMounted(async () => {
    await nextTick()
    calculatePosition()
    window.addEventListener('scroll', onScroll, true)
})

onUnmounted(() => {
    window.removeEventListener('scroll', onScroll, true)
})
</script>

<style scoped>
.gp-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-cascade-menu);
}

.gp-popup {
    position: fixed;
    z-index: calc(var(--z-cascade-menu) + 1);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    border: 1px solid var(--color-border-secondary);
    padding: var(--space-lg);
    min-width: 280px;
    max-width: 420px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.gp-header {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
    font-size: var(--font-size-16);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-primary);
}

.gp-section {
    margin-bottom: var(--space-md);
}

.gp-section:last-child {
    margin-bottom: 0;
}

.gp-section-label {
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: var(--space-xs);
}

.gp-text {
    font-size: var(--font-size-15);
    color: var(--color-text-primary);
    margin: 0;
}

.gp-empty {
    font-size: var(--font-size-15);
    color: var(--color-text-muted);
    font-style: italic;
    margin: 0;
}
</style>
