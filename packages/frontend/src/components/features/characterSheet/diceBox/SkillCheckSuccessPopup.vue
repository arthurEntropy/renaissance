<template>
    <teleport to="body">
        <!-- Backdrop: invisible, just catches outside clicks -->
        <div class="scs-backdrop" @click="$emit('close')" />

        <!-- Popup card positioned relative to the trigger element -->
        <div ref="popupEl" class="scs-popup" :style="popupStyle" @click.stop>
            <div class="scs-header">
                <strong>Success Effects</strong>
                <span class="scs-count">{{ '✨'.repeat(successCount) }}</span>
            </div>

            <!-- Configurable skill check success effects from admin -->
            <div class="scs-section">
                <div v-if="!sortedEffects.length" class="scs-empty">No success effects configured.</div>
                <div v-for="effect in sortedEffects" :key="effect.id" class="scs-row">
                    <span class="scs-name">{{ effect.name }}</span>
                    <span class="scs-desc">{{ effect.description }}</span>
                </div>
            </div>

            <!-- Attack-specific success effects (hardcoded) -->
            <div class="scs-section">
                <div class="scs-section-title">Attack Success Effects</div>
                <div v-for="effect in ATTACK_SUCCESS_EFFECTS" :key="effect.successes" class="scs-row"
                    :class="{ 'scs-row--active': effect.successes <= successCount }">
                    <span class="scs-stars">{{ '✨'.repeat(effect.successes) }}</span>
                    <span class="scs-desc">{{ attackDescription(effect) }}</span>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useSkillCheckSuccessesStore } from '@/stores/skillCheckSuccessesStore'
import { ATTACK_SUCCESS_EFFECTS } from '@/constants/attackSuccessEffects'

const props = defineProps({
    successCount: {
        type: Number,
        required: true,
    },
    anchorEl: {
        type: Object,
        default: null,
    },
    character: {
        type: Object,
        default: null,
    },
})

const emit = defineEmits(['close'])

const skillCheckSuccessesStore = useSkillCheckSuccessesStore()

const sortedEffects = computed(() => {
    const items = skillCheckSuccessesStore.items ?? []
    return [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
})

function attackDescription(effect) {
    const body = props.character?.body ?? 0
    switch (effect.successes) {
        case 1: return `The attack deals additional damage equal to half your BODY score${body ? ` (${Math.floor(body / 2)})` : ''}.`
        case 2: return `The attack deals additional damage equal to your BODY score${body ? ` (${body})` : ''}.`
        case 3: return `The attack deals additional damage equal to twice your BODY score${body ? ` (${body * 2})` : ''}.`
        case 4: return `The attack deals additional damage equal to three times your BODY score${body ? ` (${body * 3})` : ''}.`
        case 5: return `The attack deals additional damage equal to four times your BODY score${body ? ` (${body * 4})` : ''}.`
        default: return effect.description
    }
}

// ── Positioning ───────────────────────────────────────────────────────────────

const GAP = 8
const VIEWPORT_PADDING = 10

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
    if (!skillCheckSuccessesStore.items?.length) {
        await skillCheckSuccessesStore.fetch()
    }
    await nextTick()
    calculatePosition()
    window.addEventListener('scroll', onScroll, true)
})

onUnmounted(() => {
    window.removeEventListener('scroll', onScroll, true)
})
</script>

<style scoped>
.scs-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-cascade-menu);
}

.scs-popup {
    position: fixed;
    z-index: calc(var(--z-cascade-menu) + 1);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    border: 1px solid var(--color-border-secondary);
    padding: var(--space-lg);
    min-width: 300px;
    max-width: 480px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.scs-header {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
    font-size: var(--font-size-16);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-primary);
}

.scs-count {
    font-size: var(--font-size-14);
    text-transform: none;
    letter-spacing: 0;
}

.scs-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space-md);
}

.scs-section:last-child {
    margin-bottom: 0;
}

.scs-section-title {
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: var(--space-xs);
    border-bottom: 1px solid var(--color-border-secondary);
    margin-bottom: var(--space-xs);
}

.scs-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--space-xs) 0;
}

.scs-row--active .scs-stars {
    color: var(--color-accent-gold);
}

.scs-name {
    font-size: var(--font-size-13);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.scs-stars {
    font-size: var(--font-size-13);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    line-height: 1;
}

.scs-desc {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    line-height: 1.4;
}

.scs-empty {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    font-style: italic;
}
</style>
