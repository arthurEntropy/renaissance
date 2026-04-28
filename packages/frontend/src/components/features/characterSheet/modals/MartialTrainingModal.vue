<template>
    <teleport to="body">
        <!-- Backdrop: invisible, just catches outside clicks -->
        <div class="mt-backdrop" @click="$emit('close')" />

        <!-- Popup card positioned relative to the trigger FAB -->
        <div ref="popupEl" class="mt-popup" :style="popupStyle" @click.stop>
            <div class="mt-header">
                <strong>Martial Training</strong>
                <span v-if="mestiereName" class="mt-mestiere-name">{{ mestiereName }}</span>
            </div>

            <div class="mt-list">
                <div class="mt-row" v-for="row in martialRows" :key="row.key">
                    <img :src="row.icon" :alt="row.label" class="mt-icon" />
                    <span class="mt-label">{{ row.label }}</span>
                    <div class="mt-chips">
                        <ChipTag v-for="grade in equipmentGrades" :key="grade.id" :text="grade.name"
                            :variant="novizio?.[row.key]?.includes(grade.id) ? CHIP_TAG_VARIANTS.PRIMARY : CHIP_TAG_VARIANTS.DIM"
                            :rounded="CHIP_TAG_ROUNDED.FULL" :hoverable="false" />
                    </div>
                </div>
            </div>

            <div v-if="novizio?.martialNotes" class="mt-notes" v-html="safeMartialNotes"></div>
        </div>
    </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import ChipTag from '@/components/ui/chips/ChipTag.vue'
import { CHIP_TAG_VARIANTS, CHIP_TAG_ROUNDED } from '@/constants/chipTag'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import meleeIcon from '@/assets/icons/martial/melee.png'
import polearmIcon from '@/assets/icons/martial/polearms.png'
import rangedIcon from '@/assets/icons/martial/ranged.png'
import firearmIcon from '@/assets/icons/martial/firearms.png'
import armorIcon from '@/assets/icons/martial/armor.png'

const props = defineProps({
    novizio: {
        type: Object,
        default: null,
    },
    equipmentGrades: {
        type: Array,
        required: true,
    },
    mestiereName: {
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

const martialRows = [
    { key: 'melee', label: 'Melee', icon: meleeIcon },
    { key: 'polearm', label: 'Polearm', icon: polearmIcon },
    { key: 'ranged', label: 'Ranged', icon: rangedIcon },
    { key: 'firearm', label: 'Firearm', icon: firearmIcon },
    { key: 'armor', label: 'Armor', icon: armorIcon },
]

const safeMartialNotes = computed(() => sanitizeHtml(props.novizio?.martialNotes))

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
        // More space above even if tight — clamp to viewport padding
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
.mt-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-popover);
}

.mt-popup {
    position: fixed;
    z-index: calc(var(--z-popover) + 1);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    border: 1px solid var(--color-border-secondary);
    padding: var(--space-lg);
    min-width: 320px;
    max-width: 480px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.mt-header {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
    font-size: var(--font-size-16);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-primary);
}

.mt-mestiere-name {
    font-size: var(--font-size-14);
    color: var(--color-text-muted);
    font-style: italic;
    text-transform: none;
    letter-spacing: 0;
}

.mt-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.mt-row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    font-size: var(--font-size-16);
}

.mt-icon {
    width: 28px;
    height: 28px;
    object-fit: contain;
    background: var(--color-gray-light);
    border-radius: var(--radius-5);
    border: 1px solid var(--color-bg-secondary);
    padding: var(--space-xs);
    flex-shrink: 0;
}

.mt-label {
    min-width: 70px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.mt-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    padding-top: 2px;
}

.mt-notes {
    font-size: var(--font-size-15);
    color: var(--color-text-primary);
    margin-top: var(--space-sm);
}
</style>
