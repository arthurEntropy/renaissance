<template>
    <Teleport to="body">
        <Transition name="card-preview">
            <div v-if="previewAbility || previewEquipment" ref="overlayEl" class="card-preview-overlay"
                :class="{ 'placed-left': isOverlayOnLeftSide }" :style="overlayStyle" @mouseenter="cancelHide"
                @mouseleave="scheduleHide">
                <AbilityCard v-if="previewAbility" :ability="previewAbility" :collapsed="false" :collapsible="false"
                    :editable="false" :show-xp-badge="true" :show-action-buttons="false"
                    :show-improvement-toggle="false" :show-improvements="previewShowImprovements"
                    :show-successes="previewShowSuccesses" @update:showImprovements="previewShowImprovements = $event"
                    @update:showSuccesses="previewShowSuccesses = $event" />
                <EquipmentCard v-else-if="previewEquipment" :equipment="previewEquipment" :collapsed="false"
                    :collapsible="false" :editable="false" :duplicatable="false" :show-keeping-badge="true"
                    :show-improvement-toggle="false" :show-improvements="previewShowImprovements"
                    :engagement-success-options="[]" :enable-damage-roll="false" :show-successes="previewShowSuccesses"
                    @update:showImprovements="previewShowImprovements = $event"
                    @update:showSuccesses="previewShowSuccesses = $event" />
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import { useCardPreview } from '@/composables/useCardPreview'

const PREVIEW_WIDTH = 320
const GAP = 12
const VIEWPORT_MARGIN = 8

const { previewAbility, previewEquipment, anchorRect, scheduleHide, cancelHide } = useCardPreview()

const overlayEl = ref(null)
// Tracks the rendered height of the overlay so we can clamp it to the viewport.
// ResizeObserver fires after every layout change, including after CSS transitions
// complete, which is needed for accurate positioning after expansion.
const overlayHeight = ref(0)
const previewShowImprovements = ref(false)
const previewShowSuccesses = ref(false)

let resizeObserver = null
watch(overlayEl, (el) => {
    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }
    if (el) {
        resizeObserver = new ResizeObserver(() => {
            overlayHeight.value = el.offsetHeight
        })
        resizeObserver.observe(el)
    }
})

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect()
})

// Reset toggle states when the previewed item changes.
watch(
    [previewAbility, previewEquipment],
    ([ability, equipment]) => {
        if (!ability && !equipment) return
        previewShowImprovements.value = false
        previewShowSuccesses.value = false
    }
)

const overlayStyle = computed(() => {
    if (!anchorRect.value) return {}
    const rect = anchorRect.value

    // Prefer placing the preview to the right of the card.
    // Fall back to the left when there is not enough viewport space.
    let left = rect.right + GAP
    if (isOverlayOnLeftSide.value) {
        left = rect.left - PREVIEW_WIDTH - GAP
    }
    left = Math.max(VIEWPORT_MARGIN, left)

    // Align the top of the preview with the top of the anchor card.
    // If the preview would overflow the bottom of the viewport, shift it up
    // just enough to keep it fully visible.
    let top = rect.top
    const height = overlayHeight.value
    if (height > 0) {
        const overflow = top + height - (window.innerHeight - VIEWPORT_MARGIN)
        if (overflow > 0) top -= overflow
    }
    top = Math.max(VIEWPORT_MARGIN, top)

    return {
        top: top + 'px',
        left: left + 'px',
        width: PREVIEW_WIDTH + 'px',
    }
})

// Tracks which side the overlay is placed on so the enter animation slides
// in from the correct direction (toward the anchor card).
const isOverlayOnLeftSide = computed(() => {
    if (!anchorRect.value) return false
    const rect = anchorRect.value
    return rect.right + GAP + PREVIEW_WIDTH > window.innerWidth - VIEWPORT_MARGIN
})
</script>

<style scoped>
.card-preview-overlay {
    position: fixed;
    z-index: var(--z-tooltip);
    max-height: 80vh;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: var(--radius-10);
    filter: drop-shadow(var(--shadow-elevation-xl));
    pointer-events: auto;
    /* Prevent scrollbars from causing layout shifts inside the preview */
    scrollbar-width: thin;
}

/* Fade in from the side the card is on */
.card-preview-enter-active,
.card-preview-leave-active {
    transition: opacity var(--transition-fast), transform var(--transition-fast);
}

/* Default: overlay is to the right — slide in from the left */
.card-preview-enter-from,
.card-preview-leave-to {
    opacity: 0;
    transform: scale(0.96) translateX(-6px);
}

/* Overlay is to the left — slide in from the right */
.placed-left.card-preview-enter-from,
.placed-left.card-preview-leave-to {
    transform: scale(0.96) translateX(6px);
}
</style>
