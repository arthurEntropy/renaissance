<template>
    <div v-if="culture" class="culture-token-wrapper" :class="{
        'culture-token--placed': isPlaced,
        'culture-token--unplaced': !isPlaced,
        'culture-token--ghost': isGhost,
        'culture-token--has-permanent-name': showPermanentName,
        'culture-token--selected': isSelected,
    }" :style="{ '--culture-size': size + 'px' }">
        <!-- Name permanently displayed above the token in all-caps -->
        <div v-if="showPermanentName" class="culture-token__name">{{ culture.name?.toUpperCase() }}</div>
        <BaseToken :entity="culture" :imageSrc="portraitUrl" variant="culture" :square="true"
            :showRemoveFab="showRemoveFab && isPlaced" :removeFabVariant="FAB_TYPES.DELETE"
            @click="$emit('click', culture)" @remove="$emit('remove', culture)">
            <!-- Initials shown in the portrait area when no art URL is available -->
            <span v-if="!portraitUrl" class="culture-token__initials" :style="initialsStyle">{{ initials }}</span>
        </BaseToken>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseToken from '@/components/features/characterSelection/BaseToken.vue'
import { FAB_TYPES } from '@/constants/fab'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
    culture: { type: Object, default: null },
    /** Whether this culture token has been placed on the map */
    isPlaced: { type: Boolean, default: false },
    /** Pixel size of the token */
    size: { type: Number, default: 60 },
    /** Show the delete FAB on hover */
    showRemoveFab: { type: Boolean, default: false },
    /** Ghost mode for drag preview */
    isGhost: { type: Boolean, default: false },
    /** Show the culture name permanently above the token (only for canvas-placed tokens) */
    showPermanentName: { type: Boolean, default: false },
    /** Whether this token is selected on the canvas */
    isSelected: { type: Boolean, default: false },
})

defineEmits(['click', 'remove'])

const portraitUrl = useOptimizedImage(
    () => props.culture?.featuredArtUrls?.[0] ?? props.culture?.artUrls?.[0] ?? null,
    MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL
)

const initials = computed(() => {
    if (!props.culture?.name) return '?'
    return props.culture.name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('')
})

const initialsStyle = computed(() => ({
    fontSize: `${Math.max(10, Math.round(props.size * 0.28))}px`,
}))
</script>

<style scoped>
.culture-token-wrapper {
    position: relative;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer !important;
    user-select: none;
}

/* Name label permanently above the token in all-caps */
.culture-token__name {
    font-size: var(--font-size-11, 11px);
    font-family: var(--font-family-primary, sans-serif);
    color: var(--color-text-primary, #fff);
    white-space: nowrap;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.9);
    pointer-events: none;
    line-height: 1.3;
    letter-spacing: 0.08em;
    margin-bottom: 3px;
}

/* Override BaseToken portrait to match culture token appearance */
:deep(.token-portrait) {
    width: var(--culture-size, 60px);
    height: var(--culture-size, 60px);
    border-radius: var(--radius-10, 10px);
    border: 2px solid var(--color-text-secondary, goldenrod);
    background: var(--overlay-black-heavy, rgba(0, 0, 0, 0.7));
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    transition: opacity var(--transition-normal, 0.2s), border-color var(--transition-normal, 0.2s);
}

/* Suppress BaseToken's hover name tooltip only when the name is permanently shown above */
.culture-token--has-permanent-name :deep(.token-name-tooltip) {
    display: none;
}

/* Let parent context control the cursor instead of BaseToken's default pointer */
:deep(.character-token) {
    cursor: inherit;
}

/* Selected: white glow ring matching the style for other selected tokens */
.culture-token--selected :deep(.token-portrait) {
    box-shadow: 0 0 0 3px var(--color-white), var(--shadow-sm);
}

/* Unplaced: dim the portrait and switch to neutral border */
.culture-token--unplaced :deep(.token-portrait) {
    opacity: 0.5;
    border-color: var(--color-gray-medium, #666);
}

/* Ghost mode */
.culture-token--ghost .culture-token-wrapper,
.culture-token--ghost :deep(.character-token) {
    pointer-events: none;
    cursor: default;
}

.culture-token--ghost :deep(.token-portrait) {
    opacity: 0.7;
}

/* Initials fallback: overlaid absolutely inside the portrait area via slot */
.culture-token__initials {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--culture-size, 60px);
    height: var(--culture-size, 60px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-bold, 700);
    font-family: var(--font-family-primary, sans-serif);
    color: var(--color-text-primary, #fff);
    letter-spacing: 0.04em;
    pointer-events: none;
}
</style>
